import React, { useState, useRef, useEffect } from 'react';
import { Wallpaper, Upload, Link as LinkIcon, Check, X, Sliders, RotateCcw } from 'lucide-react';

export interface BackgroundPreset {
  id: string;
  name: string;
  subtitle: string;
  url: string;
  thumb: string;
}

export const PRESET_BACKGROUNDS: BackgroundPreset[] = [
  {
    id: 'capri',
    name: 'Terraza Capri',
    subtitle: 'La actual favorita',
    url: '/Bg.png',
    thumb: '/Bg.png',
  },
  {
    id: 'positano',
    name: 'Positano & Amalfi',
    subtitle: 'Vista mediterránea luminosa',
    url: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=2000&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=300&auto=format&fit=crop',
  },
  {
    id: 'como',
    name: 'Lago di Como',
    subtitle: 'Villa italiana & calma',
    url: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?q=80&w=2000&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1516483638261-f4dbaf036963?q=80&w=300&auto=format&fit=crop',
  },
  {
    id: 'dolomites',
    name: 'Dolomitas & Alpes',
    subtitle: 'Naturaleza & aire puro',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2000&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=300&auto=format&fit=crop',
  },
  {
    id: 'playa-zen',
    name: 'Playa Zen',
    subtitle: 'Mar calmo & horizonte',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2000&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=300&auto=format&fit=crop',
  },
  {
    id: 'estudio-blanco',
    name: 'Estudio Blanco',
    subtitle: 'Textura minimal limpia',
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2000&auto=format&fit=crop',
    thumb: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=300&auto=format&fit=crop',
  },
];

const OPACITY_PRESETS = [
  { value: 20, label: '20%' },
  { value: 30, label: '30%' },
  { value: 40, label: '40%' },
  { value: 50, label: '50%' },
];

interface BackgroundSelectorProps {
  currentBg: string;
  currentOpacity: number;
  onSelectBg: (url: string) => void;
  onSelectOpacity: (opacity: number) => void;
}

