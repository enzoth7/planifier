import React, { useState, useEffect, useMemo } from 'react';
import {
  ActionItem,
  ClientItem,
  ClientType,
  ClientOwner,
  TabType,
  VintageColorKey,
  UserProfile,
  APP_USERS,
  WorkspaceMode,
  TaskType,
  AppEndpoint,
} from './types';
import { loadStoredActions, saveStoredActions, loadStoredClients, saveStoredClients } from './utils/storage';
import { actionsService } from './services/actionsService';
import { getInitialEndpoint, navigateEndpoint, subscribeToEndpointChange } from './utils/router';
import { soundFx } from './utils/sound';
import { fireCraftsmanCelebration } from './utils/confetti';
import { Header } from './components/Header';
import { BoardTable } from './components/BoardTable';
import { CompletedTable } from './components/CompletedTable';
import { ClientsTable } from './components/ClientsTable';
import { CalendarView } from './components/CalendarView';
import { ActionModal } from './components/ActionModal';
import { ClientModal } from './components/ClientModal';
import { BackgroundSelector } from './components/BackgroundSelector';
import { LoginScreen } from './components/LoginScreen';
import { Loader2 } from 'lucide-react';


export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('board');
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [completedActions, setCompletedActions] = useState<ActionItem[]>([]);
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Router / Endpoint State: 'enzo' | 'cristian' | 'julieta' | 'polarist'
  const [currentEndpoint, setCurrentEndpoint] = useState<AppEndpoint>(() => getInitialEndpoint());

  // Estado de sesión autenticada
  const [authenticatedUser, setAuthenticatedUser] = useState<UserProfile | null>(() => {
    const email = localStorage.getItem('plannifier_auth_email');
    return APP_USERS.find((u) => u.email === email) || null;
  });

  // Usuario correspondiente al endpoint actual
  const currentUser: UserProfile = useMemo(() => {
    if (currentEndpoint === 'cristian') return APP_USERS[1];
    if (currentEndpoint === 'julieta') return APP_USERS[2];
    if (currentEndpoint === 'polarist') return authenticatedUser || APP_USERS[0];
    return APP_USERS[0]; // 'enzo'
  }, [currentEndpoint, authenticatedUser]);

  const workspaceMode: WorkspaceMode = currentEndpoint === 'polarist' ? 'team' : 'personal';

  // Suscripción al enrutador para cambios de URL en vivo y botones de historial
  useEffect(() => {
    const unsubscribe = subscribeToEndpointChange((newEp) => {
      setCurrentEndpoint(newEp);
    });
    return unsubscribe;
  }, []);

  const handleNavigateEndpoint = (endpoint: AppEndpoint) => {
    navigateEndpoint(endpoint);
    setCurrentEndpoint(endpoint);
  };

  const handleLogin = (email: string) => {
    const user = APP_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return;
    localStorage.setItem('plannifier_auth_email', user.email);
    setAuthenticatedUser(user);
    handleNavigateEndpoint(user.endpoint);
  };

  const handleLogout = () => {
    localStorage.removeItem('plannifier_auth_email');
    setAuthenticatedUser(null);
  };

  // Escudo de Privacidad de Rutas:
  // Un usuario autenticado solo tiene permitido acceder a:
  // 1. Su propio endpoint personal (authenticatedUser.endpoint, ej: /enzo).
  // 2. El espacio de equipo compartido (polarist, ej: /polarist).
  useEffect(() => {
    if (authenticatedUser) {
      const allowed = [authenticatedUser.endpoint, 'polarist'];
      if (!allowed.includes(currentEndpoint)) {
        handleNavigateEndpoint(authenticatedUser.endpoint);
      }
    }
  }, [authenticatedUser, currentEndpoint]);

  const [selectedTeamMemberEmail, setSelectedTeamMemberEmail] = useState<string | null>(null);

  // Calendar stats state
  const [calendarStats, setCalendarStats] = useState<{ totalValue: number; count: number }>({
    totalValue: 0,
    count: 0,
  });

  // Background customization state (isolated per user with fallback)
  const [bgImage, setBgImage] = useState<string>(() => {
    const initialUserEmail = localStorage.getItem('plannifier_current_user_email') || APP_USERS[0].email;
    return (
      localStorage.getItem(`plannifier_bg_image_${initialUserEmail}`) ||
      localStorage.getItem('plannifier_bg_image') ||
      '/Bg.png'
    );
  });
  const [bgOpacity, setBgOpacity] = useState<number>(() => {
    const initialUserEmail = localStorage.getItem('plannifier_current_user_email') || APP_USERS[0].email;
    const stored =
      localStorage.getItem(`plannifier_bg_opacity_${initialUserEmail}`) ||
      localStorage.getItem('plannifier_bg_opacity');
    return stored ? Number(stored) : 30;
  });

  // Sincronizar fondo personalizado según el usuario del endpoint activo
  useEffect(() => {
    const userBg =
      localStorage.getItem(`plannifier_bg_image_${currentUser.email}`) ||
      localStorage.getItem('plannifier_bg_image') ||
      '/Bg.png';
    const userOpacity =
      localStorage.getItem(`plannifier_bg_opacity_${currentUser.email}`) ||
      localStorage.getItem('plannifier_bg_opacity');
    setBgImage(userBg);
    setBgOpacity(userOpacity ? Number(userOpacity) : 30);
  }, [currentUser.email]);

  const handleSelectBg = (url: string) => {
    setBgImage(url);
    try {
      localStorage.setItem(`plannifier_bg_image_${currentUser.email}`, url);
      localStorage.setItem('plannifier_bg_image', url);
    } catch (e) {
      console.warn('No se pudo guardar la imagen de fondo en localStorage:', e);
    }
  };

  const handleSelectOpacity = (opacity: number) => {
    setBgOpacity(opacity);
    try {
      localStorage.setItem(`plannifier_bg_opacity_${currentUser.email}`, opacity.toString());
      localStorage.setItem('plannifier_bg_opacity', opacity.toString());
    } catch (e) {
      console.warn('No se pudo guardar la opacidad de fondo en localStorage:', e);
    }
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

  // Load from Supabase on mount (with localStorage fallback)
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
          setClients(loadStoredClients());
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

  // Aislamiento estricto de clientes por Endpoint / Espacio
  const filteredClients = useMemo(() => {
    if (currentEndpoint === 'polarist') {
      return clients.filter((c) => c.owner === 'polarist');
    }
    if (currentEndpoint === 'cristian') {
      return clients.filter((c) => c.owner === 'cristian');
    }
    if (currentEndpoint === 'julieta') {
      return clients.filter((c) => c.owner === 'juli');
    }
    // Espacio personal de Enzo
    return clients.filter((c) => (c.owner || 'enzo') === 'enzo');
  }, [clients, currentEndpoint]);

  // Aislamiento estricto de acciones activas por Endpoint / Espacio
  const filteredActions = useMemo(() => {
    if (currentEndpoint === 'polarist') {
      // Modo Equipo Polarist: acciones del espacio Polarist
      return actions.filter((item) => {
        const isPolarist =
          item.workspaceScope === 'polarist' ||
          item.target?.trim().toLowerCase() === 'polarist';
        if (!isPolarist) return false;
        if (selectedTeamMemberEmail) {
          const email = item.userEmail || APP_USERS[0].email;
          return email.toLowerCase() === selectedTeamMemberEmail.toLowerCase();
        }
        return true;
      });
    }

    // Modo Personal: únicamente las acciones personales del usuario actual
    const targetUserEmail = currentUser.email;
    return actions.filter((item) => {
      // Tareas de Polarist no se muestran en los tableros personales
      if (item.workspaceScope === 'polarist') return false;
      const email = item.userEmail || 'enzothome1@gmail.com';
      return email.toLowerCase() === targetUserEmail.toLowerCase();
    });
  }, [actions, currentEndpoint, currentUser.email, selectedTeamMemberEmail]);

  // Aislamiento estricto de acciones completadas por Endpoint / Espacio
  const filteredCompletedActions = useMemo(() => {
    if (currentEndpoint === 'polarist') {
      return completedActions.filter((item) => {
        const isPolarist =
          item.workspaceScope === 'polarist' ||
          item.target?.trim().toLowerCase() === 'polarist';
        if (!isPolarist) return false;
        if (selectedTeamMemberEmail) {
          const email = item.userEmail || APP_USERS[0].email;
          return email.toLowerCase() === selectedTeamMemberEmail.toLowerCase();
        }
        return true;
      });
    }

    const targetUserEmail = currentUser.email;
    return completedActions.filter((item) => {
      if (item.workspaceScope === 'polarist') return false;
      const email = item.userEmail || 'enzothome1@gmail.com';
      return email.toLowerCase() === targetUserEmail.toLowerCase();
    });
  }, [completedActions, currentEndpoint, currentUser.email, selectedTeamMemberEmail]);

  // Total money calculations basados en el workspace y filtros activos
  const totalValue = useMemo(() => {
    return filteredActions.reduce((acc, curr) => acc + (curr.value || 0), 0);
  }, [filteredActions]);

  const completedValue = useMemo(() => {
    return filteredCompletedActions.reduce((acc, curr) => acc + (curr.value || 0), 0);
  }, [filteredCompletedActions]);

  // Handlers
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

  /**
   * REQUERIMIENTO PRINCIPAL:
   * Al marcar completada en el tablero:
   * - Desaparece de inmediato de la lista activa (se elimina de plannifier_actions).
   * - Se inserta en plannifier_completed con completed_at.
   */
  const handleToggleComplete = async (id: string) => {
    const itemToComplete = actions.find((a) => a.id === id);
    if (!itemToComplete) return;

    // Celebración visual y táctil
    soundFx.playChalkComplete();
    fireCraftsmanCelebration();

    const completedAt = new Date().toISOString();
    const completedItem: ActionItem = {
      ...itemToComplete,
      completed: true,
      completedAt,
    };

    // Actualización optimista: desaparece inmediatamente del tablero activo
    setActions((prev) => prev.filter((item) => item.id !== id));
    setCompletedActions((prev) => [completedItem, ...prev]);

    try {
      await actionsService.completeAction(completedItem);
    } catch (err) {
      console.error('Error al persistir acción completada en Supabase:', err);
      // Revertir en caso de fallo
      setActions((prev) => [...prev, itemToComplete]);
      setCompletedActions((prev) => prev.filter((item) => item.id !== id));
    }
  };

  /**
   * Restaurar acción completada al tablero activo
   */
  const handleRestoreAction = async (item: ActionItem) => {
    soundFx.playWoodClick();

    const restoredItem: ActionItem = {
      ...item,
      completed: false,
      completedAt: undefined,
      order: actions.length,
    };

    // Actualización optimista: remover de completados y poner en tablero activo
    setCompletedActions((prev) => prev.filter((a) => a.id !== item.id));
    setActions((prev) => [restoredItem, ...prev]);

    try {
      await actionsService.restoreAction(restoredItem, 0);
    } catch (err) {
      console.error('Error al restaurar acción en Supabase:', err);
      // Revertir en caso de fallo
      setCompletedActions((prev) => [item, ...prev]);
      setActions((prev) => prev.filter((a) => a.id !== item.id));
    }
  };

  /**
   * Eliminar permanentemente del historial de completados
   */
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

  const handleUpdateColor = (id: string, color: VintageColorKey) => {
    setActions((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, tagColor: color };
          actionsService.updateAction(updated).catch(console.error);
          return updated;
        }
        return item;
      })
    );
  };

  const handleUpdateValue = (id: string, val: number) => {
    setActions((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, value: val };
          actionsService.updateAction(updated).catch(console.error);
          return updated;
        }
        return item;
      })
    );
  };

  const handleUpdateTarget = (id: string, target: string) => {
    setActions((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, target };
          actionsService.updateAction(updated).catch(console.error);
          return updated;
        }
        return item;
      })
    );
  };

  const handleUpdateTargetAndColor = (id: string, target: string, color: VintageColorKey) => {
    setActions((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, target, tagColor: color };
          actionsService.updateAction(updated).catch(console.error);
          return updated;
        }
        return item;
      })
    );
  };

  const handleUpdateDeadline = (id: string, deadline: string) => {
    setActions((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const updated = { ...item, deadline };
          actionsService.updateAction(updated).catch(console.error);
          return updated;
        }
        return item;
      })
    );
  };

  const handleToggleExpand = (id: string) => {
    setActions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isExpanded: !item.isExpanded } : item))
    );
  };

  const handleToggleSubtask = (itemId: string, subtaskId: string) => {
    setActions((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const updatedSubtasks = (item.subtasks || []).map((st) =>
            st.id === subtaskId ? { ...st, done: !st.done } : st
          );
          const updated = { ...item, subtasks: updatedSubtasks };
          actionsService.updateAction(updated).catch(console.error);
          return updated;
        }
        return item;
      })
    );
  };

  const handleAddSubtask = (itemId: string, text: string) => {
    setActions((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const newSubtask = {
            id: `st-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            text,
            done: false,
          };
          const updated = {
            ...item,
            subtasks: [...(item.subtasks || []), newSubtask],
            isExpanded: true,
          };
          actionsService.updateAction(updated).catch(console.error);
          return updated;
        }
        return item;
      })
    );
  };

  const handleDeleteSubtask = (itemId: string, subtaskId: string) => {
    setActions((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const updated = {
            ...item,
            subtasks: (item.subtasks || []).filter((st) => st.id !== subtaskId),
          };
          actionsService.updateAction(updated).catch(console.error);
          return updated;
        }
        return item;
      })
    );
  };

  const handleUpdateNotes = (itemId: string, notes: string) => {
    setActions((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const updated = { ...item, notes };
          actionsService.updateAction(updated).catch(console.error);
          return updated;
        }
        return item;
      })
    );
  };

  // Client Handlers
  const handleAddClient = (clientData: {
    name: string;
    type: ClientType;
    color: VintageColorKey;
    country?: string;
  }) => {
    const owner: ClientOwner =
      currentEndpoint === 'polarist'
        ? 'polarist'
        : currentEndpoint === 'cristian'
        ? 'cristian'
        : currentEndpoint === 'julieta'
        ? 'juli'
        : 'enzo';

    const newClient: ClientItem = {
      id: `client-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: clientData.name,
      type: clientData.type,
      color: clientData.color,
      country: clientData.country || 'Uruguay',
      owner,
      createdAt: new Date().toISOString(),
    };
    setClients((prev) => [...prev, newClient]);
    actionsService.createClient(newClient).catch(console.error);
  };

  const handleUpdateClient = (client: ClientItem) => {
    const owner: ClientOwner =
      client.owner ||
      (currentEndpoint === 'polarist'
        ? 'polarist'
        : currentEndpoint === 'cristian'
        ? 'cristian'
        : currentEndpoint === 'julieta'
        ? 'juli'
        : 'enzo');
    const updatedClient: ClientItem = { ...client, owner };
    setClients((prev) => prev.map((c) => (c.id === client.id ? updatedClient : c)));
    actionsService.updateClient(updatedClient).catch(console.error);
  };

  const handleDeleteClient = (id: string) => {
    soundFx.playTock();
    setClients((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      saveStoredClients(updated);
      return updated;
    });
    actionsService.deleteClient(id).catch((err) => {
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

  const handleQuickAdd = (data: {
    title: string;
    target: string;
    tagColor?: VintageColorKey;
    value: number;
    deadline: string;
    taskType?: TaskType;
    userEmail?: string;
  }) => {
    const isPolarist = currentEndpoint === 'polarist';
    const workspaceScope = isPolarist ? ('polarist' as const) : ('personal' as const);
    const defaultTarget = isPolarist
      ? (filteredClients[0]?.name || 'Polarist Enterprise')
      : (filteredClients[0]?.name || 'General');

    const targetToUse = data.target?.trim() || defaultTarget;
    const clientMatch = filteredClients.find(
      (c) => c.name.toLowerCase() === targetToUse.toLowerCase()
    );
    const resolvedColor = data.tagColor || clientMatch?.color || 'emerald';

    const newItem: ActionItem = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      order: 0,
      title: data.title,
      target: targetToUse,
      tagColor: resolvedColor,
      value: data.value || 0,
      currency: '$',
      deadline: data.deadline || '',
      completed: false,
      notes: '',
      subtasks: [],
      isExpanded: false,
      createdAt: new Date().toISOString(),
      taskType: data.taskType || 'action',
      userEmail: data.userEmail || currentUser.email,
      workspaceScope,
    };

    const updated = [newItem, ...actions].map((item, idx) => ({ ...item, order: idx }));
    setActions(updated);

    actionsService.createAction(newItem)
      .then(() => actionsService.reorderActions(updated))
      .catch(console.error);
  };

  const handleSaveModalItem = (itemData: Partial<ActionItem>) => {
    if (editingItem) {
      const updatedItem = { ...editingItem, ...itemData } as ActionItem;
      setActions((prev) =>
        prev.map((item) => (item.id === editingItem.id ? updatedItem : item))
      );
      actionsService.updateAction(updatedItem).catch(console.error);
    } else {
      const isPolarist = currentEndpoint === 'polarist';
      const workspaceScope = isPolarist ? ('polarist' as const) : ('personal' as const);
      const defaultTarget = isPolarist
        ? (filteredClients[0]?.name || 'Polarist Enterprise')
        : (filteredClients[0]?.name || 'General');

      const newItem: ActionItem = {
        id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        order: 0,
        title: itemData.title || 'Nueva Acción',
        target: itemData.target || defaultTarget,
        tagColor: itemData.tagColor || 'emerald',
        value: itemData.value || 0,
        currency: '$',
        deadline: itemData.deadline || '',
        completed: false,
        notes: itemData.notes || '',
        subtasks: itemData.subtasks || [],
        isExpanded: false,
        createdAt: new Date().toISOString(),
        taskType: itemData.taskType || 'action',
        userEmail: itemData.userEmail || currentUser.email,
        workspaceScope,
      };

      const updated = [newItem, ...actions].map((item, idx) => ({ ...item, order: idx }));
      setActions(updated);

      actionsService.createAction(newItem)
        .then(() => actionsService.reorderActions(updated))
        .catch(console.error);
    }
    setEditingItem(null);
  };

  if (!authenticatedUser) {
    return (
      <LoginScreen
        onLogin={handleLogin}
        bgImage="/BgPolarist.png"
        bgOpacity={bgOpacity}
      />
    );
  }

  const activeBgImage = currentEndpoint === 'polarist' ? '/BgPolarist.png' : bgImage;

  return (
    <>
      {/* Foto de fondo 100% nítida con transición suave */}
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center pointer-events-none transition-all duration-700 ease-out"
        style={{ backgroundImage: "url('" + activeBgImage + "')" }}
      />
      {/* Capa blanca suave para atenuar con transición suave */}
      <div
        className="fixed inset-0 -z-10 bg-white pointer-events-none transition-all duration-700 ease-out"
        style={{ opacity: bgOpacity / 100 }}
      />

      <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 flex flex-col justify-between max-w-[96%] xl:max-w-[1550px] w-full mx-auto text-zinc-900">
        <main className="space-y-6">
          {/* Minimalist Header con switch Tablero vs Calendario vs Completados vs Clientes */}
          <Header
            currentEndpoint={currentEndpoint}
            onNavigateEndpoint={handleNavigateEndpoint}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            totalValue={totalValue}
            calendarTotalValue={calendarStats.totalValue}
            calendarActiveCount={calendarStats.count}
            completedValue={completedValue}
            activeCount={filteredActions.length}
            completedCount={filteredCompletedActions.length}
            clientsCount={filteredClients.length}
            onOpenCreateModal={() => handleOpenCreateModal()}
            onOpenCreateClientModal={() => {
              setEditingClient(null);
              setIsClientModalOpen(true);
            }}
            currentUser={currentUser}
            onLogout={handleLogout}
            selectedTeamMemberEmail={selectedTeamMemberEmail}
            onSelectTeamMember={setSelectedTeamMemberEmail}
          />

          {/* Contenido según la pestaña activa */}
          {isLoading ? (
            <div className="rounded-xl border border-white/70 bg-white/90 backdrop-blur-md p-12 text-center shadow-xl shadow-zinc-900/5">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-zinc-400 mb-2" />
              <p className="text-xs text-zinc-500 font-mono">Sincronizando con Supabase...</p>
            </div>
          ) : activeTab === 'board' ? (
            /* Vista Principal: Tablero de Acciones Activas */
            <BoardTable
              items={filteredActions}
              clients={filteredClients}
              onReorder={handleReorder}
              onToggleComplete={handleToggleComplete}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onUpdateColor={handleUpdateColor}
              onUpdateValue={handleUpdateValue}
              onUpdateTarget={handleUpdateTarget}
              onUpdateTargetAndColor={handleUpdateTargetAndColor}
              onUpdateDeadline={handleUpdateDeadline}
              onToggleExpand={handleToggleExpand}
              onToggleSubtask={handleToggleSubtask}
              onAddSubtask={handleAddSubtask}
              onDeleteSubtask={handleDeleteSubtask}
              onUpdateNotes={handleUpdateNotes}
              onNavigateToClients={() => setActiveTab('clients')}
              onOpenCreateModal={() => handleOpenCreateModal()}
              onQuickAdd={handleQuickAdd}
              workspaceMode={workspaceMode}
              currentUser={currentUser}
            />
          ) : activeTab === 'calendar' ? (
            /* Vista Calendario: Cuadrícula de 4 Semanas */
            <CalendarView
              items={filteredActions}
              clients={filteredClients}
              onToggleComplete={handleToggleComplete}
              onEdit={handleEdit}
              onUpdateDeadline={handleUpdateDeadline}
              onOpenCreateModal={handleOpenCreateModal}
              onVisibleRangeStatsChange={setCalendarStats}
              workspaceMode={workspaceMode}
              selectedTeamMemberEmail={selectedTeamMemberEmail}
              onSelectTeamMember={setSelectedTeamMemberEmail}
            />
          ) : activeTab === 'completed' ? (
            /* Vista Secundaria: Historial de Acciones Completadas */
            <CompletedTable
              items={filteredCompletedActions}
              onRestore={handleRestoreAction}
              onDelete={handleDeleteCompleted}
              workspaceMode={workspaceMode}
            />
          ) : (
            /* Vista Clientes e Interesados (Aislados por Espacio) */
            <ClientsTable
              clients={filteredClients}
              actions={[...filteredActions, ...filteredCompletedActions]}
              onAddClient={handleAddClient}
              onUpdateClient={handleUpdateClient}
              onDeleteClient={handleDeleteClient}
              onOpenCreateModal={() => {
                setEditingClient(null);
                setIsClientModalOpen(true);
              }}
            />
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
          clients={filteredClients}
          workspaceMode={workspaceMode}
          currentUserEmail={currentUser.email}
        />

        {/* Modal para Crear / Editar Cliente */}
        <ClientModal
          isOpen={isClientModalOpen}
          onClose={() => setIsClientModalOpen(false)}
          onSave={handleSaveClientModal}
          initialData={editingClient}
        />

        {/* Selector flotante de Fondo en esquina inferior derecha */}
        <BackgroundSelector
          currentBg={activeBgImage}
          currentOpacity={bgOpacity}
          onSelectBg={handleSelectBg}
          onSelectOpacity={handleSelectOpacity}
        />
      </div>
    </>
  );
};

export default App;
