import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import {
  Plus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Filter,
  X,
  RotateCcw,
  Check,
  Video,
} from 'lucide-react';
import { ActionItem, ClientItem, VintageColorKey, VINTAGE_COLORS, TaskType, UserProfile, WorkspaceMode, APP_USERS } from '../types';
import { BoardRow } from './BoardRow';
import { EmptyState } from './EmptyState';
import { ClientAutocomplete } from './ClientAutocomplete';

type SortKey = 'manual' | 'title' | 'value' | 'deadline' | 'client';
type SortDirection = 'asc' | 'desc';

interface BoardTableProps {
  items: ActionItem[];
  clients?: ClientItem[];
  workspaceMode?: WorkspaceMode;
  currentUser?: UserProfile;
  onReorder: (newItems: ActionItem[]) => void;
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
  onOpenCreateModal: () => void;
  onNavigateToClients?: () => void;
  onQuickAdd: (data: {
    title: string;
    target: string;
    tagColor?: VintageColorKey;
    value: number;
    deadline: string;
    userEmail?: string;
    taskType?: TaskType;
  }) => void;
}

export const BoardTable: React.FC<BoardTableProps> = ({
  items,
  clients = [],
  workspaceMode = 'personal',
  currentUser,
  onReorder,
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
  onOpenCreateModal,
  onNavigateToClients,
  onQuickAdd,
}) => {
  // Sort and Filter States
  const [sortKey, setSortKey] = useState<SortKey>('manual');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedClientFilter, setSelectedClientFilter] = useState<string | null>(null);
  const [isClientFilterOpen, setIsClientFilterOpen] = useState(false);

  // Popover ref for outside click handling
  const clientFilterRef = useRef<HTMLDivElement>(null);

  // Quick Add Row State
  const [quickTitle, setQuickTitle] = useState('');
  const [quickTarget, setQuickTarget] = useState(workspaceMode === 'team' ? 'Polarist' : '');
  const [quickColor, setQuickColor] = useState<VintageColorKey | undefined>(undefined);
  const [quickValue, setQuickValue] = useState('');
  const [quickDeadline, setQuickDeadline] = useState('');
  const [quickTaskType, setQuickTaskType] = useState<TaskType>('action');
  const [quickUserEmail, setQuickUserEmail] = useState<string>(currentUser?.email || 'enzothome1@gmail.com');
  const [isQuickAddExpanded, setIsQuickAddExpanded] = useState(false);

  // Sincronizar usuario por defecto si cambia currentUser
  useEffect(() => {
    if (currentUser?.email) {
      setQuickUserEmail(currentUser.email);
    }
  }, [currentUser]);

  // Setup pointer sensor with activation distance to avoid blocking clicks
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Close client filter popover on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        clientFilterRef.current &&
        !clientFilterRef.current.contains(event.target as Node)
      ) {
        setIsClientFilterOpen(false);
      }
    };

    if (isClientFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isClientFilterOpen]);

  // Unique client list with active task counts
  const clientList = useMemo(() => {
    const map = new Map<string, { name: string; color: VintageColorKey; count: number }>();

    // Register all configured clients
    clients.forEach((c) => {
      map.set(c.name.trim().toLowerCase(), {
        name: c.name.trim(),
        color: c.color,
        count: 0,
      });
    });

    // Register any targets present on items and count active actions
    items.forEach((item) => {
      const targetName = (item.target || 'General').trim();
      const key = targetName.toLowerCase();
      const existing = map.get(key);
      if (existing) {
        if (!item.completed) existing.count += 1;
      } else {
        map.set(key, {
          name: targetName,
          color: item.tagColor || 'emerald',
          count: item.completed ? 0 : 1,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
    );
  }, [clients, items]);

  // Filtering and Sorting
  const processedItems = useMemo(() => {
    // 1. Filtrar por cliente
    const result = selectedClientFilter
      ? items.filter(
          (item) =>
            (item.target || 'General').trim().toLowerCase() ===
            selectedClientFilter.trim().toLowerCase()
        )
      : [...items];

    // 2. Si el orden es manual, preservar orden tal cual
    if (sortKey === 'manual') {
      return result;
    }

    // 3. Ordenar según sortKey y sortDirection
    return result.sort((a, b) => {
      if (sortKey === 'value') {
        const valA = a.value || 0;
        const valB = b.value || 0;
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      if (sortKey === 'deadline') {
        // Items sin fecha límite al final en ambos sentidos
        if (!a.deadline && !b.deadline) return 0;
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        const timeA = new Date(a.deadline).getTime();
        const timeB = new Date(b.deadline).getTime();
        return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
      }

      if (sortKey === 'title') {
        const titleA = (a.title || '').trim().toLowerCase();
        const titleB = (b.title || '').trim().toLowerCase();
        const comp = titleA.localeCompare(titleB, 'es', { numeric: true, sensitivity: 'base' });
        return sortDirection === 'asc' ? comp : -comp;
      }

      if (sortKey === 'client') {
        const targetA = (a.target || '').trim().toLowerCase();
        const targetB = (b.target || '').trim().toLowerCase();
        const comp = targetA.localeCompare(targetB, 'es', { numeric: true, sensitivity: 'base' });
        return sortDirection === 'asc' ? comp : -comp;
      }

      return 0;
    });
  }, [items, selectedClientFilter, sortKey, sortDirection]);

  // Cycle Sort Handler for headers:
  // DINERO: desc -> asc -> manual
  // FECHA LÍMITE: asc -> desc -> manual
  // ACCIÓN: asc -> desc -> manual
  const handleCycleSort = (key: 'title' | 'value' | 'deadline') => {
    if (sortKey !== key) {
      if (key === 'value') {
        setSortKey('value');
        setSortDirection('desc');
      } else {
        setSortKey(key);
        setSortDirection('asc');
      }
    } else {
      if (key === 'value') {
        if (sortDirection === 'desc') {
          setSortDirection('asc');
        } else {
          setSortKey('manual');
        }
      } else {
        if (sortDirection === 'asc') {
          setSortDirection('desc');
        } else {
          setSortKey('manual');
        }
      }
    }
  };

  // Drag & drop reorder: switches to manual mode and updates order
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // Si había un orden activo, cambiar automáticamente a manual
    if (sortKey !== 'manual') {
      setSortKey('manual');
    }

    const oldProcessedIndex = processedItems.findIndex((i) => i.id === active.id);
    const newProcessedIndex = processedItems.findIndex((i) => i.id === over.id);

    if (oldProcessedIndex === -1 || newProcessedIndex === -1) return;

    if (selectedClientFilter === null) {
      const reordered = arrayMove(processedItems, oldProcessedIndex, newProcessedIndex);
      onReorder(reordered);
    } else {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(items, oldIndex, newIndex);
        onReorder(reordered);
      }
    }
  };

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    // Default to today or tomorrow if no date specified
    let d = quickDeadline;
    if (!d) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      d = tomorrow.toISOString().split('T')[0];
    }

    const val = parseFloat(quickValue.replace(/[^0-9.]/g, '')) || 0;

    const targetToUse =
      quickTarget.trim() ||
      (workspaceMode === 'team' ? 'Polarist' : selectedClientFilter || 'General');

    const clientMatch = clients.find(
      (c) => c.name.toLowerCase() === targetToUse.toLowerCase()
    );
    const assignedColor = quickColor || clientMatch?.color || (targetToUse.toLowerCase() === 'polarist' ? 'emerald' : undefined);

    onQuickAdd({
      title: quickTitle.trim(),
      target: targetToUse,
      tagColor: assignedColor,
      value: val,
      deadline: d,
      userEmail: workspaceMode === 'team' ? quickUserEmail : currentUser?.email || 'enzothome1@gmail.com',
      taskType: quickTaskType,
    });

    setQuickTitle('');
    if (workspaceMode !== 'team') {
      setQuickTarget('');
    }
    setQuickColor(undefined);
    setQuickValue('');
    setQuickDeadline('');
    setQuickTaskType('action');
    setIsQuickAddExpanded(false);
  };

  // Find color dot for the active client filter badge
  const activeClientInfo = useMemo(() => {
    if (!selectedClientFilter) return null;
    return clientList.find(
      (c) => c.name.toLowerCase() === selectedClientFilter.toLowerCase()
    );
  }, [selectedClientFilter, clientList]);

  const activeClientDot = activeClientInfo
    ? VINTAGE_COLORS[activeClientInfo.color]?.dot || '#059669'
    : '#059669';

  return (
    <div className="rounded-xl border border-white/70 bg-white/90 backdrop-blur-md overflow-visible shadow-xl shadow-zinc-900/5 relative">
      {/* 4 Columns Clean Header */}
      <div className="hidden md:flex items-center px-4 sm:px-6 py-3 bg-zinc-50/70 border-b border-zinc-200/70 gap-3 sm:gap-4 text-xs font-semibold tracking-wider text-zinc-500 select-none rounded-t-xl">
        {/* Drag handle spacer */}
        <div className="w-9 flex-shrink-0" />

        {/* 4 Main Columns */}
        <div className="flex-1 grid grid-cols-12 gap-3 sm:gap-6 items-center">
          {/* Col 1: Acción / Descripción (~38%) */}
          <div className="col-span-5 pl-7 sm:pl-8">
            <button
              type="button"
              onClick={() => handleCycleSort('title')}
              className="group flex items-center gap-1.5 hover:text-zinc-900 transition-colors cursor-pointer text-left focus:outline-none"
              title={
                sortKey === 'title'
                  ? sortDirection === 'asc'
                    ? 'Orden: A-Z (clic para Z-A)'
                    : 'Orden: Z-A (clic para orden manual)'
                  : 'Ordenar alfabéticamente (A-Z)'
              }
            >
              <span className={sortKey === 'title' ? 'text-zinc-900 font-bold' : ''}>
                ACCIÓN / DESCRIPCIÓN
              </span>
              {sortKey === 'title' ? (
                sortDirection === 'asc' ? (
                  <ArrowUp className="w-3.5 h-3.5 text-zinc-900 stroke-[2.5]" />
                ) : (
                  <ArrowDown className="w-3.5 h-3.5 text-zinc-900 stroke-[2.5]" />
                )
              ) : (
                <ArrowUpDown className="w-3 h-3 text-zinc-400 opacity-40 group-hover:opacity-100 transition-opacity" />
              )}
            </button>
          </div>

          {/* Col 2: Cliente (~25%) */}
          <div className="col-span-3 pl-2 sm:pl-3 relative" ref={clientFilterRef}>
            <button
              type="button"
              onClick={() => setIsClientFilterOpen((prev) => !prev)}
              className={`group flex items-center gap-1.5 transition-colors cursor-pointer focus:outline-none ${
                selectedClientFilter || isClientFilterOpen ? 'text-zinc-900' : 'hover:text-zinc-900'
              }`}
              title="Filtrar u ordenar por cliente"
            >
              <span className={selectedClientFilter || sortKey === 'client' ? 'text-zinc-900 font-bold' : ''}>
                CLIENTE
              </span>

              {selectedClientFilter ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-zinc-900 text-white shadow-xs ml-0.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: activeClientDot }}
                  />
                  <span className="max-w-[85px] truncate">{selectedClientFilter}</span>
                  <span
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedClientFilter(null);
                    }}
                    className="hover:text-zinc-300 p-0.5 rounded-full transition-colors ml-0.5"
                    title="Quitar filtro"
                  >
                    <X className="w-2.5 h-2.5" />
                  </span>
                </span>
              ) : (
                <Filter
                  className={`w-3 h-3 transition-colors ${
                    isClientFilterOpen
                      ? 'text-zinc-900'
                      : 'text-zinc-400 opacity-50 group-hover:opacity-100'
                  }`}
                />
              )}

              {sortKey === 'client' && !selectedClientFilter && (
                sortDirection === 'asc' ? (
                  <ArrowUp className="w-3.5 h-3.5 text-zinc-900 stroke-[2.5]" />
                ) : (
                  <ArrowDown className="w-3.5 h-3.5 text-zinc-900 stroke-[2.5]" />
                )
              )}
            </button>

            {/* Client Filter & Sort Popover */}
            {isClientFilterOpen && (
              <div className="absolute left-0 top-full mt-2 w-64 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-zinc-200 p-2.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                {/* Popover Header */}
                <div className="flex items-center justify-between px-2 py-1 mb-1 border-b border-zinc-100">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                    Filtrar por Cliente
                  </span>
                  {selectedClientFilter && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedClientFilter(null);
                        setIsClientFilterOpen(false);
                      }}
                      className="text-[11px] text-zinc-500 hover:text-zinc-900 hover:underline cursor-pointer"
                    >
                      Limpiar
                    </button>
                  )}
                </div>

                {/* Quick Sort Buttons: A-Z / Z-A */}
                <div className="px-1 py-1.5 grid grid-cols-2 gap-1.5 border-b border-zinc-100">
                  <button
                    type="button"
                    onClick={() => {
                      setSortKey('client');
                      setSortDirection('asc');
                      setIsClientFilterOpen(false);
                    }}
                    className={`flex items-center justify-center gap-1 px-2 py-1 text-xs rounded-md border transition-colors cursor-pointer ${
                      sortKey === 'client' && sortDirection === 'asc'
                        ? 'bg-zinc-900 text-white border-zinc-900 font-medium'
                        : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200'
                    }`}
                  >
                    <ArrowUp className="w-3 h-3" />
                    <span>Ordenar A-Z</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSortKey('client');
                      setSortDirection('desc');
                      setIsClientFilterOpen(false);
                    }}
                    className={`flex items-center justify-center gap-1 px-2 py-1 text-xs rounded-md border transition-colors cursor-pointer ${
                      sortKey === 'client' && sortDirection === 'desc'
                        ? 'bg-zinc-900 text-white border-zinc-900 font-medium'
                        : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200'
                    }`}
                  >
                    <ArrowDown className="w-3 h-3" />
                    <span>Ordenar Z-A</span>
                  </button>
                </div>

                {/* Client List */}
                <div className="mt-1.5 max-h-60 overflow-y-auto space-y-0.5">
                  {/* Option: Todos los clientes */}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedClientFilter(null);
                      setIsClientFilterOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors cursor-pointer ${
                      selectedClientFilter === null
                        ? 'bg-zinc-100 font-semibold text-zinc-900'
                        : 'hover:bg-zinc-50 text-zinc-700'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-zinc-400" />
                      <span>Todos los clientes</span>
                    </span>
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] text-zinc-400 font-mono">
                        ({items.length})
                      </span>
                      {selectedClientFilter === null && (
                        <Check className="w-3.5 h-3.5 text-zinc-800 ml-1" />
                      )}
                    </div>
                  </button>

                  {/* Individual Clients */}
                  {clientList.map((client) => {
                    const isSelected =
                      selectedClientFilter?.toLowerCase() === client.name.toLowerCase();
                    const dotColor = VINTAGE_COLORS[client.color]?.dot || '#059669';

                    return (
                      <button
                        key={client.name}
                        type="button"
                        onClick={() => {
                          setSelectedClientFilter(client.name);
                          setIsClientFilterOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-zinc-100 font-semibold text-zinc-900'
                            : 'hover:bg-zinc-50 text-zinc-700'
                        }`}
                      >
                        <span className="flex items-center gap-2 min-w-0">
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: dotColor }}
                          />
                          <span className="truncate">{client.name}</span>
                        </span>
                        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                          <span className="text-[11px] text-zinc-400 font-mono">
                            ({client.count})
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-zinc-800 ml-1" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Col 3: Dinero (USD) (~16%) */}
          <div className="col-span-2 pl-1 sm:pl-2">
            <button
              type="button"
              onClick={() => handleCycleSort('value')}
              className="group flex items-center gap-1.5 hover:text-zinc-900 transition-colors cursor-pointer text-left focus:outline-none"
              title={
                sortKey === 'value'
                  ? sortDirection === 'desc'
                    ? 'Orden: Mayor a menor (clic para menor a mayor)'
                    : 'Orden: Menor a mayor (clic para orden manual)'
                  : 'Ordenar por monto (mayor a menor)'
              }
            >
              <span className={sortKey === 'value' ? 'text-zinc-900 font-bold' : ''}>
                DINERO (USD)
              </span>
              {sortKey === 'value' ? (
                sortDirection === 'desc' ? (
                  <ArrowDown className="w-3.5 h-3.5 text-emerald-700 stroke-[2.5]" />
                ) : (
                  <ArrowUp className="w-3.5 h-3.5 text-emerald-700 stroke-[2.5]" />
                )
              ) : (
                <ArrowUpDown className="w-3 h-3 text-zinc-400 opacity-40 group-hover:opacity-100 transition-opacity" />
              )}
            </button>
          </div>

          {/* Col 4: Fecha Límite (~21%) */}
          <div className="col-span-2 pl-1 sm:pl-2">
            <button
              type="button"
              onClick={() => handleCycleSort('deadline')}
              className="group flex items-center gap-1.5 hover:text-zinc-900 transition-colors cursor-pointer text-left focus:outline-none"
              title={
                sortKey === 'deadline'
                  ? sortDirection === 'asc'
                    ? 'Orden: Próximas primero (clic para más lejanas)'
                    : 'Orden: Más lejanas primero (clic para orden manual)'
                  : 'Ordenar por fecha límite (próximas primero)'
              }
            >
              <span className={sortKey === 'deadline' ? 'text-zinc-900 font-bold' : ''}>
                FECHA LÍMITE
              </span>
              {sortKey === 'deadline' ? (
                sortDirection === 'asc' ? (
                  <ArrowUp className="w-3.5 h-3.5 text-zinc-900 stroke-[2.5]" />
                ) : (
                  <ArrowDown className="w-3.5 h-3.5 text-zinc-900 stroke-[2.5]" />
                )
              ) : (
                <ArrowUpDown className="w-3 h-3 text-zinc-400 opacity-40 group-hover:opacity-100 transition-opacity" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Toolbar for Filter & Sort */}
      <div className="flex md:hidden items-center justify-between px-4 py-2 bg-zinc-50/80 border-b border-zinc-200/70 text-xs">
        <span className="font-semibold text-zinc-500 text-[11px] tracking-wider uppercase">
          {processedItems.length} {processedItems.length === 1 ? 'Acción' : 'Acciones'}
        </span>
        <div className="flex items-center gap-2">
          {/* Mobile Client filter trigger */}
          <button
            type="button"
            onClick={() => setIsClientFilterOpen((prev) => !prev)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs border transition-colors ${
              selectedClientFilter
                ? 'bg-zinc-900 text-white border-zinc-900 font-medium'
                : 'bg-white text-zinc-600 border-zinc-200'
            }`}
          >
            <Filter className="w-3 h-3" />
            <span className="max-w-[90px] truncate">{selectedClientFilter || 'Clientes'}</span>
          </button>

          {/* Mobile Sort Cycle: Value -> Deadline -> Title -> Manual */}
          <button
            type="button"
            onClick={() => {
              if (sortKey === 'manual') {
                setSortKey('value');
                setSortDirection('desc');
              } else if (sortKey === 'value') {
                setSortKey('deadline');
                setSortDirection('asc');
              } else if (sortKey === 'deadline') {
                setSortKey('title');
                setSortDirection('asc');
              } else {
                setSortKey('manual');
              }
            }}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs border transition-colors ${
              sortKey !== 'manual'
                ? 'bg-zinc-900 text-white border-zinc-900 font-medium'
                : 'bg-white text-zinc-600 border-zinc-200'
            }`}
          >
            <ArrowUpDown className="w-3 h-3" />
            <span>
              {sortKey === 'value'
                ? 'Dinero'
                : sortKey === 'deadline'
                ? 'Fecha'
                : sortKey === 'title'
                ? 'A-Z'
                : 'Orden'}
            </span>
          </button>
        </div>
      </div>

      {/* Active Filter & Sort Indicator Bar */}
      {(sortKey !== 'manual' || selectedClientFilter !== null) && (
        <div className="flex flex-wrap items-center justify-between px-4 sm:px-6 py-2 bg-amber-50/70 border-b border-amber-200/60 text-xs text-zinc-700 gap-2">
          <div className="flex items-center flex-wrap gap-2">
            <span className="text-[10px] font-bold tracking-wide uppercase text-amber-900/80">
              Filtro activo:
            </span>

            {selectedClientFilter && (
              <span className="inline-flex items-center gap-1.5 bg-white border border-amber-200/90 px-2 py-0.5 rounded-full text-xs shadow-xs font-medium text-zinc-800">
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: activeClientDot }}
                />
                <span className="text-zinc-400 text-[10px] uppercase font-semibold">Cliente:</span>
                <span>{selectedClientFilter}</span>
                <button
                  type="button"
                  onClick={() => setSelectedClientFilter(null)}
                  className="text-zinc-400 hover:text-zinc-800 p-0.5 rounded-full transition-colors"
                  title="Quitar filtro de cliente"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {sortKey !== 'manual' && (
              <span className="inline-flex items-center gap-1.5 bg-white border border-amber-200/90 px-2 py-0.5 rounded-full text-xs shadow-xs font-medium text-zinc-800">
                <span className="text-zinc-400 text-[10px] uppercase font-semibold">Orden:</span>
                <span>
                  {sortKey === 'value' &&
                    (sortDirection === 'desc' ? 'Dinero (Mayor a menor)' : 'Dinero (Menor a mayor)')}
                  {sortKey === 'deadline' &&
                    (sortDirection === 'asc' ? 'Fecha (Más próximas)' : 'Fecha (Más lejanas)')}
                  {sortKey === 'title' &&
                    (sortDirection === 'asc' ? 'Acción (A-Z)' : 'Acción (Z-A)')}
                  {sortKey === 'client' &&
                    (sortDirection === 'asc' ? 'Cliente (A-Z)' : 'Cliente (Z-A)')}
                </span>
                <button
                  type="button"
                  onClick={() => setSortKey('manual')}
                  className="text-zinc-400 hover:text-zinc-800 p-0.5 rounded-full transition-colors"
                  title="Restablecer a orden manual"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <span className="text-zinc-500 text-[11px]">
              • {processedItems.length} {processedItems.length === 1 ? 'acción visible' : 'acciones visibles'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              setSortKey('manual');
              setSelectedClientFilter(null);
            }}
            className="inline-flex items-center gap-1 text-xs text-amber-950 hover:text-zinc-900 font-medium hover:underline transition-colors ml-auto cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            Restablecer orden
          </button>
        </div>
      )}

      {/* Fast Inline Add Row */}
      <form
        onSubmit={handleQuickSubmit}
        className="flex items-center px-4 sm:px-6 py-3.5 bg-white/60 border-b border-zinc-200/70 gap-3 sm:gap-4 text-xs sm:text-sm rounded-t-xl md:rounded-t-none"
      >
        <div className="w-9 flex-shrink-0 flex items-center justify-center text-zinc-400">
          <Plus className="w-4 h-4" />
        </div>

        <div className="flex-1 grid grid-cols-12 gap-3 sm:gap-6 items-center">
          {/* Title Input + Task Type Toggle + Member Picker */}
          <div className="col-span-12 md:col-span-5 flex items-center gap-2">
            {/* Toggle Tipo: Acción vs Meeting */}
            <div className="flex items-center p-0.5 bg-zinc-100 rounded-md border border-zinc-200/70 text-[10px] flex-shrink-0">
              <button
                type="button"
                onClick={() => setQuickTaskType('action')}
                className={`px-1.5 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                  quickTaskType === 'action'
                    ? 'bg-white text-zinc-900 shadow-2xs font-semibold'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Acción
              </button>
              <button
                type="button"
                onClick={() => setQuickTaskType('meeting')}
                className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                  quickTaskType === 'meeting'
                    ? 'bg-purple-100 text-purple-900 shadow-2xs font-semibold'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                <Video className="w-2.5 h-2.5" />
                <span>Meeting</span>
              </button>
            </div>

            {/* En modo Team, selector de responsable para la nueva tarea */}
            {workspaceMode === 'team' && (
              <div className="flex items-center gap-1 flex-shrink-0">
                {APP_USERS.map((user) => {
                  const isSelected = quickUserEmail.toLowerCase() === user.email.toLowerCase();
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => setQuickUserEmail(user.email)}
                      title={`Asignar a ${user.name}`}
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'ring-2 ring-zinc-900 ring-offset-1 scale-105 shadow-xs text-white'
                          : 'opacity-50 hover:opacity-100 text-white'
                      }`}
                      style={{ backgroundColor: user.avatarColor }}
                    >
                      {user.initials}
                    </button>
                  );
                })}
              </div>
            )}

            <input
              type="text"
              value={quickTitle}
              onChange={(e) => {
                setQuickTitle(e.target.value);
                if (!isQuickAddExpanded && e.target.value) {
                  setIsQuickAddExpanded(true);
                }
              }}
              placeholder={
                workspaceMode === 'team'
                  ? '+ Nueva tarea de equipo para Polarist...'
                  : selectedClientFilter
                  ? `+ Escribir nueva acción para ${selectedClientFilter}...`
                  : '+ Escribir nueva acción y presionar Enter...'
              }
              className="flex-1 min-w-0 bg-transparent text-zinc-900 placeholder:text-zinc-400 text-xs sm:text-sm px-2 py-1.5 rounded border border-transparent focus:border-zinc-300 focus:bg-zinc-50 focus:outline-none"
            />
          </div>

          {/* Target Input with ClientAutocomplete */}
          <div className={`col-span-6 md:col-span-3 ${isQuickAddExpanded || quickTitle ? 'block' : 'hidden md:block'}`}>
            <ClientAutocomplete
              value={quickTarget || (isQuickAddExpanded ? '' : (workspaceMode === 'team' ? 'Polarist' : selectedClientFilter || ''))}
              onChange={(val) => {
                setQuickTarget(val);
                const match = clients.find(
                  (c) => c.name.toLowerCase() === val.trim().toLowerCase()
                );
                if (match) {
                  setQuickColor(match.color);
                }
              }}
              onSelectClient={(client) => {
                setQuickTarget(client.name);
                setQuickColor(client.color);
              }}
              clients={clients}
              placeholder={workspaceMode === 'team' ? 'Polarist' : (selectedClientFilter || 'Cliente...')}
            />
          </div>

          {/* Value Input */}
          <div className={`col-span-3 md:col-span-2 ${isQuickAddExpanded || quickTitle ? 'block' : 'hidden md:block'}`}>
            <input
              type="text"
              value={quickValue}
              onChange={(e) => setQuickValue(e.target.value)}
              placeholder="$ Monto USD"
              className="w-full bg-transparent text-emerald-700 font-mono text-xs sm:text-sm px-2.5 py-1.5 rounded border border-transparent focus:border-zinc-300 focus:bg-zinc-50 focus:outline-none font-medium"
            />
          </div>

          {/* Deadline + Submit */}
          <div className={`col-span-3 md:col-span-2 flex items-center gap-2 ${isQuickAddExpanded || quickTitle ? 'block' : 'hidden md:flex'}`}>
            <input
              type="date"
              value={quickDeadline}
              onChange={(e) => setQuickDeadline(e.target.value)}
              className="w-full bg-transparent text-zinc-700 font-mono text-xs sm:text-sm px-2 py-1.5 rounded border border-transparent focus:border-zinc-300 focus:bg-zinc-50 focus:outline-none"
            />
            {quickTitle.trim() && (
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-medium text-xs flex-shrink-0 transition-all shadow-sm cursor-pointer"
              >
                Agregar
              </button>
            )}
          </div>
        </div>
      </form>

      {/* Rows Container */}
      {processedItems.length === 0 ? (
        <div className="rounded-b-xl">
          {items.length === 0 ? (
            <EmptyState onOpenCreateModal={onOpenCreateModal} />
          ) : (
            <div className="py-12 px-4 text-center space-y-3">
              <p className="text-xs text-zinc-500">
                No hay acciones activas para el cliente{' '}
                <span className="font-semibold text-zinc-800">"{selectedClientFilter}"</span>.
              </p>
              <button
                type="button"
                onClick={() => setSelectedClientFilter(null)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-medium transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Mostrar todos los clientes
              </button>
            </div>
          )}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={processedItems.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="rounded-b-xl">
              {processedItems.map((item, idx) => {
                const openUpwards = processedItems.length > 2 && idx >= processedItems.length - 2;
                return (
                  <BoardRow
                    key={item.id}
                    item={item}
                    clients={clients}
                    workspaceMode={workspaceMode}
                    openUpwards={openUpwards}
                    onToggleComplete={onToggleComplete}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onUpdateColor={onUpdateColor}
                    onUpdateValue={onUpdateValue}
                    onUpdateTarget={onUpdateTarget}
                    onUpdateTargetAndColor={onUpdateTargetAndColor}
                    onUpdateDeadline={onUpdateDeadline}
                    onToggleExpand={onToggleExpand}
                    onToggleSubtask={onToggleSubtask}
                    onAddSubtask={onAddSubtask}
                    onDeleteSubtask={onDeleteSubtask}
                    onUpdateNotes={onUpdateNotes}
                    onNavigateToClients={onNavigateToClients}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
};
