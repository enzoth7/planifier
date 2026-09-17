import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Check, Video } from 'lucide-react';
import { ActionItem, ClientItem, VintageColorKey, VINTAGE_COLORS, TaskType, APP_USERS, WorkspaceMode } from '../types';
import { ClientAutocomplete } from './ClientAutocomplete';

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (itemData: Partial<ActionItem>) => void;
  initialData?: ActionItem | null;
  defaultDeadline?: string;
  defaultUserEmail?: string;
  currentUserEmail?: string;
  workspaceMode?: WorkspaceMode;
  clients?: ClientItem[];
}

export const ActionModal: React.FC<ActionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  defaultDeadline,
  defaultUserEmail,
  currentUserEmail,
  workspaceMode = 'personal',
  clients = [],
}) => {
  const activeEmail = currentUserEmail || defaultUserEmail || 'enzothome1@gmail.com';
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [tagColor, setTagColor] = useState<VintageColorKey>('emerald');
  const [value, setValue] = useState('1000');
  const [deadline, setDeadline] = useState('');
  const [notes, setNotes] = useState('');
  const [taskType, setTaskType] = useState<TaskType>('action');
  const [userEmail, setUserEmail] = useState<string>(activeEmail);
  const [subtasks, setSubtasks] = useState<Array<{ id: string; text: string; done: boolean }>>([]);
  const [newSubtaskText, setNewSubtaskText] = useState('');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setTarget(initialData.target);
      setTagColor(initialData.tagColor);
      setValue(initialData.value.toString());
      setDeadline(initialData.deadline);
      setNotes(initialData.notes || '');
      setTaskType(initialData.taskType || 'action');
      setUserEmail(initialData.userEmail || activeEmail);
      setSubtasks(initialData.subtasks || []);
    } else {
      setTitle('');
      setTarget(workspaceMode === 'team' ? 'Polarist' : '');
      setTagColor('emerald');
      setValue('1500');
      setTaskType('action');
      setUserEmail(activeEmail);
      setNotes('');
      setSubtasks([]);
      if (defaultDeadline) {
        setDeadline(defaultDeadline);
      } else {
        const d = new Date();
        d.setDate(d.getDate() + 2);
        setDeadline(d.toISOString().split('T')[0]);
      }
    }
  }, [initialData, defaultDeadline, activeEmail, workspaceMode, isOpen]);

  if (!isOpen) return null;

  const handleAddSubtask = () => {
    if (!newSubtaskText.trim()) return;
    setSubtasks([
      ...subtasks,
      { id: `st-${Date.now()}-${Math.random()}`, text: newSubtaskText.trim(), done: false },
    ]);
    setNewSubtaskText('');
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter((s) => s.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const numValue = parseFloat(value.replace(/[^0-9.]/g, '')) || 0;

    onSave({
      title: title.trim(),
      target: target.trim() || 'General',
      tagColor,
      value: numValue,
      currency: '$',
      deadline,
      notes: notes.trim(),
      subtasks,
      userEmail,
      taskType,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
      <div
        className="relative w-full max-w-lg rounded-xl bg-white border border-zinc-200 p-6 shadow-2xl text-zinc-900 my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="pb-3 mb-4 border-b border-zinc-100">
          <h2 className="text-base font-semibold text-zinc-900">
            {initialData ? 'Editar Acción' : 'Nueva Acción'}
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Definí la acción, destinatario, valor y fecha límite.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Tipo de Tarea & Responsable */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-2.5 rounded-lg bg-zinc-50 border border-zinc-200/80">
            {/* Tipo de Tarea */}
            <div>
              <label className="block font-medium text-zinc-700 mb-1.5">
                Tipo de Tarea
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setTaskType('action')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md font-medium transition-all cursor-pointer border ${
                    taskType === 'action'
                      ? 'bg-white text-zinc-900 border-zinc-300 shadow-xs font-semibold'
                      : 'bg-zinc-100 text-zinc-600 border-transparent hover:bg-zinc-200/70'
                  }`}
                >
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>Acción</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTaskType('meeting')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md font-medium transition-all cursor-pointer border ${
                    taskType === 'meeting'
                      ? 'bg-purple-100 text-purple-900 border-purple-300 shadow-xs font-semibold'
                      : 'bg-zinc-100 text-zinc-600 border-transparent hover:bg-zinc-200/70'
                  }`}
                >
                  <Video className="w-3 h-3 text-purple-700" />
                  <span>Meeting</span>
                </button>
              </div>
            </div>

            {/* Responsable */}
            <div>
              <label className="block font-medium text-zinc-700 mb-1.5">
                Responsable
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {APP_USERS.map((user) => {
                  const isSelected = userEmail.toLowerCase() === user.email.toLowerCase();
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => setUserEmail(user.email)}
                      className={`flex items-center justify-center gap-1.5 py-1 px-1.5 rounded-md border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-white text-zinc-900 border-zinc-900 shadow-xs font-semibold ring-1 ring-zinc-900'
                          : 'bg-zinc-100 text-zinc-600 border-transparent hover:bg-zinc-200/70'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full text-[9px] font-bold text-white flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: user.avatarColor }}
                      >
                        {user.initials}
                      </span>
                      <span className="truncate text-[11px]">{user.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Título de la acción */}
          <div>
            <label className="block font-medium text-zinc-700 mb-1.5">
              Acción / Descripción *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Cierre de Contrato Anual con Polarist"
              className="w-full bg-white text-zinc-900 px-3 py-2 rounded-lg border border-zinc-300 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-400 text-xs"
            />
          </div>

          {/* Columna 2: Cliente & Selector de color */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block font-medium text-zinc-700">
                  Cliente *
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setTarget('Polarist');
                    setTagColor('emerald');
                  }}
                  className="inline-flex items-center gap-1 text-[10.5px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded-full transition-colors cursor-pointer"
                  title="Fijar cliente Polarist"
                >
                  ⭐ Polarist
                </button>
              </div>
              <ClientAutocomplete
                value={target}
                onChange={(val) => {
                  setTarget(val);
                  const matched = clients.find(
                    (c) => c.name.toLowerCase() === val.trim().toLowerCase()
                  );
                  if (matched) {
                    setTagColor(matched.color);
                  }
                }}
                onSelectClient={(client) => {
                  setTarget(client.name);
                  setTagColor(client.color);
                }}
                clients={clients}
                required
                placeholder="Buscar o ingresar entidad..."
              />
            </div>

            <div>
              <label className="block font-medium text-zinc-700 mb-1.5">
                Color de categoría
              </label>
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {(Object.keys(VINTAGE_COLORS) as VintageColorKey[]).map((cKey) => {
                  const def = VINTAGE_COLORS[cKey];
                  const isSelected = tagColor === cKey;
                  return (
                    <button
                      key={cKey}
                      type="button"
                      onClick={() => setTagColor(cKey)}
                      title={def.label}
                      className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                        isSelected
                          ? 'ring-2 ring-zinc-900 ring-offset-2 scale-110'
                          : 'opacity-80 hover:opacity-100 hover:scale-105'
                      }`}
                      style={{ backgroundColor: def.dot }}
                    >
                      {isSelected && <Check className="w-3 h-3 text-white stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Columna 3: Dinero (USD) & Columna 4: Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-zinc-700 mb-1.5">
                Dinero (USD) *
              </label>
              <input
                type="number"
                min="0"
                step="10"
                required
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full bg-white text-emerald-700 font-mono font-medium px-3 py-2 rounded-lg border border-zinc-300 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-400 text-xs"
              />
            </div>

            <div>
              <label className="block font-medium text-zinc-700 mb-1.5">
                Fecha Límite *
              </label>
              <input
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-white text-zinc-800 font-mono px-3 py-2 rounded-lg border border-zinc-300 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-400 text-xs"
              />
            </div>
          </div>

          {/* Renglones / Sub-tareas de Seguimiento */}
          <div className="border-t border-zinc-100 pt-3">
            <label className="block font-medium text-zinc-700 mb-1.5">
              Renglones / Sub-tareas
            </label>
            {subtasks.length > 0 && (
              <div className="space-y-1 max-h-32 overflow-y-auto mb-2 pr-1">
                {subtasks.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200"
                  >
                    <span className="truncate text-zinc-800 text-xs">{st.text}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(st.id)}
                      className="text-zinc-400 hover:text-rose-600 p-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={newSubtaskText}
                onChange={(e) => setNewSubtaskText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                placeholder="+ Añadir renglón (Enter)..."
                className="flex-1 bg-white text-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-300 text-xs focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-400"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block font-medium text-zinc-700 mb-1.5">
              Notas adicionales
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalles sobre entregables o contexto..."
              rows={2}
              className="w-full bg-white text-zinc-800 p-2.5 rounded-lg border border-zinc-300 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-400 text-xs"
            />
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-zinc-500 hover:text-zinc-800 transition-colors font-medium text-xs"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs transition-colors shadow-sm"
            >
              {initialData ? 'Guardar Cambios' : 'Crear Acción'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
