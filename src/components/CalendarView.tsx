import React, { useState, useMemo, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { ActionItem, ClientItem, WorkspaceMode, APP_USERS } from '../types';
import {
  getMondayOfWeek,
  addDays,
  toISODateString,
  isSameDay,
  formatCalendarHeaderRange,
} from '../utils/dates';
import { soundFx } from '../utils/sound';
import { CalendarActionCard } from './CalendarActionCard';

interface CalendarViewProps {
  items: ActionItem[];
  clients?: ClientItem[];
  workspaceMode?: WorkspaceMode;
  selectedTeamMemberEmail?: string | null;
  onSelectTeamMember?: (email: string | null) => void;
  onToggleComplete: (id: string) => void;
  onEdit: (item: ActionItem) => void;
  onUpdateDeadline: (id: string, deadline: string) => void;
  onOpenCreateModal: (defaultDate?: string) => void;
  onVisibleRangeStatsChange?: (stats: { totalValue: number; count: number }) => void;
}

const WEEK_DAYS = [
  { short: 'LUN', full: 'Lunes' },
  { short: 'MAR', full: 'Martes' },
  { short: 'MIÉ', full: 'Miércoles' },
  { short: 'JUE', full: 'Jueves' },
  { short: 'VIE', full: 'Viernes' },
  { short: 'SÁB', full: 'Sábado' },
  { short: 'DOM', full: 'Domingo' },
];

export const CalendarView: React.FC<CalendarViewProps> = ({
  items,
  workspaceMode = 'personal',
  selectedTeamMemberEmail,
  onSelectTeamMember,
  onToggleComplete,
  onEdit,
  onUpdateDeadline,
  onOpenCreateModal,
  onVisibleRangeStatsChange,
}) => {
  // La ventana principal muestra: semana anterior + actual + dos siguientes.
  const [startDate, setStartDate] = useState<Date>(() =>
    addDays(getMondayOfWeek(new Date()), -7)
  );
  const [dragOverDayIso, setDragOverDayIso] = useState<string | null>(null);
  const [isDragOverTray, setIsDragOverTray] = useState(false);
  const [isUnscheduledOpen, setIsUnscheduledOpen] = useState(false);

  // Fecha de referencia actual
  const today = useMemo(() => new Date(), []);

  // Generar exactamente 28 días (4 semanas x 7 días)
  const days = useMemo(() => {
    return Array.from({ length: 28 }, (_, index) => {
      const date = addDays(startDate, index);
      const iso = toISODateString(date);
      const isCurrentDay = isSameDay(date, today);
      const isStartMonth = date.getMonth() === startDate.getMonth();

      return {
        date,
        iso,
        dayNumber: date.getDate(),
        isCurrentDay,
        isStartMonth,
      };
    });
  }, [startDate, today]);

  // Agrupar acciones por fecha ISO YYYY-MM-DD
  const { actionsByDate, unscheduledActions, visibleTotalValue, visibleActiveCount } = useMemo(() => {
    const map = new Map<string, ActionItem[]>();
    const unscheduled: ActionItem[] = [];
    const visibleDaySet = new Set(days.map((d) => d.iso));
    let totalVal = 0;
    let visibleCount = 0;

    items.forEach((item) => {
      if (!item.deadline || item.deadline.trim() === '') {
        unscheduled.push(item);
      } else {
        const existing = map.get(item.deadline) || [];
        existing.push(item);
        map.set(item.deadline, existing);

        if (visibleDaySet.has(item.deadline)) {
          totalVal += item.value || 0;
          visibleCount += 1;
        }
      }
    });

    return {
      actionsByDate: map,
      unscheduledActions: unscheduled,
      visibleTotalValue: totalVal,
      visibleActiveCount: visibleCount,
    };
  }, [items, days]);

  // Notificar al padre sobre las estadísticas de la ventana visible de 4 semanas
  useEffect(() => {
    if (onVisibleRangeStatsChange) {
      onVisibleRangeStatsChange({
        totalValue: visibleTotalValue,
        count: visibleActiveCount,
      });
    }
  }, [visibleTotalValue, visibleActiveCount, onVisibleRangeStatsChange]);

  // Navegación
  const handlePrevPeriod = () => {
    soundFx.playTock();
    setStartDate((prev) => addDays(prev, -28));
  };

  const handleNextPeriod = () => {
    soundFx.playTock();
    setStartDate((prev) => addDays(prev, 28));
  };

  const handleToday = () => {
    soundFx.playTock();
    setStartDate(addDays(getMondayOfWeek(new Date()), -7));
  };

  // Drag & Drop en casilleros de días
  const handleDayDragOver = (e: React.DragEvent, iso: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverDayIso !== iso) {
      setDragOverDayIso(iso);
    }
  };

  const handleDayDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverDayIso(null);
    }
  };

  const handleDayDrop = (e: React.DragEvent, iso: string) => {
    e.preventDefault();
    setDragOverDayIso(null);
    const actionId = e.dataTransfer.getData('text/plain');
    if (actionId) {
      onUpdateDeadline(actionId, iso);
      soundFx.playWoodClick();
    }
  };

  // Drag & Drop en bandeja sin fecha
  const handleTrayDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOverTray) {
      setIsDragOverTray(true);
    }
  };

  const handleTrayDragLeave = (e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOverTray(false);
    }
  };

  const handleTrayDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverTray(false);
    const actionId = e.dataTransfer.getData('text/plain');
    if (actionId) {
      onUpdateDeadline(actionId, '');
      soundFx.playWoodClick();
    }
  };

  const headerTitle = useMemo(() => formatCalendarHeaderRange(startDate), [startDate]);

  return (
    <div className="space-y-4">
      {/* Barra Superior de Control del Calendario */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/90 backdrop-blur-md rounded-xl p-3 sm:p-3.5 border border-white/70 shadow-sm">
        {/* Título de Rango y Navegación */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 rounded-lg bg-zinc-100 text-zinc-700">
            <CalendarIcon className="w-4 h-4" />
          </div>

          <h2 className="text-sm sm:text-base font-bold text-zinc-900 tracking-tight">
            {headerTitle}
          </h2>

          <div className="flex items-center ml-1 sm:ml-2 bg-zinc-100/90 rounded-lg p-0.5 border border-zinc-200/60 text-xs">
            <button
              type="button"
              onClick={handlePrevPeriod}
              title="4 semanas anteriores"
              className="p-1.5 rounded-md hover:bg-white text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleToday}
              className="px-2.5 py-1 rounded-md text-xs font-medium text-zinc-700 hover:bg-white hover:text-zinc-900 transition-colors"
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={handleNextPeriod}
              title="4 semanas siguientes"
              className="p-1.5 rounded-md hover:bg-white text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Acciones del lado derecho: Filtro de miembros (en modo Team) + Total visible & Botón sin fecha */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 text-xs">
          {workspaceMode === 'team' && onSelectTeamMember && (
            <div className="flex items-center gap-1 p-0.5 bg-zinc-100/90 rounded-lg border border-zinc-200/60 text-xs mr-1">
              <button
                type="button"
                onClick={() => onSelectTeamMember(null)}
                className={`px-2 py-0.5 rounded font-medium transition-all cursor-pointer ${
                  selectedTeamMemberEmail === null
                    ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Todos
              </button>
              {APP_USERS.map((user) => {
                const isSelected = selectedTeamMemberEmail === user.email;
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => onSelectTeamMember(user.email)}
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                        : 'text-zinc-500 hover:text-zinc-800'
                    }`}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: user.avatarColor }}
                    />
                    <span>{user.name}</span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100/70 text-zinc-600 font-mono">
            <Sparkles className="w-3 h-3 text-amber-600" />
            <span>{visibleActiveCount} acciones</span>
            <span>•</span>
            <span className="font-semibold text-emerald-700">
              ${visibleTotalValue.toLocaleString('en-US')} USD
            </span>
          </div>

          {unscheduledActions.length > 0 && (
            <button
              type="button"
              onClick={() => setIsUnscheduledOpen(!isUnscheduledOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                isUnscheduledOpen
                  ? 'bg-amber-100/80 text-amber-900 border border-amber-300'
                  : 'bg-zinc-100 hover:bg-zinc-200/70 text-zinc-700 border border-zinc-200/60'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Sin fecha ({unscheduledActions.length})</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${
                  isUnscheduledOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
          )}
        </div>
      </div>

      {/* Bandeja de Acciones Sin Fecha Programada (Cajón Colapsable) */}
      {isUnscheduledOpen && unscheduledActions.length > 0 && (
        <div
          onDragOver={handleTrayDragOver}
          onDragLeave={handleTrayDragLeave}
          onDrop={handleTrayDrop}
          className={`rounded-xl p-3.5 border transition-all duration-200 ${
            isDragOverTray
              ? 'bg-amber-50/90 border-amber-300 ring-2 ring-amber-400 shadow-md'
              : 'bg-white/90 backdrop-blur-md border-white/70 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-semibold text-zinc-800">
                Acciones sin fecha programada
              </span>
              <span className="text-[11px] text-zinc-400">
                — Arrastrá una acción a cualquier día del calendario para fijar su fecha
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 max-h-[160px] overflow-y-auto p-1">
            {unscheduledActions.map((item) => (
              <div key={item.id} className="w-[180px] sm:w-[210px] flex-shrink-0">
                <CalendarActionCard
                  item={item}
                  workspaceMode={workspaceMode}
                  onToggleComplete={onToggleComplete}
                  onEdit={onEdit}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Contenedor Cuadrícula de 4 Semanas (Garantiza 7 columnas fijas) */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[780px] space-y-2">
          {/* Fila Encabezado de los 7 Días de la Semana */}
          <div className="grid grid-cols-7 gap-2">
            {WEEK_DAYS.map((day) => (
              <div
                key={day.short}
                className="py-2 px-1 text-center font-bold text-xs tracking-wider text-zinc-600 bg-white/70 backdrop-blur-xs rounded-lg border border-white/60 uppercase select-none"
                title={day.full}
              >
                {day.short}
              </div>
            ))}
          </div>

          {/* Cuadrícula de 28 Días (4 Semanas x 7 Columnas) */}
          <div className="grid grid-cols-7 gap-2">
            {days.map((day) => {
              const dayActions = actionsByDate.get(day.iso) || [];
              const dayTotalValue = dayActions.reduce(
                (sum, act) => sum + (act.value || 0),
                0
              );
              const isDragTarget = dragOverDayIso === day.iso;

              return (
                <div
                  key={day.iso}
                  onDragOver={(e) => handleDayDragOver(e, day.iso)}
                  onDragLeave={handleDayDragLeave}
                  onDrop={(e) => handleDayDrop(e, day.iso)}
                  className={`group relative min-h-[135px] sm:min-h-[150px] p-2 sm:p-2.5 rounded-xl border flex flex-col justify-between transition-all duration-150 ${
                    isDragTarget
                      ? 'bg-emerald-50/90 border-emerald-400 ring-2 ring-emerald-500 shadow-md'
                      : day.isCurrentDay
                      ? 'bg-amber-50/95 backdrop-blur-md border-amber-400 shadow-md ring-2 ring-amber-300/80'
                      : 'bg-white/85 backdrop-blur-md border-white/70 hover:border-zinc-300/80 hover:bg-white/95 shadow-xs'
                  }`}
                >
                  {/* Cabecera del día */}
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      {/* Número del día */}
                      <div className="flex items-center gap-1">
                        {day.isCurrentDay ? (
                          <span
                            className="w-5 h-5 rounded-full bg-amber-500 text-amber-950 text-[11px] font-bold flex items-center justify-center shadow-xs ring-2 ring-amber-200"
                            title="Hoy"
                          >
                            {day.dayNumber}
                          </span>
                        ) : (
                          <span
                            className={`text-xs font-semibold pl-0.5 ${
                              day.isStartMonth ? 'text-zinc-700' : 'text-zinc-400'
                            }`}
                          >
                            {day.dayNumber}
                          </span>
                        )}
                      </div>

                      {/* Total USD del día & Botón + para agregar acción */}
                      <div className="flex items-center gap-1">
                        {dayTotalValue > 0 && (
                          <span className="font-mono text-[10px] font-semibold text-emerald-700">
                            +${dayTotalValue >= 1000
                              ? `${(dayTotalValue / 1000).toLocaleString('en-US', {
                                  maximumFractionDigits: 1,
                                })}k`
                              : dayTotalValue.toLocaleString('en-US')}
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => onOpenCreateModal(day.iso)}
                          title={`Nueva acción para el ${day.dayNumber}`}
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-zinc-100 text-zinc-400 hover:text-zinc-800 transition-opacity"
                        >
                          <Plus className="w-3 h-3 stroke-[2.5]" />
                        </button>
                      </div>
                    </div>

                    {/* Lista de Acciones para este día */}
                    <div className="space-y-1.5 overflow-y-auto max-h-[120px] sm:max-h-[135px] pr-0.5">
                      {dayActions.map((action) => (
                        <CalendarActionCard
                          key={action.id}
                          item={action}
                          workspaceMode={workspaceMode}
                          onToggleComplete={onToggleComplete}
                          onEdit={onEdit}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Espacio inferior sutil si el día está vacío */}
                  {dayActions.length === 0 && (
                    <div
                      onClick={() => onOpenCreateModal(day.iso)}
                      className="h-10 border border-dashed border-zinc-200/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer hover:border-zinc-300 hover:bg-zinc-50/50 transition-all text-zinc-400 hover:text-zinc-600"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1 stroke-[2]" />
                      <span className="text-[10px]">Acción</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
