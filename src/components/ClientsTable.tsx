import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Trash2,
  Edit2,
  Check,
  ChevronDown,
  Lock,
} from 'lucide-react';
import { ClientItem, ClientType, VintageColorKey, VINTAGE_COLORS, ActionItem } from '../types';
import { soundFx } from '../utils/sound';
import { COUNTRIES, DEFAULT_COUNTRY } from '../utils/countries';
import { CountryFlag } from './CountryFlag';
import { isPolaristTeamClient } from '../utils/clients';

interface ClientsTableProps {
  clients: ClientItem[];
  actions?: ActionItem[];
  onAddClient: (client: { name: string; type: ClientType; color: VintageColorKey; country?: string }) => void;
  onUpdateClient: (client: ClientItem) => void;
  onDeleteClient: (id: string) => void;
  onOpenCreateModal?: () => void;
}

export const ClientsTable: React.FC<ClientsTableProps> = ({
  clients,
  onAddClient,
  onUpdateClient,
  onDeleteClient,
  onOpenCreateModal,
}) => {
  // Quick Add Row State
  const [quickName, setQuickName] = useState('');
  const [quickColor, setQuickColor] = useState<VintageColorKey>('emerald');
  const [quickCountry, setQuickCountry] = useState<string>(DEFAULT_COUNTRY);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [isCountryPickerOpen, setIsCountryPickerOpen] = useState(false);

  // Inline editing state for client names
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // Color & Country popover state for table rows
  const [activeColorPopoverId, setActiveColorPopoverId] = useState<string | null>(null);
  const [activeCountryPopoverId, setActiveCountryPopoverId] = useState<string | null>(null);

  // Close open popovers when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        !target.closest('.country-popover-container') &&
        !target.closest('.color-popover-container') &&
        !target.closest('.country-picker-dropdown') &&
        !target.closest('.color-picker-dropdown')
      ) {
        setActiveCountryPopoverId(null);
        setActiveColorPopoverId(null);
        setIsCountryPickerOpen(false);
        setIsColorPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickName.trim()) return;

    soundFx.playChalkComplete();
    onAddClient({
      name: quickName.trim(),
      type: 'cliente',
      color: quickColor,
      country: quickCountry,
    });

    setQuickName('');
    setQuickColor('emerald');
    setQuickCountry(DEFAULT_COUNTRY);
    setIsColorPickerOpen(false);
    setIsCountryPickerOpen(false);
  };

  const handleStartEditing = (client: ClientItem) => {
    setEditingId(client.id);
    setEditingName(client.name);
  };

  const handleSaveName = (client: ClientItem) => {
    if (editingName.trim() && editingName.trim() !== client.name) {
      onUpdateClient({
        ...client,
        name: editingName.trim(),
      });
    }
    setEditingId(null);
  };

  const handleSelectColor = (client: ClientItem, color: VintageColorKey) => {
    soundFx.playTock();
    onUpdateClient({
      ...client,
      color,
    });
    setActiveColorPopoverId(null);
  };

  const handleSelectCountry = (client: ClientItem, country: string) => {
    soundFx.playTock();
    onUpdateClient({
      ...client,
      country,
    });
    setActiveCountryPopoverId(null);
  };

  const quickColorDef = VINTAGE_COLORS[quickColor] || VINTAGE_COLORS.emerald;

  return (
    <div className="rounded-xl border border-white/70 bg-white/90 backdrop-blur-md overflow-visible shadow-xl shadow-zinc-900/5 relative">
      {/* Table Header: CLIENTE | PAÍS | COLOR ASIGNADO | ACCIONES */}
      <div className="hidden md:flex items-center px-4 sm:px-6 py-3 bg-zinc-50/70 border-b border-zinc-200/70 gap-3 sm:gap-4 text-xs font-semibold tracking-wider text-zinc-500 select-none rounded-t-xl">
        {/* Spacer */}
        <div className="w-8 flex-shrink-0" />

        {/* 4 Main Columns */}
        <div className="flex-1 grid grid-cols-12 gap-3 sm:gap-6 items-center">
          {/* Col 1: Cliente */}
          <div className="col-span-4 pl-1">CLIENTE</div>

          {/* Col 2: País */}
          <div className="col-span-3 pl-1">PAÍS</div>

          {/* Col 3: Color Asignado */}
          <div className="col-span-3 pl-1">COLOR ASIGNADO</div>

          {/* Col 4: Acciones */}
          <div className="col-span-2 text-right pr-2">ACCIONES</div>
        </div>
      </div>

      {/* Fast Inline Add Row */}
      <form
        onSubmit={handleQuickSubmit}
        className="flex items-center px-4 sm:px-6 py-3 bg-white/60 border-b border-zinc-200/70 gap-3 sm:gap-4 text-xs sm:text-sm rounded-t-xl md:rounded-t-none"
      >
        <div className="w-8 flex-shrink-0 flex items-center justify-center text-zinc-400">
          <Plus className="w-4 h-4" />
        </div>

        <div className="flex-1 grid grid-cols-12 gap-3 sm:gap-6 items-center">
          {/* Col 1: Nombre */}
          <div className="col-span-12 md:col-span-4">
            <input
              type="text"
              value={quickName}
              onChange={(e) => setQuickName(e.target.value)}
              placeholder="+ Nombre del cliente (ej. Polarist)..."
              className="w-full bg-transparent text-zinc-900 placeholder:text-zinc-400 text-xs sm:text-sm px-2.5 py-1.5 rounded border border-transparent focus:border-zinc-300 focus:bg-zinc-50 focus:outline-none font-medium"
            />
          </div>

          {/* Col 2: Selector de País */}
          <div className="col-span-6 md:col-span-3 relative country-picker-dropdown">
            <button
              type="button"
              onClick={() => {
                setIsCountryPickerOpen(!isCountryPickerOpen);
                setIsColorPickerOpen(false);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-medium text-zinc-700 transition-colors w-full sm:w-auto"
            >
              <CountryFlag country={quickCountry} />
              <span className="truncate">{quickCountry}</span>
              <ChevronDown className="w-3 h-3 text-zinc-400 ml-auto sm:ml-1" />
            </button>

            {isCountryPickerOpen && (
              <div className="absolute left-0 top-full mt-1.5 z-50 w-52 rounded-lg bg-white border border-zinc-200 p-1.5 shadow-2xl max-h-56 overflow-y-auto">
                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 mb-1">
                  Seleccionar País
                </div>
                <div className="space-y-0.5">
                  {COUNTRIES.map((c) => {
                    const isSelected = quickCountry === c.name;
                    return (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => {
                          setQuickCountry(c.name);
                          setIsCountryPickerOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-left transition-colors ${
                          isSelected
                            ? 'bg-zinc-100 text-zinc-900 font-semibold'
                            : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                        }`}
                      >
                        <CountryFlag country={c.code} />
                        <span className="truncate">{c.name}</span>
                        {isSelected && (
                          <Check className="w-3 h-3 ml-auto text-zinc-900 stroke-[2.5]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Col 3: Color Selector */}
          <div className="col-span-6 md:col-span-3 relative color-picker-dropdown">
            <button
              type="button"
              onClick={() => {
                setIsColorPickerOpen(!isColorPickerOpen);
                setIsCountryPickerOpen(false);
              }}
              className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-medium text-zinc-700 transition-colors"
            >
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: quickColorDef.dot }}
              />
              <span>{quickColorDef.label}</span>
              <ChevronDown className="w-3 h-3 text-zinc-400" />
            </button>

            {isColorPickerOpen && (
              <div className="absolute left-0 top-full mt-1.5 z-50 w-44 rounded-lg bg-white border border-zinc-200 p-1.5 shadow-2xl">
                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 mb-1">
                  Paleta de Colores
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {(Object.keys(VINTAGE_COLORS) as VintageColorKey[]).map((cKey) => {
                    const def = VINTAGE_COLORS[cKey];
                    return (
                      <button
                        key={cKey}
                        type="button"
                        onClick={() => {
                          setQuickColor(cKey);
                          setIsColorPickerOpen(false);
                        }}
                        className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs text-left transition-colors ${
                          quickColor === cKey
                            ? 'bg-zinc-100 text-zinc-900 font-semibold'
                            : 'text-zinc-600 hover:bg-zinc-50'
                        }`}
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: def.dot }}
                        />
                        <span className="truncate text-[11px]">{def.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Col 4: Submit Button */}
          <div className="col-span-12 md:col-span-2 flex items-center justify-end">
            <button
              type="submit"
              disabled={!quickName.trim()}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 disabled:opacity-40 disabled:hover:bg-zinc-900 text-white font-medium text-xs flex-shrink-0 transition-all shadow-sm"
            >
              + Agregar
            </button>
          </div>
        </div>
      </form>

      {/* Rows Container */}
      {clients.length === 0 ? (
        <div className="py-16 px-4 text-center rounded-b-xl">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6 stroke-[1.5]" />
          </div>
          <h3 className="text-sm font-medium text-zinc-800">
            No hay clientes registrados
          </h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            Registrá a tus clientes arriba para organizar tus proyectos y autocompletar acciones.
          </p>
          {onOpenCreateModal && (
            <button
              type="button"
              onClick={onOpenCreateModal}
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-xs font-medium shadow-sm hover:bg-zinc-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Registrar Primer Cliente</span>
            </button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-zinc-200/60 rounded-b-xl">
          {clients.map((client, idx) => {
            const isSystemClient = isPolaristTeamClient(client);
            const colorDef = VINTAGE_COLORS[client.color] || VINTAGE_COLORS.emerald;
            const isEditing = editingId === client.id;
            const isColorPopoverOpen = activeColorPopoverId === client.id;
            const isCountryPopoverOpen = activeCountryPopoverId === client.id;
            const clientCountry = client.country || DEFAULT_COUNTRY;
            const openUpwards = clients.length > 2 && idx >= clients.length - 2;

            return (
              <div
                key={client.id}
                className={`group transition-colors bg-white/40 hover:bg-white/75 last:rounded-b-xl ${
                  isColorPopoverOpen || isCountryPopoverOpen ? 'relative z-30' : ''
                }`}
              >
                <div className="flex items-center py-3.5 px-4 sm:px-6 gap-3 sm:gap-4 text-xs sm:text-sm">
                  {/* Left icon / bullet */}
                  <div className="w-8 flex-shrink-0 flex items-center justify-center">
                    <span
                      className="w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-xs"
                      style={{ backgroundColor: colorDef.dot }}
                    />
                  </div>

                  {/* 4 COLUMNS GRID: CLIENTE | PAÍS | COLOR | ACCIONES */}
                  <div className="flex-1 grid grid-cols-12 gap-3 sm:gap-6 items-center min-w-0">
                    {/* Col 1: Nombre */}
                    <div className="col-span-12 md:col-span-4 min-w-0">
                      {isEditing && !isSystemClient ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            autoFocus
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onBlur={() => handleSaveName(client)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveName(client);
                              } else if (e.key === 'Escape') {
                                setEditingId(null);
                              }
                            }}
                            className="w-full bg-white text-zinc-900 text-xs px-2 py-1 rounded border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-medium"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveName(client)}
                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                        </div>
                      ) : (
                        <div
                          className={`flex items-center gap-2 ${isSystemClient ? '' : 'cursor-pointer'}`}
                          onDoubleClick={() => !isSystemClient && handleStartEditing(client)}
                          title={isSystemClient ? 'Perfil de equipo protegido' : 'Doble click para editar nombre'}
                        >
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${colorDef.bg} ${colorDef.border} ${colorDef.text}`}
                          >
                            <span className="truncate max-w-[180px] sm:max-w-[240px]">
                              {client.name}
                            </span>
                          </span>

                          {isSystemClient ? (
                            <span className="inline-flex items-center gap-1 rounded bg-emerald-600 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white">
                              <Lock className="h-2.5 w-2.5" />
                              Equipo
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleStartEditing(client)}
                              className="opacity-0 group-hover:opacity-60 hover:opacity-100 p-1 text-zinc-400 hover:text-zinc-700 transition-opacity"
                              title="Editar nombre"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Col 2: PAÍS (Banderita + Nombre con Popover de un clic) */}
                    <div className="col-span-6 md:col-span-3 min-w-0 relative country-popover-container">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveCountryPopoverId(
                            isCountryPopoverOpen ? null : client.id
                          );
                          setActiveColorPopoverId(null);
                        }}
                        title="Click para cambiar país"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-medium text-zinc-700 transition-colors max-w-full"
                      >
                        <CountryFlag country={clientCountry} />
                        <span className="truncate">{clientCountry}</span>
                        <ChevronDown className="w-3 h-3 text-zinc-400 flex-shrink-0 ml-auto" />
                      </button>

                      {isCountryPopoverOpen && (
                        <div
                          className={`absolute left-0 ${
                            openUpwards ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
                          } z-50 w-52 rounded-lg bg-white border border-zinc-200 p-1.5 shadow-2xl max-h-56 overflow-y-auto`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 mb-1">
                            Cambiar País
                          </div>
                          <div className="space-y-0.5">
                            {COUNTRIES.map((c) => {
                              const isSelected = clientCountry === c.name;
                              return (
                                <button
                                  key={c.code}
                                  type="button"
                                  onClick={() => handleSelectCountry(client, c.name)}
                                  className={`w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded transition-colors text-left ${
                                    isSelected
                                      ? 'bg-zinc-100 text-zinc-900 font-semibold'
                                      : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                                  }`}
                                >
                                  <CountryFlag country={c.code} />
                                  <span className="truncate text-xs">{c.name}</span>
                                  {isSelected && (
                                    <Check className="w-3 h-3 ml-auto text-zinc-900 stroke-[2.5]" />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Col 3: Color Asignado */}
                    <div className="col-span-4 md:col-span-3 min-w-0 relative color-popover-container">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveColorPopoverId(
                            isColorPopoverOpen ? null : client.id
                          );
                          setActiveCountryPopoverId(null);
                        }}
                        title="Click para cambiar color"
                        className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-medium text-zinc-700 transition-colors"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: colorDef.dot }}
                        />
                        <span className="truncate">{colorDef.label}</span>
                        <ChevronDown className="w-3 h-3 text-zinc-400" />
                      </button>

                      {isColorPopoverOpen && (
                        <div
                          className={`absolute left-0 ${
                            openUpwards ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
                          } z-50 w-44 rounded-lg bg-white border border-zinc-200 p-1.5 shadow-2xl`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 mb-1">
                            Cambiar Color
                          </div>
                          <div className="space-y-0.5 max-h-48 overflow-y-auto">
                            {(Object.keys(VINTAGE_COLORS) as VintageColorKey[]).map(
                              (cKey) => {
                                const def = VINTAGE_COLORS[cKey];
                                const isSelected = client.color === cKey;
                                return (
                                  <button
                                    key={cKey}
                                    type="button"
                                    onClick={() => handleSelectColor(client, cKey)}
                                    className={`w-full flex items-center gap-2 px-2 py-1 text-xs rounded transition-colors text-left ${
                                      isSelected
                                        ? 'bg-zinc-100 text-zinc-900 font-semibold'
                                        : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                                    }`}
                                  >
                                    <span
                                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                      style={{ backgroundColor: def.dot }}
                                    />
                                    <span className="truncate text-xs">
                                      {def.label}
                                    </span>
                                    {isSelected && (
                                      <Check className="w-3 h-3 ml-auto text-zinc-900" />
                                    )}
                                  </button>
                                );
                              }
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Col 4: Acciones (Únicamente botón eliminar instantáneo con 1 clic) */}
                    <div className="col-span-2 md:col-span-2 flex items-center justify-end pr-2 min-w-0">
                      {isSystemClient ? (
                        <span title="Polarist (Equipo) no se puede eliminar" className="p-1 text-zinc-400">
                          <Lock className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteClient(client.id);
                          }}
                          title="Eliminar cliente"
                          className="p-1 rounded text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex-shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
