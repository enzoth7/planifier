import React, { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Check,
  ChevronDown,
  ChevronRight,
  Trash2,
  Edit2,
  Video,
} from 'lucide-react';
import { ActionItem, ClientItem, VintageColorKey, WorkspaceMode, getUserByEmail, APP_USERS } from '../types';
import { formatDisplayDate } from '../utils/dates';
import { ClientSelectPopover } from './ClientSelectPopover';
import { SubtaskLines } from './SubtaskLines';

interface BoardRowProps {
  item: ActionItem;
  clients?: ClientItem[];
  openUpwards?: boolean;
  workspaceMode?: WorkspaceMode;
  onToggleComplete: (id: string) => void;
  onEdit: (item: ActionItem) => void;
  onDelete: (id: string) => void;
  onUpdateColor: (id: string, color: VintageColorKey) => void;
  onUpdateValue: (id: string, val: number) => void;
  onUpdateTarget?: (id: string, target: string) => void;
  onUpdateTargetAndColor?: (id: string, target: string, color: VintageColorKey) => void;
  onUpdateDeadline?: (id: string, deadline: string) => void;
  onToggleExpand: (id: string) => void;
  onToggleSubtask: (itemId: string, subtaskId: string) => void;
  onAddSubtask: (itemId: string, text: string) => void;
  onDeleteSubtask: (itemId: string, subtaskId: string) => void;
  onUpdateNotes: (itemId: string, notes: string) => void;
  onNavigateToClients?: () => void;
  onUpdateUserEmail?: (id: string, userEmail: string) => void;
}

