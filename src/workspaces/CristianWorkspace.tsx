import React, { useState, useMemo } from 'react';
import { WorkspaceProps } from './types';
import { TabType, ActionItem, VintageColorKey, TaskType, APP_USERS } from '../types';
import { Header } from '../components/Header';
import { BoardTable } from '../components/BoardTable';
import { CalendarView } from '../components/CalendarView';
import { CompletedTable } from '../components/CompletedTable';
import { ClientsTable } from '../components/ClientsTable';
import { BackgroundSelector } from '../components/BackgroundSelector';

const CRISTIAN_EMAIL = 'cristianpayret@gmail.com';

export const CristianWorkspace: React.FC<WorkspaceProps> = ({
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
  // Gestión modular e independiente de pestañas de Cristian
  const [activeTab, setActiveTab] = useState<TabType>('board');
  const [calendarStats, setCalendarStats] = useState<{ totalValue: number; count: number }>({
    totalValue: 0,
    count: 0,
  });

  // Aislamiento estricto de clientes de Cristian
  const cristianClients = useMemo(() => {
    return clients.filter((c) => c.owner === 'cristian');
  }, [clients]);

  // Aislamiento estricto de acciones activas de Cristian
  const cristianActions = useMemo(() => {
    return actions.filter((item) => {
      if (item.workspaceScope === 'polarist') return false;
      const email = item.userEmail || '';
      return email.toLowerCase() === CRISTIAN_EMAIL.toLowerCase();
    });
  }, [actions]);

  // Aislamiento estricto de acciones completadas de Cristian
  const cristianCompletedActions = useMemo(() => {
    return completedActions.filter((item) => {
      if (item.workspaceScope === 'polarist') return false;
      const email = item.userEmail || '';
      return email.toLowerCase() === CRISTIAN_EMAIL.toLowerCase();
    });
  }, [completedActions]);

  // Métricas financieras personales de Cristian
  const totalValue = useMemo(() => {
    return cristianActions.reduce((acc, curr) => acc + (curr.value || 0), 0);
  }, [cristianActions]);

  const completedValue = useMemo(() => {
    return cristianCompletedActions.reduce((acc, curr) => acc + (curr.value || 0), 0);
  }, [cristianCompletedActions]);

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
      userEmail: CRISTIAN_EMAIL,
    });
  };

  const cristianProfile = APP_USERS[1] || currentUser;

  return (
    <div className="space-y-6">
      {/* Header Contextualizado para Cristian */}
      <Header
        currentEndpoint="cristian"
        onNavigateEndpoint={onNavigateEndpoint}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentUser={cristianProfile}
        onLogout={onLogout}
        selectedTeamMemberEmail={null}
        onSelectTeamMember={() => {}}
        totalValue={totalValue}
        calendarTotalValue={calendarStats.totalValue}
        calendarActiveCount={calendarStats.count}
        completedValue={completedValue}
        activeCount={cristianActions.length}
        completedCount={cristianCompletedActions.length}
        clientsCount={cristianClients.length}
        onOpenCreateModal={() => onOpenCreateModal()}
        onOpenCreateClientModal={onOpenCreateClientModal}
      />

      {/* Subpáginas y Vistas Modulares de Cristian */}
      {activeTab === 'board' ? (
        <BoardTable
          items={cristianActions}
          clients={cristianClients}
          workspaceMode="personal"
          currentUser={cristianProfile}
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
          items={cristianActions}
          clients={cristianClients}
          workspaceMode="personal"
          onToggleComplete={onCompleteAction}
          onEdit={onEditAction || ((item: ActionItem) => onOpenCreateModal(item.deadline))}
          onUpdateDeadline={onUpdateDeadline || (() => {})}
          onOpenCreateModal={onOpenCreateModal}
          onVisibleRangeStatsChange={setCalendarStats}
        />
      ) : activeTab === 'completed' ? (
        <CompletedTable
          items={cristianCompletedActions}
          onRestore={onRestoreAction || (() => {})}
          onDelete={onDeleteCompletedAction || onDeleteAction}
          workspaceMode="personal"
        />
      ) : (
        <ClientsTable
          clients={cristianClients}
          actions={[...cristianActions, ...cristianCompletedActions]}
          onAddClient={onAddClient}
          onUpdateClient={onUpdateClient}
          onDeleteClient={onDeleteClient}
          onOpenCreateModal={onOpenCreateClientModal}
        />
      )}

      {/* Selector de Fondo Personalizado de Cristian */}
      <BackgroundSelector
        currentBg={bgImage}
        currentOpacity={bgOpacity}
        onSelectBg={onSelectBg}
        onSelectOpacity={onSelectOpacity}
      />
    </div>
  );
};
