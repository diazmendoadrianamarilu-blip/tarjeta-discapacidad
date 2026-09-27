/*
 * Acceso a las APIs de API Designer (ver src/config.js → API).
 *
 * Por qué NO se usa getEthosQuery: getEthosQuery solo ejecuta consultas GraphQL
 * de Ethos declaradas dentro de la tarjeta (cards[].queries). Las APIs de API
 * Designer son REST; el proxy /api/ethos-query no las conoce y responde 400
 * ("Request Failed for the queryId").
 *
 * authenticatedEthosFetch llama al proxy REST de Ethos con el token del usuario
 * de la sesión, que es lo que exigen las APIs con rol SELFSERVICE-FACULTY y lo
 * que hace funcionar %%SECURITY_PRINCIPAL_ID%%.
 *
 * En este tenant, las APIs con "Autenticación del usuario" rechazan cualquier
 * parámetro de consulta propio (400 "Parámetros [...] no esperados"). Por eso
 * las APIs "-sesion" no reciben parámetros: Banner filtra por el docente de la
 * sesión (SIRASGN_PIDM = SECURITY_PRINCIPAL_ID) y solo viajan offset/limit.
 */
import { API, LISTA_FILTRADA_POR_SESION } from '../config';

const TAMANO_PAGINA = 500;
const MAX_PAGINAS = 40;

export class ErrorApi extends Error {
  constructor(recurso, estado, detalle) {
    super(`${recurso} respondió ${estado || 'sin estado'}${detalle ? `: ${detalle}` : ''}`);
    this.name = 'ErrorApi';
    this.recurso = recurso;
    this.estado = estado;
    this.detalle = detalle;
  }
}

function aceptar(version) {
  return `application/vnd.hedtech.integration.v${version}+json`;
}

async function leerDetalleError(respuesta) {
  try {
    const texto = await respuesta.text();
    if (!texto) return '';
    try {
      const json = JSON.parse(texto);
      const primero = Array.isArray(json.errors) ? json.errors[0] : json;
      return (primero && (primero.message || primero.description || primero.code)) || texto;
    } catch {
      return texto.slice(0, 300);
    }
  } catch {
    return '';
  }
}

function aFilas(cuerpo) {
  if (Array.isArray(cuerpo)) return cuerpo;
  if (cuerpo && Array.isArray(cuerpo.data)) return cuerpo.data;
  return cuerpo ? [cuerpo] : [];
}

async function pedirPagina(authenticatedEthosFetch, { recurso, version }, parametros, offset) {
  const busqueda = new window.URLSearchParams();
  Object.entries(parametros).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== '') busqueda.append(clave, String(valor));
  });
  busqueda.append('offset', String(offset));
  busqueda.append('limit', String(TAMANO_PAGINA));

  let respuesta;
  try {
    respuesta = await authenticatedEthosFetch(`${recurso}?${busqueda.toString()}`, {
      method: 'GET',
      headers: { Accept: aceptar(version) },
    });
  } catch (err) {
    throw new ErrorApi(recurso, null, err && err.message ? err.message : 'error de red');
  }

  if (!respuesta) throw new ErrorApi(recurso, null, 'sin respuesta del proxy de Ethos');
  if (!respuesta.ok) {
    throw new ErrorApi(recurso, respuesta.status, await leerDetalleError(respuesta));
  }

  const cabecera = respuesta.headers && respuesta.headers.get
    ? respuesta.headers.get('x-total-count')
    : null;
  const total = cabecera === null || cabecera === '' ? NaN : Number(cabecera);
  return { filas: aFilas(await respuesta.json()), total: Number.isFinite(total) ? total : null };
}

/* GET paginado. Si la versión pedida aún no está registrada en Ethos (406) y
   la API tiene "respaldo", se repite con esa versión. */
