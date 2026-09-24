import React, { useState, useMemo } from 'react';
import { WorkspaceProps } from './types';
import { TabType, ActionItem, VintageColorKey, TaskType, APP_USERS } from '../types';
import { Header } from '../components/Header';
import { BoardTable } from '../components/BoardTable';
import { CalendarView } from '../components/CalendarView';
import { CompletedTable } from '../components/CompletedTable';
import { ClientsTable } from '../components/ClientsTable';
import { BackgroundSelector } from '../components/BackgroundSelector';
import { isPolaristTeamClient } from '../utils/clients';

const ENZO_EMAIL = 'enzothome1@gmail.com';

export const EnzoWorkspace: React.FC<WorkspaceProps> = ({
  actions,
  completedActions,
  clients,
  currentUser,
  onNavigateEndpoint,
  onLogout,
  onAddAction,
  onDeleteAction,
  onCompleteAction,
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  onOpenCreateModal,
  onOpenCreateClientModal,
  onSelectBg,
  onSelectOpacity,
  bgImage,
  bgOpacity,
  onRestoreAction,
  onDeleteCompletedAction,
  onReorderActions,
  onEditAction,
  onUpdateColor,
  onUpdateValue,
  onUpdateTarget,
  onUpdateTargetAndColor,
  onUpdateDeadline,
  onToggleExpand,
  onToggleSubtask,
  onAddSubtask,
  onDeleteSubtask,
  onUpdateNotes,
}) => {
  // Gestión independiente de pestañas / subpáginas de Enzo
  const [activeTab, setActiveTab] = useState<TabType>('board');
  const [calendarStats, setCalendarStats] = useState<{ totalValue: number; count: number }>({
    totalValue: 0,
    count: 0,
  });

  // Aislamiento estricto de clientes personales de Enzo
  const enzoClients = useMemo(() => {
    return clients.filter((c) => (c.owner || 'enzo') === 'enzo' || isPolaristTeamClient(c));
  }, [clients]);

  // Aislamiento estricto de acciones activas de Enzo (excluye tareas de Polarist)
  const enzoActions = useMemo(() => {
    return actions.filter((item) => {
      if (item.workspaceScope === 'polarist') return false;
      const email = item.userEmail || ENZO_EMAIL;
      return email.toLowerCase() === ENZO_EMAIL.toLowerCase();
    });
  }, [actions]);

  // Aislamiento estricto de acciones completadas de Enzo
  const enzoCompletedActions = useMemo(() => {
    return completedActions.filter((item) => {
      if (item.workspaceScope === 'polarist') return false;
      const email = item.userEmail || ENZO_EMAIL;
      return email.toLowerCase() === ENZO_EMAIL.toLowerCase();
    });
  }, [completedActions]);

  // Métricas financieras personales de Enzo
  const totalValue = useMemo(() => {
    return enzoActions.reduce((acc, curr) => acc + (curr.value || 0), 0);
  }, [enzoActions]);

  const completedValue = useMemo(() => {
    return enzoCompletedActions.reduce((acc, curr) => acc + (curr.value || 0), 0);
  }, [enzoCompletedActions]);

  const handleQuickAdd = (data: {
    title: string;
    target: string;
    tagColor?: VintageColorKey;
    value: number;
    deadline: string;
    taskType?: TaskType;
  }) => {
    onAddAction({
      ...data,
      userEmail: ENZO_EMAIL,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Contextualizado para Enzo */}
      <Header
        currentEndpoint="enzo"
        onNavigateEndpoint={onNavigateEndpoint}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentUser={currentUser || APP_USERS[0]}
        onLogout={onLogout}
        selectedTeamMemberEmail={null}
        onSelectTeamMember={() => {}}
        totalValue={totalValue}
        calendarTotalValue={calendarStats.totalValue}
        calendarActiveCount={calendarStats.count}
        completedValue={completedValue}
        activeCount={enzoActions.length}
        completedCount={enzoCompletedActions.length}
        clientsCount={enzoClients.length}
        onOpenCreateModal={() => onOpenCreateModal()}
        onOpenCreateClientModal={onOpenCreateClientModal}
      />

      {/* Subpáginas y Vistas Modulares de Enzo */}
      {activeTab === 'board' ? (
        <BoardTable
          items={enzoActions}
          clients={enzoClients}
          workspaceMode="personal"
          currentUser={currentUser || APP_USERS[0]}
          onReorder={onReorderActions || (() => {})}
          onToggleComplete={onCompleteAction}
          onEdit={onEditAction || ((item: ActionItem) => onOpenCreateModal(item.deadline))}
          onDelete={onDeleteAction}
          onUpdateColor={onUpdateColor || (() => {})}
          onUpdateValue={onUpdateValue || (() => {})}
          onUpdateTarget={onUpdateTarget}
          onUpdateTargetAndColor={onUpdateTargetAndColor}
          onUpdateDeadline={onUpdateDeadline}
          onToggleExpand={onToggleExpand || (() => {})}
          onToggleSubtask={onToggleSubtask || (() => {})}
          onAddSubtask={onAddSubtask || (() => {})}
          onDeleteSubtask={onDeleteSubtask || (() => {})}
          onUpdateNotes={onUpdateNotes || (() => {})}
          onNavigateToClients={() => setActiveTab('clients')}
          onOpenCreateModal={() => onOpenCreateModal()}
          onQuickAdd={handleQuickAdd}
        />
      ) : activeTab === 'calendar' ? (
        <CalendarView
          items={enzoActions}
          clients={enzoClients}
          workspaceMode="personal"
          onToggleComplete={onCompleteAction}
          onEdit={onEditAction || ((item: ActionItem) => onOpenCreateModal(item.deadline))}
          onUpdateDeadline={onUpdateDeadline || (() => {})}
          onOpenCreateModal={onOpenCreateModal}
          onVisibleRangeStatsChange={setCalendarStats}
        />
      ) : activeTab === 'completed' ? (
        <CompletedTable
          items={enzoCompletedActions}
          onRestore={onRestoreAction || (() => {})}
          onDelete={onDeleteCompletedAction || onDeleteAction}
          workspaceMode="personal"
        />
      ) : (
        <ClientsTable
          clients={enzoClients}
          actions={[...enzoActions, ...enzoCompletedActions]}
          onAddClient={onAddClient}
          onUpdateClient={onUpdateClient}
          onDeleteClient={onDeleteClient}
          onOpenCreateModal={onOpenCreateClientModal}
        />
      )}

      {/* Selector de Fondo Personalizado de Enzo */}
      <BackgroundSelector
        currentBg={bgImage}
        currentOpacity={bgOpacity}
        onSelectBg={onSelectBg}
        onSelectOpacity={onSelectOpacity}
      />
    </div>
  );
};
