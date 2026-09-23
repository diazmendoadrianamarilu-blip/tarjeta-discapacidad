/**
 * Resolución de la identidad del docente logueado.
 *
 * EL PROBLEMA QUE RESUELVE ESTE ARCHIVO
 * -------------------------------------
 * `useUserInfo()` del SDK de Experience no garantiza devolver el código Banner.
 * La documentación pública del paquete de hooks solo promete `firstName`,
 * `locale`, `roles` y `tenantId`. Por eso `userInfo.bannerId` venía undefined
 * y la página moría con "No se pudo identificar tu usuario".
 *
 * En vez de apostar a un nombre de campo, este módulo:
 *   1. barre TODAS las claves plausibles de `useUserInfo()`,
 *   2. si no encuentra nada, decodifica el JWT de la extensión y barre sus claims,
 *   3. si tampoco, usa el respaldo manual de `config.js`,
 *   4. y en cualquier caso devuelve un diagnóstico con lo que sí había disponible,
 *      para que una sola publicación nos diga cuál es el campo correcto en USS.
 */

import { DOCENTE_RESPALDO } from '../config';
import { obtenerPidm } from './discapacidad';

/* Nombres de campo candidatos, del más probable al menos. */
const CLAVES_BANNER_ID = [
  'bannerId', 'bannerID', 'banner_id',
  'colleagueId', 'colleaguePersonId',
  'personId', 'person_id',
  'userId', 'user_id',
  'accountId', 'account_id',
  'id', 'sub',
  'externalId', 'erpId', 'sourceSystemId',
];

const CLAVES_PIDM = ['pidm', 'PIDM', 'bannerPidm', 'person_pidm'];

/** Un valor sirve como identificador si es texto o número no vacío. */
function valorUtil(v) {
  if (v === null || v === undefined) return false;
  if (typeof v === 'number') return Number.isFinite(v);
  if (typeof v === 'string') return v.trim().length > 0;
  return false;
}

/** Busca la primera clave presente en un objeto (sin recorrer anidados). */
function primeraClave(objeto, claves) {
  if (!objeto || typeof objeto !== 'object') return null;
  for (const clave of claves) {
    if (valorUtil(objeto[clave])) {
      return { clave, valor: objeto[clave] };
    }
  }
  return null;
}

/** Decodifica el payload de un JWT sin validar la firma (solo lectura local). */
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
    console.warn('[identidad] No se pudo decodificar el JWT de la extensión:', err);
    return null;
  }
}

/**
 * Resuelve quién es el docente.
 *
 * @returns {Promise<{pidm:number|null, bannerId:string|null, origen:string,
 *                    diagnostico:object}>}
 */
export async function resolverDocente({ userInfo, getExtensionJwt, getEthosQuery }) {
  const diagnostico = {
    clavesUserInfo: userInfo && typeof userInfo === 'object' ? Object.keys(userInfo) : [],
    clavesJwt: [],
    encontradoEn: null,
    notas: [],
  };

  let bannerId = null;
  let pidm = null;
  let origen = null;

  /* ---- 1. useUserInfo() ------------------------------------------------- */
  const enUserInfoPidm = primeraClave(userInfo, CLAVES_PIDM);
  if (enUserInfoPidm) {
    pidm = Number(enUserInfoPidm.valor);
    origen = `useUserInfo().${enUserInfoPidm.clave}`;
    diagnostico.encontradoEn = origen;
  }

  const enUserInfo = primeraClave(userInfo, CLAVES_BANNER_ID);
  if (enUserInfo) {
    bannerId = String(enUserInfo.valor);
    if (!origen) {
      origen = `useUserInfo().${enUserInfo.clave}`;
      diagnostico.encontradoEn = origen;
    }
  }

  /* ---- 2. JWT de la extensión ------------------------------------------- */
  if (!bannerId && !pidm && typeof getExtensionJwt === 'function') {
    try {
      const jwt = await getExtensionJwt();
      const payload = leerPayloadJwt(jwt);
      if (payload) {
        diagnostico.clavesJwt = Object.keys(payload);

        const jwtPidm = primeraClave(payload, CLAVES_PIDM);
        if (jwtPidm) {
          pidm = Number(jwtPidm.valor);
          origen = `jwt.${jwtPidm.clave}`;
          diagnostico.encontradoEn = origen;
        }

        const jwtId = primeraClave(payload, CLAVES_BANNER_ID);
        if (jwtId) {
          bannerId = String(jwtId.valor);
          if (!origen) {
            origen = `jwt.${jwtId.clave}`;
            diagnostico.encontradoEn = origen;
          }
        }
      }
    } catch (err) {
      diagnostico.notas.push(`getExtensionJwt() falló: ${err.message}`);
    }
  }

  /* ---- 3. Respaldo manual de config.js ---------------------------------- */
  if (!pidm && !bannerId) {
    if (valorUtil(DOCENTE_RESPALDO.pidm)) {
      pidm = Number(DOCENTE_RESPALDO.pidm);
      origen = 'config.js (respaldo manual)';
      diagnostico.notas.push(
        'No se encontró la identidad en la sesión; se usó el PIDM de respaldo.',
      );
    } else if (valorUtil(DOCENTE_RESPALDO.bannerId)) {
      bannerId = String(DOCENTE_RESPALDO.bannerId);
      origen = 'config.js (respaldo manual)';
    }
  }

  /* ---- 4. Traducir código Banner -> PIDM -------------------------------- */
  if (!pidm && bannerId && getEthosQuery) {
    try {
      const resuelto = await obtenerPidm({ idpersona: bannerId }, { getEthosQuery });
      if (valorUtil(resuelto)) {
        pidm = Number(resuelto);
      } else {
        diagnostico.notas.push(
          `x-persona-pidm no devolvió PIDM para "${bannerId}".`,
        );
      }
    } catch (err) {
      diagnostico.notas.push(`x-persona-pidm falló: ${err.message}`);
    }
  }

  return { pidm: pidm || null, bannerId, origen, diagnostico };
}