async function consultar(authenticatedEthosFetch, api, parametros = {}) {
  if (typeof authenticatedEthosFetch !== 'function') {
    throw new ErrorApi(api.recurso, null, 'authenticatedEthosFetch no está disponible en useData()');
  }

  try {
    return await consultarVersion(authenticatedEthosFetch, api, parametros);
  } catch (err) {
    if (err.name === 'ErrorApi' && err.estado === 406 && api.respaldo) {
      console.warn(`[Bienestar] ${api.recurso} v${api.version} no disponible; se usa v${api.respaldo}`);
      return consultarVersion(authenticatedEthosFetch, { ...api, version: api.respaldo }, parametros);
    }
    throw err;
  }
}

/* El servidor puede devolver menos filas que el limit pedido (su maxPageSize
   manda). El tamaño real de página es el de la primera respuesta: se sigue
   pidiendo mientras lleguen páginas completas y no se alcance x-total-count. */
async function consultarVersion(authenticatedEthosFetch, api, parametros) {
  const filas = [];
  let tamanoReal = null;
  for (let pagina = 0; pagina < MAX_PAGINAS; pagina += 1) {
    const { filas: lote, total } = await pedirPagina(authenticatedEthosFetch, api, parametros, filas.length);
    filas.push(...lote);
    if (tamanoReal === null) tamanoReal = lote.length;
    if (lote.length === 0 || lote.length < tamanoReal) break;
    if (total !== null && filas.length >= total) break;
  }
  return filas;
}

/* APIs complementarias: si aún no existen o fallan, la tarjeta sigue con lo que tiene. */
async function consultarOpcional(authenticatedEthosFetch, api) {
  if (!api) return [];
  try {
    return await consultar(authenticatedEthosFetch, api);
  } catch (err) {
    console.warn(`[Bienestar] ${api.recurso} no disponible:`, err.message || err);
    return [];
  }
}

/* ---------- Identidad del docente ---------- */

