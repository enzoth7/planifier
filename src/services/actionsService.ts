import { supabase } from '../utils/supabase';
import { ActionItem, ClientItem, ClientType, ClientOwner, TaskType, VintageColorKey } from '../types';
import { INITIAL_ACTIONS, INITIAL_CLIENTS } from '../utils/storage';
import { isPolaristTeamClient, POLARIST_TEAM_CLIENT_ID } from '../utils/clients';

// Las tablas persistentes ya existentes conservan este namespace. Renombrarlas
// requiere una migración de base de datos; no debe hacerse desde el cliente.
const ACTIONS_TABLE = 'plannifier_actions';
const COMPLETED_ACTIONS_TABLE = 'plannifier_completed';
const CLIENTS_TABLE = 'plannifier_clients';

// La app es de un solo usuario. Las columnas user_email / workspace_scope siguen
// existiendo en la base, así que se escriben siempre con estos valores.
const OWNER_EMAIL = 'enzothome1@gmail.com';
const WORKSPACE_SCOPE = 'personal';

/** Filas que pertenecen a Enzo: sin objetivos, sin espacio Polarist y sin otros usuarios. */
const isOwnRow = (row: any): boolean =>
  row.task_type !== 'objective' &&
  row.workspace_scope !== 'polarist' &&
  (row.user_email || OWNER_EMAIL).toLowerCase() === OWNER_EMAIL;

/** Filas viejas guardaban metadatos como comentario al inicio de `notes`; se descartan. */
const stripLegacyMeta = (rawNotes?: string): string =>
  (rawNotes || '').replace(/^<!--META:\{.*?\}-->\s*/, '');

const rowToAction = (row: any, completed: boolean): ActionItem => ({
  id: row.id,
  order: completed ? 0 : row.order_index ?? 0,
  title: row.title ?? '',
  target: row.client ?? '',
  tagColor: (row.color as VintageColorKey) || 'emerald',
  value: Number(row.value) || 0,
  currency: '$',
  deadline: row.deadline ?? '',
  completed,
  completedAt: completed ? row.completed_at : undefined,
  notes: stripLegacyMeta(row.notes),
  subtasks: Array.isArray(row.subtasks) ? row.subtasks : [],
  createdAt: row.created_at ?? new Date().toISOString(),
  taskType: (row.task_type as TaskType) || 'action',
});

const actionToRow = (item: ActionItem) => ({
  id: item.id,
  title: item.title,
  client: item.target,
  color: item.tagColor,
  value: item.value,
  deadline: item.deadline,
  notes: item.notes || '',
  subtasks: item.subtasks || [],
  created_at: item.createdAt || new Date().toISOString(),
  user_email: OWNER_EMAIL,
  task_type: item.taskType || 'action',
  workspace_scope: WORKSPACE_SCOPE,
});

const markSeeded = () => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('planifier_db_seeded', 'true');
  localStorage.setItem('planifier_supabase_seeded_v2', 'true');
};

