import React, { useState, useEffect } from 'react';
import { X, Check, Video, FolderOpen } from 'lucide-react';
import { ActionItem, ClientItem, VintageColorKey, VINTAGE_COLORS, TaskType } from '../types';
import { ClientAutocomplete } from './ClientAutocomplete';

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (itemData: Partial<ActionItem>) => void;
  initialData?: ActionItem | null;
  defaultDeadline?: string;
  clients?: ClientItem[];
}

export const ActionModal: React.FC<ActionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  defaultDeadline,
  clients = [],
}) => {
  const [title, setTitle] = useState('');
  const [target, setTarget] = useState('');
  const [tagColor, setTagColor] = useState<VintageColorKey>('emerald');
  const [value, setValue] = useState('1000');
  const [deadline, setDeadline] = useState('');
  const [notes, setNotes] = useState('');
  const [taskType, setTaskType] = useState<TaskType>('action');

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title);
      setTarget(initialData.target);
      setTagColor(initialData.tagColor);
      setValue(initialData.value.toString());
      setDeadline(initialData.deadline);
      setNotes(initialData.notes || '');
      setTaskType(initialData.taskType || 'action');
    } else {
      setTitle('');
      setTarget('');
      setTagColor('emerald');
      setValue('1500');
      setTaskType('action');
      setNotes('');
      if (defaultDeadline) {
        setDeadline(defaultDeadline);
      } else {
        const d = new Date();
        d.setDate(d.getDate() + 2);
        setDeadline(d.toISOString().split('T')[0]);
      }
    }
  }, [initialData, defaultDeadline, isOpen]);

  if (!isOpen) return null;

  const isProject = taskType === 'project';

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
      // Los proyectos no tienen fecha; sus notas se editan desde el diálogo del proyecto,
      // por eso no se envía `subtasks` y se conservan tal cual están.
      deadline: isProject ? '' : deadline,
      notes: notes.trim(),
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
            {isProject ? (initialData ? 'Editar Proyecto' : 'Nuevo Proyecto') : initialData ? 'Editar Acción' : 'Nueva Acción'}
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            {isProject
              ? 'Definí el proyecto y su cliente. Las notas y fechas se cargan desde el tablero.'
              : 'Definí la acción, destinatario, valor y fecha límite.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Tipo de Tarea */}
          <div className="p-2.5 rounded-lg bg-zinc-50 border border-zinc-200/80">
            {/* Tipo de Tarea */}
            <div>
              <label className="block font-medium text-zinc-700 mb-1.5">
                Tipo de Tarea
              </label>
              <div className="grid grid-cols-3 gap-1.5">
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

                <button
                  type="button"
                  onClick={() => setTaskType('project')}
                  className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md font-medium transition-all cursor-pointer border ${
                    taskType === 'project'
                      ? 'bg-sky-100 text-sky-900 border-sky-300 shadow-xs font-semibold'
                      : 'bg-zinc-100 text-zinc-600 border-transparent hover:bg-zinc-200/70'
                  }`}
                >
                  <FolderOpen className="w-3 h-3 text-sky-700" />
                  <span>Proyecto</span>
                </button>
              </div>
            </div>
          </div>

          {/* Título de la acción */}
          <div>
            <label className="block font-medium text-zinc-700 mb-1.5">
              {isProject ? 'Proyecto *' : 'Acción / Descripción *'}
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isProject ? 'Ej: Web de MateArte' : 'Ej: Cierre de Contrato Anual con Polarist'}
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

            {!isProject && (
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
            )}
          </div>

          {/* Notas (en los proyectos, las notas viven en el diálogo del proyecto) */}
          {!isProject && (
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
          )}

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
              {initialData ? 'Guardar Cambios' : isProject ? 'Crear Proyecto' : 'Crear Acción'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
