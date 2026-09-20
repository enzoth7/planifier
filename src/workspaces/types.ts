import {
  ActionItem,
  ClientItem,
  ClientType,
  VintageColorKey,
  UserProfile,
  AppEndpoint,
  TaskType,
  ObjectiveItem,
} from '../types';

export interface WorkspaceProps {
  actions: ActionItem[];
  completedActions: ActionItem[];
  clients: ClientItem[];
  objectives: ObjectiveItem[];
  currentUser: UserProfile;
  onNavigateEndpoint: (endpoint: AppEndpoint) => void;
  onLogout: () => void;
  onAddAction: (data: {
    title: string;
    target: string;
    tagColor?: VintageColorKey;
    value: number;
    deadline: string;
    taskType?: TaskType;
    userEmail?: string;
  }) => void;
  onUpdateAction: (action: ActionItem) => void;
  onUpdateObjective: (objective: ObjectiveItem) => void;
  onDeleteAction: (id: string) => void;
  onCompleteAction: (id: string) => void;
  onAddClient: (clientData: {
    name: string;
    type: ClientType;
    color: VintageColorKey;
    country?: string;
  }) => void;
  onUpdateClient: (client: ClientItem) => void;
  onDeleteClient: (id: string) => void;
  onOpenCreateModal: (date?: string) => void;
  onOpenCreateClientModal: () => void;
  onSelectBg: (url: string) => void;
  onSelectOpacity: (opacity: number) => void;
  bgImage: string;
  bgOpacity: number;

  // Interacciones adicionales de tablero y detalles
  onRestoreAction?: (item: ActionItem) => void;
  onDeleteCompletedAction?: (id: string) => void;
  onReorderActions?: (newItems: ActionItem[]) => void;
  onEditAction?: (item: ActionItem) => void;
  onUpdateColor?: (id: string, color: VintageColorKey) => void;
  onUpdateValue?: (id: string, val: number) => void;
  onUpdateTarget?: (id: string, target: string) => void;
  onUpdateTargetAndColor?: (id: string, target: string, color: VintageColorKey) => void;
  onUpdateDeadline?: (id: string, deadline: string) => void;
  onToggleExpand?: (id: string) => void;
  onToggleSubtask?: (itemId: string, subtaskId: string) => void;
  onAddSubtask?: (itemId: string, text: string) => void;
  onDeleteSubtask?: (itemId: string, subtaskId: string) => void;
  onUpdateNotes?: (itemId: string, notes: string) => void;
  onUpdateUserEmail?: (id: string, userEmail: string) => void;
}