export const actionsService = {
  /**
   * Carga las acciones activas desde `plannifier_actions` ordenadas por `order_index ASC`.
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

    // Los objetivos de Polarist comparten tabla; nunca deben aparecer en el tablero.
    const allRows = data || [];
    if (allRows.length > 0) {
      markSeeded();
      return allRows.filter(isOwnRow).map((row: any) => rowToAction(row, false));
    }

    const isDbSeeded =
      typeof window !== 'undefined' &&
      (localStorage.getItem('planifier_db_seeded') === 'true' ||
        localStorage.getItem('planifier_supabase_seeded_v2') === 'true');

    // Si la tabla devolvió 0 filas y ya fue sembrada previamente, devolver vacío.
    if (isDbSeeded) return [];

    // Solo sembrar en el primer arranque absoluto.
    markSeeded();

    const rowsToInsert = INITIAL_ACTIONS.filter((a) => !a.completed).map((item, idx) => ({
      ...actionToRow(item),
      order_index: idx,
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

    const completedRows = INITIAL_ACTIONS.filter((a) => a.completed).map((item) => ({
      ...actionToRow(item),
      completed_at: item.completedAt || new Date().toISOString(),
    }));
    if (completedRows.length > 0) {
      const { error: seedCompErr } = await supabase.from(COMPLETED_ACTIONS_TABLE).upsert(completedRows);
      if (seedCompErr) console.error('Error al sembrar completadas iniciales:', seedCompErr);
    }

    return (inserted || rowsToInsert).map((row: any) => rowToAction(row, false));
  },

  /** Inserta una nueva acción en `plannifier_actions`. */
  async createAction(item: ActionItem): Promise<void> {
    const { error } = await supabase.from(ACTIONS_TABLE).insert({ ...actionToRow(item), order_index: item.order });
    if (error) {
      console.error('Error al crear acción en Supabase:', error);
      throw error;
    }
  },

  /** Actualiza los datos de una acción activa. */
  async updateAction(item: ActionItem): Promise<void> {
    // `id` y `created_at` no se reescriben al actualizar.
    const { id: _id, created_at: _createdAt, ...row } = actionToRow(item);
    const { error } = await supabase
      .from(ACTIONS_TABLE)
      .update({ ...row, order_index: item.order })
      .eq('id', item.id);
    if (error) {
      console.error('Error al actualizar acción en Supabase:', error);
      throw error;
    }
  },

  /** Actualiza el orden (order_index) de las acciones en lote. */
  async reorderActions(items: ActionItem[]): Promise<void> {
    const results = await Promise.all(
      items.map((item, index) => supabase.from(ACTIONS_TABLE).update({ order_index: index }).eq('id', item.id))
    );
    const failed = results.find((r) => r.error);
    if (failed && failed.error) {
      console.error('Error al reordenar acciones en Supabase:', failed.error);
      throw failed.error;
    }
  },

  /** Elimina una acción activa. */
  async deleteAction(id: string): Promise<void> {
    const { error } = await supabase.from(ACTIONS_TABLE).delete().eq('id', id);
    if (error) {
      console.error('Error al eliminar acción activa:', error);
      throw error;
    }
  },

  /**
   * Completa una acción: se inserta en `plannifier_completed` con `completed_at`
   * y se elimina de `plannifier_actions`.
   */
  async completeAction(item: ActionItem): Promise<void> {
    const completedAt = new Date().toISOString();
    const { error: insertError } = await supabase
      .from(COMPLETED_ACTIONS_TABLE)
      .upsert({ ...actionToRow(item), created_at: item.createdAt || completedAt, completed_at: completedAt });
    if (insertError) {
      console.error('Error al insertar en plannifier_completed:', insertError);
      throw insertError;
    }

    const { error: deleteError } = await supabase.from(ACTIONS_TABLE).delete().eq('id', item.id);
    if (deleteError) {
      console.error('Error al eliminar de plannifier_actions:', deleteError);
      throw deleteError;
    }
  },

  /** Carga las acciones completadas ordenadas por `completed_at DESC`. */
  async fetchCompletedActions(): Promise<ActionItem[]> {
    const { data, error } = await supabase
      .from(COMPLETED_ACTIONS_TABLE)
      .select('*')
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('Error al cargar acciones completadas:', error);
      throw error;
    }

    if (data && data.length > 0) markSeeded();

    return (data || []).filter(isOwnRow).map((row: any) => rowToAction(row, true));
  },

  /** Restaura una acción completada al tablero activo. */
  async restoreAction(item: ActionItem, newOrderIndex = 0): Promise<void> {
    const { error: insertError } = await supabase
      .from(ACTIONS_TABLE)
      .upsert({ ...actionToRow(item), order_index: newOrderIndex });
    if (insertError) {
      console.error('Error al restaurar a plannifier_actions:', insertError);
      throw insertError;
    }

    const { error: deleteError } = await supabase.from(COMPLETED_ACTIONS_TABLE).delete().eq('id', item.id);
    if (deleteError) {
      console.error('Error al remover de plannifier_completed:', deleteError);
      throw deleteError;
    }
  },

  /** Elimina permanentemente una acción del historial de completados. */
  async deleteCompletedAction(id: string): Promise<void> {
    const { error } = await supabase.from(COMPLETED_ACTIONS_TABLE).delete().eq('id', id);
    if (error) {
      console.error('Error al eliminar de plannifier_completed:', error);
      throw error;
    }
  },

  /**
   * Carga la lista de clientes/interesados. El cliente fijo "Polarist" siempre
   * está disponible aunque se haya borrado de la base.
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
      markSeeded();
      clientList = data.map((row: any) => {
        const rawType = (row.type as string) || 'cliente';
        let clientType: ClientType = 'cliente';
        let owner: ClientOwner = (row.owner as ClientOwner) || (row.name?.trim().toLowerCase() === 'polarist' ? 'polarist' : 'enzo');

        if (rawType.includes('::')) {
          const [t, o] = rawType.split('::');
          clientType = (t as ClientType) || 'cliente';
          if (!row.owner) owner = (o as ClientOwner) || owner;
        } else {
          clientType = (rawType as ClientType) || 'cliente';
        }

        const client: ClientItem = {
          id: row.id,
          name: row.name ?? '',
          type: clientType,
          owner,
          color: (row.color as VintageColorKey) || 'emerald',
          country: row.country || 'Uruguay',
          createdAt: row.created_at,
        };
        return isPolaristTeamClient(client) ? { ...client, isSystem: true } : client;
      });
    } else if (!isDbSeeded) {
      markSeeded();

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

    // El cliente Polarist es fijo. Si fue borrado en una versión anterior,
    // se restaura aunque la base ya tenga otros clientes.
    const polaristIndex = clientList.findIndex(isPolaristTeamClient);
    if (polaristIndex >= 0) {
      clientList[polaristIndex] = {
        ...clientList[polaristIndex],
        name: 'Polarist',
        owner: 'polarist',
        isSystem: true,
      };
    } else {
      const defaultPolaristClient: ClientItem = {
        id: POLARIST_TEAM_CLIENT_ID,
        name: 'Polarist',
        type: 'cliente',
        owner: 'polarist',
        isSystem: true,
        color: 'emerald',
        country: 'Uruguay',
        createdAt: new Date().toISOString(),
      };
      clientList.unshift(defaultPolaristClient);

      const { error: restoreError } = await supabase.from(CLIENTS_TABLE).upsert({
        id: defaultPolaristClient.id,
        name: defaultPolaristClient.name,
        type: defaultPolaristClient.type,
        owner: defaultPolaristClient.owner,
        color: defaultPolaristClient.color,
        country: defaultPolaristClient.country,
        created_at: defaultPolaristClient.createdAt,
      });
      if (restoreError) {
        console.warn('No se pudo restaurar el cliente Polarist en Supabase.', restoreError);
      }
    }

    // Solo clientes propios (más el fijo Polarist).
    return clientList.filter((c) => (c.owner || 'enzo') === 'enzo' || isPolaristTeamClient(c));
  },

  /** Inserta un nuevo cliente/interesado. */
  async createClient(client: ClientItem): Promise<void> {
    const row = {
      id: client.id,
      name: client.name,
      type: client.type || 'cliente',
      owner: client.owner || 'enzo',
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

  /** Actualiza los datos de un cliente/interesado. */
  async updateClient(client: ClientItem): Promise<void> {
    const protectedClient = isPolaristTeamClient(client);
    const row = {
      name: protectedClient ? 'Polarist' : client.name,
      type: client.type || 'cliente',
      owner: protectedClient ? 'polarist' : client.owner || 'enzo',
      color: client.color,
      country: client.country,
    };
    const { error } = await supabase.from(CLIENTS_TABLE).update(row).eq('id', client.id);
    if (error) {
      console.error('Error al actualizar cliente en Supabase:', error);
      throw error;
    }
  },

  /** Elimina un cliente. */
  async deleteClient(client: ClientItem): Promise<void> {
    if (isPolaristTeamClient(client)) {
      throw new Error('El cliente Polarist es parte del sistema y no puede eliminarse.');
    }

    const { error } = await supabase.from(CLIENTS_TABLE).delete().eq('id', client.id);
    if (error) {
      console.error('Error al eliminar cliente de Supabase:', error);
      throw error;
    }
  },
};
