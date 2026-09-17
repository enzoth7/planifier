import React, { useState, useEffect } from 'react';
import { X, Check, ChevronDown } from 'lucide-react';
import { ClientItem, VintageColorKey, VINTAGE_COLORS } from '../types';
import { COUNTRIES, DEFAULT_COUNTRY } from '../utils/countries';
import { CountryFlag } from './CountryFlag';

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (clientData: Partial<ClientItem>) => void;
  initialData?: ClientItem | null;
}

export const ClientModal: React.FC<ClientModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState<VintageColorKey>('emerald');
  const [country, setCountry] = useState<string>(DEFAULT_COUNTRY);
  const [isCountryOpen, setIsCountryOpen] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setColor(initialData.color);
      setCountry(initialData.country || DEFAULT_COUNTRY);
    } else {
      setName('');
      setColor('emerald');
      setCountry(DEFAULT_COUNTRY);
    }
    setIsCountryOpen(false);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      type: initialData?.type || 'cliente',
      color,
      country,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm overflow-y-auto">
      <div
        className="relative w-full max-w-md rounded-xl bg-white border border-zinc-200 p-6 shadow-2xl text-zinc-900 my-8"
        onClick={(e) => {
          e.stopPropagation();
          setIsCountryOpen(false);
        }}
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
            {initialData ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Definí el nombre, país de origen y color identificador.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Nombre */}
          <div>
            <label className="block font-medium text-zinc-700 mb-1.5">
              Nombre del Cliente *
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Polarist Enterprise, Grupo Sur"
              className="w-full bg-white text-zinc-900 px-3 py-2 rounded-lg border border-zinc-300 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-400 text-xs font-medium"
            />
          </div>

          {/* Selector de País */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <label className="block font-medium text-zinc-700 mb-1.5">
              País
            </label>
            <button
              type="button"
              onClick={() => setIsCountryOpen(!isCountryOpen)}
              className="w-full flex items-center justify-between bg-white text-zinc-900 px-3 py-2 rounded-lg border border-zinc-300 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-400 text-xs font-medium hover:bg-zinc-50 transition-colors"
            >
              <span className="flex items-center gap-2">
                <CountryFlag country={country} />
                <span>{country}</span>
              </span>
              <ChevronDown className="w-4 h-4 text-zinc-400" />
            </button>

            {isCountryOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-lg bg-white border border-zinc-200 p-1.5 shadow-xl max-h-56 overflow-y-auto">
                <div className="space-y-0.5">
                  {COUNTRIES.map((c) => {
                    const isSelected = country === c.name;
                    return (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => {
                          setCountry(c.name);
                          setIsCountryOpen(false);
                        }}
                        className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-left transition-colors ${
                          isSelected
                            ? 'bg-zinc-100 text-zinc-900 font-semibold'
                            : 'text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900'
                        }`}
                      >
                        <CountryFlag country={c.code} />
                        <span className="truncate">{c.name}</span>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 ml-auto text-zinc-900 stroke-[2.5]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Selector de Color */}
          <div>
            <label className="block font-medium text-zinc-700 mb-1.5">
              Color asignado
            </label>
            <div className="flex flex-wrap items-center gap-2 pt-1 p-2 bg-zinc-50 rounded-lg border border-zinc-200/80">
              {(Object.keys(VINTAGE_COLORS) as VintageColorKey[]).map((cKey) => {
                const def = VINTAGE_COLORS[cKey];
                const isSelected = color === cKey;
                return (
                  <button
                    key={cKey}
                    type="button"
                    onClick={() => setColor(cKey)}
                    title={def.label}
                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                      isSelected
                        ? 'ring-2 ring-zinc-900 ring-offset-2 scale-110 shadow-xs'
                        : 'opacity-80 hover:opacity-100 hover:scale-105'
                    }`}
                    style={{ backgroundColor: def.dot }}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                  </button>
                );
              })}
            </div>
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
              {initialData ? 'Guardar Cambios' : 'Crear Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
