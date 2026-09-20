import { AppEndpoint } from '../types';

export const VALID_ENDPOINTS: AppEndpoint[] = ['enzo', 'cristian', 'julieta', 'polarist'];

export const ENDPOINT_TITLES: Record<AppEndpoint, string> = {
  enzo: 'Planifier | Vista personal Enzo',
  cristian: 'Planifier | Vista personal Cristian',
  julieta: 'Planifier | Vista personal Julieta',
  polarist: 'Planifier | Vista Polarist',
};

/**
 * Detecta el endpoint actual desde window.location.pathname (/enzo),
 * window.location.hash (#/enzo o #enzo), o null si no se detectó.
 */
export const getEndpointFromUrl = (): AppEndpoint | null => {
  if (typeof window === 'undefined') return null;

  // 1. Extraer del pathname: /enzo -> 'enzo'
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '').toLowerCase();
  if (VALID_ENDPOINTS.includes(path as AppEndpoint)) {
    return path as AppEndpoint;
  }

  // 2. Extraer del hash: #/enzo o #enzo -> 'enzo'
  const hash = window.location.hash.replace(/^#\/?/, '').toLowerCase();
  if (VALID_ENDPOINTS.includes(hash as AppEndpoint)) {
    return hash as AppEndpoint;
  }

  return null;
};

/**
 * Determina el endpoint inicial:
 * 1. Desde URL (pathname o hash)
 * 2. Desde localStorage ('planifier_current_endpoint')
 * 3. Por defecto 'enzo'
 */
export const getInitialEndpoint = (): AppEndpoint => {
  const fromUrl = getEndpointFromUrl();
  if (fromUrl) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('planifier_current_endpoint', fromUrl);
    }
    return fromUrl;
  }

  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('planifier_current_endpoint') as AppEndpoint | null;
    if (saved && VALID_ENDPOINTS.includes(saved)) {
      return saved;
    }
  }

  return 'enzo';
};

/**
 * Navega a un endpoint usando pushState y actualiza document.title y localStorage.
 * Despacha un evento 'endpointchange' para que los suscriptores reaccionen de inmediato.
 */
export const navigateEndpoint = (endpoint: AppEndpoint): void => {
  if (typeof window === 'undefined') return;

  if (VALID_ENDPOINTS.includes(endpoint)) {
    localStorage.setItem('planifier_current_endpoint', endpoint);
    window.history.pushState(null, '', '/' + endpoint);
    document.title = ENDPOINT_TITLES[endpoint];
    window.dispatchEvent(new Event('endpointchange'));
  }
};

/**
 * Suscribe un callback a cambios de endpoint vía popstate (atrás/adelante), hashchange y endpointchange.
 * Retorna función de desuscripción.
 */
export const subscribeToEndpointChange = (callback: (endpoint: AppEndpoint) => void): (() => void) => {
  if (typeof window === 'undefined') return () => {};

  const handler = () => {
    const fromUrl = getEndpointFromUrl();
    const saved = localStorage.getItem('planifier_current_endpoint') as AppEndpoint | null;
    const ep = fromUrl || saved || 'enzo';
    const validEp = VALID_ENDPOINTS.includes(ep) ? ep : 'enzo';
    document.title = ENDPOINT_TITLES[validEp];
    callback(validEp);
  };

  window.addEventListener('popstate', handler);
  window.addEventListener('hashchange', handler);
  window.addEventListener('endpointchange', handler);

  return () => {
    window.removeEventListener('popstate', handler);
    window.removeEventListener('hashchange', handler);
    window.removeEventListener('endpointchange', handler);
  };
};
