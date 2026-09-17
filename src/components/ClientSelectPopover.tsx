import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ClientItem, VintageColorKey, VINTAGE_COLORS } from '../types';
import { CountryFlag } from './CountryFlag';
import { soundFx } from '../utils/sound';
import { Search, Check, ChevronDown, Plus, Users, X } from 'lucide-react';

export interface ClientSelectPopoverProps {
  target: string;
  currentColor: VintageColorKey;
  clients?: ClientItem[];
  openUpwards?: boolean;
  align?: 'left' | 'right';
  onSelectClient: (clientName: string, color: VintageColorKey) => void;
  onUpdateColor?: (color: VintageColorKey) => void;
  onNavigateToClients?: () => void;
}

export const ClientSelectPopover: React.FC<ClientSelectPopoverProps> = ({
  target,
  currentColor,
  clients = [],
  openUpwards = false,
  align = 'left',
  onSelectClient,
  onUpdateColor,
  onNavigateToClients,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input when popover opens
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      // Small timeout to ensure DOM is ready
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Filter clients by search query
  const filteredClients = useMemo(() => {
    const trimmed = search.trim().toLowerCase();
    if (!trimmed) return clients;
    return clients.filter((c) => c.name.toLowerCase().includes(trimmed));
  }, [clients, search]);

  // Check if "General" option matches search
  const showGeneral = useMemo(() => {
    const trimmed = search.trim().toLowerCase();
    if (!trimmed) return true;
    return 'general'.includes(trimmed);
  }, [search]);

  // Check if search has custom text not matching any registered client or "general"
  const isCustomNew = useMemo(() => {
    const trimmed = search.trim();
    if (!trimmed) return false;
    const lower = trimmed.toLowerCase();
    if (lower === 'general') return false;
    return !clients.some((c) => c.name.toLowerCase() === lower);
  }, [clients, search]);

  // Color definition for the current badge
  const colorDef = VINTAGE_COLORS[currentColor] || VINTAGE_COLORS.emerald;

  // Matched client for current target (to show flag on the badge if available)
  const currentClient = useMemo(() => {
    if (!target) return null;
    return clients.find((c) => c.name.toLowerCase() === target.trim().toLowerCase()) || null;
  }, [clients, target]);

  const handleSelect = (clientName: string, color: VintageColorKey) => {
    soundFx.playTock();
    onSelectClient(clientName, color);
    setIsOpen(false);
  };

  const handleSelectColorOnly = (color: VintageColorKey) => {
    soundFx.playTock();
    if (onUpdateColor) {
      onUpdateColor(color);
    } else {
      onSelectClient(target || 'General', color);
    }
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      // If custom new name is typed and user hits Enter
      if (isCustomNew) {
        handleSelect(search.trim(), currentColor);
      } else if (filteredClients.length > 0) {
        handleSelect(filteredClients[0].name, filteredClients[0].color);
      } else if (showGeneral) {
        handleSelect('General', 'emerald');
      }
    }
  };

  return (
    <div className={`relative inline-block text-left ${isOpen ? 'z-30' : ''}`} ref={containerRef}>
      {/* Pastilla del cliente (Trigger) */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Click para cambiar cliente"
        className={`group/badge inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all duration-150 hover:opacity-90 focus:outline-none cursor-pointer shadow-2xs ${colorDef.bg} ${colorDef.border} ${colorDef.text}`}
      >
        {currentClient && currentClient.country && (
          <CountryFlag country={currentClient.country} className="w-3.5 h-2.5" />
        )}
        <span className="truncate max-w-[140px] sm:max-w-[220px]">
          {target || 'General'}
        </span>
        <ChevronDown
          className={`w-3 h-3 opacity-50 group-hover/badge:opacity-100 transition-transform duration-150 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Menú Desplegable Popover */}
      {isOpen && (
        <div
          className={`absolute z-50 w-72 rounded-xl bg-white border border-zinc-200/90 shadow-2xl p-1.5 text-xs ${
            openUpwards ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          } ${align === 'right' ? 'right-0' : 'left-0'}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Cabecera / Buscador */}
          <div className="relative flex items-center px-2 py-1 mb-1 border-b border-zinc-100">
            <Search className="w-3.5 h-3.5 text-zinc-400 mr-1.5 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar o escribir cliente..."
              className="w-full bg-transparent text-zinc-800 placeholder:text-zinc-400 text-xs py-0.5 focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="p-0.5 text-zinc-400 hover:text-zinc-600 rounded transition-colors"
                title="Limpiar búsqueda"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Lista scrolleable de Clientes */}
          <div className="max-h-56 overflow-y-auto space-y-0.5 pr-0.5">
            {/* Opción General */}
            {showGeneral && (
              <button
                type="button"
                onClick={() => handleSelect('General', 'emerald')}
                className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                  (!target || target.toLowerCase() === 'general')
                    ? 'bg-zinc-100 font-semibold text-zinc-900'
                    : 'text-zinc-700 hover:bg-zinc-50'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: VINTAGE_COLORS.emerald.dot }}
                  />
                  <span className="truncate text-xs">General</span>
                </div>
                {(!target || target.toLowerCase() === 'general') && (
                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5] flex-shrink-0" />
                )}
              </button>
            )}

            {/* Clientes Registrados con Polarist destacado */}
            {filteredClients
              .slice()
              .sort((a, b) => {
                const isAPolarist = a.name.trim().toLowerCase() === 'polarist';
                const isBPolarist = b.name.trim().toLowerCase() === 'polarist';
                if (isAPolarist) return -1;
                if (isBPolarist) return 1;
                return 0;
              })
              .map((client) => {
                const cDef = VINTAGE_COLORS[client.color] || VINTAGE_COLORS.emerald;
                const isSelected = target?.trim().toLowerCase() === client.name.trim().toLowerCase();
                const isPolarist = client.name.trim().toLowerCase() === 'polarist';

                return (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => handleSelect(client.name, client.color)}
                    className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-zinc-100 font-semibold text-zinc-900'
                        : isPolarist
                        ? 'bg-emerald-50/50 hover:bg-emerald-100/60 text-emerald-950 font-medium border border-emerald-200/50 my-0.5'
                        : 'text-zinc-700 hover:bg-zinc-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-xs"
                        style={{ backgroundColor: cDef.dot }}
                      />
                      <CountryFlag country={client.country} />
                      <span className="truncate text-xs">{client.name}</span>
                      {isPolarist && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-600 text-white uppercase tracking-wider ml-1">
                          Equipo
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5] flex-shrink-0" />
                    )}
                  </button>
                );
              })}

            {/* Opción para usar nombre personalizado si se escribió algo que no existe */}
            {isCustomNew && (
              <button
                type="button"
                onClick={() => handleSelect(search.trim(), currentColor)}
                className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors bg-amber-50/60 hover:bg-amber-100/60 text-amber-900 border border-amber-200/60 mt-1 cursor-pointer"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Plus className="w-3.5 h-3.5 text-amber-700 flex-shrink-0" />
                  <span className="truncate text-xs font-medium">
                    Usar &ldquo;{search.trim()}&rdquo;
                  </span>
                </div>
                <span className="text-[10px] text-amber-700 font-normal uppercase tracking-wide flex-shrink-0">
                  Libre
                </span>
              </button>
            )}

            {/* Si no hay coincidencias y no es custom válido */}
            {filteredClients.length === 0 && !showGeneral && !isCustomNew && (
              <div className="py-3 px-2 text-center text-zinc-400 text-xs">
                No se encontraron clientes
              </div>
            )}

            {/* Si no hay ningún cliente registrado en el sistema */}
            {clients.length === 0 && (
              <div className="p-3 text-center text-xs text-zinc-500 space-y-2">
                <p>No hay clientes registrados en el sistema.</p>
                {onNavigateToClients && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onNavigateToClients();
                    }}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-colors cursor-pointer"
                  >
                    <Users className="w-3.5 h-3.5" />
                    Ir a pestaña Clientes
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Selector rápido de color al pie (para ajustar el color de la pastilla individualmente si se desea) */}
          <div className="mt-1.5 pt-1.5 border-t border-zinc-100">
            <div className="flex items-center justify-between px-2 pb-1 text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
              <span>Color de pastilla</span>
              <span className="font-normal lowercase text-zinc-400">
                {colorDef.label}
              </span>
            </div>
            <div className="flex items-center justify-between px-1.5 py-0.5 gap-1">
              {(Object.keys(VINTAGE_COLORS) as VintageColorKey[]).map((key) => {
                const c = VINTAGE_COLORS[key];
                const isSelected = key === currentColor;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSelectColorOnly(key)}
                    title={c.label}
                    className={`w-4 h-4 rounded-full flex items-center justify-center transition-transform hover:scale-125 cursor-pointer ${
                      isSelected ? 'ring-2 ring-zinc-800 ring-offset-1 scale-110' : 'opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c.dot }}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
