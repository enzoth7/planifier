import React, { useState } from 'react';
import { Plus, X, Check, Circle, Edit3 } from 'lucide-react';
import { SubtaskItem } from '../types';

interface SubtaskLinesProps {
  subtasks: SubtaskItem[];
  notes?: string;
  onToggleSubtask: (subtaskId: string) => void;
  onAddSubtask: (text: string) => void;
  onDeleteSubtask: (subtaskId: string) => void;
  onUpdateNotes?: (notes: string) => void;
}

export const SubtaskLines: React.FC<SubtaskLinesProps> = ({
  subtasks,
  notes,
  onToggleSubtask,
  onAddSubtask,
  onDeleteSubtask,
  onUpdateNotes,
}) => {
  const [newText, setNewText] = useState('');
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesVal, setNotesVal] = useState(notes || '');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;
    onAddSubtask(newText.trim());
    setNewText('');
  };

  const handleSaveNotes = () => {
    if (onUpdateNotes) {
      onUpdateNotes(notesVal.trim());
    }
    setEditingNotes(false);
  };

  return (
    <div className="border-l-2 border-zinc-200 pl-3 py-1.5 my-1.5 space-y-1.5 text-xs bg-zinc-50/70 p-2.5 rounded-r-lg">
      {/* Existing Subtasks */}
      {subtasks.map((st) => (
        <div
          key={st.id}
          className="flex items-center justify-between group py-0.5 gap-2"
        >
          <button
            type="button"
            onClick={() => onToggleSubtask(st.id)}
            className="flex items-center gap-2 text-left min-w-0 flex-1 focus:outline-none"
          >
            {st.done ? (
              <span className="w-3.5 h-3.5 rounded bg-emerald-50 border border-emerald-500 flex items-center justify-center flex-shrink-0 text-emerald-600">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </span>
            ) : (
              <Circle className="w-3.5 h-3.5 text-zinc-400 hover:text-zinc-600 flex-shrink-0 transition-colors" />
            )}
            <span
              className={`truncate text-xs ${
                st.done ? 'line-through text-zinc-400' : 'text-zinc-700'
              }`}
            >
              {st.text}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onDeleteSubtask(st.id)}
            className="opacity-0 group-hover:opacity-100 text-zinc-400 hover:text-rose-600 p-0.5 transition-opacity"
            title="Eliminar renglón"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}

      {/* Add inline subtask */}
      <form onSubmit={handleAdd} className="flex items-center gap-1.5 pt-0.5">
        <input
          type="text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="+ Agregar renglón... (Enter)"
          className="w-full bg-white text-zinc-800 placeholder:text-zinc-400 text-xs px-2 py-1 rounded border border-zinc-200 focus:outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400"
        />
        {newText.trim() && (
          <button
            type="submit"
            className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium rounded transition-colors flex items-center gap-1 flex-shrink-0"
          >
            <Plus className="w-3 h-3" />
            Añadir
          </button>
        )}
      </form>

      {/* Notes / Bitácora */}
      {(notes || editingNotes) ? (
        <div className="pt-1">
          {editingNotes ? (
            <div className="space-y-1.5">
              <textarea
                value={notesVal}
                onChange={(e) => setNotesVal(e.target.value)}
                placeholder="Notas o contexto..."
                className="w-full bg-white text-zinc-800 p-2 text-xs rounded border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-zinc-400 min-h-[44px]"
                rows={2}
              />
              <div className="flex justify-end gap-1.5">
                <button
                  type="button"
                  onClick={() => setEditingNotes(false)}
                  className="px-2 py-0.5 text-[11px] text-zinc-500 hover:text-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveNotes}
                  className="px-2.5 py-0.5 text-[11px] bg-zinc-900 hover:bg-zinc-800 text-white font-medium rounded border border-transparent"
                >
                  Guardar
                </button>
              </div>
            </div>
          ) : (
            <div
              className="flex items-center justify-between group cursor-pointer text-[11px] text-zinc-500 italic py-0.5"
              onClick={() => {
                setNotesVal(notes || '');
                setEditingNotes(true);
              }}
              title="Click para editar notas"
            >
              <p className="truncate">{notes}</p>
              <Edit3 className="w-3 h-3 opacity-0 group-hover:opacity-100 text-zinc-400 ml-1 flex-shrink-0" />
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEditingNotes(true)}
          className="text-[11px] text-zinc-400 hover:text-zinc-600 transition-colors italic block pt-0.5"
        >
          + Añadir nota
        </button>
      )}
    </div>
  );
};
