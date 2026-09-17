import React, { useState, useMemo } from 'react';
import { WorkspaceProps } from './types';
import { TabType, ActionItem, VintageColorKey, TaskType, APP_USERS } from '../types';
import { Header } from '../components/Header';
import { BoardTable } from '../components/BoardTable';
import { CalendarView } from '../components/CalendarView';
import { CompletedTable } from '../components/CompletedTable';
import { ClientsTable } from '../components/ClientsTable';
import { BackgroundSelector } from '../components/BackgroundSelector';

const JULIETA_EMAIL = 'juliperez2803@gmail.com';

export const JulietaWorkspace: React.FC<WorkspaceProps> = ({
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
  // Gestión modular e independiente de pestañas de Julieta
  const [activeTab, setActiveTab] = useState<TabType>('board');
  const [calendarStats, setCalendarStats] = useState<{ totalValue: number; count: number }>({
    totalValue: 0,
    count: 0,
  });

  // Aislamiento estricto de clientes de Julieta
  const julietaClients = useMemo(() => {
    return clients.filter((c) => c.owner === 'juli');
  }, [clients]);

  // Aislamiento estricto de acciones activas de Julieta
  const julietaActions = useMemo(() => {
    return actions.filter((item) => {
      if (item.workspaceScope === 'polarist') return false;
      const email = item.userEmail || '';
      return email.toLowerCase() === JULIETA_EMAIL.toLowerCase();
    });
  }, [actions]);

  // Aislamiento estricto de acciones completadas de Julieta
  const julietaCompletedActions = useMemo(() => {
    return completedActions.filter((item) => {
      if (item.workspaceScope === 'polarist') return false;
      const email = item.userEmail || '';
      return email.toLowerCase() === JULIETA_EMAIL.toLowerCase();
    });
  }, [completedActions]);

  // Métricas financieras personales de Julieta
  const totalValue = useMemo(() => {
    return julietaActions.reduce((acc, curr) => acc + (curr.value || 0), 0);
  }, [julietaActions]);

  const completedValue = useMemo(() => {
    return julietaCompletedActions.reduce((acc, curr) => acc + (curr.value || 0), 0);
  }, [julietaCompletedActions]);

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
      userEmail: JULIETA_EMAIL,
    });
  };

  const julietaProfile = APP_USERS[2] || currentUser;

  return (
    <div className="space-y-6">
      {/* Header Contextualizado para Julieta */}
      <Header
        currentEndpoint="julieta"
        onNavigateEndpoint={onNavigateEndpoint}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentUser={julietaProfile}
        onLogout={onLogout}
        selectedTeamMemberEmail={null}
        onSelectTeamMember={() => {}}
        totalValue={totalValue}
        calendarTotalValue={calendarStats.totalValue}
        calendarActiveCount={calendarStats.count}
        completedValue={completedValue}
        activeCount={julietaActions.length}
        completedCount={julietaCompletedActions.length}
        clientsCount={julietaClients.length}
        onOpenCreateModal={() => onOpenCreateModal()}
        onOpenCreateClientModal={onOpenCreateClientModal}
      />

      {/* Subpáginas y Vistas Modulares de Julieta */}
      {activeTab === 'board' ? (
        <BoardTable
          items={julietaActions}
          clients={julietaClients}
          workspaceMode="personal"
          currentUser={julietaProfile}
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
          items={julietaActions}
          clients={julietaClients}
          workspaceMode="personal"
          onToggleComplete={onCompleteAction}
          onEdit={onEditAction || ((item: ActionItem) => onOpenCreateModal(item.deadline))}
          onUpdateDeadline={onUpdateDeadline || (() => {})}
          onOpenCreateModal={onOpenCreateModal}
          onVisibleRangeStatsChange={setCalendarStats}
        />
      ) : activeTab === 'completed' ? (
        <CompletedTable
          items={julietaCompletedActions}
          onRestore={onRestoreAction || (() => {})}
          onDelete={onDeleteCompletedAction || onDeleteAction}
          workspaceMode="personal"
        />
      ) : (
        <ClientsTable
          clients={julietaClients}
          actions={[...julietaActions, ...julietaCompletedActions]}
          onAddClient={onAddClient}
          onUpdateClient={onUpdateClient}
          onDeleteClient={onDeleteClient}
          onOpenCreateModal={onOpenCreateClientModal}
        />
      )}

      {/* Selector de Fondo Personalizado de Julieta */}
      <BackgroundSelector
        currentBg={bgImage}
        currentOpacity={bgOpacity}
        onSelectBg={onSelectBg}
        onSelectOpacity={onSelectOpacity}
      />
    </div>
  );
};
