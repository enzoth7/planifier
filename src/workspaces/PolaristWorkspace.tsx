import React, { useState, useMemo } from 'react';
import { WorkspaceProps } from './types';
import { TabType, ActionItem, VintageColorKey, TaskType, APP_USERS } from '../types';
import { Header } from '../components/Header';
import { BoardTable } from '../components/BoardTable';
import { CalendarView } from '../components/CalendarView';
import { CompletedTable } from '../components/CompletedTable';
import { ClientsTable } from '../components/ClientsTable';
import { ObjectivesView } from '../components/ObjectivesView';

export const PolaristWorkspace: React.FC<WorkspaceProps> = ({
  actions,
  completedActions,
  clients,
  objectives,
  currentUser,
  onNavigateEndpoint,
  onLogout,
  onAddAction,
  onUpdateAction,
  onUpdateObjective,
  onDeleteAction,
  onCompleteAction,
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  onOpenCreateModal,
  onOpenCreateClientModal,
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
  onUpdateUserEmail,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('board');
  const [selectedTeamMemberEmail, setSelectedTeamMemberEmail] = useState<string | null>(null);
  const [selectedObjectiveMonth, setSelectedObjectiveMonth] = useState(() => {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return objectives.some((objective) => objective.month === currentMonth)
      ? currentMonth
      : objectives[0]?.month || '';
  });
  const [calendarStats, setCalendarStats] = useState<{ totalValue: number; count: number }>({
    totalValue: 0,
    count: 0,
  });

  // Clientes exclusivos de Polarist
  const polaristClients = useMemo(() => {
    return clients.filter((c) => c.owner === 'polarist');
  }, [clients]);

  // Acciones activas del equipo Polarist (con filtro opcional por miembro)
  const polaristActions = useMemo(() => {
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
  }, [actions, selectedTeamMemberEmail]);

  // Acciones completadas del equipo Polarist
  const polaristCompletedActions = useMemo(() => {
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
  }, [completedActions, selectedTeamMemberEmail]);

  // Métricas financieras del equipo Polarist
  const totalValue = useMemo(() => {
    return polaristActions.reduce((acc, curr) => acc + (curr.value || 0), 0);
  }, [polaristActions]);

  const completedValue = useMemo(() => {
    return polaristCompletedActions.reduce((acc, curr) => acc + (curr.value || 0), 0);
  }, [polaristCompletedActions]);

  const selectedObjective = useMemo(
    () => objectives.find((objective) => objective.month === selectedObjectiveMonth) || objectives[0],
    [objectives, selectedObjectiveMonth]
  );

  const objectiveCompletedValue = useMemo(() => {
    if (!selectedObjective) return 0;
    return polaristCompletedActions
      .filter(
        (item) =>
          item.completedAt?.slice(0, 7) === selectedObjective.month ||
          item.deadline?.slice(0, 7) === selectedObjective.month
      )
      .reduce((sum, item) => sum + (item.value || 0), 0);
  }, [polaristCompletedActions, selectedObjective]);

  const handleQuickAdd = (data: {
    title: string;
    target: string;
    tagColor?: VintageColorKey;
    value: number;
    deadline: string;
    taskType?: TaskType;
    userEmail?: string;
  }) => {
    onAddAction({
      ...data,
      userEmail: data.userEmail || selectedTeamMemberEmail || currentUser?.email || APP_USERS[0].email,
    });
  };

  const handleUpdateTarget = (id: string, target: string) => {
    const item = actions.find((a) => a.id === id);
    if (item) {
      onUpdateAction({
        ...item,
        target,
        workspaceScope: 'polarist',
      });
    } else if (onUpdateTarget) {
      onUpdateTarget(id, target);
    }
  };

  const handleUpdateTargetAndColor = (id: string, target: string, color: VintageColorKey) => {
    const item = actions.find((a) => a.id === id);
    if (item) {
      onUpdateAction({
        ...item,
        target,
        tagColor: color,
        workspaceScope: 'polarist',
      });
    } else if (onUpdateTargetAndColor) {
      onUpdateTargetAndColor(id, target, color);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Contextualizado para Polarist con Selector de Miembros */}
      <Header
        currentEndpoint="polarist"
        onNavigateEndpoint={onNavigateEndpoint}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        currentUser={currentUser || APP_USERS[0]}
        onLogout={onLogout}
        selectedTeamMemberEmail={selectedTeamMemberEmail}
        onSelectTeamMember={setSelectedTeamMemberEmail}
        totalValue={totalValue}
        calendarTotalValue={calendarStats.totalValue}
        calendarActiveCount={calendarStats.count}
        completedValue={completedValue}
        activeCount={polaristActions.length}
        completedCount={polaristCompletedActions.length}
        clientsCount={polaristClients.length}
        objectiveTarget={selectedObjective?.revenueTarget || 0}
        objectiveCompleted={objectiveCompletedValue}
        onOpenCreateModal={() => onOpenCreateModal()}
        onOpenCreateClientModal={onOpenCreateClientModal}
      />

      {/* Subpáginas y Vistas de Equipo Polarist */}
      {activeTab === 'board' ? (
        <BoardTable
          items={polaristActions}
          clients={polaristClients}
          workspaceMode="team"
          currentUser={currentUser || APP_USERS[0]}
          onReorder={onReorderActions || (() => {})}
          onToggleComplete={onCompleteAction}
          onEdit={onEditAction || ((item: ActionItem) => onOpenCreateModal(item.deadline))}
          onDelete={onDeleteAction}
          onUpdateColor={onUpdateColor || (() => {})}
          onUpdateValue={onUpdateValue || (() => {})}
          onUpdateTarget={handleUpdateTarget}
          onUpdateTargetAndColor={handleUpdateTargetAndColor}
          onUpdateDeadline={onUpdateDeadline}
          onToggleExpand={onToggleExpand || (() => {})}
          onToggleSubtask={onToggleSubtask || (() => {})}
          onAddSubtask={onAddSubtask || (() => {})}
          onDeleteSubtask={onDeleteSubtask || (() => {})}
          onUpdateNotes={onUpdateNotes || (() => {})}
          onNavigateToClients={() => setActiveTab('clients')}
          onOpenCreateModal={() => onOpenCreateModal()}
          onQuickAdd={handleQuickAdd}
          onUpdateUserEmail={onUpdateUserEmail}
        />
      ) : activeTab === 'calendar' ? (
        <CalendarView
          items={polaristActions}
          clients={polaristClients}
          workspaceMode="team"
          selectedTeamMemberEmail={selectedTeamMemberEmail}
          onSelectTeamMember={setSelectedTeamMemberEmail}
          onToggleComplete={onCompleteAction}
          onEdit={onEditAction || ((item: ActionItem) => onOpenCreateModal(item.deadline))}
          onUpdateDeadline={onUpdateDeadline || (() => {})}
          onOpenCreateModal={onOpenCreateModal}
          onVisibleRangeStatsChange={setCalendarStats}
        />
      ) : activeTab === 'objectives' ? (
        <ObjectivesView
          objectives={objectives}
          activeActions={polaristActions}
          completedActions={polaristCompletedActions}
          onUpdateObjective={onUpdateObjective}
          onSelectedObjectiveChange={(objective) => setSelectedObjectiveMonth(objective.month)}
        />
      ) : activeTab === 'completed' ? (
        <CompletedTable
          items={polaristCompletedActions}
          onRestore={onRestoreAction || (() => {})}
          onDelete={onDeleteCompletedAction || onDeleteAction}
          workspaceMode="team"
        />
      ) : (
        <ClientsTable
          clients={polaristClients}
          actions={[...polaristActions, ...polaristCompletedActions]}
          onAddClient={onAddClient}
          onUpdateClient={onUpdateClient}
          onDeleteClient={onDeleteClient}
          onOpenCreateModal={onOpenCreateClientModal}
        />
      )}

      {/* NOTA: Polarist NO incluye BackgroundSelector ya que su fondo es fijo y corporativo (/BgPolarist.png) */}
    </div>
  );
};
