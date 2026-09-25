/* eslint-env browser */

async function ejecutar(recurso, params, getEthosQuery) {
  if (!getEthosQuery) {
    throw new Error('No hay funcion de consulta getEthosQuery disponible.');
  }

  const opciones = { queryId: recurso };
  if (params && Object.keys(params).length > 0) {
    opciones.searchParameters = params;
  }

  const respuesta = await getEthosQuery(opciones);
  
  if (Array.isArray(respuesta)) return respuesta;
  if (respuesta && Array.isArray(respuesta.data)) return respuesta.data;
  return [];
}

export async function listarAlumnosDelDocente(getEthosQuery, { pidmdocente, term }) {
  // Aseguramos que viaja como número
  const filas = await ejecutar('x-bienestar-docente-lista', { pidmdocente: Number(pidmdocente), term }, getEthosQuery);
  return agruparPorAlumno(filas);
}

export async function obtenerDetalleAlumno(getEthosQuery, { idalumno, term }) {
  const filas = await ejecutar('x-discapacidad-detalle', { idalumno, term }, getEthosQuery);
  return filas[0] || null;
}

export function agruparPorAlumno(filas) {
  const porAlumno = new Map();

  filas.forEach((f) => {
    const clave = f.idAlumno;
    if (!clave) return;
    
    if (!porAlumno.has(clave)) {
      porAlumno.set(clave, {
        idAlumno: f.idAlumno,
        nombres: f.nombres || '',
        apellidos: f.apellidos || '',
        nombreCompleto: `${f.nombres || ''} ${f.apellidos || ''}`.trim(),
        periodo: f.periodo,
        discapacidades: [],
        secciones: [],
        carrera: null
      });
    }
    const a = porAlumno.get(clave);

    const yaTieneDisc = a.discapacidades.some((d) => d.codigo === f.codDiscapacidad);
    if (!yaTieneDisc && f.codDiscapacidad) {
      a.discapacidades.push({
        codigo: f.codDiscapacidad,
        descripcion: f.tipoDiscapacidad,
        principal: f.esPrincipal === 'Y',
      });
    }

    const yaTieneNrc = a.secciones.some((s) => s.nrc === f.nrc);
    if (!yaTieneNrc && f.nrc) {
      a.secciones.push({
        nrc: f.nrc,
        codMateria: f.codMateria,
        numCurso: f.numCurso,
        seccion: f.seccion,
        curso: f.curso || `${f.codMateria} ${f.numCurso}`,
      });
    }
  });

  porAlumno.forEach((a) => {
    a.discapacidades.sort((x, y) => (y.principal === true) - (x.principal === true));
  });

  return Array.from(porAlumno.values())
    .sort((a, b) => a.nombreCompleto.localeCompare(b.nombreCompleto, 'es'));
}

export function iniciales(nombres = '', apellidos = '') {
  const a = (nombres.trim().split(/\s+/)[0] || '')[0] || '';
  const b = (apellidos.trim().split(/\s+/)[0] || '')[0] || '';
  return (a + b).toUpperCase();
}

export function formatearFecha(valor) {
  if (!valor) return null;
  const m = String(valor).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return String(valor);
  const fecha = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'long', year: 'numeric' }).format(fecha);
}