function aPidm(valor) {
  const n = Number(valor);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function aDocente(fila) {
  if (!fila) return null;
  const pidm = aPidm(fila.pidm);
  if (!pidm) return null;
  return {
    pidm,
    idPersona: fila.idPersona || null,
    nombre: nombreCompleto(fila.nombres, fila.apellidos),
  };
}

/* x-docente-sesion: Banner filtra SPRIDEN_PIDM = SECURITY_PRINCIPAL_ID. */
export async function obtenerDocenteSesion(authenticatedEthosFetch) {
  const filas = await consultar(authenticatedEthosFetch, API.sesion);
  return aDocente(filas.find((f) => aPidm(f && f.pidm)));
}

/* x-persona-pidm: traduce el código Banner (SPRIDEN_ID) al PIDM interno. */
export async function obtenerPidmPorId(authenticatedEthosFetch, idpersona) {
  const id = String(idpersona || '').trim();
  if (!id) return null;
  const filas = await consultar(authenticatedEthosFetch, API.persona, { idpersona: id });
  return aDocente(filas.find((f) => f && f.idPersona === id) || filas[0]);
}

/* ---------- Tablero: periodos → cursos → alumnos ---------- */

/* Última consulta del tablero. La ficha se toma de aquí; si se entra directo a
   la URL de un alumno (sin pasar por la lista), se vuelve a consultar. */
let cacheTablero = null;

/* Devuelve { alumnos, periodos }. periodos = [{ periodo, cursos: [{ periodo,
   nrc, codigo, titulo, seccion, alumnos }] }], del periodo más reciente al más
   antiguo. Un alumno aparece en cada curso del docente en que esté matriculado. */
export async function cargarTablero(authenticatedEthosFetch, { pidm, term }) {
  const pidmdocente = aPidm(pidm);
  if (!LISTA_FILTRADA_POR_SESION && !pidmdocente) {
    throw new ErrorApi(API.lista.recurso, null, `PIDM del docente inválido (${pidm})`);
  }
  const parametros = LISTA_FILTRADA_POR_SESION ? {} : { pidmdocente, term };

  const promesa = Promise.all([
    consultar(authenticatedEthosFetch, API.lista, parametros),
    LISTA_FILTRADA_POR_SESION ? consultarOpcional(authenticatedEthosFetch, API.cursos) : [],
  ]).then(([filas, cursos]) => armarTablero(filas, cursos, term));

  cacheTablero = { term, promesa };
  promesa.catch(() => { if (cacheTablero && cacheTablero.promesa === promesa) cacheTablero = null; });
  return promesa;
}

export function armarTablero(filas, filasCursos, term) {
  const titulos = titulosDeCursos(filasCursos);
  const porAlumno = new Map();
  const cursos = new Map();

  filas.forEach((f) => {
    if (!f || !f.idAlumno) return;
    if (!porAlumno.has(f.idAlumno)) porAlumno.set(f.idAlumno, { filas: [], secciones: new Map() });
    const a = porAlumno.get(f.idAlumno);
    a.filas.push(f);

    const periodo = String(f.periodo || term || '');
    const clave = `${periodo}|${f.nrc || ''}`;
    if (!f.nrc) return;
    if (!cursos.has(clave)) {
      cursos.set(clave, {
        clave,
        periodo,
        nrc: String(f.nrc),
        codigo: [f.codMateria, f.numCurso].filter(Boolean).join(' '),
        seccion: f.seccion || null,
        titulo: tituloCurso(f.curso) || titulos.get(clave) || null,
        idsAlumnos: new Set(),
      });
    }
    cursos.get(clave).idsAlumnos.add(f.idAlumno);
    if (!a.secciones.has(clave)) a.secciones.set(clave, cursos.get(clave));
  });

  const alumnos = new Map();
  porAlumno.forEach(({ filas: propias, secciones }, id) => {
    const periodos = Array.from(secciones.values()).map((c) => c.periodo);
    const ultimoPeriodo = periodos.sort().pop() || term;
    const ficha = construirFicha(propias, ultimoPeriodo);
    alumnos.set(id, {
      idAlumno: ficha.idAlumno,
      nombres: ficha.nombres,
      apellidos: ficha.apellidos,
      nombreCompleto: ficha.nombreCompleto,
      carrera: ficha.carrera,
      discapacidades: ficha.discapacidades,
      secciones: Array.from(secciones.values()).map((c) => ({
        clave: c.clave, periodo: c.periodo, nrc: c.nrc, codigo: c.codigo, seccion: c.seccion, titulo: c.titulo,
      })),
      ficha,
    });
  });

  const porPeriodo = new Map();
  cursos.forEach(({ idsAlumnos, ...curso }) => {
    const lista = Array.from(idsAlumnos)
      .map((id) => alumnos.get(id))
      .sort((x, y) => x.apellidos.localeCompare(y.apellidos, 'es') || x.nombres.localeCompare(y.nombres, 'es'));
    if (!porPeriodo.has(curso.periodo)) porPeriodo.set(curso.periodo, []);
    porPeriodo.get(curso.periodo).push({ ...curso, alumnos: lista });
  });

  const periodos = Array.from(porPeriodo.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([periodo, lista]) => ({
      periodo,
      cursos: lista.sort((x, y) => x.codigo.localeCompare(y.codigo, 'es') || x.nrc.localeCompare(y.nrc)),
    }));

  return {
    alumnos: Array.from(alumnos.values())
      .sort((x, y) => x.nombreCompleto.localeCompare(y.nombreCompleto, 'es')),
    periodos,
  };
}

/* x-bienestar-cursos-sesion: título de la sección (SSBSECT_CRSE_TITLE) o, si
   está vacío, el del catálogo (SCBCRSE_TITLE) vigente para el periodo. */
function titulosDeCursos(filas) {
  const elegido = new Map();
  (filas || []).forEach((f) => {
    if (!f || !f.nrc) return;
    const clave = `${f.periodo || ''}|${f.nrc}`;
    const titulo = f.tituloSeccion || f.tituloCatalogo;
    if (!titulo) return;
    const peso = f.tituloSeccion ? 'z' : String(f.periodoCatalogo || '');
    const vigente = !f.periodoCatalogo || String(f.periodoCatalogo) <= String(f.periodo || '');
    if (!vigente && !f.tituloSeccion) return;
    const actual = elegido.get(clave);
    if (!actual || peso > actual.peso) elegido.set(clave, { peso, titulo });
  });
  const titulos = new Map();
  elegido.forEach(({ titulo }, clave) => titulos.set(clave, tituloCurso(titulo)));
  return titulos;
}

/* ---------- Ficha (Nivel 3) ---------- */

const cacheDetalle = new Map();

export async function obtenerDetalleAlumno(authenticatedEthosFetch, { idalumno, term }) {
  if (LISTA_FILTRADA_POR_SESION) {
    // x-discapacidad-detalle no admite idalumno con autenticación de usuario:
    // la ficha sale del tablero, que solo trae alumnos del docente de la sesión.
    const tablero = await (cacheTablero && cacheTablero.term === term
      ? cacheTablero.promesa
      : cargarTablero(authenticatedEthosFetch, { term }));
    const alumno = tablero.alumnos.find((a) => a.idAlumno === idalumno);
    return alumno ? { ...alumno.ficha, secciones: alumno.secciones } : null;
  }

  const clave = `${idalumno}|${term}`;
  if (!cacheDetalle.has(clave)) {
    const promesa = consultar(authenticatedEthosFetch, API.detalle, { idalumno, term })
      .then((filas) => construirFicha(filas, term));
    cacheDetalle.set(clave, promesa);
    promesa.catch(() => cacheDetalle.delete(clave));
  }
  return cacheDetalle.get(clave);
}

function codigoYDescripcion(codigo, descripcion) {
  if (!codigo && !descripcion) return null;
  return { codigo: codigo || null, descripcion: descripcion ? String(descripcion).trim() : null };
}

export function construirFicha(filas, term) {
  const validas = filas.filter(Boolean);
  if (validas.length === 0) return null;

  // Registro SGBSTDN vigente: el de TERM_CODE_EFF más reciente que no pase del
  // periodo. Si ninguno cumple (o la API no trae SGBSTDN), se usan todas.
  const enPeriodo = validas.filter((f) => f.periodoEfectivo && String(f.periodoEfectivo) <= String(term));
  const candidatas = enPeriodo.length > 0 ? enPeriodo : validas;
  const base = candidatas.reduce((mejor, f) => (
    String(f.periodoEfectivo || '') > String(mejor.periodoEfectivo || '') ? f : mejor
  ), candidatas[0]);

  const hoy = new Date().toISOString().slice(0, 10);
  const discapacidades = [];
  validas.forEach((f) => agregarDiscapacidad(discapacidades, f));
  const ordenadas = ordenarDiscapacidades(discapacidades);
  const vigentes = ordenadas.filter((d) => !d.vigenteHasta || String(d.vigenteHasta).slice(0, 10) >= hoy);

  return {
    idAlumno: base.idAlumno,
    nombres: nombrePropio(base.nombres),
    apellidos: nombrePropio(base.apellidos),
    nombreCompleto: nombreCompleto(base.nombres, base.apellidos),
    carrera: base.carrera ? nombrePropio(base.carrera) : (base.codCarrera || null),
    codCarrera: base.codCarrera || null,
    campus: codigoYDescripcion(base.campus, base.campusDesc),
    programa: codigoYDescripcion(base.programa, base.programaDesc),
    nivel: codigoYDescripcion(base.nivel, base.nivelDesc),
    escuela: codigoYDescripcion(base.escuela, base.escuelaDesc),
    departamento: codigoYDescripcion(base.departamento, base.departamentoDesc),
    ciclo: base.ciclo || null,
    tutor: elegirTutor(validas, term),
    estadoAlumno: base.estadoAlumno || null,
    periodo: base.periodoDiscapacidad || term,
    discapacidades: ordenadas,
    ajustesActivos: vigentes,
    vigente: vigentes.length > 0,
  };
}

/* SGRADVR: tutor principal con el TERM_CODE_EFF más reciente que no pase del periodo. */
function elegirTutor(filas, term) {
  const conTutor = filas.filter((f) => f.tutor || f.tutorId);
  if (conTutor.length === 0) return null;
  const vigentes = conTutor.filter((f) => !f.tutorPeriodo || String(f.tutorPeriodo) <= String(term));
  const opciones = vigentes.length > 0 ? vigentes : conTutor;
  const t = opciones.reduce((mejor, f) => {
    const clave = (x) => `${x.tutorPrincipal === 'Y' ? 1 : 0}${x.tutorPeriodo || ''}`;
    return clave(f) > clave(mejor) ? f : mejor;
  }, opciones[0]);
  return { nombre: t.tutor ? nombrePropio(t.tutor) : null, id: t.tutorId || null };
}

/* ---------- Datos personales (sección desplegable de la ficha) ---------- */

let cacheContacto = null;

/* x-bienestar-persona-sesion trae, sin parámetros, los datos de contacto de
   los alumnos con discapacidad del docente de la sesión. Se pide una sola vez
   y solo cuando se abre la sección. */
export async function obtenerDatosPersonales(authenticatedEthosFetch, idalumno) {
  if (!API.contacto) return null;
  if (!cacheContacto) {
    cacheContacto = consultar(authenticatedEthosFetch, API.contacto);
    cacheContacto.catch(() => { cacheContacto = null; });
  }
  const filas = (await cacheContacto).filter((f) => f && f.idAlumno === idalumno);
  return construirDatosPersonales(filas);
}

function activo(estado) {
  return estado !== 'I';
}

function unicosPor(lista, clave) {
  const vistos = new Set();
  return lista.filter((x) => {
    const k = clave(x);
    if (!k || vistos.has(k)) return false;
    vistos.add(k);
    return true;
  });
}

export function construirDatosPersonales(filas) {
  if (!filas || filas.length === 0) return null;
  const hoy = new Date().toISOString().slice(0, 10);

  const direcciones = unicosPor(
    filas.filter((f) => f.direccion && activo(f.direccionEstado)
      && (!f.direccionHasta || String(f.direccionHasta).slice(0, 10) >= hoy)),
    (f) => [f.tipoDireccion, f.direccion, f.direccion2, f.distrito].join('|'),
  ).map((f) => ({
    tipo: f.tipoDireccionDesc || f.tipoDireccion || null,
    linea: [f.direccion, f.direccion2].filter(Boolean).join(' '),
    distrito: f.distrito ? nombrePropio(f.distrito) : null,
    provincia: f.provinciaDesc || f.provincia || null,
    region: f.regionDesc || f.region || null,
    pais: f.paisDesc || f.pais || null,
  }));

  const telefonos = unicosPor(
    filas.filter((f) => f.telefonoNumero && activo(f.telefonoEstado))
      .sort((x, y) => Number(y.telefonoPrincipal === 'Y') - Number(x.telefonoPrincipal === 'Y')),
    (f) => `${f.telefonoArea || ''}${f.telefonoNumero}`,
  ).map((f) => ({
    numero: [f.telefonoArea, f.telefonoNumero].filter(Boolean).join(' '),
    tipo: f.tipoTelefonoDesc || f.tipoTelefono || null,
  }));

  const correos = unicosPor(
    filas.filter((f) => f.correo && activo(f.correoEstado))
      .sort((x, y) => Number(y.correoPreferido === 'Y') - Number(x.correoPreferido === 'Y')),
    (f) => String(f.correo).toLowerCase(),
  ).map((f) => ({ correo: f.correo, tipo: f.tipoCorreoDesc || f.tipoCorreo || null }));

  const nacimiento = filas.find((f) => f.fechaNacimiento);
  return {
    fechaNacimiento: nacimiento ? nacimiento.fechaNacimiento : null,
    direcciones,
    telefonos,
    correos,
  };
}

/* ---------- Utilidades ---------- */

/* Una entrada por código de STVDISA; si hay varias filas (una por registro
   SGBSTDN), se conserva la vigencia más amplia. */
function agregarDiscapacidad(lista, f) {
  if (!f.codDiscapacidad) return;
  const existente = lista.find((d) => d.codigo === f.codDiscapacidad);
  if (existente) {
    if (f.vigenteDesde && (!existente.vigenteDesde || f.vigenteDesde < existente.vigenteDesde)) {
      existente.vigenteDesde = f.vigenteDesde;
    }
    if (existente.vigenteHasta && (!f.vigenteHasta || f.vigenteHasta > existente.vigenteHasta)) {
      existente.vigenteHasta = f.vigenteHasta || null;
    }
    if (f.esPrincipal === 'Y') existente.principal = true;
    return;
  }
  lista.push({
    codigo: f.codDiscapacidad,
    descripcion: oracion(f.tipoDiscapacidad) || f.codDiscapacidad,
    principal: f.esPrincipal === 'Y',
    vigenteDesde: f.vigenteDesde || null,
    vigenteHasta: f.vigenteHasta || null,
  });
}

function ordenarDiscapacidades(lista) {
  return [...lista].sort((x, y) => Number(y.principal) - Number(x.principal));
}

const PARTICULAS = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'e', 'da', 'van', 'von']);

