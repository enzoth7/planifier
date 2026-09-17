import React, { useState } from 'react';
import { Check, Video } from 'lucide-react';
import { ActionItem, VINTAGE_COLORS, WorkspaceMode, getUserByEmail } from '../types';

interface CalendarActionCardProps {
  item: ActionItem;
  workspaceMode?: WorkspaceMode;
  onToggleComplete: (id: string) => void;
  onEdit: (item: ActionItem) => void;
}

export const CalendarActionCard: React.FC<CalendarActionCardProps> = ({
  item,
  workspaceMode = 'personal',
  onToggleComplete,
  onEdit,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const colorDef = VINTAGE_COLORS[item.tagColor] || VINTAGE_COLORS.emerald;
  const assignedUser = getUserByEmail(item.userEmail);

  const handleDragStart = (e: React.DragEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', item.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  // Format currency: e.g. "+$4.8k" or "+$800"
  const formattedValue =
    item.value >= 1000
      ? `+$${(item.value / 1000).toLocaleString('en-US', {
          maximumFractionDigits: 1,
        })}k`
      : `+$${item.value.toLocaleString('en-US')}`;

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onClick={() => onEdit(item)}
      className={`group/card relative flex flex-col gap-1 p-2 rounded-lg border border-zinc-200/80 bg-white/95 hover:bg-white hover:border-zinc-300 shadow-xs hover:shadow-md transition-all cursor-grab active:cursor-grabbing select-none text-left ${
        isDragging ? 'opacity-40 scale-95 shadow-none' : ''
      } ${item.taskType === 'meeting' ? 'border-l-[3px] border-l-purple-500' : ''}`}
    >
      {/* Top row: Checkbox, Client Tag Capsule, Responsible Avatar, and USD Value */}
      <div className="flex items-center justify-between gap-1 min-w-0">
        <div className="flex items-center gap-1 min-w-0 flex-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete(item.id);
            }}
            title="Marcar como completada (1 clic)"
            className="w-3.5 h-3.5 rounded-full border border-zinc-300 hover:border-emerald-500 hover:bg-emerald-50 flex items-center justify-center flex-shrink-0 transition-colors"
          >
            <Check className="w-2.5 h-2.5 text-transparent group-hover/card:text-zinc-300 hover:!text-emerald-600 transition-colors" />
          </button>

          {/* Avatar del responsable en modo Equipo Polarist */}
          {workspaceMode === 'team' && (
            <span
              className="w-4 h-4 rounded-full flex items-center justify-center text-[8.5px] font-bold text-white flex-shrink-0 shadow-2xs"
              style={{ backgroundColor: assignedUser.avatarColor }}
              title={`Responsable: ${assignedUser.name}`}
            >
              {assignedUser.initials}
            </span>
          )}

          {/* Icono de Meeting */}
          {item.taskType === 'meeting' && (
            <span
              className="p-0.5 rounded bg-purple-100 text-purple-700 flex-shrink-0"
              title="Reunión / Meeting"
            >
              <Video className="w-2.5 h-2.5 stroke-[2.5]" />
            </span>
          )}

          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold truncate max-w-[75px] border ${colorDef.bg} ${colorDef.text} ${colorDef.border}`}
            title={item.target || 'General'}
          >
            {item.target || 'General'}
          </span>
        </div>

        {item.value > 0 && (
          <span className="font-mono text-[10.5px] font-bold text-emerald-700 tracking-tight flex-shrink-0">
            {formattedValue}
          </span>
        )}
      </div>

      {/* Bottom row: Action Title */}
      <p
        className="text-[11px] font-medium text-zinc-800 group-hover/card:text-zinc-950 truncate pl-4 leading-tight"
        title={item.title}
      >
        {item.title}
      </p>
    </div>
  );
};
