import React from 'react';
import { Plus } from 'lucide-react';

interface EmptyStateProps {
  onOpenCreateModal: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onOpenCreateModal }) => {
  return (
    <div className="py-16 px-4 text-center select-none flex flex-col items-center justify-center">
      <div className="w-10 h-10 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center mb-3 text-zinc-400">
        <Plus className="w-5 h-5" />
      </div>

      <h3 className="text-sm font-semibold text-zinc-800 mb-1">
        No hay acciones pendientes
      </h3>

      <p className="text-xs text-zinc-500 max-w-xs mb-4">
        Creá una nueva acción para comenzar a planificar tus prioridades.
      </p>

      <button
        type="button"
        onClick={onOpenCreateModal}
        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition-colors shadow-sm"
      >
        <Plus className="w-3.5 h-3.5" />
        Nueva Acción
      </button>
    </div>
  );
};
