import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Check,
  Trash2,
  Edit2,
  Video,
  FolderOpen,
} from 'lucide-react';
import { ActionItem, ClientItem, VintageColorKey } from '../types';
import { formatDisplayDate, toISODateString } from '../utils/dates';
import { ClientSelectPopover } from './ClientSelectPopover';

interface BoardRowProps {
  item: ActionItem;
  clients?: ClientItem[];
  openUpwards?: boolean;
  onToggleComplete: (id: string) => void;
  onEdit: (item: ActionItem) => void;
  onDelete: (id: string) => void;
  onUpdateColor: (id: string, color: VintageColorKey) => void;
  onUpdateValue: (id: string, val: number) => void;
  onUpdateTarget?: (id: string, target: string) => void;
  onUpdateTargetAndColor?: (id: string, target: string, color: VintageColorKey) => void;
  onUpdateDeadline?: (id: string, deadline: string) => void;
  onOpenProject: (id: string) => void;
  onNavigateToClients?: () => void;
}

export const BoardRow: React.FC<BoardRowProps> = ({
  item,
  clients = [],
  openUpwards = false,
  onToggleComplete,
  onEdit,
  onDelete,
  onUpdateColor,
  onUpdateValue,
  onUpdateTarget,
  onUpdateTargetAndColor,
  onUpdateDeadline,
  onOpenProject,
  onNavigateToClients,
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
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.6 : 1,
  };

  const formattedDate = formatDisplayDate(item.deadline);

  const isProject = item.taskType === 'project';

  // Resumen de las notas de un proyecto: cuántas faltan y cuál es la fecha más próxima.
  const pendingNotes = isProject ? (item.subtasks || []).filter((n) => !n.done) : [];
  const nextNoteDeadline = pendingNotes
    .map((n) => n.deadline)
    .filter((d): d is string => !!d)
    .sort()[0];
  const hasOverdueNote = !!nextNoteDeadline && nextNoteDeadline < toISODateString(new Date());
  const projectSummary = pendingNotes.length === 0
    ? ((item.subtasks || []).length > 0 ? 'Todo al día' : 'Sin notas')
    : `${pendingNotes.length} ${pendingNotes.length === 1 ? 'pendiente' : 'pendientes'}`;

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
          <div className={`col-span-12 md:col-span-5 min-w-0 pr-2`}>
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
                  {isProject ? (
                    <span
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/80 shadow-2xs flex-shrink-0"
                      title="Proyecto"
                    >
                      <FolderOpen className="w-2.5 h-2.5 stroke-[2.5]" />
                      <span>Proyecto</span>
                    </span>
                  ) : item.taskType === 'meeting' ? (
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

                  {isProject ? (
                    <button
                      type="button"
                      onClick={() => onOpenProject(item.id)}
                      title="Abrir proyecto y sus notas"
                      className={`truncate text-left text-xs sm:text-sm font-medium leading-tight hover:underline underline-offset-2 cursor-pointer focus:outline-none focus-visible:underline ${
                        item.completed ? 'line-through text-zinc-400' : 'text-zinc-900'
                      }`}
                    >
                      {item.title}
                    </button>
                  ) : (
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
                  )}
                </div>

                {/* Proyecto: resumen de notas. Acción/Meeting: nota corta si existe */}
                {isProject ? (
                  <button
                    type="button"
                    onClick={() => onOpenProject(item.id)}
                    className="flex items-center gap-1.5 mt-1 text-[11px] text-zinc-500 hover:text-zinc-800 transition-colors focus:outline-none cursor-pointer"
                  >
                    <span>{projectSummary}</span>
                    {nextNoteDeadline && (
                      <span className={hasOverdueNote ? 'text-rose-600 font-medium' : 'text-zinc-400'}>
                        • {hasOverdueNote ? 'vencida' : 'próxima'} {formatDisplayDate(nextNoteDeadline)}
                      </span>
                    )}
                  </button>
                ) : (
                  item.notes && (
                    <p className="mt-1 text-[11px] text-zinc-400 truncate italic" title={item.notes}>
                      {item.notes}
                    </p>
                  )
                )}
              </div>
            </div>
          </div>

          {/* COLUMNA CLIENTE: Cliente (Badge cromático y selector de cliente) */}
          <div className={`col-span-6 md:col-span-3 min-w-0`}>
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
            {isProject ? (
              <div
                className="text-xs text-zinc-400 font-mono whitespace-nowrap"
                title="Los proyectos no tienen fecha límite; las fechas van en sus notas"
              >
                Sin fecha
              </div>
            ) : isEditingDate ? (
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
    </div>
  );
};
