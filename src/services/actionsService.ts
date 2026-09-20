import { supabase } from '../utils/supabase';
import { ActionItem, ClientItem, ClientType, ClientOwner, ObjectiveItem, TaskType, VintageColorKey } from '../types';
import { INITIAL_ACTIONS, INITIAL_CLIENTS } from '../utils/storage';
import { INITIAL_OBJECTIVES } from '../data/objectives';

const parseObjectiveNotes = (rawNotes: unknown, fallbackQuarterlyGoal = '') => {
  if (typeof rawNotes !== 'string' || !rawNotes.trim()) {
    return { quarterlyGoal: fallbackQuarterlyGoal, actualRevenue: 0 };
  }

  try {
    const parsed = JSON.parse(rawNotes) as { quarterlyGoal?: unknown; actualRevenue?: unknown };
    if (parsed && typeof parsed === 'object') {
      return {
        quarterlyGoal: typeof parsed.quarterlyGoal === 'string' ? parsed.quarterlyGoal : fallbackQuarterlyGoal,
        actualRevenue: Math.max(0, Number(parsed.actualRevenue) || 0),
      };
    }
  } catch {
    // Los objetivos anteriores guardaban el objetivo trimestral como texto plano.
  }

  return { quarterlyGoal: rawNotes, actualRevenue: 0 };
};

const serializeObjectiveNotes = (objective: Pick<ObjectiveItem, 'quarterlyGoal' | 'actualRevenue'>) => JSON.stringify({
  quarterlyGoal: objective.quarterlyGoal || '',
  actualRevenue: Math.max(0, Number(objective.actualRevenue) || 0),
});

// Las tablas persistentes ya existentes conservan este namespace. Renombrarlas
// requiere una migración de base de datos; no debe hacerse desde el cliente.
const ACTIONS_TABLE = 'plannifier_actions';
const COMPLETED_ACTIONS_TABLE = 'plannifier_completed';
const CLIENTS_TABLE = 'plannifier_clients';

/**
 * Utilidades para extraer y serializar metadatos (userEmail, taskType, workspaceScope)
 * en el campo notes si las columnas aún no existen en la base de datos Supabase.
 */
function extractMetaFromNotes(rawNotes?: string): {
  cleanNotes: string;
  userEmail?: string;
  taskType?: TaskType;
  workspaceScope?: 'personal' | 'polarist';
} {
  if (!rawNotes) return { cleanNotes: '' };
  const match = rawNotes.match(/^<!--META:(\{.*?\})-->\s*/);
  if (match) {
    try {
      const parsed = JSON.parse(match[1]);
      return {
        cleanNotes: rawNotes.replace(match[0], ''),
        userEmail: parsed.userEmail,
        taskType: parsed.taskType,
        workspaceScope: parsed.workspaceScope,
      };
    } catch {
      // Si falla parseo, retornar nota tal cual
    }
  }
  return { cleanNotes: rawNotes };
}

