/*
 * Identificación del docente autenticado, en secuencia:
 *   1. x-docente-sesion: Banner devuelve el PIDM del usuario del token
 *      (SPRIDEN_PIDM = %%SECURITY_PRINCIPAL_ID%%). No se envía nada desde el navegador.
 *   2. Respaldo: si (1) no devuelve filas o falla, se lee el código Banner
 *      (SPRIDEN_ID) del JWT de Experience (user.erpId) y x-persona-pidm lo
 *      traduce a PIDM.
 *
 * El erpId del JWT es SPRIDEN_ID (p. ej. "100723307"), NO el PIDM: nunca se
 * envía directamente como pidmdocente.
 */
import { obtenerDocenteSesion, obtenerPidmPorId } from './discapacidad';

const CLAVES_ID_BANNER = ['erpId', 'bannerId', 'spridenId', 'idPersona'];

function valorUtil(v) {
  if (v === null || v === undefined) return false;
  if (typeof v === 'number') return Number.isFinite(v);
  if (typeof v === 'string') return v.trim().length > 0;
  return false;
}

function buscarClave(objeto, claves, profundidad = 0) {
  if (!objeto || typeof objeto !== 'object' || profundidad > 3) return null;

  for (const clave of claves) {
    if (valorUtil(objeto[clave])) return String(objeto[clave]).trim();
  }
  for (const valor of Object.values(objeto)) {
    if (valor && typeof valor === 'object' && !Array.isArray(valor)) {
      const hallado = buscarClave(valor, claves, profundidad + 1);
      if (hallado) return hallado;
    }
  }
  return null;
}

export function leerPayloadJwt(jwt) {
  try {
    if (!jwt || typeof jwt !== 'string') return null;
    const partes = jwt.split('.');
    if (partes.length < 2) return null;
    const base64 = partes[1].replace(/-/g, '+').replace(/_/g, '/');
    const relleno = base64 + '==='.slice((base64.length + 3) % 4);
    const texto = decodeURIComponent(
      window.atob(relleno)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(texto);
  } catch (err) {
    console.warn('[identidad] No se pudo decodificar el JWT:', err);
    return null;
  }
}

async function idBannerDesdeJwt(getExtensionJwt) {
  if (typeof getExtensionJwt !== 'function') return null;
  try {
    const payload = leerPayloadJwt(await getExtensionJwt());
    return payload ? buscarClave(payload, CLAVES_ID_BANNER) : null;
  } catch (err) {
    console.warn('[identidad] No se pudo obtener el JWT de Experience:', err);
    return null;
  }
}

export class ErrorIdentidad extends Error {
  constructor(intentos) {
    super('No se pudo identificar al docente en Banner.');
    this.name = 'ErrorIdentidad';
    this.tipo = 'identidad';
    this.intentos = intentos;
  }
}

/* Devuelve { pidm, idPersona, nombre, origen } o lanza ErrorIdentidad con el
   resultado de cada intento (se muestra en el panel de diagnóstico). */
export async function resolverDocente(authenticatedEthosFetch, getExtensionJwt) {
  const intentos = [];

  try {
    const docente = await obtenerDocenteSesion(authenticatedEthosFetch);
    if (docente) return { ...docente, origen: 'x-docente-sesion' };
    intentos.push('x-docente-sesion: respondió sin filas para el usuario de la sesión.');
  } catch (err) {
    intentos.push(`x-docente-sesion: ${err.message || err}`);
  }

  const idBanner = await idBannerDesdeJwt(getExtensionJwt);
  if (!idBanner) {
    intentos.push('JWT de Experience: no trae el código Banner (erpId).');
    throw new ErrorIdentidad(intentos);
  }

  try {
    const docente = await obtenerPidmPorId(authenticatedEthosFetch, idBanner);
    if (docente) return { ...docente, origen: 'x-persona-pidm' };
    intentos.push(`x-persona-pidm: sin filas para idpersona=${idBanner}.`);
  } catch (err) {
    intentos.push(`x-persona-pidm (idpersona=${idBanner}): ${err.message || err}`);
  }

  throw new ErrorIdentidad(intentos);
}
