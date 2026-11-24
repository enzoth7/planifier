import React from 'react';
import {
  Plus,
  CheckCircle2,
  LayoutGrid,
  Users,
  CalendarDays,
} from 'lucide-react';
import { TabType } from '../types';

interface HeaderProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  totalValue: number;
  calendarTotalValue?: number;
  completedValue: number;
  activeCount: number;
  calendarActiveCount?: number;
  completedCount: number;
  clientsCount: number;
  onOpenCreateModal: () => void;
  onOpenCreateClientModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  totalValue,
  calendarTotalValue,
  completedValue,
  activeCount,
  calendarActiveCount,
  completedCount,
  clientsCount,
  onOpenCreateModal,
  onOpenCreateClientModal,
}) => {
  const moneyLabel =
    activeTab === 'clients'
      ? 'Total clientes:'
      : activeTab === 'completed'
      ? 'Total completado:'
      : activeTab === 'calendar'
      ? 'Total 4 semanas:'
      : 'Total en juego:';

  const displayedValue =
    activeTab === 'board'
      ? totalValue
      : activeTab === 'calendar'
      ? (calendarTotalValue ?? totalValue)
      : completedValue;

  const tabClass = (tab: TabType) =>
    `flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-md transition-all font-medium cursor-pointer ${
      activeTab === tab ? 'bg-white text-zinc-900 shadow-xs' : 'text-zinc-500 hover:text-zinc-800'
    }`;

  const countClass = (tab: TabType, activeStyle: string, idleStyle: string) =>
    `text-[10px] px-1.5 py-0.5 rounded-full leading-none font-mono ${activeTab === tab ? activeStyle : idleStyle}`;

  return (
    <header className="flex flex-col gap-3.5 bg-white/90 backdrop-blur-md rounded-xl p-3.5 sm:p-4 border border-white/70 shadow-sm">
      {/* Fila Superior: Título de vista + Total Dinero + Botón Nueva Acción */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center flex-wrap gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-950 border border-emerald-200/80 shadow-2xs font-semibold text-xs sm:text-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 flex-shrink-0" />
            <span>Vista personal Enzo</span>
          </div>
        </div>

        {/* Derecha: Total USD + Botón de Acción */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3.5 flex-wrap">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-500 font-normal">{moneyLabel}</span>
            <span className="font-mono font-semibold text-zinc-900 text-sm tracking-tight">
              {activeTab === 'clients' ? `${clientsCount} registrados` : `$${displayedValue.toLocaleString('en-US')} USD`}
            </span>
          </div>

          {/* Visible en Tablero/Calendario (+ Nueva Acción) y en Clientes (+ Nuevo Cliente) */}
          {(activeTab === 'board' || activeTab === 'calendar') && (
            <button
              type="button"
              onClick={onOpenCreateModal}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium tracking-wide transition-all shadow-sm active:scale-95 flex-shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Nueva Acción</span>
            </button>
          )}

          {activeTab === 'clients' && (
            <button
              type="button"
              onClick={onOpenCreateClientModal || onOpenCreateModal}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium tracking-wide transition-all shadow-sm active:scale-95 flex-shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Nuevo Cliente</span>
            </button>
          )}
        </div>
      </div>

      {/* Fila Inferior: Pestañas de Vista */}
      <div className="flex min-w-0 items-center justify-end border-t border-zinc-100 pt-2.5">
        <div className="flex max-w-full items-center overflow-x-auto p-1 bg-zinc-100/90 rounded-lg border border-zinc-200/60 text-xs">
          <button type="button" onClick={() => onTabChange('board')} className={tabClass('board')}>
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Tablero</span>
            {activeCount > 0 && (
              <span className={countClass('board', 'bg-zinc-100 text-zinc-700', 'bg-zinc-200/70 text-zinc-500')}>
                {activeCount}
              </span>
            )}
          </button>

          <button type="button" onClick={() => onTabChange('calendar')} className={tabClass('calendar')}>
            <CalendarDays className="w-3.5 h-3.5 text-zinc-700" />
            <span>Calendario</span>
            {calendarActiveCount !== undefined && calendarActiveCount > 0 && (
              <span className={countClass('calendar', 'bg-zinc-100 text-zinc-700', 'bg-zinc-200/70 text-zinc-500')}>
                {calendarActiveCount}
              </span>
            )}
          </button>

          <button type="button" onClick={() => onTabChange('completed')} className={tabClass('completed')}>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Completados</span>
            {completedCount > 0 && (
              <span
                className={countClass('completed', 'bg-emerald-100 text-emerald-800 font-semibold', 'bg-zinc-200/70 text-zinc-600')}
              >
                {completedCount}
              </span>
            )}
          </button>

          <button type="button" onClick={() => onTabChange('clients')} className={tabClass('clients')}>
            <Users className="w-3.5 h-3.5 text-blue-600" />
            <span>Clientes</span>
            {clientsCount > 0 && (
              <span className={countClass('clients', 'bg-blue-100 text-blue-800 font-semibold', 'bg-zinc-200/70 text-zinc-600')}>
                {clientsCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
