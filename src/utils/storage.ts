import { ActionItem, ClientItem } from '../types';

const STORAGE_KEY = 'planifier_board_items_v1';
const CLIENTS_STORAGE_KEY = 'planifier_clients_v1';

export const INITIAL_CLIENTS: ClientItem[] = [
  { id: 'client-polarist', name: 'Polarist', type: 'cliente', color: 'emerald', country: 'Uruguay' },
  { id: 'client-1', name: 'Polarist Enterprise', type: 'interesado', color: 'emerald', country: 'Uruguay' },
  { id: 'client-2', name: 'Infraestructura Cloud', type: 'cliente', color: 'navy', country: 'Estados Unidos' },
  { id: 'client-3', name: 'Grupo Automotor Sur', type: 'cliente', color: 'yellow', country: 'Uruguay' },
  { id: 'client-4', name: 'Corporativo & Legal', type: 'cliente', color: 'burgundy', country: 'España' },
  { id: 'client-5', name: 'I+D Proyectos', type: 'interesado', color: 'terracotta', country: 'Argentina' },
  { id: 'client-6', name: 'Finanzas & Admin', type: 'cliente', color: 'charcoal', country: 'Uruguay' },
];

export const INITIAL_ACTIONS: ActionItem[] = [
  {
    id: 'act-1',
    order: 0,
    title: 'Cierre de Contrato Anual y Onboarding',
    target: 'Polarist',
    tagColor: 'emerald',
    value: 4800,
    currency: '$',
    deadline: '2026-09-18', // Tomorrow
    completed: false,
    notes: 'Revisión final de cláusulas de SLA y firma digital con Dirección Técnica.',
    subtasks: [
      { id: 'sub-1', text: 'Enviar borrador de contrato con anexos SLA', done: true },
      { id: 'sub-2', text: 'Confirmar recepción del comprobante de anticipo', done: false },
      { id: 'sub-3', text: 'Configurar canal prioritario y credenciales', done: false },
    ],
    isExpanded: true,
    createdAt: '2026-09-15T09:00:00Z',
    userEmail: 'enzothome1@gmail.com',
    taskType: 'action',
  },
  {
    id: 'act-2',
    order: 1,
    title: 'Migración y Despliegue de Red n8n + Redis Clúster',
    target: 'Infraestructura Cloud',
    tagColor: 'navy',
    value: 2200,
    currency: '$',
    deadline: '2026-09-17', // Today!
    completed: false,
    notes: 'Optimización de latencia en webhooks críticos y colas de reintento.',
    subtasks: [
      { id: 'sub-4', text: 'Backup completo de base Postgres y flujos activos', done: true },
      { id: 'sub-5', text: 'Provisionar instancias con volumen NVMe', done: true },
      { id: 'sub-6', text: 'Test de carga con 500 ejecuciones simultáneas', done: false },
    ],
    isExpanded: false,
    createdAt: '2026-09-14T14:30:00Z',
    userEmail: 'enzothome1@gmail.com',
    taskType: 'action',
  },
  {
    id: 'act-3',
    order: 2,
    title: 'Meeting Estratégica: Roadmap Trimestral Polarist',
    target: 'Polarist',
    tagColor: 'vividViolet',
    value: 3500,
    currency: '$',
    deadline: '2026-09-22',
    completed: false,
    notes: 'Alineación de objetivos de expansión y sprints con Cristian y Julieta.',
    subtasks: [
      { id: 'sub-7', text: 'Preparar métricas de conversión y MRR', done: true },
      { id: 'sub-8', text: 'Presentar nuevas funcionalidades de automatización', done: false },
    ],
    isExpanded: false,
    createdAt: '2026-09-16T11:00:00Z',
    userEmail: 'cristianpayret@gmail.com',
    taskType: 'meeting',
  },
  {
    id: 'act-4',
    order: 3,
    title: 'Auditoría Legal y Mitigación de Responsabilidad SAS',
    target: 'Corporativo & Legal',
    tagColor: 'burgundy',
    value: 1250,
    currency: '$',
    deadline: '2026-09-25',
    completed: false,
    notes: 'Blindaje de términos de servicio y contratos de confidencialidad B2B.',
    subtasks: [
      { id: 'sub-9', text: 'Revisión con escribanía en Montevideo', done: false },
      { id: 'sub-10', text: 'Actualizar plantilla NDA para proveedores externos', done: false },
    ],
    isExpanded: false,
    createdAt: '2026-09-13T16:00:00Z',
    userEmail: 'juliperez2803@gmail.com',
    taskType: 'action',
  },
  {
    id: 'act-5',
    order: 4,
    title: 'Sprint de Micro-SaaS: Motor de Indexación RAG',
    target: 'Polarist',
    tagColor: 'terracotta',
    value: 1800,
    currency: '$',
    deadline: '2026-09-29',
    completed: false,
    notes: 'Embeddings híbridos con reranking para documentación técnica.',
    subtasks: [
      { id: 'sub-11', text: 'Benchmark con Cohere vs Voyage AI', done: true },
      { id: 'sub-12', text: 'Integración en endpoint FastAPI', done: true },
    ],
    isExpanded: false,
    createdAt: '2026-09-12T10:00:00Z',
    userEmail: 'enzothome1@gmail.com',
    taskType: 'action',
  },
  {
    id: 'act-6',
    order: 5,
    title: 'Renovación de Licencias y Mantenimiento Trimestral',
    target: 'Finanzas & Admin',
    tagColor: 'charcoal',
    value: 950,
    currency: '$',
    deadline: '2026-09-16', // Yesterday (Overdue to test visual urgency)
    completed: true,
    completedAt: '2026-09-16T18:00:00Z',
    notes: 'Conciliación bancaria y facturas electrónicas DGI cerradas con éxito.',
    subtasks: [
      { id: 'sub-13', text: 'Descarga de extractos y comprobantes', done: true },
      { id: 'sub-14', text: 'Envío a estudio contable', done: true },
    ],
    isExpanded: false,
    createdAt: '2026-09-10T12:00:00Z',
    userEmail: 'enzothome1@gmail.com',
    taskType: 'action',
  }
];

