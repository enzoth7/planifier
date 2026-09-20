import React, { useMemo, useState } from 'react';
import {
  CalendarRange,
  Check,
  CheckCircle2,
  Circle,
  CircleDollarSign,
  Flag,
  Plus,
  Target,
  TrendingUp,
} from 'lucide-react';
import { ActionItem, ObjectiveItem } from '../types';

interface ObjectivesViewProps {
  objectives: ObjectiveItem[];
  activeActions: ActionItem[];
  completedActions: ActionItem[];
  onUpdateObjective: (objective: ObjectiveItem) => void;
  onSelectedObjectiveChange?: (objective: ObjectiveItem) => void;
}

const formatMoney = (value: number) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(value);

export const ObjectivesView: React.FC<ObjectivesViewProps> = ({
  objectives,
  activeActions,
  completedActions,
  onUpdateObjective,
  onSelectedObjectiveChange,
}) => {
  const initialMonth = useMemo(() => {
    const current = new Date().toISOString().slice(0, 7);
    return objectives.some((objective) => objective.month === current)
      ? current
      : objectives[0]?.month || '';
  }, [objectives]);
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [newMilestone, setNewMilestone] = useState('');

  const selected =
    objectives.find((objective) => objective.month === selectedMonth) || objectives[0];

  const monthMetrics = useMemo(() => {
    if (!selected) return { active: 0, completed: 0, completedValue: 0 };
    const belongsToMonth = (item: ActionItem) =>
      item.deadline?.slice(0, 7) === selected.month ||
      item.completedAt?.slice(0, 7) === selected.month;
    const monthActive = activeActions.filter(belongsToMonth);
    const monthCompleted = completedActions.filter(belongsToMonth);
    return {
      active: monthActive.length,
      completed: monthCompleted.length,
      completedValue: monthCompleted.reduce((sum, item) => sum + (item.value || 0), 0),
    };
  }, [activeActions, completedActions, selected]);

  if (!selected) {
    return (
      <section className="rounded-xl border border-white/70 bg-white/90 p-10 text-center shadow-sm">
        <Target className="mx-auto mb-3 h-6 w-6 text-zinc-400" />
        <p className="text-sm font-semibold text-zinc-800">No hay objetivos cargados</p>
        <p className="mt-1 text-xs text-zinc-500">La planificación mensual aparecerá aquí.</p>
      </section>
    );
  }

  const completedMilestones = selected.milestones.filter((milestone) => milestone.done).length;
  const milestoneProgress = selected.milestones.length
    ? Math.round((completedMilestones / selected.milestones.length) * 100)
    : 0;
  const revenueProgress = selected.revenueTarget
    ? Math.min(100, Math.round((monthMetrics.completedValue / selected.revenueTarget) * 100))
    : 0;

  const updateSelected = (updated: ObjectiveItem) => {
    onUpdateObjective(updated);
    onSelectedObjectiveChange?.(updated);
  };

  const toggleMilestone = (id: string) => {
    updateSelected({
      ...selected,
      milestones: selected.milestones.map((milestone) =>
        milestone.id === id ? { ...milestone, done: !milestone.done } : milestone
      ),
    });
  };

  const addMilestone = (event: React.FormEvent) => {
    event.preventDefault();
    const text = newMilestone.trim();
    if (!text) return;
    updateSelected({
      ...selected,
      milestones: [
        ...selected.milestones,
        { id: `goal-${Date.now()}`, text, done: false },
      ],
    });
    setNewMilestone('');
  };

  const selectMonth = (month: string) => {
    setSelectedMonth(month);
    const objective = objectives.find((item) => item.month === month);
    if (objective) onSelectedObjectiveChange?.(objective);
  };

  return (
    <section className="overflow-hidden rounded-xl border border-white/70 bg-white/95 shadow-sm backdrop-blur-md">
      <div className="border-b border-zinc-100 px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700">
              <Target className="h-3.5 w-3.5" />
              Objetivos Polarist 2026
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-zinc-950">Qué queremos lograr este mes</h2>
            <p className="mt-1 max-w-2xl text-sm text-zinc-500">
              Una vista simple para conectar las acciones del equipo con los resultados mensuales.
            </p>
          </div>

          <nav aria-label="Mes del objetivo" className="flex max-w-full gap-1 overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-100/80 p-1">
            {objectives.map((objective) => {
              const isActive = objective.month === selected.month;
              return (
                <button
                  key={objective.id}
                  type="button"
                  onClick={() => selectMonth(objective.month)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`min-h-10 shrink-0 rounded-md px-3 text-xs font-medium capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 ${
                    isActive
                      ? 'bg-white text-zinc-950 shadow-xs'
                      : 'text-zinc-500 hover:bg-white/60 hover:text-zinc-800'
                  }`}
                >
                  {objective.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-12">
        <div className="rounded-xl border border-zinc-200 bg-zinc-950 p-5 text-white lg:col-span-7">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-200">
                <Flag className="h-3 w-3 text-emerald-400" />
                Foco mensual
              </div>
              <h3 className="max-w-2xl text-xl font-semibold leading-snug tracking-tight sm:text-2xl">
                {selected.monthlyGoal}
              </h3>
            </div>
            <span className="font-mono text-xs text-zinc-400">{selected.month}</span>
          </div>

          <div className="mt-8">
            <div className="mb-2 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs text-zinc-400">Facturación completada</p>
                <p className="mt-1 font-mono text-xl font-semibold">
                  ${formatMoney(monthMetrics.completedValue)}
                  <span className="ml-1 text-sm font-normal text-zinc-400">
                    / ${formatMoney(selected.revenueTarget)} USD
                  </span>
                </p>
              </div>
              <span className="font-mono text-sm font-semibold text-emerald-400">{revenueProgress}%</span>
            </div>
            <div
              role="progressbar"
              aria-label={`Facturación de ${selected.label}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={revenueProgress}
              className="h-2 overflow-hidden rounded-full bg-white/10"
            >
              <div
                className="h-full rounded-full bg-emerald-400 transition-[width] duration-300"
                style={{ width: `${revenueProgress}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1">
          <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/80 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800">
              <TrendingUp className="h-4 w-4" />
              Objetivo trimestral
            </div>
            <p className="mt-3 text-sm font-medium leading-relaxed text-emerald-950">
              {selected.quarterlyGoal || 'Definir el objetivo del trimestre.'}
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-700">
              <CalendarRange className="h-4 w-4 text-blue-600" />
              Movimiento del mes
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <p className="font-mono text-xl font-semibold text-zinc-950">{monthMetrics.active}</p>
                <p className="text-xs text-zinc-500">acciones activas</p>
              </div>
              <div>
                <p className="font-mono text-xl font-semibold text-emerald-700">{monthMetrics.completed}</p>
                <p className="text-xs text-zinc-500">completadas</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white lg:col-span-8">
          <div className="flex flex-col gap-3 border-b border-zinc-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-semibold text-zinc-900">Resultados clave del mes</h3>
              </div>
              <p className="mt-1 text-xs text-zinc-500">Marcá lo que el equipo ya consiguió.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-semibold text-zinc-700">
                {completedMilestones}/{selected.milestones.length}
              </span>
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-zinc-100">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${milestoneProgress}%` }} />
              </div>
              <span className="font-mono text-xs text-zinc-500">{milestoneProgress}%</span>
            </div>
          </div>

          <div className="divide-y divide-zinc-100">
            {selected.milestones.map((milestone) => (
              <button
                key={milestone.id}
                type="button"
                onClick={() => toggleMilestone(milestone.id)}
                className="group flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-600 sm:px-5"
              >
                {milestone.done ? (
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                    <Check className="h-3.5 w-3.5 stroke-[3]" />
                  </span>
                ) : (
                  <Circle className="h-6 w-6 shrink-0 text-zinc-300 transition-colors group-hover:text-emerald-500" />
                )}
                <span className={`text-sm ${milestone.done ? 'text-zinc-400 line-through' : 'font-medium text-zinc-800'}`}>
                  {milestone.text}
                </span>
              </button>
            ))}
          </div>

          <form onSubmit={addMilestone} className="flex gap-2 border-t border-zinc-100 bg-zinc-50/60 p-3 sm:p-4">
            <label htmlFor="new-milestone" className="sr-only">Nuevo resultado clave</label>
            <input
              id="new-milestone"
              value={newMilestone}
              onChange={(event) => setNewMilestone(event.target.value)}
              placeholder="Agregar un resultado clave…"
              className="min-h-11 min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
            <button
              type="submit"
              disabled={!newMilestone.trim()}
              className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg bg-zinc-900 px-3.5 text-xs font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Agregar</span>
            </button>
          </form>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-5 lg:col-span-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            <CircleDollarSign className="h-4 w-4 text-amber-600" />
            Lectura rápida
          </div>
          <p className="mt-4 text-3xl font-semibold tracking-tight text-zinc-950">{milestoneProgress}%</p>
          <p className="mt-1 text-sm text-zinc-600">de los resultados clave cumplidos.</p>
          <div className="my-5 h-px bg-zinc-200" />
          <p className="text-xs leading-relaxed text-zinc-500">
            La facturación avanza al completar acciones con monto. Los resultados clave se actualizan manualmente para que el equipo confirme el resultado real, no solo la tarea.
          </p>
        </div>
      </div>
    </section>
  );
};