export const actionsService = {
  /**
   * Carga las acciones activas desde `planifier_actions` ordenadas por `order_index ASC`.
   * Si la tabla está vacía en el primer arranque, siembra las acciones iniciales.
   */
  async fetchActiveActions(): Promise<ActionItem[]> {
    const { data, error } = await supabase
      .from(ACTIONS_TABLE)
      .select('*')
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error al cargar acciones activas desde Supabase:', error);
      throw error;
    }

    const isDbSeeded =
      typeof window !== 'undefined' &&
      (localStorage.getItem('planifier_db_seeded') === 'true' ||
       localStorage.getItem('planifier_supabase_seeded_v2') === 'true');

    const actionRows = (data || []).filter((row: any) => row.task_type !== 'objective');

    // Si hay acciones en Supabase, registrar que la base ya fue inicializada y retornar filas.
    // Los objetivos comparten almacenamiento, pero nunca deben aparecer en el tablero de tareas.
    if (actionRows.length > 0) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('planifier_db_seeded', 'true');
        localStorage.setItem('planifier_supabase_seeded_v2', 'true');
      }
      return actionRows.map((row: any) => {
        const meta = extractMetaFromNotes(row.notes);
        const resolvedScope =
          (row.workspace_scope as 'personal' | 'polarist') ||
          meta.workspaceScope ||
          (row.client?.trim().toLowerCase() === 'polarist' ? 'polarist' : 'personal');

        return {
          id: row.id,
          order: row.order_index ?? 0,
          title: row.title ?? '',
          target: row.client ?? '',
          tagColor: (row.color as VintageColorKey) || 'emerald',
          value: Number(row.value) || 0,
          currency: '$',
          deadline: row.deadline ?? '',
          completed: false,
          notes: meta.cleanNotes,
          subtasks: Array.isArray(row.subtasks) ? row.subtasks : [],
          isExpanded: false,
          createdAt: row.created_at ?? new Date().toISOString(),
          userEmail: row.user_email || meta.userEmail || 'enzothome1@gmail.com',
          taskType: (row.task_type as TaskType) || meta.taskType || 'action',
          workspaceScope: resolvedScope,
        };
      });
    }

    // Si la tabla devolvió 0 acciones y ya fue sembrada previamente, devolver vacío []
    if (isDbSeeded) {
      return [];
    }

    // Solo sembrar en el primer arranque absoluto si nunca fue sembrada
    if (typeof window !== 'undefined') {
      localStorage.setItem('planifier_db_seeded', 'true');
      localStorage.setItem('planifier_supabase_seeded_v2', 'true');
    }

    const activeSeeds = INITIAL_ACTIONS.filter((a) => !a.completed);
    const rowsToInsert = activeSeeds.map((item, idx) => ({
      id: item.id,
      order_index: idx,
      title: item.title,
      client: item.target,
      color: item.tagColor,
      value: item.value,
      deadline: item.deadline,
      notes: item.notes || '',
      subtasks: item.subtasks || [],
      created_at: item.createdAt || new Date().toISOString(),
      user_email: item.userEmail || 'enzothome1@gmail.com',
      task_type: item.taskType || 'action',
      workspace_scope: item.workspaceScope || (item.target?.trim().toLowerCase() === 'polarist' ? 'polarist' : 'personal'),
    }));

    const { data: inserted, error: insertError } = await supabase
      .from(ACTIONS_TABLE)
      .insert(rowsToInsert)
      .select('*')
      .order('order_index', { ascending: true });

    if (insertError) {
      console.error('Error al sembrar acciones activas:', insertError);
      throw insertError;
    }

    // También sembrar acción completada inicial en planifier_completed si la tabla está vacía
    const completedSeeds = INITIAL_ACTIONS.filter((a) => a.completed);
    if (completedSeeds.length > 0) {
      const completedRows = completedSeeds.map((item) => ({
        id: item.id,
        title: item.title,
        client: item.target,
        color: item.tagColor,
        value: item.value,
        deadline: item.deadline,
        notes: item.notes || '',
        subtasks: item.subtasks || [],
        completed_at: item.completedAt || new Date().toISOString(),
        created_at: item.createdAt || new Date().toISOString(),
        user_email: item.userEmail || 'enzothome1@gmail.com',
        task_type: item.taskType || 'action',
        workspace_scope: item.workspaceScope || (item.target?.trim().toLowerCase() === 'polarist' ? 'polarist' : 'personal'),
      }));
      const { error: seedCompErr } = await supabase.from(COMPLETED_ACTIONS_TABLE).upsert(completedRows);
      if (seedCompErr) {
        console.error('Error al sembrar completadas iniciales:', seedCompErr);
      }
    }

    return (inserted || rowsToInsert).map((row: any) => {
      const meta = extractMetaFromNotes(row.notes);
      const resolvedScope =
        (row.workspace_scope as 'personal' | 'polarist') ||
        meta.workspaceScope ||
        (row.client?.trim().toLowerCase() === 'polarist' ? 'polarist' : 'personal');

      return {
        id: row.id,
        order: row.order_index ?? 0,
        title: row.title ?? '',
        target: row.client ?? '',
        tagColor: (row.color as VintageColorKey) || 'emerald',
        value: Number(row.value) || 0,
        currency: '$',
        deadline: row.deadline ?? '',
        completed: false,
        notes: meta.cleanNotes,
        subtasks: Array.isArray(row.subtasks) ? row.subtasks : [],
        isExpanded: false,
        createdAt: row.created_at ?? new Date().toISOString(),
        userEmail: row.user_email || meta.userEmail || 'enzothome1@gmail.com',
        taskType: (row.task_type as TaskType) || meta.taskType || 'action',
        workspaceScope: resolvedScope,
      };
    });
  },

  /**
   * Inserta una nueva acción en `planifier_actions`.
   */
  async createAction(item: ActionItem): Promise<void> {
    const row = {
      id: item.id,
      order_index: item.order,
      title: item.title,
      client: item.target,
      color: item.tagColor,
      value: item.value,
      deadline: item.deadline,
      notes: item.notes || '',
      subtasks: item.subtasks || [],
      created_at: item.createdAt || new Date().toISOString(),
      user_email: item.userEmail || 'enzothome1@gmail.com',
      task_type: item.taskType || 'action',
      workspace_scope: item.workspaceScope || 'personal',
    };

    const { error } = await supabase.from(ACTIONS_TABLE).insert(row);
    if (error) {
      console.error('Error al crear acción en Supabase:', error);
      throw error;
    }
  },

  /**
   * Actualiza los datos de una acción activa en `planifier_actions`.
   */
  async updateAction(item: ActionItem): Promise<void> {
    const row = {
      title: item.title,
      client: item.target,
      color: item.tagColor,
      value: item.value,
      deadline: item.deadline,
      notes: item.notes || '',
      subtasks: item.subtasks || [],
      order_index: item.order,
      user_email: item.userEmail || 'enzothome1@gmail.com',
      task_type: item.taskType || 'action',
      workspace_scope: item.workspaceScope || 'personal',
    };

    const { error } = await supabase.from(ACTIONS_TABLE).update(row).eq('id', item.id);
    if (error) {
      console.error('Error al actualizar acción en Supabase:', error);
      throw error;
    }
  },

  /**
   * Actualiza el orden (order_index) de las acciones en lote.
   */
  async reorderActions(items: ActionItem[]): Promise<void> {
    const updates = items.map((item, index) =>
      supabase.from(ACTIONS_TABLE).update({ order_index: index }).eq('id', item.id)
    );
    const results = await Promise.all(updates);
    const hasError = results.find((r) => r.error);
    if (hasError && hasError.error) {
      console.error('Error al reordenar acciones en Supabase:', hasError.error);
      throw hasError.error;
    }
  },

  /**
   * Elimina una acción activa de `planifier_actions`.
   */
  async deleteAction(id: string): Promise<void> {
    const { error } = await supabase.from(ACTIONS_TABLE).delete().eq('id', id);
    if (error) {
      console.error('Error al eliminar acción activa:', error);
      throw error;
    }
  },

  /**
   * Completa una acción:
   * - Se inserta en `planifier_completed` con `completed_at`.
   * - Se elimina de `planifier_actions` para desaparecer de la vista principal.
   * Fallback resiliente si columnas no existen.
   */
  async completeAction(item: ActionItem): Promise<void> {
    const completedAt = new Date().toISOString();
    const completedRow = {
      id: item.id,
      title: item.title,
      client: item.target,
      color: item.tagColor,
      value: item.value,
      deadline: item.deadline,
      notes: item.notes || '',
      subtasks: item.subtasks || [],
      completed_at: completedAt,
      created_at: item.createdAt || completedAt,
      user_email: item.userEmail || 'enzothome1@gmail.com',
      task_type: item.taskType || 'action',
      workspace_scope: item.workspaceScope || 'personal',
    };

    const { error: insertError } = await supabase.from(COMPLETED_ACTIONS_TABLE).upsert(completedRow);
    if (insertError) {
      console.error('Error al insertar en planifier_completed:', insertError);
      throw insertError;
    }

    const { error: deleteError } = await supabase.from(ACTIONS_TABLE).delete().eq('id', item.id);
    if (deleteError) {
      console.error('Error al eliminar de planifier_actions:', deleteError);
      throw deleteError;
    }
  },

  /**
   * Carga las acciones completadas desde `planifier_completed` ordenadas por `completed_at DESC`.
   */
  async fetchCompletedActions(): Promise<ActionItem[]> {
    const { data, error } = await supabase
      .from(COMPLETED_ACTIONS_TABLE)
      .select('*')
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('Error al cargar acciones completadas:', error);
      throw error;
    }

    if (data && data.length > 0 && typeof window !== 'undefined') {
      localStorage.setItem('planifier_db_seeded', 'true');
      localStorage.setItem('planifier_supabase_seeded_v2', 'true');
    }

    return (data || []).map((row: any) => {
      const meta = extractMetaFromNotes(row.notes);
      const resolvedScope =
        (row.workspace_scope as 'personal' | 'polarist') ||
        meta.workspaceScope ||
        (row.client?.trim().toLowerCase() === 'polarist' ? 'polarist' : 'personal');

      return {
        id: row.id,
        order: 0,
        title: row.title ?? '',
        target: row.client ?? '',
        tagColor: (row.color as VintageColorKey) || 'emerald',
        value: Number(row.value) || 0,
        currency: '$',
        deadline: row.deadline ?? '',
        completed: true,
        completedAt: row.completed_at,
        notes: meta.cleanNotes,
        subtasks: Array.isArray(row.subtasks) ? row.subtasks : [],
        isExpanded: false,
        createdAt: row.created_at ?? new Date().toISOString(),
        userEmail: row.user_email || meta.userEmail || 'enzothome1@gmail.com',
        taskType: (row.task_type as TaskType) || meta.taskType || 'action',
        workspaceScope: resolvedScope,
      };
    });
  },

  /**
   * Restaura una acción completada de regreso al tablero activo:
   * - Se inserta en `planifier_actions` con `order_index`.
   * - Se elimina de `planifier_completed`.
   */
  async restoreAction(item: ActionItem, newOrderIndex = 0): Promise<void> {
    const activeRow = {
      id: item.id,
      order_index: newOrderIndex,
      title: item.title,
      client: item.target,
      color: item.tagColor,
      value: item.value,
      deadline: item.deadline,
      notes: item.notes || '',
      subtasks: item.subtasks || [],
      created_at: item.createdAt || new Date().toISOString(),
      user_email: item.userEmail || 'enzothome1@gmail.com',
      task_type: item.taskType || 'action',
      workspace_scope: item.workspaceScope || 'personal',
    };

    const { error: insertError } = await supabase.from(ACTIONS_TABLE).upsert(activeRow);
    if (insertError) {
      console.error('Error al restaurar a planifier_actions:', insertError);
      throw insertError;
    }

    const { error: deleteError } = await supabase.from(COMPLETED_ACTIONS_TABLE).delete().eq('id', item.id);
    if (deleteError) {
      console.error('Error al remover de planifier_completed:', deleteError);
      throw deleteError;
    }
  },

  /**
   * Elimina permanentemente una acción del historial de completados.
   */
  async deleteCompletedAction(id: string): Promise<void> {
    const { error } = await supabase.from(COMPLETED_ACTIONS_TABLE).delete().eq('id', id);
    if (error) {
      console.error('Error al eliminar de planifier_completed:', error);
      throw error;
    }
  },

  /**
   * Carga los objetivos compartidos del equipo. Se guardan en la tabla de acciones
   * existente para no introducir una migración destructiva ni separar los datos actuales.
   */
  async fetchObjectives(): Promise<ObjectiveItem[]> {
    const { data, error } = await supabase
      .from(ACTIONS_TABLE)
      .select('*')
      .eq('task_type', 'objective')
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error al cargar objetivos:', error);
      throw error;
    }

    let rows = data || [];
    if (rows.length === 0) {
      const seedRows = INITIAL_OBJECTIVES.map((objective, index) => ({
        id: objective.id,
        order_index: index,
        title: objective.monthlyGoal,
        client: objective.month,
        color: 'emerald',
        value: objective.revenueTarget,
        deadline: `${objective.month}-${objective.month.endsWith('-02') ? '28' : ['04', '06', '09', '11'].includes(objective.month.slice(5)) ? '30' : '31'}`,
        notes: serializeObjectiveNotes(objective),
        subtasks: objective.milestones,
        created_at: new Date().toISOString(),
        user_email: 'enzothome1@gmail.com',
        task_type: 'objective',
        workspace_scope: 'polarist',
      }));

      const { data: inserted, error: insertError } = await supabase
        .from(ACTIONS_TABLE)
        .insert(seedRows)
        .select('*')
        .order('order_index', { ascending: true });

      if (insertError) {
        console.error('Error al importar objetivos iniciales:', insertError);
        throw insertError;
      }
      rows = inserted || seedRows;
    }

    return rows.map((row: any) => {
      const fallback = INITIAL_OBJECTIVES.find((item) => item.id === row.id);
      const month = row.client || row.deadline?.slice(0, 7) || fallback?.month || '';
      const notes = parseObjectiveNotes(row.notes, fallback?.quarterlyGoal);
      return {
        id: row.id,
        month,
        label:
          fallback?.label ||
          new Intl.DateTimeFormat('es-UY', { month: 'long', timeZone: 'UTC' }).format(
            new Date(`${month}-01T00:00:00Z`)
          ),
        monthlyGoal: row.title || fallback?.monthlyGoal || 'Definir objetivo mensual',
        quarterlyGoal: notes.quarterlyGoal,
        revenueTarget: Number(row.value) || 0,
        actualRevenue: notes.actualRevenue,
        milestones: Array.isArray(row.subtasks) ? row.subtasks : [],
        updatedAt: row.created_at,
      } as ObjectiveItem;
    });
  },

  async updateObjective(objective: ObjectiveItem): Promise<void> {
    const { error } = await supabase
      .from(ACTIONS_TABLE)
      .update({
        title: objective.monthlyGoal,
        client: objective.month,
        value: objective.revenueTarget,
        notes: serializeObjectiveNotes(objective),
        subtasks: objective.milestones,
      })
      .eq('id', objective.id)
      .eq('task_type', 'objective');

    if (error) {
      console.error('Error al actualizar objetivo:', error);
      throw error;
    }
  },

  /**
   * Carga la lista de clientes/interesados desde `planifier_clients`.
   * Asegura que el cliente "Polarist" siempre esté en la lista disponible.
   */
  async fetchClients(): Promise<ClientItem[]> {
    const { data, error } = await supabase
      .from(CLIENTS_TABLE)
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error al cargar clientes desde Supabase:', error);
      throw error;
    }

    const isDbSeeded =
      typeof window !== 'undefined' &&
      (localStorage.getItem('planifier_db_seeded') === 'true' ||
       localStorage.getItem('planifier_supabase_seeded_v2') === 'true');

    let clientList: ClientItem[] = [];

    if (data && data.length > 0) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('planifier_db_seeded', 'true');
        localStorage.setItem('planifier_supabase_seeded_v2', 'true');
      }
      clientList = data.map((row: any) => {
        const rawType = (row.type as string) || 'cliente';
        let clientType: ClientType = 'cliente';
        let owner: ClientOwner = (row.owner as ClientOwner) || (row.name?.trim().toLowerCase() === 'polarist' ? 'polarist' : 'enzo');

        if (rawType.includes('::')) {
          const [t, o] = rawType.split('::');
          clientType = (t as ClientType) || 'cliente';
          if (!row.owner) {
            owner = (o as ClientOwner) || owner;
          }
        } else {
          clientType = (rawType as ClientType) || 'cliente';
        }

        return {
          id: row.id,
          name: row.name ?? '',
          type: clientType,
          owner,
          color: (row.color as VintageColorKey) || 'emerald',
          country: row.country || 'Uruguay',
          createdAt: row.created_at,
        };
      });
    } else if (!isDbSeeded) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('planifier_db_seeded', 'true');
        localStorage.setItem('planifier_supabase_seeded_v2', 'true');
      }

      const rowsToInsert = INITIAL_CLIENTS.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type || 'cliente',
        owner: c.owner || (c.name.trim().toLowerCase() === 'polarist' ? 'polarist' : 'enzo'),
        color: c.color,
        country: c.country || 'Uruguay',
        created_at: c.createdAt || new Date().toISOString(),
      }));
      await supabase.from(CLIENTS_TABLE).insert(rowsToInsert);
      clientList = rowsToInsert.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type as ClientType,
        owner: c.owner as ClientOwner,
        color: c.color as VintageColorKey,
        country: c.country,
        createdAt: c.created_at,
      }));
    }

    // No inyectar cliente mock client-polarist-enterprise si ya existe cliente con owner 'polarist'
    const hasPolaristClient = clientList.some(
      (c) => c.owner === 'polarist' || c.name.trim().toLowerCase() === 'polarist'
    );
    if (!hasPolaristClient && clientList.length === 0) {
      const defaultPolaristClient: ClientItem = {
        id: 'client-1',
        name: 'Polarist',
        type: 'cliente',
        owner: 'polarist',
        color: 'emerald',
        country: 'Uruguay',
        createdAt: new Date().toISOString(),
      };
      clientList.unshift(defaultPolaristClient);
    }

    return clientList;
  },

  /**
   * Inserta un nuevo cliente/interesado en `planifier_clients`.
   */
  async createClient(client: ClientItem): Promise<void> {
    const ownerToSave = client.owner || 'enzo';
    const row = {
      id: client.id,
      name: client.name,
      type: client.type || 'cliente',
      owner: ownerToSave,
      color: client.color,
      country: client.country || 'Uruguay',
      created_at: client.createdAt || new Date().toISOString(),
    };
    const { error } = await supabase.from(CLIENTS_TABLE).insert(row);
    if (error) {
      console.error('Error al crear cliente en Supabase:', error);
      throw error;
    }
  },

  /**
   * Actualiza los datos de un cliente/interesado en `planifier_clients`.
   */
  async updateClient(client: ClientItem): Promise<void> {
    const ownerToSave = client.owner || 'enzo';
    const row = {
      name: client.name,
      type: client.type || 'cliente',
      owner: ownerToSave,
      color: client.color,
      country: client.country,
    };
    const { error } = await supabase.from(CLIENTS_TABLE).update(row).eq('id', client.id);
    if (error) {
      console.error('Error al actualizar cliente en Supabase:', error);
      throw error;
    }
  },

  /**
   * Elimina un cliente de `planifier_clients`.
   */
  async deleteClient(id: string): Promise<void> {
    const { error } = await supabase.from(CLIENTS_TABLE).delete().eq('id', id);
    if (error) {
      console.error('Error al eliminar cliente de Supabase:', error);
      throw error;
    }
  },
};
