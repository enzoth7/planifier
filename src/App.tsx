import React, { useState, useEffect } from 'react';
import {
  ActionItem,
  ClientItem,
  ClientType,
  VintageColorKey,
  TaskType,
} from './types';
import { loadStoredActions, saveStoredActions, loadStoredClients, saveStoredClients } from './utils/storage';
import { actionsService } from './services/actionsService';
import { preferencesService, UserPreferences } from './services/preferencesService';
import { soundFx } from './utils/sound';
import { fireCraftsmanCelebration } from './utils/confetti';
import { EnzoWorkspace } from './workspaces/EnzoWorkspace';
import { WorkspaceProps } from './workspaces/types';
import { ActionModal } from './components/ActionModal';
import { ClientModal } from './components/ClientModal';
import { Loader2 } from 'lucide-react';
import { ensurePolaristTeamClient, isPolaristTeamClient } from './utils/clients';

// App de un solo usuario: las preferencias (fondo, opacidad) se guardan bajo este email.
const OWNER_EMAIL = 'enzothome1@gmail.com';

const isVisibleClient = (client: ClientItem) =>
  (client.owner || 'enzo') === 'enzo' || isPolaristTeamClient(client);

export const App: React.FC = () => {
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [completedActions, setCompletedActions] = useState<ActionItem[]>([]);
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Preferencias de fondo (con fallback local y sincronización Supabase)
  const [preferences, setPreferences] = useState<UserPreferences>(() =>
    preferencesService.getStoredPreferences(OWNER_EMAIL)
  );

  useEffect(() => {
    let isMounted = true;
    preferencesService.loadPreferences(OWNER_EMAIL).then((pref) => {
      if (isMounted) setPreferences(pref);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSelectBg = (url: string) => {
    setPreferences((prev) => ({ ...prev, bgImage: url }));
    preferencesService.savePreferences(OWNER_EMAIL, { bgImage: url });
  };

  const handleSelectOpacity = (opacity: number) => {
    setPreferences((prev) => ({ ...prev, bgOpacity: opacity }));
    preferencesService.savePreferences(OWNER_EMAIL, { bgOpacity: opacity });
  };

  // Modal State for Actions
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ActionItem | null>(null);
  const [defaultDeadline, setDefaultDeadline] = useState<string | undefined>(undefined);

  const handleOpenCreateModal = (date?: string) => {
    setEditingItem(null);
    setDefaultDeadline(date);
    setIsModalOpen(true);
  };

  // Modal State for Clients
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<ClientItem | null>(null);

  // Load actions and clients from Supabase on mount (with localStorage fallback)
  useEffect(() => {
    let isMounted = true;

    async function initializeData() {
      try {
        setIsLoading(true);
        const [activeData, completedData, clientsData] = await Promise.all([
          actionsService.fetchActiveActions(),
          actionsService.fetchCompletedActions(),
          actionsService.fetchClients(),
        ]);

        if (isMounted) {
          setActions(activeData);
          setCompletedActions(completedData);
          setClients(clientsData);
        }
      } catch (err) {
        console.error('Error cargando datos de Supabase, recurriendo a localStorage:', err);
        if (isMounted) {
          const stored = loadStoredActions();
          setActions(stored.filter((a) => !a.completed));
          setCompletedActions(stored.filter((a) => a.completed));
          setClients(ensurePolaristTeamClient(loadStoredClients()).filter(isVisibleClient));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initializeData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync to localStorage as offline safety backup
  useEffect(() => {
    if (!isLoading) {
      saveStoredActions([...actions, ...completedActions]);
      saveStoredClients(clients);
    }
  }, [actions, completedActions, clients, isLoading]);

  // Handlers para Acciones
  const handleReorder = (newFilteredItems: ActionItem[]) => {
    const newFilteredMap = new Map(newFilteredItems.map((item, idx) => [item.id, idx]));
    const updatedActions = actions.map((item) => {
      if (newFilteredMap.has(item.id)) {
        return { ...item, order: newFilteredMap.get(item.id)! };
      }
      return item;
    });
    updatedActions.sort((a, b) => (a.order || 0) - (b.order || 0));
    setActions(updatedActions);
    actionsService.reorderActions(newFilteredItems).catch((err) => {
      console.error('Error reordenando acciones:', err);
    });
  };

  const handleToggleComplete = async (id: string) => {
    const itemToComplete = actions.find((a) => a.id === id);
    if (!itemToComplete) return;

    soundFx.playChalkComplete();
    fireCraftsmanCelebration();

    const completedAt = new Date().toISOString();
    const completedItem: ActionItem = {
      ...itemToComplete,
      completed: true,
      completedAt,
    };

    setActions((prev) => prev.filter((item) => item.id !== id));
    setCompletedActions((prev) => [completedItem, ...prev]);

    try {
      await actionsService.completeAction(completedItem);
    } catch (err) {
      console.error('Error al persistir acción completada en Supabase:', err);
      setActions((prev) => [...prev, itemToComplete]);
      setCompletedActions((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const handleRestoreAction = async (item: ActionItem) => {
    soundFx.playWoodClick();

    const restoredItem: ActionItem = {
      ...item,
      completed: false,
      completedAt: undefined,
      order: actions.length,
    };

    setCompletedActions((prev) => prev.filter((a) => a.id !== item.id));
    setActions((prev) => [restoredItem, ...prev]);

    try {
      await actionsService.restoreAction(restoredItem, 0);
    } catch (err) {
      console.error('Error al restaurar acción en Supabase:', err);
      setCompletedActions((prev) => [item, ...prev]);
      setActions((prev) => prev.filter((a) => a.id !== item.id));
    }
  };

  const handleDeleteCompleted = async (id: string) => {
    soundFx.playTock();
    setCompletedActions((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      saveStoredActions([...actions, ...updated]);
      return updated;
    });
    try {
      await actionsService.deleteCompletedAction(id);
    } catch (err) {
      console.error('Error al eliminar acción completada en Supabase:', err);
    }
  };

  const handleEdit = (item: ActionItem) => {
    setDefaultDeadline(undefined);
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    soundFx.playTock();
    setActions((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      saveStoredActions([...updated, ...completedActions]);
      return updated;
    });
    actionsService.deleteAction(id).catch((err) => {
      console.error('Error al eliminar acción activa en Supabase:', err);
    });
  };

  // Aplica un cambio a una acción activa y lo persiste.
  const patchAction = (id: string, patch: Partial<ActionItem>) => {
    setActions((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, ...patch };
        actionsService.updateAction(updated).catch(console.error);
        return updated;
      })
    );
  };

  const handleUpdateAction = (action: ActionItem) => {
    setActions((prev) => prev.map((a) => (a.id === action.id ? action : a)));
    actionsService.updateAction(action).catch(console.error);
  };

  const handleUpdateColor = (id: string, color: VintageColorKey) => patchAction(id, { tagColor: color });
  const handleUpdateValue = (id: string, val: number) => patchAction(id, { value: val });
  const handleUpdateTarget = (id: string, target: string) => patchAction(id, { target });
  const handleUpdateTargetAndColor = (id: string, target: string, color: VintageColorKey) =>
    patchAction(id, { target, tagColor: color });
  const handleUpdateDeadline = (id: string, deadline: string) => patchAction(id, { deadline });

  // Handlers para Clientes
  const handleAddClient = (clientData: {
    name: string;
    type: ClientType;
    color: VintageColorKey;
    country?: string;
  }) => {
    const newClient: ClientItem = {
      id: `client-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: clientData.name,
      type: clientData.type,
      color: clientData.color,
      country: clientData.country || 'Uruguay',
      owner: 'enzo',
      createdAt: new Date().toISOString(),
    };
    setClients((prev) => [...prev, newClient]);
    actionsService.createClient(newClient).catch(console.error);
  };

  const handleUpdateClient = (client: ClientItem) => {
    const existingClient = clients.find((item) => item.id === client.id);
    const protectedClient = existingClient && isPolaristTeamClient(existingClient);
    const updatedClient: ClientItem = protectedClient
      ? { ...client, name: 'Polarist', owner: 'polarist', isSystem: true }
      : { ...client, owner: client.owner || 'enzo' };
    setClients((prev) => prev.map((c) => (c.id === client.id ? updatedClient : c)));
    actionsService.updateClient(updatedClient).catch(console.error);
  };

  const handleDeleteClient = (id: string) => {
    const clientToDelete = clients.find((client) => client.id === id);
    if (!clientToDelete || isPolaristTeamClient(clientToDelete)) return;

    soundFx.playTock();
    setClients((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      saveStoredClients(updated);
      return updated;
    });
    actionsService.deleteClient(clientToDelete).catch((err) => {
      console.error('Error al eliminar cliente en Supabase:', err);
    });
  };

  const handleSaveClientModal = (clientData: Partial<ClientItem>) => {
    if (editingClient) {
      const updated: ClientItem = {
        ...editingClient,
        name: clientData.name || editingClient.name,
        type: clientData.type || editingClient.type,
        color: clientData.color || editingClient.color,
        country: clientData.country || editingClient.country || 'Uruguay',
      };
      handleUpdateClient(updated);
    } else if (clientData.name) {
      handleAddClient({
        name: clientData.name,
        type: clientData.type || 'cliente',
        color: clientData.color || 'emerald',
        country: clientData.country || 'Uruguay',
      });
    }
    setEditingClient(null);
  };

  // Crea una acción nueva al principio del tablero y la persiste.
  const createAction = (data: {
    title: string;
    target?: string;
    tagColor?: VintageColorKey;
    value?: number;
    deadline?: string;
    notes?: string;
    subtasks?: ActionItem['subtasks'];
    taskType?: TaskType;
  }) => {
    const targetToUse = data.target?.trim() || clients[0]?.name || 'General';
    const clientMatch = clients.find((c) => c.name.toLowerCase() === targetToUse.toLowerCase());

    const newItem: ActionItem = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      order: 0,
      title: data.title,
      target: targetToUse,
      tagColor: data.tagColor || clientMatch?.color || 'emerald',
      value: data.value || 0,
      currency: '$',
      deadline: data.deadline || '',
      completed: false,
      notes: data.notes || '',
      subtasks: data.subtasks || [],
      createdAt: new Date().toISOString(),
      taskType: data.taskType || 'action',
    };

    const updated = [newItem, ...actions].map((item, idx) => ({ ...item, order: idx }));
    setActions(updated);

    actionsService
      .createAction(newItem)
      .then(() => actionsService.reorderActions(updated))
      .catch(console.error);
  };

  const handleSaveModalItem = (itemData: Partial<ActionItem>) => {
    if (editingItem) {
      const updatedItem: ActionItem = { ...editingItem, ...itemData };
      setActions((prev) => prev.map((item) => (item.id === editingItem.id ? updatedItem : item)));
      actionsService.updateAction(updatedItem).catch(console.error);
    } else {
      createAction({ ...itemData, title: itemData.title || 'Nueva Acción' });
    }
    setEditingItem(null);
  };

  const workspaceProps: WorkspaceProps = {
    actions,
    completedActions,
    clients,
    onAddAction: createAction,
    onUpdateAction: handleUpdateAction,
    onDeleteAction: handleDelete,
    onCompleteAction: handleToggleComplete,
    onRestoreAction: handleRestoreAction,
    onDeleteCompletedAction: handleDeleteCompleted,
    onReorderActions: handleReorder,
    onAddClient: handleAddClient,
    onUpdateClient: handleUpdateClient,
    onDeleteClient: handleDeleteClient,
    onOpenCreateModal: handleOpenCreateModal,
    onOpenCreateClientModal: () => {
      setEditingClient(null);
      setIsClientModalOpen(true);
    },
    onEditAction: handleEdit,
    onSelectBg: handleSelectBg,
    onSelectOpacity: handleSelectOpacity,
    bgImage: preferences.bgImage,
    bgOpacity: preferences.bgOpacity,
    onUpdateColor: handleUpdateColor,
    onUpdateValue: handleUpdateValue,
    onUpdateTarget: handleUpdateTarget,
    onUpdateTargetAndColor: handleUpdateTargetAndColor,
    onUpdateDeadline: handleUpdateDeadline,
  };

  return (
    <>
      {/* Fondo fotográfico con transición suave */}
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center pointer-events-none transition-all duration-700 ease-out"
        style={{ backgroundImage: `url('${preferences.bgImage}')` }}
      />
      {/* Capa blanca suave para atenuación */}
      <div
        className="fixed inset-0 -z-10 bg-white pointer-events-none transition-all duration-700 ease-out"
        style={{ opacity: preferences.bgOpacity / 100 }}
      />

      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 flex flex-col justify-between max-w-[96%] xl:max-w-[1550px] w-full mx-auto text-zinc-900">
        <main className="space-y-6">
          {isLoading ? (
            <div className="rounded-xl border border-white/70 bg-white/90 backdrop-blur-md p-12 text-center shadow-xl shadow-zinc-900/5">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-zinc-400 mb-2" />
              <p className="text-xs text-zinc-500 font-mono">Sincronizando con Supabase...</p>
            </div>
          ) : (
            <EnzoWorkspace {...workspaceProps} />
          )}
        </main>

        {/* Modal para Crear / Editar Acción */}
        <ActionModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setDefaultDeadline(undefined);
          }}
          onSave={handleSaveModalItem}
          initialData={editingItem}
          defaultDeadline={defaultDeadline}
          clients={clients}
        />

        {/* Modal para Crear / Editar Cliente */}
        <ClientModal
          isOpen={isClientModalOpen}
          onClose={() => setIsClientModalOpen(false)}
          onSave={handleSaveClientModal}
          initialData={editingClient}
        />
      </div>
    </>
  );
};

export default App;
