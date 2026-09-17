import React from 'react';
import { APP_USERS } from '../types';
import { ArrowRight, ShieldCheck } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (email: string) => void;
  bgImage?: string;
  bgOpacity?: number;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  bgImage = '/BgPolarist.png',
  bgOpacity = 30,
}) => {
  const resolvedBg = bgImage || '/BgPolarist.png';

  return (
    <>
      {/* Fondo nítido con transición */}
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center transition-all duration-700 ease-out"
        style={{ backgroundImage: `url("${resolvedBg}")` }}
      />
      {/* Capa blanca suave para dar legibilidad */}
      <div
        className="fixed inset-0 -z-10 bg-white transition-all duration-700 ease-out"
        style={{ opacity: bgOpacity / 100 }}
      />

      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white/95 backdrop-blur-xl rounded-2xl p-6 sm:p-7 border border-white/80 shadow-2xl shadow-zinc-900/10 text-zinc-900 animate-in fade-in zoom-in-95 duration-200">
          {/* Logo / Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-zinc-900 text-white flex items-center justify-center shadow-md shadow-zinc-900/10">
              <ShieldCheck className="w-6 h-6 text-emerald-400 stroke-[2.2]" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              Plannifier
            </h1>
          </div>

          {/* Accesos rápidos a los 3 perfiles */}
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 px-1 mb-2.5">
              Elegí tu perfil
            </div>
            <div className="space-y-2.5">
              {APP_USERS.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => onLogin(user.email)}
                  className="w-full group flex items-center justify-between p-3 rounded-xl border border-zinc-200/80 bg-zinc-50/70 hover:bg-white hover:border-zinc-300 hover:shadow-md transition-all text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-xs flex-shrink-0"
                      style={{ backgroundColor: user.avatarColor }}
                    >
                      {user.initials}
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-zinc-800 group-hover:text-zinc-900 transition-colors">
                        {user.name}
                      </div>
                      <div className="text-xs text-zinc-400 font-mono truncate">
                        {user.email}
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-800 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};