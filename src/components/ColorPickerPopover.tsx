import React, { useState, useRef, useEffect } from 'react';
import { VintageColorKey, VINTAGE_COLORS } from '../types';
import { soundFx } from '../utils/sound';

interface ColorPickerPopoverProps {
  currentColor: VintageColorKey;
  target: string;
  onSelectColor: (color: VintageColorKey) => void;
  onUpdateTarget?: (target: string) => void;
  align?: 'left' | 'right';
  openUpwards?: boolean;
}

export const ColorPickerPopover: React.FC<ColorPickerPopoverProps> = ({
  currentColor,
  target,
  onSelectColor,
  onUpdateTarget,
  align = 'left',
  openUpwards = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [targetVal, setTargetVal] = useState(target);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTargetVal(target);
  }, [target]);

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

  const colorDef = VINTAGE_COLORS[currentColor] || VINTAGE_COLORS.emerald;

  const handleSelect = (key: VintageColorKey) => {
    soundFx.playTock();
    onSelectColor(key);
    setIsOpen(false);
  };

  const handleSaveTarget = () => {
    setIsEditing(false);
    if (onUpdateTarget && targetVal.trim() && targetVal.trim() !== target) {
      onUpdateTarget(targetVal.trim());
    } else {
      setTargetVal(target);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveTarget();
    } else if (e.key === 'Escape') {
      setTargetVal(target);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <div className="inline-block" ref={containerRef}>
        <input
          ref={inputRef}
          type="text"
          autoFocus
          value={targetVal}
          onChange={(e) => setTargetVal(e.target.value)}
          onBlur={handleSaveTarget}
          onKeyDown={handleKeyDown}
          className="bg-white text-zinc-900 text-xs px-2 py-0.5 rounded border border-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-400 font-medium"
        />
      </div>
    );
  }

  return (
    <div className={`relative inline-block text-left ${isOpen ? 'z-30' : ''}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onDoubleClick={(e) => {
          e.stopPropagation();
          setIsOpen(false);
          setIsEditing(true);
        }}
        title="Click para cambiar color • Doble click para editar cliente"
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border transition-all duration-150 hover:opacity-90 focus:outline-none ${colorDef.bg} ${colorDef.border} ${colorDef.text}`}
      >
        <span className="truncate max-w-[180px] sm:max-w-[260px]">
          {target || 'General'}
        </span>
      </button>

      {isOpen && (
        <div
          className={`absolute z-50 w-36 rounded-lg bg-white border border-zinc-200 p-1 shadow-2xl max-h-64 overflow-y-auto ${
            openUpwards ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
          } ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 mb-1">
            Color
          </div>
          <div className="space-y-0.5">
            {(Object.keys(VINTAGE_COLORS) as VintageColorKey[]).map((key) => {
              const def = VINTAGE_COLORS[key];
              const isSelected = key === currentColor;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSelect(key)}
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
                  <span className="truncate text-xs">{def.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
