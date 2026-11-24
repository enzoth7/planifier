import React, { useState, useMemo } from 'react';
import { WorkspaceProps } from './types';
import { TabType } from '../types';
import { Header } from '../components/Header';
import { BoardTable } from '../components/BoardTable';
import { CalendarView } from '../components/CalendarView';
import { CompletedTable } from '../components/CompletedTable';
import { ClientsTable } from '../components/ClientsTable';
import { BackgroundSelector } from '../components/BackgroundSelector';

export const EnzoWorkspace: React.FC<WorkspaceProps> = ({
  actions,
  completedActions,
  clients,
  onAddAction,
  onUpdateAction,
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
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('board');
  const [calendarStats, setCalendarStats] = useState<{ totalValue: number; count: number }>({
    totalValue: 0,
    count: 0,
  });

  const totalValue = useMemo(() => actions.reduce((acc, curr) => acc + (curr.value || 0), 0), [actions]);
  const completedValue = useMemo(
    () => completedActions.reduce((acc, curr) => acc + (curr.value || 0), 0),
    [completedActions]
  );

  return (
    <div className="space-y-6">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        totalValue={totalValue}
        calendarTotalValue={calendarStats.totalValue}
        calendarActiveCount={calendarStats.count}
        completedValue={completedValue}
        activeCount={actions.length}
        completedCount={completedActions.length}
        clientsCount={clients.length}
        onOpenCreateModal={() => onOpenCreateModal()}
        onOpenCreateClientModal={onOpenCreateClientModal}
      />

      {activeTab === 'board' ? (
        <BoardTable
          items={actions}
          clients={clients}
          onReorder={onReorderActions}
          onToggleComplete={onCompleteAction}
          onEdit={onEditAction}
          onDelete={onDeleteAction}
          onUpdateColor={onUpdateColor}
          onUpdateValue={onUpdateValue}
          onUpdateTarget={onUpdateTarget}
          onUpdateTargetAndColor={onUpdateTargetAndColor}
          onUpdateDeadline={onUpdateDeadline}
          onUpdateAction={onUpdateAction}
          onNavigateToClients={() => setActiveTab('clients')}
          onOpenCreateModal={() => onOpenCreateModal()}
          onQuickAdd={onAddAction}
        />
      ) : activeTab === 'calendar' ? (
        <CalendarView
          items={actions}
          clients={clients}
          onToggleComplete={onCompleteAction}
          onEdit={onEditAction}
          onUpdateDeadline={onUpdateDeadline}
          onOpenCreateModal={onOpenCreateModal}
          onVisibleRangeStatsChange={setCalendarStats}
        />
      ) : activeTab === 'completed' ? (
        <CompletedTable items={completedActions} onRestore={onRestoreAction} onDelete={onDeleteCompletedAction} />
      ) : (
        <ClientsTable
          clients={clients}
          actions={[...actions, ...completedActions]}
          onAddClient={onAddClient}
          onUpdateClient={onUpdateClient}
          onDeleteClient={onDeleteClient}
          onOpenCreateModal={onOpenCreateClientModal}
        />
      )}

      <BackgroundSelector
        currentBg={bgImage}
        currentOpacity={bgOpacity}
        onSelectBg={onSelectBg}
        onSelectOpacity={onSelectOpacity}
      />
    </div>
  );
};
