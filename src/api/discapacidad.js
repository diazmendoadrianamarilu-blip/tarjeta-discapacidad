/* eslint-env browser */

async function ejecutar(recurso, params, ctx) {
  const { getEthosQuery } = ctx;
  if (!getEthosQuery) {
    throw new Error('No hay funcion de consulta disponible. Revisa api/discapacidad.js');
  }
  
  // CORRECCIÓN CLAVE AQUÍ: getEthosQuery exige un único objeto como argumento
  const respuesta = await getEthosQuery({
    queryId: recurso,
    searchParameters: params
  });
  
  if (Array.isArray(respuesta)) return respuesta;
  if (respuesta && Array.isArray(respuesta.data)) return respuesta.data;
  return [];
}

export async function listarAlumnosDelDocente({ pidmdocente, term }, ctx) {
  const filas = await ejecutar('x-discapacidad-docente', { pidmdocente, term }, ctx);
  return agruparPorAlumno(filas);
}

export async function obtenerDetalleAlumno({ idalumno, term }, ctx) {
  const filas = await ejecutar('x-discapacidad-detalle', { idalumno, term }, ctx);
  return filas[0] || null;
}

export async function obtenerPidm({ idpersona }, ctx) {
  const filas = await ejecutar('x-persona-pidm', { idpersona }, ctx);
  return filas[0] ? filas[0].pidm : null;
}

export async function mapaCursosDelDocente({ iddocente, term }, ctx) {
  const filas = await ejecutar('x-asignacion-docente', { iddocente, term }, ctx);
  const mapa = {};
  filas.forEach((f) => { if (f.crn) mapa[f.crn] = f.title || f.curso; });
  return mapa;
}

export function agruparPorAlumno(filas) {
  const porAlumno = new Map();

  filas.forEach((f) => {
    const clave = f.idAlumno;
    if (!porAlumno.has(clave)) {
      porAlumno.set(clave, {
        idAlumno: f.idAlumno,
        nombres: f.nombres || '',
        apellidos: f.apellidos || '',
        nombreCompleto: `${f.nombres || ''} ${f.apellidos || ''}`.trim(),
        periodo: f.periodo,
        discapacidades: [],
        secciones: [],
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
        curso: f.curso || null,
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

export function descargarReporte(alumnos, periodo) {
  const cabecera = ['Codigo', 'Apellidos', 'Nombres', 'Tipo de discapacidad',
                    'Principal', 'NRC', 'Curso', 'Periodo'];
  const lineas = [cabecera];

  alumnos.forEach((a) => {
    const tipos = a.discapacidades.map((d) => d.descripcion).join(' / ');
    const principal = a.discapacidades.some((d) => d.principal) ? 'Si' : 'No';
    if (a.secciones.length === 0) {
      lineas.push([a.idAlumno, a.apellidos, a.nombres, tipos, principal, '', '', periodo]);
    } else {
      a.secciones.forEach((s) => {
        const curso = s.curso || `${s.codMateria} ${s.numCurso}`;
        lineas.push([a.idAlumno, a.apellidos, a.nombres, tipos, principal,
                     s.nrc, curso, periodo]);
      });
    }
  });

  const csv = lineas
    .map((fila) => fila.map((c) => `"${String(c == null ? '' : c).replace(/"/g, '""')}"`).join(';'))
    .join('\r\n');

  // eslint-disable-next-line no-undef
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  // eslint-disable-next-line no-undef
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = `alumnos-discapacidad-${periodo}.csv`;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  // eslint-disable-next-line no-undef
  URL.revokeObjectURL(url);
}