export const BackgroundSelector: React.FC<BackgroundSelectorProps> = ({
  currentBg,
  currentOpacity,
  onSelectBg,
  onSelectOpacity,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowUrlInput(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Manejo de archivo y compresión a base64
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const compressedDataUrl = await compressImageFile(file);
      onSelectBg(compressedDataUrl);
    } catch (err) {
      console.error('Error al procesar la imagen:', err);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Compresor ligero para evitar límites de localStorage
  const compressImageFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1920;
          let width = img.width;
          let height = img.height;

          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          // Calidad JPEG balanceada ~0.82
          const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          resolve(dataUrl);
        };
        img.onerror = () => reject(new Error('Error al decodificar la imagen'));
        img.src = event.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Error al leer el archivo'));
      reader.readAsDataURL(file);
    });
  };

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = urlInput.trim();
    if (trimmed) {
      onSelectBg(trimmed);
      setUrlInput('');
      setShowUrlInput(false);
    }
  };

  const isCustomBg = !PRESET_BACKGROUNDS.some((preset) => preset.url === currentBg);

  return (
    <div className="fixed bottom-5 right-5 z-40" ref={containerRef}>
      {/* Popover desplegable flotante hacia arriba */}
      {isOpen && (
        <div className="absolute bottom-14 right-0 w-80 sm:w-88 rounded-2xl bg-white/95 backdrop-blur-xl border border-white/80 shadow-2xl p-4 space-y-4 text-zinc-800 animate-in fade-in duration-200">
          {/* Header del Popover */}
          <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-zinc-100 text-zinc-700">
                <Wallpaper className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-zinc-900 leading-none">Fondo de Pantalla</h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">Personalizá tu espacio de trabajo</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-zinc-400 hover:text-zinc-700 rounded-md hover:bg-zinc-100 transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Galería de Fondos Preset (Grid 3x2) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-medium text-zinc-500 px-0.5">
              <span>Colección Mediterránea & Zen</span>
              {isCustomBg && (
                <button
                  type="button"
                  onClick={() => onSelectBg('/Bg.png')}
                  className="text-[10px] text-zinc-600 hover:text-zinc-900 flex items-center gap-1 underline underline-offset-2"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  Volver a Capri
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              {PRESET_BACKGROUNDS.map((preset) => {
                const isSelected = currentBg === preset.url;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onSelectBg(preset.url)}
                    title={`${preset.name} - ${preset.subtitle}`}
                    className={`group relative flex flex-col rounded-xl overflow-hidden border text-left transition-all active:scale-[0.98] ${
                      isSelected
                        ? 'border-zinc-800 ring-2 ring-zinc-800 shadow-md'
                        : 'border-zinc-200 hover:border-zinc-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="w-full h-14 bg-zinc-100 relative overflow-hidden">
                      <img
                        src={preset.thumb}
                        alt={preset.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                          <div className="bg-white text-zinc-900 rounded-full p-0.5 shadow">
                            <Check className="w-3 h-3 stroke-[2.5]" />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="p-1 bg-white/95">
                      <p className="text-[10px] font-medium text-zinc-800 truncate leading-tight">
                        {preset.name}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Opciones Adicionales: Subir foto propia o URL */}
          <div className="space-y-2 pt-1 border-t border-zinc-100">
            <div className="flex items-center gap-1.5">
              {/* Input file oculto */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-xl text-[11px] font-medium text-zinc-700 transition-colors active:scale-95 disabled:opacity-50"
              >
                <Upload className="w-3 h-3 text-zinc-500" />
                <span>{isUploading ? 'Subiendo...' : 'Subir imagen'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 border rounded-xl text-[11px] font-medium transition-colors active:scale-95 ${
                  showUrlInput
                    ? 'bg-zinc-800 text-white border-zinc-800'
                    : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-700 border-zinc-200'
                }`}
              >
                <LinkIcon className="w-3 h-3 text-zinc-500" />
                <span>Pegar URL</span>
              </button>
            </div>

            {/* Input de URL expandible */}
            {showUrlInput && (
              <form onSubmit={handleApplyUrl} className="flex gap-1.5 animate-in fade-in duration-150">
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="flex-1 px-2.5 py-1 bg-white border border-zinc-300 rounded-lg text-xs placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-800"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!urlInput.trim()}
                  className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-900 disabled:bg-zinc-300 text-white text-[11px] font-medium rounded-lg transition-colors"
                >
                  Aplicar
                </button>
              </form>
            )}
          </div>

          {/* Control de Atenuación / Claridad */}
          <div className="space-y-1.5 pt-1 border-t border-zinc-100">
            <div className="flex items-center justify-between text-[11px] text-zinc-500 px-0.5">
              <span className="flex items-center gap-1 font-medium">
                <Sliders className="w-3 h-3 text-zinc-400" />
                Atenuación blanca
              </span>
              <span className="font-mono text-[10px] text-zinc-600 font-semibold">{currentOpacity}%</span>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {OPACITY_PRESETS.map((op) => {
                const isActive = currentOpacity === op.value;
                return (
                  <button
                    key={op.value}
                    type="button"
                    onClick={() => onSelectOpacity(op.value)}
                    className={`py-1 text-[11px] font-medium rounded-lg border transition-all ${
                      isActive
                        ? 'bg-zinc-800 text-white border-zinc-800 shadow-sm'
                        : 'bg-zinc-50 hover:bg-zinc-100 text-zinc-600 border-zinc-200'
                    }`}
                  >
                    {op.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Botón flotante en esquina inferior derecha */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="Cambiar fondo"
        className="bg-white/90 hover:bg-white text-zinc-700 hover:text-zinc-950 p-2.5 rounded-full shadow-lg border border-white/80 transition-all active:scale-95 flex items-center gap-2 backdrop-blur-md group"
      >
        <Wallpaper className="w-4 h-4 text-zinc-600 group-hover:text-zinc-900 transition-colors" />
        <span className="text-xs font-medium pr-1 text-zinc-700 group-hover:text-zinc-950 hidden sm:inline select-none">
          Cambiar fondo
        </span>
      </button>
    </div>
  );
};
