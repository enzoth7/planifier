import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ClientItem, VINTAGE_COLORS } from '../types';
import { ChevronDown, Check } from 'lucide-react';
import { CountryFlag } from './CountryFlag';

interface ClientAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelectClient?: (client: ClientItem) => void;
  clients: ClientItem[];
  placeholder?: string;
  className?: string;
  required?: boolean;
  autoFocus?: boolean;
}

export const ClientAutocomplete: React.FC<ClientAutocompleteProps> = ({
  value,
  onChange,
  onSelectClient,
  clients,
  placeholder = 'Buscar o ingresar cliente...',
  className = '',
  required = false,
  autoFocus = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter clients based on input
  const filteredClients = useMemo(() => {
    const trimmed = value.trim().toLowerCase();
    if (!trimmed) return clients;
    return clients.filter((c) => c.name.toLowerCase().includes(trimmed));
  }, [clients, value]);

  // Keep highlighted index in bounds
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredClients]);

  const handleSelect = (client: ClientItem) => {
    onChange(client.name);
    if (onSelectClient) {
      onSelectClient(client);
    }
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % Math.max(1, filteredClients.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev <= 0 ? Math.max(0, filteredClients.length - 1) : prev - 1
      );
    } else if (e.key === 'Enter') {
      if (filteredClients.length > 0 && highlightedIndex < filteredClients.length) {
        e.preventDefault();
        handleSelect(filteredClients[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div className="relative flex items-center">
        <input
          ref={inputRef}
          type="text"
          required={required}
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-white text-zinc-900 placeholder:text-zinc-400 text-xs sm:text-sm px-2.5 py-1.5 pr-7 rounded border border-transparent focus:border-zinc-300 focus:bg-zinc-50 focus:outline-none transition-all"
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => {
            setIsOpen(!isOpen);
            inputRef.current?.focus();
          }}
          className="absolute right-1.5 p-1 text-zinc-400 hover:text-zinc-600 rounded transition-colors"
          title="Ver clientes guardados"
        >
          <ChevronDown
            className={`w-3.5 h-3.5 transition-transform duration-150 ${
              isOpen ? 'rotate-180 text-zinc-600' : ''
            }`}
          />
        </button>
      </div>

      {isOpen && (
        <div
          className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-xl bg-white border border-zinc-200/90 p-1.5 shadow-xl shadow-zinc-900/10 text-xs"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 flex items-center justify-between border-b border-zinc-100 mb-1">
            <span>Clientes</span>
            <span className="font-mono text-zinc-400 font-normal">
              {filteredClients.length} disponibles
            </span>
          </div>

          {filteredClients.length === 0 ? (
            <div className="px-3 py-3 text-center text-zinc-500">
              <p className="text-xs">
                No hay coincidencias para &ldquo;{value}&rdquo;
              </p>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Se guardará como cliente libre al confirmar la acción.
              </p>
            </div>
          ) : (
            <div className="space-y-0.5">
              {filteredClients.map((client, idx) => {
                const colorDef = VINTAGE_COLORS[client.color] || VINTAGE_COLORS.emerald;
                const isSelected =
                  value.trim().toLowerCase() === client.name.toLowerCase();
                const isHighlighted = idx === highlightedIndex;

                return (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => handleSelect(client)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-left transition-colors ${
                      isHighlighted
                        ? 'bg-zinc-100/90 text-zinc-900'
                        : 'text-zinc-700 hover:bg-zinc-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Color dot badge */}
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-xs"
                        style={{ backgroundColor: colorDef.dot }}
                      />
                      <CountryFlag country={client.country} />
                      <span
                        className={`truncate font-medium text-xs ${
                          isSelected ? 'text-zinc-900 font-semibold' : 'text-zinc-800'
                        }`}
                      >
                        {client.name}
                      </span>
                    </div>

                    {isSelected && (
                      <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5] flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
