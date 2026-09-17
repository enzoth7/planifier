export interface CountryOption {
  code: string;
  name: string;
  flag: string;
}

export const COUNTRIES: CountryOption[] = [
  { code: 'UY', name: 'Uruguay', flag: '🇺🇾' },
  { code: 'AR', name: 'Argentina', flag: '🇦🇷' },
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'ES', name: 'España', flag: '🇪🇸' },
  { code: 'MX', name: 'México', flag: '🇲🇽' },
  { code: 'CL', name: 'Chile', flag: '🇨🇱' },
  { code: 'BR', name: 'Brasil', flag: '🇧🇷' },
  { code: 'CO', name: 'Colombia', flag: '🇨🇴' },
  { code: 'PY', name: 'Paraguay', flag: '🇵🇾' },
  { code: 'PE', name: 'Perú', flag: '🇵🇪' },
  { code: 'GB', name: 'Reino Unido', flag: '🇬🇧' },
  { code: 'DE', name: 'Alemania', flag: '🇩🇪' },
  { code: 'IT', name: 'Italia', flag: '🇮🇹' },
  { code: 'OT', name: 'Otro', flag: '🌐' },
];

export const DEFAULT_COUNTRY = 'Uruguay';
export const DEFAULT_COUNTRY_CODE = 'UY';

/**
 * Normaliza y devuelve el código ISO alpha-2 (ej. 'UY', 'AR', 'US')
 * según el nombre o código de país dado. Retorna null si es "Otro" o no reconocido.
 */
export function getCountryCode(countryNameOrCode?: string): string | null {
  if (!countryNameOrCode) return DEFAULT_COUNTRY_CODE;
  const clean = countryNameOrCode.trim().toUpperCase();

  if (clean === 'OT' || clean === 'OTRO') return null;

  // Si ya es un código ISO en nuestro catálogo
  const directCodeMatch = COUNTRIES.find((c) => c.code === clean);
  if (directCodeMatch) {
    return directCodeMatch.code === 'OT' ? null : directCodeMatch.code;
  }

  const lower = countryNameOrCode.trim().toLowerCase();
  const directNameMatch = COUNTRIES.find((c) => c.name.toLowerCase() === lower);
  if (directNameMatch) {
    return directNameMatch.code === 'OT' ? null : directNameMatch.code;
  }

  if (lower.includes('uruguay')) return 'UY';
  if (lower.includes('argentina')) return 'AR';
  if (lower.includes('estados unidos') || lower.includes('usa') || lower.includes('eeuu') || lower.includes('ee.uu') || lower.includes('united states')) return 'US';
  if (lower.includes('españa') || lower.includes('espana') || lower.includes('spain')) return 'ES';
  if (lower.includes('méxico') || lower.includes('mexico')) return 'MX';
  if (lower.includes('chile')) return 'CL';
  if (lower.includes('brasil') || lower.includes('brazil')) return 'BR';
  if (lower.includes('colombia')) return 'CO';
  if (lower.includes('paraguay')) return 'PY';
  if (lower.includes('perú') || lower.includes('peru')) return 'PE';
  if (lower.includes('reino unido') || lower.includes('uk') || lower.includes('united kingdom')) return 'GB';
  if (lower.includes('alemania') || lower.includes('germany')) return 'DE';
  if (lower.includes('italia') || lower.includes('italy')) return 'IT';

  // Si es código ISO de 2 letras
  if (clean.length === 2 && /^[A-Z]{2}$/.test(clean)) {
    return clean;
  }

  return null;
}

/**
 * Devuelve el emoji de la bandera para un país dado (fallback de texto).
 */
export function getCountryFlag(countryName?: string): string {
  if (!countryName) return '🇺🇾';
  const clean = countryName.trim().toLowerCase();
  const match = COUNTRIES.find(
    (c) => c.name.toLowerCase() === clean || c.code.toLowerCase() === clean
  );
  if (match) return match.flag;
  
  const code = getCountryCode(countryName);
  if (code) {
    const codeMatch = COUNTRIES.find((c) => c.code === code);
    if (codeMatch) return codeMatch.flag;
  }

  return '🌐';
}
