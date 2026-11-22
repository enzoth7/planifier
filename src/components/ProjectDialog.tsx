import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Check, ChevronDown, ChevronRight, FolderOpen, Plus, Trash2, X } from 'lucide-react';
import { ActionItem, SubtaskItem, VINTAGE_COLORS } from '../types';
import { formatDisplayDate, toISODateString } from '../utils/dates';

interface ProjectDialogProps {
  project: ActionItem | null;
  onClose: () => void;
  onUpdate: (project: ActionItem) => void;
}

const newNoteId = () => `note-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

/**
 * Pendientes: las que tienen fecha van primero (la más próxima arriba) y el resto
 * conserva el orden en que se escribieron.
 */
const sortPending = (notes: SubtaskItem[]): SubtaskItem[] => {
  const dated = notes.filter((n) => n.deadline).sort((a, b) => (a.deadline! < b.deadline! ? -1 : a.deadline! > b.deadline! ? 1 : 0));
  const undated = notes.filter((n) => !n.deadline);
  return [...dated, ...undated];
};

const AUTOSAVE_MS = 600;

/**
 * Diálogo de un proyecto con el formato de Notas de Apple: lista de notas a la izquierda
 * y, al abrir una, su editor a la derecha. Lo que se escribe se guarda solo.
 */
export const ProjectDialog: React.FC<ProjectDialogProps> = ({ project, onClose, onUpdate }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editorText, setEditorText] = useState('');
  const [draftDeadline, setDraftDeadline] = useState('');
  const [showDone, setShowDone] = useState(false);

  // Todo lo que usan el autosave y el cierre se lee de refs para no trabajar con
  // versiones viejas del proyecto cuando el temporizador se dispara.
  const projectRef = useRef(project);
  projectRef.current = project;
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const editorRef = useRef<{ id: string | null; text: string; deadline: string }>({ id: null, text: '', deadline: '' });
  const timerRef = useRef<number | undefined>(undefined);

  const projectId = project?.id;

  /**
   * Guarda lo escrito en el editor. Una nota nueva solo se crea cuando tiene texto;
   * una nota existente que quedó vacía se elimina (solo al salir de ella, nunca a mitad
   * de tipeo, para no borrarla si el texto se vacía un instante).
   */
  const flush = (allowDelete: boolean) => {
    window.clearTimeout(timerRef.current);
    const { id, text, deadline } = editorRef.current;
    const p = projectRef.current;
    if (!id || !p) return;
    const list = p.subtasks ?? [];
    const existing = list.find((n) => n.id === id);
    const clean = text.trim();

    if (existing) {
      if (!clean) {
        if (allowDelete) onUpdateRef.current({ ...p, subtasks: list.filter((n) => n.id !== id) });
        return;
      }
      if (clean === existing.text) return;
      onUpdateRef.current({ ...p, subtasks: list.map((n) => (n.id === id ? { ...n, text: clean } : n)) });
    } else if (clean) {
      const note: SubtaskItem = { id, text: clean, done: false };
      if (deadline) note.deadline = deadline;
      onUpdateRef.current({ ...p, subtasks: [...list, note] });
    }
  };
  const flushRef = useRef(flush);
  flushRef.current = flush;

  const requestClose = () => {
    flushRef.current(true);
    onCloseRef.current();
  };
  const requestCloseRef = useRef(requestClose);
  requestCloseRef.current = requestClose;

  // Al abrir otro proyecto (o cerrar) se descarta cualquier selección.
  useEffect(() => {
    window.clearTimeout(timerRef.current);
    editorRef.current = { id: null, text: '', deadline: '' };
    setSelectedId(null);
    setEditorText('');
    setDraftDeadline('');
    setShowDone(false);
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') requestCloseRef.current();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [projectId]);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const notes = project?.subtasks ?? [];
  const pending = useMemo(() => sortPending(notes.filter((n) => !n.done)), [notes]);
  const done = useMemo(() => notes.filter((n) => n.done), [notes]);
  const todayIso = toISODateString(new Date());

  if (!project) return null;

  const colorDef = VINTAGE_COLORS[project.tagColor] || VINTAGE_COLORS.emerald;
  const selectedNote = notes.find((n) => n.id === selectedId) || null;
  const isPendingNew = !!selectedId && !selectedNote;
  const panelDeadline = selectedNote ? selectedNote.deadline || '' : draftDeadline;

  const patchNote = (id: string, patch: Partial<SubtaskItem>) => {
    const p = projectRef.current;
    if (!p) return;
    onUpdateRef.current({ ...p, subtasks: (p.subtasks ?? []).map((n) => (n.id === id ? { ...n, ...patch } : n)) });
  };

  const selectNote = (note: SubtaskItem) => {
    if (note.id === selectedId) return;
    flush(true);
    editorRef.current = { id: note.id, text: note.text, deadline: '' };
    setSelectedId(note.id);
    setEditorText(note.text);
    setDraftDeadline('');
  };

  const startNewNote = () => {
    flush(true);
    const id = newNoteId();
    editorRef.current = { id, text: '', deadline: '' };
    setSelectedId(id);
    setEditorText('');
    setDraftDeadline('');
  };

  const onEditorChange = (value: string) => {
    setEditorText(value);
    editorRef.current.text = value;
    window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => flushRef.current(false), AUTOSAVE_MS);
  };

  const onPanelDeadlineChange = (value: string) => {
    if (selectedNote) {
      patchNote(selectedNote.id, { deadline: value || undefined });
    } else {
      setDraftDeadline(value);
      editorRef.current.deadline = value;
    }
  };

  const deleteSelected = () => {
    if (!selectedNote) return;
    window.clearTimeout(timerRef.current);
    editorRef.current = { id: null, text: '', deadline: '' };
    const p = projectRef.current;
    onUpdateRef.current({ ...p!, subtasks: (p!.subtasks ?? []).filter((n) => n.id !== selectedNote.id) });
    setSelectedId(null);
    setEditorText('');
  };

  // Tarjeta ancha y baja: primera línea como título; debajo, la fecha y el resto del texto.
  const renderCard = (note: SubtaskItem) => {
    const isSelected = note.id === selectedId;
    const isOverdue = !note.done && !!note.deadline && note.deadline < todayIso;
    const isToday = !note.done && note.deadline === todayIso;
    const lines = note.text.trim().split('\n');
    const title = lines[0];
    const rest = lines.slice(1).join(' ').replace(/\s+/g, ' ').trim();

    return (
      <li key={note.id}>
        <div
          role="button"
          tabIndex={0}
          onClick={() => selectNote(note)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              selectNote(note);
            }
          }}
          className={`flex items-center gap-3 h-16 px-3 rounded-xl border cursor-pointer transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 ${
            isSelected
              ? 'bg-zinc-100 border-zinc-300'
              : note.done
              ? 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100/70'
              : 'bg-white border-zinc-200 hover:bg-zinc-50'
          }`}
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              patchNote(note.id, { done: !note.done });
            }}
            title={note.done ? 'Marcar pendiente' : 'Marcar hecha'}
            className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
              note.done ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-zinc-300 hover:border-zinc-500 bg-white'
            }`}
          >
            {note.done && <Check className="w-3 h-3 stroke-[3]" />}
          </button>

          <div className="min-w-0 flex-1">
            <p className={`truncate text-sm font-medium ${note.done ? 'line-through text-zinc-400' : 'text-zinc-900'}`}>{title}</p>
            <div className="flex items-center gap-2 mt-0.5 min-w-0 text-xs text-zinc-500">
              {note.deadline && (
                <span
                  className={`inline-flex items-center gap-1 flex-shrink-0 font-mono ${
                    note.done ? 'text-zinc-400' : isOverdue ? 'text-rose-600 font-medium' : isToday ? 'text-amber-700 font-medium' : 'text-zinc-600'
                  }`}
                >
                  <Calendar className="w-3 h-3" />
                  {formatDisplayDate(note.deadline)}
                </span>
              )}
              <span className="truncate text-zinc-400">{rest || (note.deadline ? '' : 'Sin más texto')}</span>
            </div>
          </div>
        </div>
      </li>
    );
  };

  // Portal al body: el tablero tiene backdrop-blur, que convertiría a este overlay
  // `fixed` en uno relativo al tablero en lugar de a la ventana.
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) requestClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Proyecto ${project.title}`}
        className="relative w-full max-w-4xl h-[36rem] max-h-[90vh] flex flex-col rounded-xl bg-white border border-zinc-200 shadow-2xl text-zinc-900"
      >
        {/* Header */}
        <div className="flex items-start gap-3 px-6 pt-5 pb-4 border-b border-zinc-100 flex-shrink-0">
          <div className="mt-0.5 w-9 h-9 rounded-lg bg-zinc-100 text-zinc-600 flex items-center justify-center flex-shrink-0">
            <FolderOpen className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-zinc-900 leading-tight break-words">{project.title}</h2>
            <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-zinc-500">
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-medium border ${colorDef.bg} ${colorDef.border} ${colorDef.text}`}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colorDef.dot }} />
                <span className="truncate max-w-[180px]">{project.target}</span>
              </span>
              <span>
                {pending.length} {pending.length === 1 ? 'pendiente' : 'pendientes'}
                {done.length > 0 && ` · ${done.length} ${done.length === 1 ? 'hecha' : 'hechas'}`}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={requestClose}
            title="Cerrar (Esc)"
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body: lista de notas | editor */}
        <div className="flex-1 min-h-0 flex flex-col sm:flex-row">
          {/* Lista */}
          <div className="sm:w-80 flex-shrink-0 max-h-52 sm:max-h-none flex flex-col border-b sm:border-b-0 sm:border-r border-zinc-100 min-h-0">
            <div className="p-3 flex-shrink-0">
              <button
                type="button"
                onClick={startNewNote}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-zinc-300 text-sm font-medium text-zinc-600 hover:border-zinc-900 hover:text-zinc-900 hover:bg-zinc-50 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Nueva nota
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-3 space-y-3">
              {pending.length > 0 ? (
                <ul className="space-y-2">{pending.map(renderCard)}</ul>
              ) : (
                <p className="text-xs text-zinc-400 text-center py-6">
                  {notes.length === 0 ? 'Todavía no hay notas.' : 'No quedan notas pendientes.'}
                </p>
              )}

              {done.length > 0 && (
                <div>
                  <button
                    type="button"
                    onClick={() => setShowDone((prev) => !prev)}
                    className="flex items-center gap-1 mb-2 text-xs font-medium text-zinc-500 hover:text-zinc-800 transition-colors"
                  >
                    {showDone ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    Hechas ({done.length})
                  </button>
                  {showDone && <ul className="space-y-2">{done.map(renderCard)}</ul>}
                </div>
              )}
            </div>
          </div>

          {/* Editor */}
          <div className="flex-1 min-w-0 min-h-[16rem] flex flex-col">
            {selectedId ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-b border-zinc-100 flex-shrink-0">
                  <label className="inline-flex items-center gap-2 text-xs text-zinc-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Fecha límite</span>
                    <input
                      type="date"
                      value={panelDeadline}
                      onChange={(e) => onPanelDeadlineChange(e.target.value)}
                      className="bg-white text-zinc-800 text-xs px-1.5 py-1 rounded border border-zinc-200 focus:outline-none focus:border-zinc-400 font-mono"
                    />
                    {panelDeadline && (
                      <button
                        type="button"
                        onClick={() => onPanelDeadlineChange('')}
                        title="Quitar fecha"
                        className="p-0.5 rounded text-zinc-400 hover:text-zinc-700"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </label>

                  {selectedNote && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => patchNote(selectedNote.id, { done: !selectedNote.done })}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                          selectedNote.done
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        {selectedNote.done ? 'Hecha' : 'Marcar hecha'}
                      </button>
                      <button
                        type="button"
                        onClick={deleteSelected}
                        title="Eliminar nota"
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <textarea
                  key={selectedId}
                  autoFocus
                  value={editorText}
                  onChange={(e) => onEditorChange(e.target.value)}
                  onBlur={() => flush(false)}
                  placeholder={isPendingNew ? 'Escribí la nota…' : ''}
                  className="flex-1 min-h-0 w-full resize-none bg-transparent px-5 py-4 text-sm leading-relaxed text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
                />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-6">
                <button
                  type="button"
                  onClick={startNewNote}
                  className="flex flex-col items-center gap-3 px-10 py-8 rounded-2xl text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-colors cursor-pointer"
                >
                  <span className="w-14 h-14 rounded-full bg-zinc-900 text-white flex items-center justify-center">
                    <Plus className="w-7 h-7" />
                  </span>
                  <span className="text-base font-semibold">Nueva nota</span>
                  <span className="text-xs text-zinc-400">O elegí una de la lista para verla y editarla</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