export function loadStoredActions(): ActionItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
    const isSeeded =
      localStorage.getItem('planifier_db_seeded') === 'true' ||
      localStorage.getItem('planifier_supabase_seeded_v2') === 'true';

    if (isSeeded) {
      return [];
    }

    saveStoredActions(INITIAL_ACTIONS);
    localStorage.setItem('planifier_db_seeded', 'true');
    localStorage.setItem('planifier_supabase_seeded_v2', 'true');
    return INITIAL_ACTIONS;
  } catch (err) {
    console.error('Error loading stored actions:', err);
    return [];
  }
}

export function saveStoredActions(actions: ActionItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(actions));
  } catch (err) {
    console.error('Error saving actions to localStorage:', err);
  }
}

export function exportBoardToJSON(actions: ActionItem[]): void {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(actions, null, 2));
  const downloadAnchor = document.createElement('a');
  const todayStr = new Date().toISOString().split('T')[0];
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `planifier-backup-${todayStr}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

export function importBoardFromJSON(
  file: File,
  onSuccess: (items: ActionItem[]) => void,
  onError: (msg: string) => void
): void {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string;
      const parsed = JSON.parse(content);
      if (!Array.isArray(parsed)) {
        throw new Error('El archivo no contiene una lista válida de acciones.');
      }
      // Basic validation
      const validItems: ActionItem[] = parsed.map((item, idx) => ({
        id: item.id || `act-${Date.now()}-${idx}`,
        order: typeof item.order === 'number' ? item.order : idx,
        title: item.title || 'Sin título',
        target: item.target || 'General',
        tagColor: item.tagColor || 'emerald',
        value: Number(item.value) || 0,
        currency: item.currency || '$',
        deadline: item.deadline || '',
        completed: Boolean(item.completed),
        completedAt: item.completedAt,
        notes: item.notes || '',
        subtasks: Array.isArray(item.subtasks) ? item.subtasks : [],
        isExpanded: Boolean(item.isExpanded),
        createdAt: item.createdAt || new Date().toISOString(),
        userEmail: item.userEmail || 'enzothome1@gmail.com',
        taskType: item.taskType || 'action',
      }));

      saveStoredActions(validItems);
      onSuccess(validItems);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Formato de archivo inválido';
      onError(errorMsg);
    }
  };
  reader.readAsText(file);
}

export function loadStoredClients(): ClientItem[] {
  try {
    const raw = localStorage.getItem(CLIENTS_STORAGE_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
    const isSeeded =
      localStorage.getItem('planifier_db_seeded') === 'true' ||
      localStorage.getItem('planifier_supabase_seeded_v2') === 'true';

    if (isSeeded) {
      return [];
    }

    saveStoredClients(INITIAL_CLIENTS);
    localStorage.setItem('planifier_db_seeded', 'true');
    localStorage.setItem('planifier_supabase_seeded_v2', 'true');
    return INITIAL_CLIENTS;
  } catch (err) {
    console.error('Error loading stored clients:', err);
    return [];
  }
}

export function saveStoredClients(clients: ClientItem[]): void {
  try {
    localStorage.setItem(CLIENTS_STORAGE_KEY, JSON.stringify(clients));
  } catch (err) {
    console.error('Error saving clients to localStorage:', err);
  }
}
