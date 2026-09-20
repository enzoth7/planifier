import React from 'react';
import {
  Plus,
  CheckCircle2,
  LayoutGrid,
  Users,
  CalendarDays,
  WalletCards,
  Target,
  User,
  LogOut,
} from 'lucide-react';
import { TabType, UserProfile, AppEndpoint, APP_USERS } from '../types';

interface HeaderProps {
  currentEndpoint: AppEndpoint;
  onNavigateEndpoint: (endpoint: AppEndpoint) => void;
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  currentUser: UserProfile;
  onLogout: () => void;
  selectedTeamMemberEmail: string | null;
  onSelectTeamMember: (email: string | null) => void;
  totalValue: number;
  calendarTotalValue?: number;
  completedValue: number;
  activeCount: number;
  calendarActiveCount?: number;
  completedCount: number;
  clientsCount: number;
  objectiveTarget?: number;
  objectiveCompleted?: number;
  financeBalance?: number;
  onOpenCreateModal: () => void;
  onOpenCreateClientModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentEndpoint,
  onNavigateEndpoint,
  activeTab,
  onTabChange,
  currentUser,
  onLogout,
  selectedTeamMemberEmail,
  onSelectTeamMember,
  totalValue,
  calendarTotalValue,
  completedValue,
  activeCount,
  calendarActiveCount,
  completedCount,
  clientsCount,
  objectiveTarget = 0,
  objectiveCompleted = 0,
  financeBalance = 0,
  onOpenCreateModal,
  onOpenCreateClientModal,
}) => {
  const moneyLabel =
    activeTab === 'objectives'
      ? 'Meta del mes:'
      : activeTab === 'finance'
      ? 'Caja disponible:'
      : activeTab === 'clients'
      ? 'Total clientes:'
      : activeTab === 'completed'
      ? 'Total completado:'
      : activeTab === 'calendar'
      ? 'Total 4 semanas:'
      : currentEndpoint === 'polarist'
      ? selectedTeamMemberEmail
        ? `Total ${APP_USERS.find((u) => u.email === selectedTeamMemberEmail)?.name || 'Miembro'}:`
        : 'Total Polarist:'
      : 'Total en juego:';

  const displayedValue =
    activeTab === 'board'
      ? totalValue
      : activeTab === 'calendar'
      ? (calendarTotalValue ?? totalValue)
      : completedValue;

  return (
    <header className="flex flex-col gap-3.5 bg-white/90 backdrop-blur-md rounded-xl p-3.5 sm:p-4 border border-white/70 shadow-sm">
      {/* Fila Superior: Título de Vista según Endpoint + Alternar Vista + Total Dinero + Botón Nueva Acción + Botón Salir */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Izquierda: Indicador exacto de Vista y botón de navegación */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Vista Personal Enzo */}
          {currentEndpoint === 'enzo' && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-950 border border-emerald-200/80 shadow-2xs font-semibold text-xs sm:text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 flex-shrink-0" />
                <span>Vista personal Enzo</span>
              </div>
              <button
                type="button"
                onClick={() => onNavigateEndpoint('polarist')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100/90 hover:bg-zinc-200/80 text-zinc-700 hover:text-zinc-900 border border-zinc-200/70 text-xs font-medium transition-all shadow-2xs cursor-pointer"
                title="Abrir el espacio compartido de Polarist"
              >
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                <span>Vista Polarist</span>
              </button>
            </div>
          )}

          {/* Vista Personal Cristian */}
          {currentEndpoint === 'cristian' && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-950 border border-blue-200/80 shadow-2xs font-semibold text-xs sm:text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 flex-shrink-0" />
                <span>Vista personal Cristian</span>
              </div>
              <button
                type="button"
                onClick={() => onNavigateEndpoint('polarist')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100/90 hover:bg-zinc-200/80 text-zinc-700 hover:text-zinc-900 border border-zinc-200/70 text-xs font-medium transition-all shadow-2xs cursor-pointer"
                title="Abrir el espacio compartido de Polarist"
              >
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                <span>Vista Polarist</span>
              </button>
            </div>
          )}

          {/* Vista Personal Julieta */}
          {currentEndpoint === 'julieta' && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-50 text-purple-950 border border-purple-200/80 shadow-2xs font-semibold text-xs sm:text-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600 flex-shrink-0" />
                <span>Vista personal Julieta</span>
              </div>
              <button
                type="button"
                onClick={() => onNavigateEndpoint('polarist')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100/90 hover:bg-zinc-200/80 text-zinc-700 hover:text-zinc-900 border border-zinc-200/70 text-xs font-medium transition-all shadow-2xs cursor-pointer"
                title="Abrir el espacio compartido de Polarist"
              >
                <Users className="w-3.5 h-3.5 text-emerald-600" />
                <span>Vista Polarist</span>
              </button>
            </div>
          )}

          {/* Vista Polarist (Espacio de Equipo) */}
          {currentEndpoint === 'polarist' && (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-zinc-900 text-white shadow-2xs font-bold text-xs sm:text-sm">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Vista Polarist</span>
              </div>

              {/* Botón para volver a su propio espacio personal */}
              <button
                type="button"
                onClick={() => {
                  const myEp: AppEndpoint =
                    currentUser.id === 'cristian'
                      ? 'cristian'
                      : currentUser.id === 'juli'
                      ? 'julieta'
                      : 'enzo';
                  onNavigateEndpoint(myEp);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100/90 hover:bg-zinc-200/80 text-zinc-700 hover:text-zinc-900 border border-zinc-200/70 text-xs font-medium transition-all shadow-2xs cursor-pointer"
                title={`Volver a mi espacio personal (${currentUser.name})`}
              >
                <User className="w-3.5 h-3.5 text-zinc-600" />
                <span>Mi espacio personal ({currentUser.name})</span>
              </button>
            </div>
          )}
        </div>

        {/* Derecha: Total USD + Botón de Acción + Botón de Salir */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3.5 flex-wrap">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-500 font-normal">{moneyLabel}</span>
            <span className="font-mono font-semibold text-zinc-900 text-sm tracking-tight">
              {activeTab === 'objectives'
                ? `$${objectiveCompleted.toLocaleString('en-US')} / $${objectiveTarget.toLocaleString('en-US')} USD`
                : activeTab === 'finance'
                ? `$${financeBalance.toLocaleString('en-US', { maximumFractionDigits: 0 })} USD`
                : activeTab === 'clients'
                ? `${clientsCount} registrados`
                : `$${displayedValue.toLocaleString('en-US')} USD`}
            </span>
          </div>

          {/* Botón superior: Visible en Tablero/Calendario (+ Nueva Acción) y en Clientes (+ Nuevo Cliente) */}
          {(activeTab === 'board' || activeTab === 'calendar') && (
            <button
              type="button"
              onClick={onOpenCreateModal}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium tracking-wide transition-all shadow-sm active:scale-95 flex-shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Nueva Acción</span>
            </button>
          )}

          {activeTab === 'clients' && (
            <button
              type="button"
              onClick={onOpenCreateClientModal || onOpenCreateModal}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium tracking-wide transition-all shadow-sm active:scale-95 flex-shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Nuevo Cliente</span>
            </button>
          )}

          {/* Botón Salir / Cerrar Sesión */}
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-zinc-200/80 hover:border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900 text-xs font-medium transition-all shadow-2xs cursor-pointer flex-shrink-0"
            title="Cerrar sesión"
          >
            <LogOut className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>


      {/* Fila Inferior: Filtros de Miembros (Modo Team) / Contexto + Pestañas de Vista */}
      <div className="flex flex-col items-stretch justify-between gap-3 border-t border-zinc-100 pt-2.5 lg:flex-row lg:items-center">
        {/* Izquierda: En modo Polarist, selector para filtrar por miembro */}
        <div className="flex items-center flex-wrap gap-1.5 text-xs">
          {currentEndpoint === 'polarist' ? (
            <div className="flex w-full max-w-full items-center gap-1 overflow-x-auto rounded-lg border border-zinc-200/60 bg-zinc-100/80 p-1 lg:w-auto">
              <span className="shrink-0 px-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                Miembro:
              </span>
              <button
                type="button"
                onClick={() => onSelectTeamMember(null)}
                className={`shrink-0 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  selectedTeamMemberEmail === null
                    ? 'bg-white text-zinc-900 shadow-xs font-semibold'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                Todos
              </button>

              {APP_USERS.map((user) => {
                const isSelected = selectedTeamMemberEmail === user.email;
                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => onSelectTeamMember(user.email)}
                    className={`inline-flex shrink-0 items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white text-zinc-900 shadow-xs font-semibold'
                        : 'text-zinc-500 hover:text-zinc-800'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: user.avatarColor }}
                    />
                    <span>{user.name}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <span className="text-zinc-500 text-xs flex items-center gap-1.5">
              <span>Espacio de</span>
              <span className="font-semibold text-zinc-800 flex items-center gap-1">
                <span
                  className="w-2 h-2 rounded-full inline-block"
                  style={{ backgroundColor: currentUser.avatarColor }}
                />
                {currentUser.name}
              </span>
              <span className="text-zinc-400 font-mono text-[11px]">({currentUser.email})</span>
            </span>
          )}
        </div>

        {/* Derecha: Selector de Vistas (Tablero, Calendario, Completados, Clientes) */}
        <div className="flex min-w-0 items-center justify-between gap-2 lg:justify-end">
          <div className="flex max-w-full items-center overflow-x-auto p-1 bg-zinc-100/90 rounded-lg border border-zinc-200/60 text-xs">
            <button
              type="button"
              onClick={() => onTabChange('board')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all font-medium cursor-pointer ${
                activeTab === 'board'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Tablero</span>
              {activeCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full leading-none font-mono ${
                    activeTab === 'board'
                      ? 'bg-zinc-100 text-zinc-700'
                      : 'bg-zinc-200/70 text-zinc-500'
                  }`}
                >
                  {activeCount}
                </span>
              )}
            </button>

            {currentEndpoint === 'polarist' && (
              <button
                type="button"
                onClick={() => onTabChange('objectives')}
                className={`flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-md transition-all font-medium cursor-pointer ${
                  activeTab === 'objectives'
                    ? 'bg-white text-zinc-900 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                <Target className="w-3.5 h-3.5 text-emerald-600" />
                <span>Objetivos</span>
              </button>
            )}

            {currentEndpoint === 'polarist' && (
              <button
                type="button"
                onClick={() => onTabChange('finance')}
                className={`flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-md transition-all font-medium cursor-pointer ${
                  activeTab === 'finance'
                    ? 'bg-white text-zinc-900 shadow-xs'
                    : 'text-zinc-500 hover:text-zinc-800'
                }`}
              >
                <WalletCards className="h-3.5 w-3.5 text-amber-600" />
                <span>Finanzas</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onTabChange('calendar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all font-medium cursor-pointer ${
                activeTab === 'calendar'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5 text-zinc-700" />
              <span>Calendario</span>
              {calendarActiveCount !== undefined && calendarActiveCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full leading-none font-mono ${
                    activeTab === 'calendar'
                      ? 'bg-zinc-100 text-zinc-700'
                      : 'bg-zinc-200/70 text-zinc-500'
                  }`}
                >
                  {calendarActiveCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => onTabChange('completed')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all font-medium cursor-pointer ${
                activeTab === 'completed'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Completados</span>
              {completedCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full leading-none font-mono ${
                    activeTab === 'completed'
                      ? 'bg-emerald-100 text-emerald-800 font-semibold'
                      : 'bg-zinc-200/70 text-zinc-600'
                  }`}
                >
                  {completedCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => onTabChange('clients')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all font-medium cursor-pointer ${
                activeTab === 'clients'
                  ? 'bg-white text-zinc-900 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>Clientes</span>
              {clientsCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full leading-none font-mono ${
                    activeTab === 'clients'
                      ? 'bg-blue-100 text-blue-800 font-semibold'
                      : 'bg-zinc-200/70 text-zinc-600'
                  }`}
                >
                  {clientsCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
