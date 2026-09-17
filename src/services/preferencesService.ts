import { supabase } from '../utils/supabase';

export interface UserPreferences {
  userEmail: string;
  bgImage: string;
  bgOpacity: number;
  activeSubpage?: string;
  settings?: Record<string, any>;
}

const DEFAULT_BG = '/Bg.png';
const DEFAULT_OPACITY = 30;

/**
 * Obtiene las preferencias almacenadas en localStorage de forma síncrona
 * con aislamiento estricto por userEmail (clave: plannifier_pref_${userEmail}).
 */
export function getStoredPreferences(userEmail: string): UserPreferences {
  const defaults: UserPreferences = {
    userEmail,
    bgImage: DEFAULT_BG,
    bgOpacity: DEFAULT_OPACITY,
    activeSubpage: 'board',
    settings: {},
  };

  if (!userEmail) return defaults;

  try {
    const raw = localStorage.getItem(`plannifier_pref_${userEmail}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...defaults,
        ...parsed,
        userEmail,
      };
    }

    // Fallback inteligente para migración de claves previas por email
    const legacyBg = localStorage.getItem(`plannifier_bg_image_${userEmail}`);
    const legacyOpacity = localStorage.getItem(`plannifier_bg_opacity_${userEmail}`);
    if (legacyBg || legacyOpacity) {
      const migrated: UserPreferences = {
        ...defaults,
        bgImage: legacyBg || defaults.bgImage,
        bgOpacity: legacyOpacity ? Number(legacyOpacity) : defaults.bgOpacity,
      };
      localStorage.setItem(`plannifier_pref_${userEmail}`, JSON.stringify(migrated));
      return migrated;
    }
  } catch (err) {
    console.warn(`[preferencesService] Error al leer localStorage para ${userEmail}:`, err);
  }

  return defaults;
}

export const preferencesService = {
  getStoredPreferences,

  /**
   * Carga las preferencias del usuario:
   * 1. Lee primero de localStorage con clave única plannifier_pref_${userEmail} para respuesta instantánea.
   * 2. Si no existe en localStorage, usa valores por defecto (bgImage: '/Bg.png', bgOpacity: 30).
   * 3. Consulta en segundo plano la tabla plannifier_user_preferences en Supabase (user_email.eq.${userEmail}).
   *    Si hay datos en Supabase, los guarda en localStorage y los retorna.
   */
  async loadPreferences(userEmail: string): Promise<UserPreferences> {
    const localPref = getStoredPreferences(userEmail);

    if (!userEmail) return localPref;

    try {
      const { data, error } = await supabase
        .from('plannifier_user_preferences')
        .select('*')
        .eq('user_email', userEmail)
        .maybeSingle();

      if (error) {
        console.warn(`[preferencesService] Supabase load error para ${userEmail}:`, error.message);
        return localPref;
      }

      if (data) {
        const remotePref: UserPreferences = {
          userEmail: data.user_email,
          bgImage: data.bg_image || localPref.bgImage,
          bgOpacity: typeof data.bg_opacity === 'number' ? data.bg_opacity : localPref.bgOpacity,
          activeSubpage: data.active_subpage || localPref.activeSubpage,
          settings: data.settings || localPref.settings || {},
        };

        try {
          localStorage.setItem(`plannifier_pref_${userEmail}`, JSON.stringify(remotePref));
        } catch (e) {
          console.warn('[preferencesService] Error actualizando cache localStorage:', e);
        }

        return remotePref;
      }
    } catch (err) {
      console.warn(`[preferencesService] Excepción consultando Supabase para ${userEmail}:`, err);
    }

    return localPref;
  },

  /**
   * Guarda las preferencias del usuario:
   * 1. Guarda en localStorage bajo plannifier_pref_${userEmail}.
   *    ELIMINA cualquier clave global compartida (plannifier_bg_image, plannifier_bg_opacity).
   * 2. Realiza upsert en Supabase plannifier_user_preferences.
   */
  async savePreferences(userEmail: string, updates: Partial<UserPreferences>): Promise<void> {
    if (!userEmail) return;

    const current = getStoredPreferences(userEmail);
    const merged: UserPreferences = {
      ...current,
      ...updates,
      userEmail,
    };

    // 1. Persistencia síncrona en localStorage aislado
    try {
      localStorage.setItem(`plannifier_pref_${userEmail}`, JSON.stringify(merged));

      // ELIMINAR cualquier residuo en claves globales compartidas
      localStorage.removeItem('plannifier_bg_image');
      localStorage.removeItem('plannifier_bg_opacity');
      localStorage.removeItem(`plannifier_bg_image_${userEmail}`);
      localStorage.removeItem(`plannifier_bg_opacity_${userEmail}`);
    } catch (err) {
      console.warn(`[preferencesService] Error al guardar en localStorage para ${userEmail}:`, err);
    }

    // 2. Persistencia en Supabase
    try {
      const { error } = await supabase.from('plannifier_user_preferences').upsert(
        {
          user_email: userEmail,
          bg_image: merged.bgImage,
          bg_opacity: merged.bgOpacity,
          active_subpage: merged.activeSubpage,
          settings: merged.settings || {},
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_email' }
      );

      if (error) {
        console.warn(`[preferencesService] Error upsert Supabase para ${userEmail}:`, error.message);
      }
    } catch (err) {
      console.warn(`[preferencesService] Excepción upsert Supabase para ${userEmail}:`, err);
    }
  },
};