export const BoardRow: React.FC<BoardRowProps> = ({
  item,
  clients = [],
  openUpwards = false,
  workspaceMode = 'personal',
  onToggleComplete,
  onEdit,
  onDelete,
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
  onNavigateToClients,
  onUpdateUserEmail,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const [isEditingValue, setIsEditingValue] = useState(false);
  const [valueInput, setValueInput] = useState(item.value.toString());

  const [isEditingDate, setIsEditingDate] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.6 : 1,
  };

  const formattedDate = formatDisplayDate(item.deadline);

  const assignedUser = getUserByEmail(item.userEmail);

  const subtasksCount = item.subtasks ? item.subtasks.length : 0;
  const completedSubtasksCount = item.subtasks
    ? item.subtasks.filter((s) => s.done).length
    : 0;

  const handleValueSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const num = parseFloat(valueInput.replace(/[^0-9.]/g, ''));
    if (!isNaN(num)) {
      onUpdateValue(item.id, Math.max(0, num));
    } else {
      setValueInput(item.value.toString());
    }
    setIsEditingValue(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group border-b border-zinc-200/60 transition-colors bg-white/50 last:border-b-0 last:rounded-b-xl ${
        isDragging ? 'bg-zinc-50/90 shadow-md ring-1 ring-zinc-300' : 'hover:bg-white/80'
      } ${item.completed ? 'bg-zinc-50/40 opacity-60' : ''}`}
    >
      <div className="flex items-start sm:items-center py-3.5 sm:py-4 px-4 sm:px-6 gap-3 sm:gap-4 text-xs sm:text-sm">
        {/* Left Drag Handle */}
        <div
          {...attributes}
          {...listeners}
          title="Arrastrar para mover fila"
          className="w-9 flex-shrink-0 flex items-center justify-center mt-1 sm:mt-0 p-1 text-zinc-300 hover:text-zinc-600 cursor-grab active:cursor-grabbing transition-colors rounded hover:bg-zinc-100"
        >
          <GripVertical className="w-4 h-4" />
        </div>

        {/* COLUMNS GRID */}
        <div className="flex-1 grid grid-cols-12 gap-3 sm:gap-6 items-start sm:items-center min-w-0">
          {/* COLUMNA 1: Acción / Descripción */}
          <div className={`col-span-12 ${workspaceMode === 'team' ? 'md:col-span-4' : 'md:col-span-5'} min-w-0 pr-2`}>
            <div className="flex items-start gap-2.5">
              {/* Checkbox */}
              <button
                type="button"
                onClick={() => onToggleComplete(item.id)}
                title={item.completed ? 'Marcar pendiente' : 'Marcar completada'}
                className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                  item.completed
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'border-zinc-300 hover:border-zinc-400 bg-white'
                }`}
              >
                {item.completed && <Check className="w-3 h-3 stroke-[3]" />}
              </button>

              <div className="flex-1 min-w-0">
                {/* Badges y Título en el mismo renglón */}
                <div className="flex items-center gap-2 min-w-0">
                  {/* Badge del tipo de tarea: Acción vs Meeting */}
                  {item.taskType === 'meeting' ? (
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/80 shadow-2xs flex-shrink-0"
                      title="Reunión / Meeting"
                    >
                      <Video className="w-2.5 h-2.5 stroke-[2.5]" />
                      <span>Meeting</span>
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-600 border border-zinc-200/70 shadow-2xs flex-shrink-0"
                      title="Tarea de Acción"
                    >
                      Acción
                    </span>
                  )}

                  <span
                    className={`truncate text-xs sm:text-sm font-medium leading-tight ${
                      item.completed
                        ? 'line-through text-zinc-400'
                        : 'text-zinc-900'
                    }`}
                    title={item.title}
                  >
                    {item.title}
                  </span>
                </div>

                {/* Subtask / Renglones toggle indicator */}
                <div className="flex items-center gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => onToggleExpand(item.id)}
                    className="flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-800 transition-colors focus:outline-none"
                  >
                    {item.isExpanded ? (
                      <ChevronDown className="w-3 h-3 text-zinc-500" />
                    ) : (
                      <ChevronRight className="w-3 h-3 text-zinc-400" />
                    )}
                    <span>
                      {subtasksCount > 0
                        ? `Renglones (${completedSubtasksCount}/${subtasksCount})`
                        : '+ Renglones'}
                    </span>
                  </button>

                  {item.notes && !item.isExpanded && (
                    <span className="text-[11px] text-zinc-400 truncate max-w-[140px] italic">
                      • {item.notes}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* COLUMNA 2 (Solo modo team): ENCARGADO */}
          {workspaceMode === 'team' && (
            <div className="col-span-6 md:col-span-2 min-w-0 flex items-center relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                className="group/assign inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-zinc-200/80 bg-white/90 hover:bg-zinc-50 hover:border-zinc-300 shadow-2xs transition-all cursor-pointer text-zinc-800 focus:outline-none"
                title="Cambiar encargado"
              >
                <span
                  className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white shadow-2xs flex-shrink-0"
                  style={{ backgroundColor: assignedUser.avatarColor }}
                >
                  {assignedUser.initials}
                </span>
                <span className="truncate max-w-[80px] font-medium">{assignedUser.name}</span>
                <ChevronDown className="w-3 h-3 text-zinc-400 group-hover/assign:text-zinc-600 transition-transform" />
              </button>

              {/* Popover selector de encargado */}
              {isUserMenuOpen && (
                <div
                  className={`absolute z-50 left-0 ${
                    openUpwards ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
                  } w-48 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-zinc-200 p-1.5 animate-in fade-in zoom-in-95 duration-100`}
                >
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 mb-1">
                    Asignar Encargado
                  </div>
                  <div className="space-y-0.5">
                    {APP_USERS.map((user) => {
                      const isCurrent =
                        (item.userEmail || APP_USERS[0].email).toLowerCase() === user.email.toLowerCase();
                      return (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => {
                            if (onUpdateUserEmail) {
                              onUpdateUserEmail(item.id, user.email);
                            }
                            setIsUserMenuOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                            isCurrent ? 'bg-zinc-100 font-semibold text-zinc-900' : 'hover:bg-zinc-50 text-zinc-700'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span
                              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-2xs flex-shrink-0"
                              style={{ backgroundColor: user.avatarColor }}
                            >
                              {user.initials}
                            </span>
                            <span className="truncate">{user.name}</span>
                          </div>
                          {isCurrent && <Check className="w-3.5 h-3.5 text-zinc-800 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* COLUMNA CLIENTE: Cliente (Badge cromático y selector de cliente) */}
          <div className={`col-span-6 ${workspaceMode === 'team' ? 'md:col-span-2' : 'md:col-span-3'} min-w-0`}>
            <ClientSelectPopover
              target={item.target}
              currentColor={item.tagColor}
              clients={clients}
              openUpwards={openUpwards}
              onSelectClient={(newTarget, newColor) => {
                if (onUpdateTargetAndColor) {
                  onUpdateTargetAndColor(item.id, newTarget, newColor);
                } else {
                  if (onUpdateTarget) onUpdateTarget(item.id, newTarget);
                  onUpdateColor(item.id, newColor);
                }
              }}
              onUpdateColor={(newColor) => onUpdateColor(item.id, newColor)}
              onNavigateToClients={onNavigateToClients}
            />
          </div>

          {/* COLUMNA 3 (~16% ancho / 2 cols out of 12): Dinero (USD) */}
          <div className="col-span-6 md:col-span-2 min-w-0">
            {isEditingValue ? (
              <form onSubmit={handleValueSubmit} className="flex items-center max-w-[130px]">
                <span className="text-xs text-zinc-400 mr-1">$</span>
                <input
                  type="text"
                  autoFocus
                  value={valueInput}
                  onChange={(e) => setValueInput(e.target.value)}
                  onBlur={() => handleValueSubmit()}
                  className="w-full bg-white text-emerald-700 font-mono text-xs sm:text-sm px-2 py-0.5 rounded border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                />
              </form>
            ) : (
              <div
                onClick={() => {
                  setValueInput(item.value.toString());
                  setIsEditingValue(true);
                }}
                className="inline-flex items-center gap-1 cursor-pointer group/val transition-colors"
                title="Click para editar monto"
              >
                <span className="font-mono text-xs sm:text-sm font-semibold text-zinc-800 group-hover/val:text-emerald-700">
                  ${item.value.toLocaleString('en-US')} USD
                </span>
              </div>
            )}
          </div>

          {/* COLUMNA 4 (~21% ancho / 2 cols out of 12): Fecha Límite + Acciones */}
          <div className="col-span-12 md:col-span-2 flex items-center justify-between gap-2 min-w-0">
            {isEditingDate ? (
              <input
                type="date"
                autoFocus
                value={item.deadline}
                onChange={(e) => {
                  if (onUpdateDeadline) onUpdateDeadline(item.id, e.target.value);
                  setIsEditingDate(false);
                }}
                onBlur={() => setIsEditingDate(false)}
                className="bg-white text-zinc-800 text-xs px-1 py-0.5 rounded border border-zinc-300 focus:outline-none font-mono"
              />
            ) : (
              <div
                onClick={() => setIsEditingDate(true)}
                className="cursor-pointer text-xs text-zinc-600 hover:text-zinc-900 transition-colors font-mono whitespace-nowrap"
                title="Click para cambiar fecha límite"
              >
                {formattedDate}
              </div>
            )}

            {/* Hover Actions: Edit & Trash */}
            <div className="flex items-center gap-1 opacity-70 md:opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <button
                type="button"
                onClick={() => onEdit(item)}
                title="Editar acción completa"
                className="p-1 rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(item.id);
                }}
                title="Eliminar acción"
                className="p-1 rounded text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* EXPANDABLE SUBTASKS / RENGLONES */}
      {item.isExpanded && (
        <div className="px-4 sm:px-6 pb-3.5 pt-0 ml-8 sm:ml-12">
          <SubtaskLines
            subtasks={item.subtasks || []}
            notes={item.notes}
            onToggleSubtask={(subId) => onToggleSubtask(item.id, subId)}
            onAddSubtask={(text) => onAddSubtask(item.id, text)}
            onDeleteSubtask={(subId) => onDeleteSubtask(item.id, subId)}
            onUpdateNotes={(newNotes) => onUpdateNotes(item.id, newNotes)}
          />
        </div>
      )}
    </div>
  );
};
