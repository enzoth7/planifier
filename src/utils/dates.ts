const MONTH_NAMES_ES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

/**
 * Parses YYYY-MM-DD into a Date object at local midnight
 */
export function parseISODate(isoStr: string): Date {
  if (!isoStr) return new Date();
  const parts = isoStr.split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  return new Date(isoStr);
}

/**
 * Formats YYYY-MM-DD into "18 Sep" or "18 Sep 2026"
 */
export function formatDisplayDate(isoStr: string): string {
  if (!isoStr) return 'Sin fecha';
  const d = parseISODate(isoStr);
  if (isNaN(d.getTime())) return isoStr;
  const day = d.getDate();
  const month = MONTH_NAMES_ES[d.getMonth()] || '';
  const currentYear = new Date().getFullYear();
  if (d.getFullYear() !== currentYear) {
    return `${day} ${month} ${d.getFullYear()}`;
  }
  return `${day} ${month}`;
}

/**
 * Formats ISO timestamp into friendly completed date: "17 Sep • 11:45"
 */
export function formatCompletedDate(isoStr?: string): string {
  if (!isoStr) return 'Reciente';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    const day = d.getDate();
    const month = MONTH_NAMES_ES[d.getMonth()] || '';
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${day} ${month} • ${hours}:${minutes}`;
  } catch {
    return isoStr;
  }
}


export type UrgencyLevel = 'overdue' | 'today' | 'tomorrow' | 'urgent' | 'upcoming' | 'completed';

export interface UrgencyInfo {
  level: UrgencyLevel;
  label: string;
  badgeClass: string;
  dotColor: string;
  diffDays: number;
}

export function getUrgencyInfo(isoStr: string, completed: boolean): UrgencyInfo {
  if (completed) {
    return {
      level: 'completed',
      label: 'Hecho',
      badgeClass: 'bg-zinc-800/50 border-zinc-700/40 text-zinc-500',
      dotColor: '#71717a',
      diffDays: 999,
    };
  }

  if (!isoStr) {
    return {
      level: 'upcoming',
      label: 'Sin fecha',
      badgeClass: 'bg-zinc-800/40 border-zinc-700/30 text-zinc-400',
      dotColor: '#71717a',
      diffDays: 999,
    };
  }

  const target = parseISODate(isoStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const daysAgo = Math.abs(diffDays);
    return {
      level: 'overdue',
      label: daysAgo === 1 ? 'Venció ayer' : `Vencido (${daysAgo}d)`,
      badgeClass: 'bg-rose-500/10 border-rose-500/30 text-rose-400 font-medium',
      dotColor: '#f43f5e',
      diffDays,
    };
  }

  if (diffDays === 0) {
    return {
      level: 'today',
      label: 'Hoy',
      badgeClass: 'bg-amber-500/10 border-amber-500/30 text-amber-400 font-semibold',
      dotColor: '#f59e0b',
      diffDays: 0,
    };
  }

  if (diffDays === 1) {
    return {
      level: 'tomorrow',
      label: 'Mañana',
      badgeClass: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
      dotColor: '#fbbf24',
      diffDays: 1,
    };
  }

  if (diffDays <= 3) {
    return {
      level: 'urgent',
      label: `${diffDays}d`,
      badgeClass: 'bg-zinc-800/80 border-zinc-700/60 text-zinc-300',
      dotColor: '#a1a1aa',
      diffDays,
    };
  }

  return {
    level: 'upcoming',
    label: `${diffDays}d`,
    badgeClass: 'bg-zinc-900 border-zinc-800 text-zinc-400',
    dotColor: '#71717a',
    diffDays,
  };
}

export const FULL_MONTH_NAMES_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

/**
 * Retorna el lunes a las 00:00:00 de la semana que contiene la fecha provista
 */
export function getMondayOfWeek(d: Date = new Date()): Date {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = date.getDay(); // 0 es Domingo, 1 es Lunes...
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Convierte un objeto Date local a formato de cadena YYYY-MM-DD
 */
export function toISODateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Suma (o resta) días a una fecha retornando una nueva instancia de Date
 */
export function addDays(d: Date, days: number): Date {
  const result = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Verifica si dos fechas corresponden al mismo día (año, mes y día)
 */
export function isSameDay(d1: Date, d2: Date): boolean {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

/**
 * Formatea el rango del encabezado de 4 semanas (28 días):
 * ej: "Septiembre - Octubre 2026" o "Septiembre 2026"
 */
export function formatCalendarHeaderRange(startDate: Date): string {
  const endDate = addDays(startDate, 27);
  const startMonth = FULL_MONTH_NAMES_ES[startDate.getMonth()];
  const endMonth = FULL_MONTH_NAMES_ES[endDate.getMonth()];
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();

  if (startYear === endYear) {
    if (startDate.getMonth() === endDate.getMonth()) {
      return `${startMonth} ${startYear}`;
    }
    return `${startMonth} - ${endMonth} ${startYear}`;
  }
  return `${startMonth} ${startYear} - ${endMonth} ${endYear}`;
}
