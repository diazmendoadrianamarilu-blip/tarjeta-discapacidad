const CLAVES_PIDM = ['pidm', 'PIDM', 'bannerPidm', 'person_pidm', 'erpId'];

function valorUtil(v) {
  if (v === null || v === undefined) return false;
  if (typeof v === 'number') return Number.isFinite(v);
  if (typeof v === 'string') return v.trim().length > 0;
  return false;
}

function buscarClave(objeto, claves, prefijo = '', profundidad = 0) {
  if (!objeto || typeof objeto !== 'object' || profundidad > 3) return null;

  for (const clave of claves) {
    if (valorUtil(objeto[clave])) {
      return { ruta: prefijo ? `${prefijo}.${clave}` : clave, valor: objeto[clave] };
    }
  }
  for (const [nombre, valor] of Object.entries(objeto)) {
    if (valor && typeof valor === 'object' && !Array.isArray(valor)) {
      const hallado = buscarClave(
        valor, claves, prefijo ? `${prefijo}.${nombre}` : nombre, profundidad + 1,
      );
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
    console.warn('No se pudo decodificar el JWT:', err);
    return null;
  }
}

export async function resolverDocente({ getExtensionJwt }) {
  let pidm = null;

  if (typeof getExtensionJwt === 'function') {
    try {
      const jwt = await getExtensionJwt();
      const payload = leerPayloadJwt(jwt);
      if (payload) {
        const jwtPidm = buscarClave(payload, CLAVES_PIDM);
        if (jwtPidm) {
          pidm = Number(jwtPidm.valor);
        }
      }
    } catch (err) {
      console.error('Error al obtener JWT', err);
    }
  }

  return { 
    pidm: pidm || null, 
    bannerId: null, 
    nombre: null, 
    origen: pidm ? 'JWT' : null, 
    diagnostico: null 
  };
}