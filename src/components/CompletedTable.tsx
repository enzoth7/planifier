import React, { useState } from 'react';
import {
  RotateCcw,
  Trash2,
  ChevronDown,
  ChevronRight,
  Check,
  Archive,
  Video,
} from 'lucide-react';
import { ActionItem, VINTAGE_COLORS, WorkspaceMode, getUserByEmail } from '../types';
import { formatCompletedDate } from '../utils/dates';

interface CompletedTableProps {
  items: ActionItem[];
  onRestore: (item: ActionItem) => void;
  onDelete: (id: string) => void;
  workspaceMode?: WorkspaceMode;
}

export const CompletedTable: React.FC<CompletedTableProps> = ({
  items,
  onRestore,
  onDelete,
  workspaceMode = 'personal',
}) => {
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="rounded-xl border border-white/70 bg-white/90 backdrop-blur-md overflow-hidden shadow-xl shadow-zinc-900/5">
      {/* 4 Columns Clean Header */}
      <div className="hidden md:flex items-center px-4 sm:px-6 py-3 bg-zinc-50/70 border-b border-zinc-200/70 gap-3 sm:gap-4 text-xs font-semibold tracking-wider text-zinc-500 select-none">
        {/* Spacer for alignment with BoardTable */}
        <div className="w-9 flex-shrink-0" />

        {/* 4 Main Columns */}
        <div className="flex-1 grid grid-cols-12 gap-3 sm:gap-6 items-center">
          {/* Col 1: Acción / Descripción */}
          <div className="col-span-5 pl-7 sm:pl-8">ACCIÓN / DESCRIPCIÓN</div>

          {/* Col 2: Cliente */}
          <div className="col-span-3 pl-2 sm:pl-3">CLIENTE</div>

          {/* Col 3: Dinero (USD) */}
          <div className="col-span-2 pl-1 sm:pl-2">DINERO (USD)</div>

          {/* Col 4: Fecha en que se completó */}
          <div className="col-span-2 pl-1 sm:pl-2">FECHA COMPLETADO</div>
        </div>
      </div>

      {/* Rows Container */}
      {items.length === 0 ? (
        <div className="py-16 px-4 text-center">
          <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-3 text-zinc-400">
            <Archive className="w-6 h-6 stroke-[1.5]" />
          </div>
          <h3 className="text-sm font-medium text-zinc-800">
            No hay acciones completadas aún
          </h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            Las acciones que marques con el check en el tablero activo se archivarán automáticamente en esta sección.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-200/60">
          {items.map((item) => {
            const colorDef = VINTAGE_COLORS[item.tagColor] || VINTAGE_COLORS.emerald;
            const isExpanded = !!expandedIds[item.id];
            const subtasksCount = item.subtasks ? item.subtasks.length : 0;
            const completedDateStr = formatCompletedDate(item.completedAt);
            const user = getUserByEmail(item.userEmail);

            return (
              <div
                key={item.id}
                className="group transition-colors bg-white/40 hover:bg-white/70"
              >
                <div className="flex items-start sm:items-center py-3.5 sm:py-4 px-4 sm:px-6 gap-3 sm:gap-4 text-xs sm:text-sm">
                  {/* Left Spacer for alignment with BoardTable */}
                  <div className="w-9 flex-shrink-0" />

                  {/* 4 COLUMNS GRID */}
                  <div className="flex-1 grid grid-cols-12 gap-3 sm:gap-6 items-start sm:items-center min-w-0">
                    {/* COLUMNA 1: Acción / Descripción */}
                    <div className="col-span-12 md:col-span-5 min-w-0 pr-2">
                      <div className="flex items-start gap-2.5">
                        {/* Completed Check Badge / Restore button */}
                        <button
                          type="button"
                          onClick={() => onRestore(item)}
                          title="Restaurar al tablero activo"
                          className="mt-0.5 w-4 h-4 rounded bg-emerald-600/90 hover:bg-emerald-700 text-white flex items-center justify-center flex-shrink-0 transition-colors shadow-xs"
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                        </button>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {workspaceMode === 'team' && user && (
                              <span
                                className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-2xs flex-shrink-0"
                                style={{ backgroundColor: user.avatarColor }}
                                title={`Responsable: ${user.name}`}
                              >
                                {user.initials}
                              </span>
                            )}
                            {item.taskType === 'meeting' && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200/80 flex-shrink-0">
                                <Video className="w-2.5 h-2.5 text-amber-600" />
                                Meeting
                              </span>
                            )}
                            <span
                              className="text-xs sm:text-sm font-medium leading-tight text-zinc-700 line-through opacity-85 truncate"
                              title={item.title}
                            >
                              {item.title}
                            </span>
                          </div>

                        {/* Subtasks / Notes preview */}
                        {(subtasksCount > 0 || item.notes) && (
                          <div className="flex items-center gap-2 mt-1">
                            <button
                              type="button"
                              onClick={() => toggleExpand(item.id)}
                              className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-800 transition-colors focus:outline-none"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-3 h-3 text-zinc-500" />
                              ) : (
                                <ChevronRight className="w-3 h-3 text-zinc-400" />
                              )}
                              <span>
                                {subtasksCount > 0
                                  ? `Renglones (${subtasksCount})`
                                  : 'Notas'}
                              </span>
                            </button>

                            {item.notes && !isExpanded && (
                              <span className="text-[11px] text-zinc-400 truncate max-w-[160px] italic">
                                • {item.notes}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                    {/* COLUMNA 2: Cliente */}
                    <div className="col-span-6 md:col-span-3 min-w-0">
                      <div
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${colorDef.bg} ${colorDef.border} ${colorDef.text} opacity-90`}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: colorDef.dot }}
                        />
                        <span className="truncate max-w-[130px]">{item.target}</span>
                      </div>
                    </div>

                    {/* COLUMNA 3: Dinero (USD) */}
                    <div className="col-span-6 md:col-span-2 min-w-0">
                      <span className="font-mono text-xs sm:text-sm font-semibold text-emerald-800/90">
                        ${(item.value || 0).toLocaleString('en-US')} USD
                      </span>
                    </div>

                    {/* COLUMNA 4: Fecha en que se completó + Acciones */}
                    <div className="col-span-12 md:col-span-2 flex items-center justify-between gap-2 min-w-0">
                      <div
                        className="text-xs text-zinc-500 font-mono whitespace-nowrap"
                        title={item.completedAt ? new Date(item.completedAt).toLocaleString() : ''}
                      >
                        {completedDateStr}
                      </div>

                      {/* Botones: Restaurar al tablero & Eliminar definitivamente */}
                      <div className="flex items-center gap-1 opacity-80 md:opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => onRestore(item)}
                          title="Restaurar al tablero activo"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-zinc-600 hover:text-emerald-700 hover:bg-emerald-50 border border-transparent hover:border-emerald-200/60 transition-all active:scale-95"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span className="hidden xl:inline text-[11px] font-medium">Restaurar</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(item.id);
                          }}
                          title="Eliminar definitivamente"
                          className="p-1 rounded text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Subtasks expandidas en completados */}
                {isExpanded && (
                  <div className="px-4 sm:px-6 pb-3 pt-0 ml-8 sm:ml-12 border-t border-zinc-100/80 bg-zinc-50/40">
                    {item.notes && (
                      <p className="text-xs text-zinc-600 my-2 italic bg-white/70 p-2 rounded border border-zinc-200/50">
                        {item.notes}
                      </p>
                    )}
                    {subtasksCount > 0 && (
                      <div className="space-y-1.5 my-2">
                        {item.subtasks.map((st) => (
                          <div
                            key={st.id}
                            className="flex items-center gap-2 text-xs text-zinc-600"
                          >
                            <span className="w-3 h-3 rounded-full border border-emerald-500 bg-emerald-50 flex items-center justify-center text-emerald-600">
                              <Check className="w-2 h-2 stroke-[3]" />
                            </span>
                            <span className={st.done ? 'line-through text-zinc-400' : ''}>
                              {st.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
