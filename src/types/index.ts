export type VintageColorKey = 
  | 'emerald'
  | 'navy'
  | 'burgundy'
  | 'gold'
  | 'terracotta'
  | 'lavender'
  | 'charcoal'
  | 'yellow'
  | 'darkNavy'
  | 'lightGreen'
  | 'vividViolet';

export interface ColorDefinition {
  key: VintageColorKey;
  label: string;
  bg: string;
  border: string;
  text: string;
  dot: string;
  badgeBg: string;
}

export const VINTAGE_COLORS: Record<VintageColorKey, ColorDefinition> = {
  emerald: {
    key: 'emerald',
    label: 'Verde',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-800',
    dot: '#059669',
    badgeBg: 'bg-emerald-50 border-emerald-200 text-emerald-800'
  },
  navy: {
    key: 'navy',
    label: 'Azul',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-800',
    dot: '#2563eb',
    badgeBg: 'bg-blue-50 border-blue-200 text-blue-800'
  },
  burgundy: {
    key: 'burgundy',
    label: 'Rojo',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-800',
    dot: '#e11d48',
    badgeBg: 'bg-rose-50 border-rose-200 text-rose-800'
  },
  gold: {
    key: 'gold',
    label: 'Ámbar',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-800',
    dot: '#d97706',
    badgeBg: 'bg-amber-50 border-amber-200 text-amber-800'
  },
  terracotta: {
    key: 'terracotta',
    label: 'Naranja',
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-800',
    dot: '#ea580c',
    badgeBg: 'bg-orange-50 border-orange-200 text-orange-800'
  },
  lavender: {
    key: 'lavender',
    label: 'Morado',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-800',
    dot: '#9333ea',
    badgeBg: 'bg-purple-50 border-purple-200 text-purple-800'
  },
  charcoal: {
    key: 'charcoal',
    label: 'Gris',
    bg: 'bg-zinc-100',
    border: 'border-zinc-200',
    text: 'text-zinc-800',
    dot: '#52525b',
    badgeBg: 'bg-zinc-100 border-zinc-200 text-zinc-800'
  },
  yellow: {
    key: 'yellow',
    label: 'Amarillo',
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-800',
    dot: '#eab308',
    badgeBg: 'bg-yellow-50 border-yellow-200 text-yellow-800'
  },
  darkNavy: {
    key: 'darkNavy',
    label: 'Azul Oscuro',
    bg: 'bg-blue-100/70',
    border: 'border-blue-900/30',
    text: 'text-blue-950 font-semibold',
    dot: '#1e3a8a',
    badgeBg: 'bg-blue-100/70 border-blue-900/30 text-blue-950 font-semibold'
  },
  lightGreen: {
    key: 'lightGreen',
    label: 'Verde Claro',
    bg: 'bg-lime-50',
    border: 'border-lime-200',
    text: 'text-lime-800',
    dot: '#84cc16',
    badgeBg: 'bg-lime-50 border-lime-200 text-lime-800'
  },
  vividViolet: {
    key: 'vividViolet',
    label: 'Violeta Fuerte',
    bg: 'bg-purple-100',
    border: 'border-purple-300',
    text: 'text-purple-950 font-semibold',
    dot: '#7e22ce',
    badgeBg: 'bg-purple-100 border-purple-300 text-purple-950 font-semibold'
  },
};

export type AppEndpoint = 'enzo' | 'cristian' | 'julieta' | 'polarist';

export interface UserProfile {
  id: 'enzo' | 'cristian' | 'juli';
  name: string;
  email: string;
  avatarColor: string;
  initials: string;
  endpoint: AppEndpoint;
}

export const APP_USERS: UserProfile[] = [
  { id: 'enzo', name: 'Enzo', email: 'enzothome1@gmail.com', avatarColor: '#059669', initials: 'EN', endpoint: 'enzo' },
  { id: 'cristian', name: 'Cristian', email: 'cristianpayret@gmail.com', avatarColor: '#2563eb', initials: 'CP', endpoint: 'cristian' },
  { id: 'juli', name: 'Juli', email: 'juliperez2803@gmail.com', avatarColor: '#9333ea', initials: 'JP', endpoint: 'julieta' },
];

export type TaskType = 'action' | 'meeting';
export type WorkspaceMode = 'personal' | 'team';
export type ClientOwner = 'enzo' | 'cristian' | 'juli' | 'polarist';

export const getUserByEmail = (email?: string): UserProfile => {
  if (!email) return APP_USERS[0];
  const found = APP_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
  return found || APP_USERS[0];
};

export interface SubtaskItem {
  id: string;
  text: string;
  done: boolean;
}

export interface ActionItem {
  id: string;
  order: number;
  title: string;
  target: string;
  tagColor: VintageColorKey;
  value: number; // in USD or chosen currency
  currency: string;
  deadline: string; // ISO date format YYYY-MM-DD
  completed: boolean;
  completedAt?: string;
  notes?: string;
  subtasks: SubtaskItem[];
  isExpanded?: boolean; // UI state for expandable lines
  createdAt: string;
  userEmail?: string;
  taskType?: TaskType;
  workspaceScope?: 'personal' | 'polarist';
}

export type TabFilter = 'all' | 'pending' | 'completed';

export type TabType = 'board' | 'calendar' | 'completed' | 'clients';

export type ClientType = 'cliente' | 'interesado';

export interface ClientItem {
  id: string;
  name: string;
  type: ClientType;
  owner?: ClientOwner;
  color: VintageColorKey;
  country?: string;
  createdAt?: string;
}

export interface BoardStats {
  totalActiveValue: number;
  activeCount: number;
  completedCount: number;
  totalCount: number;
  nextDeadline: {
    date: string;
    formatted: string;
    daysDiff: number;
    title: string;
  } | null;
}

