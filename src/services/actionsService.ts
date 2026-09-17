import { supabase } from '../utils/supabase';
import { ActionItem, ClientItem, ClientType, ClientOwner, TaskType, VintageColorKey } from '../types';
import { INITIAL_ACTIONS, INITIAL_CLIENTS } from '../utils/storage';

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

function injectMetaIntoNotes(
  notes: string | undefined,
  userEmail?: string,
  taskType?: TaskType,
  workspaceScope?: 'personal' | 'polarist'
): string {
  const { cleanNotes } = extractMetaFromNotes(notes);
  const metaObj = {
    userEmail: userEmail || 'enzothome1@gmail.com',
    taskType: taskType || 'action',
    workspaceScope: workspaceScope || 'personal',
  };
  return `<!--META:${JSON.stringify(metaObj)}-->\n${cleanNotes}`;
}

export const actionsService = {
  /**
   * Carga las acciones activas desde `plannifier_actions` ordenadas por `order_index ASC`.
   * Si la tabla está vacía en el primer arranque, siembra las acciones iniciales.
   */
  async fetchActiveActions(): Promise<ActionItem[]> {
    const { data, error } = await supabase
      .from('plannifier_actions')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Error al cargar acciones activas desde Supabase:', error);
      throw error;
    }

    const isDbSeeded =
      typeof window !== 'undefined' &&
      (localStorage.getItem('plannifier_db_seeded') === 'true' ||
       localStorage.getItem('plannifier_supabase_seeded_v2') === 'true');

    // Si hay datos en Supabase, registrar que la base ya fue inicializada y retornar filas
    if (data && data.length > 0) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('plannifier_db_seeded', 'true');
        localStorage.setItem('plannifier_supabase_seeded_v2', 'true');
      }
      return data.map((row: any) => {
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
      localStorage.setItem('plannifier_db_seeded', 'true');
      localStorage.setItem('plannifier_supabase_seeded_v2', 'true');
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
      notes: injectMetaIntoNotes(item.notes, item.userEmail, item.taskType, item.workspaceScope),
      subtasks: item.subtasks || [],
      created_at: item.createdAt || new Date().toISOString(),
      user_email: item.userEmail || 'enzothome1@gmail.com',
      task_type: item.taskType || 'action',
    }));

    let insertedData: any[] | null = null;
    const { data: inserted, error: insertError } = await supabase
      .from('plannifier_actions')
      .insert(rowsToInsert)
      .select('*')
      .order('order_index', { ascending: true });

    if (insertError) {
      console.warn('Fallo siembra con columnas user_email/task_type, reintentando con fallback:', insertError.message);
      const fallbackRows = rowsToInsert.map((r, idx) => {
        const seed = activeSeeds[idx];
        return {
          id: r.id,
          order_index: r.order_index,
          title: r.title,
          client: r.client,
          color: r.color,
          value: r.value,
          deadline: r.deadline,
          notes: injectMetaIntoNotes(seed.notes, seed.userEmail, seed.taskType, seed.workspaceScope),
          subtasks: r.subtasks,
          created_at: r.created_at,
        };
      });
      const { data: fbData } = await supabase.from('plannifier_actions').insert(fallbackRows).select('*');
      insertedData = fbData || fallbackRows;
    } else {
      insertedData = inserted;
    }

    // También sembrar acción completada inicial en plannifier_completed si la tabla está vacía
    const completedSeeds = INITIAL_ACTIONS.filter((a) => a.completed);
    if (completedSeeds.length > 0) {
      const completedRows = completedSeeds.map((item) => ({
        id: item.id,
        title: item.title,
        client: item.target,
        color: item.tagColor,
        value: item.value,
        deadline: item.deadline,
        notes: injectMetaIntoNotes(item.notes, item.userEmail, item.taskType, item.workspaceScope),
        subtasks: item.subtasks || [],
        completed_at: item.completedAt || new Date().toISOString(),
        created_at: item.createdAt || new Date().toISOString(),
        user_email: item.userEmail || 'enzothome1@gmail.com',
        task_type: item.taskType || 'action',
      }));
      const { error: seedCompErr } = await supabase.from('plannifier_completed').upsert(completedRows);
      if (seedCompErr) {
        const fallbackCompRows = completedSeeds.map((item) => ({
          id: item.id,
          title: item.title,
          client: item.target,
          color: item.tagColor,
          value: item.value,
          deadline: item.deadline,
          notes: injectMetaIntoNotes(item.notes, item.userEmail, item.taskType, item.workspaceScope),
          subtasks: item.subtasks || [],
          completed_at: item.completedAt || new Date().toISOString(),
          created_at: item.createdAt || new Date().toISOString(),
        }));
        await supabase.from('plannifier_completed').upsert(fallbackCompRows);
      }
    }

    return (insertedData || rowsToInsert).map((row: any) => {
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
   * Inserta una nueva acción en `plannifier_actions`.
   * Fallback resiliente: Si Supabase retorna error (ej. columna no existe aún), reintenta sin esas columnas
   * y preserva la información en `notes` serializado.
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
      notes: injectMetaIntoNotes(item.notes, item.userEmail, item.taskType, item.workspaceScope),
      subtasks: item.subtasks || [],
      created_at: item.createdAt || new Date().toISOString(),
      user_email: item.userEmail || 'enzothome1@gmail.com',
      task_type: item.taskType || 'action',
    };

    const { error } = await supabase.from('plannifier_actions').insert(row);
    if (error) {
      console.warn('Supabase insert con columnas user_email/task_type falló, reintentando con fallback en notes:', error.message);
      const fallbackRow = {
        id: item.id,
        order_index: item.order,
        title: item.title,
        client: item.target,
        color: item.tagColor,
        value: item.value,
        deadline: item.deadline,
        notes: injectMetaIntoNotes(item.notes, item.userEmail, item.taskType, item.workspaceScope),
        subtasks: item.subtasks || [],
        created_at: item.createdAt || new Date().toISOString(),
      };
      const { error: fallbackError } = await supabase.from('plannifier_actions').insert(fallbackRow);
      if (fallbackError) {
        console.error('Error definitivo al crear acción en Supabase:', fallbackError);
        throw fallbackError;
      }
    }
  },

  /**
   * Actualiza los datos de una acción activa en `plannifier_actions`.
   * Fallback resiliente si columnas user_email o task_type no existen en Supabase.
   */
  async updateAction(item: ActionItem): Promise<void> {
    const row = {
      title: item.title,
      client: item.target,
      color: item.tagColor,
      value: item.value,
      deadline: item.deadline,
      notes: injectMetaIntoNotes(item.notes, item.userEmail, item.taskType, item.workspaceScope),
      subtasks: item.subtasks || [],
      order_index: item.order,
      user_email: item.userEmail || 'enzothome1@gmail.com',
      task_type: item.taskType || 'action',
    };

    const { error } = await supabase.from('plannifier_actions').update(row).eq('id', item.id);
    if (error) {
      console.warn('Supabase update con columnas user_email/task_type falló, reintentando con fallback en notes:', error.message);
      const fallbackRow = {
        title: item.title,
        client: item.target,
        color: item.tagColor,
        value: item.value,
        deadline: item.deadline,
        notes: injectMetaIntoNotes(item.notes, item.userEmail, item.taskType, item.workspaceScope),
        subtasks: item.subtasks || [],
        order_index: item.order,
      };
      const { error: fallbackError } = await supabase.from('plannifier_actions').update(fallbackRow).eq('id', item.id);
      if (fallbackError) {
        console.error('Error al actualizar acción en Supabase:', fallbackError);
        throw fallbackError;
      }
    }
  },

  /**
   * Actualiza el orden (order_index) de las acciones en lote.
   */
  async reorderActions(items: ActionItem[]): Promise<void> {
    const updates = items.map((item, index) =>
      supabase.from('plannifier_actions').update({ order_index: index }).eq('id', item.id)
    );
    const results = await Promise.all(updates);
    const hasError = results.find((r) => r.error);
    if (hasError && hasError.error) {
      console.error('Error al reordenar acciones en Supabase:', hasError.error);
      throw hasError.error;
    }
  },

  /**
   * Elimina una acción activa de `plannifier_actions`.
   */
  async deleteAction(id: string): Promise<void> {
    const { error } = await supabase.from('plannifier_actions').delete().eq('id', id);
    if (error) {
      console.error('Error al eliminar acción activa:', error);
      throw error;
    }
  },

  /**
   * Completa una acción:
   * - Se inserta en `plannifier_completed` con `completed_at`.
   * - Se elimina de `plannifier_actions` para desaparecer de la vista principal.
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
      notes: injectMetaIntoNotes(item.notes, item.userEmail, item.taskType, item.workspaceScope),
      subtasks: item.subtasks || [],
      completed_at: completedAt,
      created_at: item.createdAt || completedAt,
      user_email: item.userEmail || 'enzothome1@gmail.com',
      task_type: item.taskType || 'action',
    };

    const { error: insertError } = await supabase.from('plannifier_completed').upsert(completedRow);
    if (insertError) {
      console.warn('Supabase completeAction upsert falló con columnas extendidas, reintentando fallback:', insertError.message);
      const fallbackRow = {
        id: item.id,
        title: item.title,
        client: item.target,
        color: item.tagColor,
        value: item.value,
        deadline: item.deadline,
        notes: injectMetaIntoNotes(item.notes, item.userEmail, item.taskType, item.workspaceScope),
        subtasks: item.subtasks || [],
        completed_at: completedAt,
        created_at: item.createdAt || completedAt,
      };
      const { error: fallbackError } = await supabase.from('plannifier_completed').upsert(fallbackRow);
      if (fallbackError) {
        console.error('Error al insertar en plannifier_completed:', fallbackError);
        throw fallbackError;
      }
    }

    const { error: deleteError } = await supabase.from('plannifier_actions').delete().eq('id', item.id);
    if (deleteError) {
      console.error('Error al eliminar de plannifier_actions:', deleteError);
      throw deleteError;
    }
  },

  /**
   * Carga las acciones completadas desde `plannifier_completed` ordenadas por `completed_at DESC`.
   */
  async fetchCompletedActions(): Promise<ActionItem[]> {
    const { data, error } = await supabase
      .from('plannifier_completed')
      .select('*')
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('Error al cargar acciones completadas:', error);
      throw error;
    }

    if (data && data.length > 0 && typeof window !== 'undefined') {
      localStorage.setItem('plannifier_db_seeded', 'true');
      localStorage.setItem('plannifier_supabase_seeded_v2', 'true');
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
   * - Se inserta en `plannifier_actions` con `order_index`.
   * - Se elimina de `plannifier_completed`.
   * Fallback resiliente si columnas no existen.
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
      notes: injectMetaIntoNotes(item.notes, item.userEmail, item.taskType, item.workspaceScope),
      subtasks: item.subtasks || [],
      created_at: item.createdAt || new Date().toISOString(),
      user_email: item.userEmail || 'enzothome1@gmail.com',
      task_type: item.taskType || 'action',
    };

    const { error: insertError } = await supabase.from('plannifier_actions').upsert(activeRow);
    if (insertError) {
      console.warn('Supabase restoreAction upsert falló con columnas extendidas, reintentando fallback:', insertError.message);
      const fallbackRow = {
        id: item.id,
        order_index: newOrderIndex,
        title: item.title,
        client: item.target,
        color: item.tagColor,
        value: item.value,
        deadline: item.deadline,
        notes: injectMetaIntoNotes(item.notes, item.userEmail, item.taskType, item.workspaceScope),
        subtasks: item.subtasks || [],
        created_at: item.createdAt || new Date().toISOString(),
      };
      const { error: fallbackError } = await supabase.from('plannifier_actions').upsert(fallbackRow);
      if (fallbackError) {
        console.error('Error al restaurar a plannifier_actions:', fallbackError);
        throw fallbackError;
      }
    }

    const { error: deleteError } = await supabase.from('plannifier_completed').delete().eq('id', item.id);
    if (deleteError) {
      console.error('Error al remover de plannifier_completed:', deleteError);
      throw deleteError;
    }
  },

  /**
   * Elimina permanentemente una acción del historial de completados.
   */
  async deleteCompletedAction(id: string): Promise<void> {
    const { error } = await supabase.from('plannifier_completed').delete().eq('id', id);
    if (error) {
      console.error('Error al eliminar de plannifier_completed:', error);
      throw error;
    }
  },

  /**
   * Carga la lista de clientes/interesados desde `plannifier_clients`.
   * Asegura que el cliente "Polarist" siempre esté en la lista disponible.
   */
  async fetchClients(): Promise<ClientItem[]> {
    const { data, error } = await supabase
      .from('plannifier_clients')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error al cargar clientes desde Supabase:', error);
      throw error;
    }

    const isDbSeeded =
      typeof window !== 'undefined' &&
      (localStorage.getItem('plannifier_db_seeded') === 'true' ||
       localStorage.getItem('plannifier_supabase_seeded_v2') === 'true');

    let clientList: ClientItem[] = [];

    if (data && data.length > 0) {
      if (typeof window !== 'undefined') {
        localStorage.setItem('plannifier_db_seeded', 'true');
        localStorage.setItem('plannifier_supabase_seeded_v2', 'true');
      }
      clientList = data.map((row: any) => {
        const rawType = (row.type as string) || 'cliente';
        let clientType: ClientType = 'cliente';
        let owner: ClientOwner = 'enzo';

        if (rawType.includes('::')) {
          const [t, o] = rawType.split('::');
          clientType = (t as ClientType) || 'cliente';
          owner = (o as ClientOwner) || 'enzo';
        } else {
          clientType = (rawType as ClientType) || 'cliente';
          // Clientes existentes sin etiqueta pertenecen a Enzo
          owner = 'enzo';
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
        localStorage.setItem('plannifier_db_seeded', 'true');
        localStorage.setItem('plannifier_supabase_seeded_v2', 'true');
      }

      const rowsToInsert = INITIAL_CLIENTS.map((c) => ({
        id: c.id,
        name: c.name,
        type: `${c.type || 'cliente'}::enzo`,
        color: c.color,
        country: c.country || 'Uruguay',
        created_at: c.createdAt || new Date().toISOString(),
      }));
      await supabase.from('plannifier_clients').insert(rowsToInsert);
      clientList = INITIAL_CLIENTS.map((c) => ({ ...c, owner: 'enzo' as ClientOwner }));
    }

    // Asegurar que Polarist tenga al menos un cliente propio para empezar en su espacio
    const hasPolaristClient = clientList.some((c) => c.owner === 'polarist');
    if (!hasPolaristClient) {
      const defaultPolaristClient: ClientItem = {
        id: 'client-polarist-enterprise',
        name: 'Polarist Enterprise',
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
   * Inserta un nuevo cliente/interesado en `plannifier_clients`.
   * Serializa el owner en type como `${type}::${owner}` para aislar entre usuarios y Polarist.
   */
  async createClient(client: ClientItem): Promise<void> {
    const ownerToSave = client.owner || 'enzo';
    const row = {
      id: client.id,
      name: client.name,
      type: `${client.type || 'cliente'}::${ownerToSave}`,
      color: client.color,
      country: client.country || 'Uruguay',
      created_at: client.createdAt || new Date().toISOString(),
    };
    const { error } = await supabase.from('plannifier_clients').insert(row);
    if (error) {
      console.error('Error al crear cliente en Supabase:', error);
      throw error;
    }
  },

  /**
   * Actualiza los datos de un cliente/interesado en `plannifier_clients`.
   */
  async updateClient(client: ClientItem): Promise<void> {
    const ownerToSave = client.owner || 'enzo';
    const row = {
      name: client.name,
      type: `${client.type || 'cliente'}::${ownerToSave}`,
      color: client.color,
      country: client.country,
    };
    const { error } = await supabase.from('plannifier_clients').update(row).eq('id', client.id);
    if (error) {
      console.error('Error al actualizar cliente en Supabase:', error);
      throw error;
    }
  },

  /**
   * Elimina un cliente de `plannifier_clients`.
   */
  async deleteClient(id: string): Promise<void> {
    const { error } = await supabase.from('plannifier_clients').delete().eq('id', id);
    if (error) {
      console.error('Error al eliminar cliente de Supabase:', error);
      throw error;
    }
  },
};

