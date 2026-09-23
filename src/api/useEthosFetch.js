import { useCallback, useRef } from 'react';
import { useData } from '@ellucian/experience-extension-utils';

/* authenticatedEthosFetch estable entre renders: si Experience entrega una
   función nueva en cada render, las consultas no se vuelven a disparar. */
export function useEthosFetch() {
  const { authenticatedEthosFetch } = useData();
  const ultima = useRef(authenticatedEthosFetch);
  ultima.current = authenticatedEthosFetch;

  return useCallback((...argumentos) => {
    if (typeof ultima.current !== 'function') {
      return Promise.reject(new Error('authenticatedEthosFetch no está disponible en useData()'));
    }
    return ultima.current(...argumentos);
  }, []);
}