/* Banner guarda los nombres en mayúsculas: "GÓMEZ DE LA CRUZ" → "Gómez de la Cruz". */
export function nombrePropio(texto) {
  return String(texto || '')
    .toLocaleLowerCase('es')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((palabra, i) => (i > 0 && PARTICULAS.has(palabra)
      ? palabra
      : palabra.replace(/(^|[-'])(\p{L})/gu, (_, sep, letra) => sep + letra.toLocaleUpperCase('es'))))
    .join(' ');
}

const ROMANOS = /^(i{1,3}|iv|v|vi{1,3}|ix|x|xi{1,3})$/i;

/* "INVESTIGACION II" → "Investigacion II". Solo transforma si viene en mayúsculas. */
export function tituloCurso(texto) {
  const t = String(texto || '').replace(/\s+/g, ' ').trim();
  if (!t) return null;
  if (t !== t.toLocaleUpperCase('es')) return t;
  return nombrePropio(t)
    .split(' ')
    .map((p) => (ROMANOS.test(p) ? p.toUpperCase() : p))
    .join(' ');
}

/* "DISCAPACIDAD VISUAL" → "Discapacidad visual". */
export function oracion(texto) {
  const t = String(texto || '').replace(/\s+/g, ' ').trim();
  if (!t || t !== t.toLocaleUpperCase('es')) return t;
  const minus = t.toLocaleLowerCase('es');
  return minus.charAt(0).toLocaleUpperCase('es') + minus.slice(1);
}

export function nombreCompleto(nombres, apellidos) {
  return nombrePropio(`${nombres || ''} ${apellidos || ''}`);
}

export function iniciales(nombres = '', apellidos = '') {
  const a = (String(nombres).trim().split(/\s+/)[0] || '')[0] || '';
  const b = (String(apellidos).trim().split(/\s+/)[0] || '')[0] || '';
  return (a + b).toUpperCase();
}

/* "2002-01-19" o "2002-01-19T00:00:00Z" → "19 de enero de 2002" (sin desfase de zona). */
export function formatearFecha(valor) {
  if (!valor) return null;
  const m = String(valor).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return String(valor);
  const fecha = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return new Intl.DateTimeFormat('es-PE', { day: 'numeric', month: 'long', year: 'numeric' }).format(fecha);
}
