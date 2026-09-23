/*
 * Acceso a las APIs de API Designer (x-docente-sesion, x-discapacidad-docente,
 * x-discapacidad-detalle).
 *
 * Por qué NO se usa getEthosQuery: getEthosQuery solo ejecuta consultas GraphQL
 * de Ethos declaradas en extension.js dentro de la tarjeta
 * (cards[].queries = { id: [{ resourceVersions, query }] }) y resueltas contra
 * Data Access. Las APIs de API Designer son REST; el proxy /api/ethos-query no
 * las conoce y responde 400 ("Request Failed for the queryId").
 *
 * authenticatedEthosFetch llama al proxy REST de Ethos con el token del usuario
 * de la sesión, que es lo que exigen las APIs con "Autenticación del usuario"
 * (rol SELFSERVICE-FACULTY) y lo que hace funcionar SECURITY_PRINCIPAL_ID.
 */
import { API, LISTA_FILTRADA_POR_SESION } from '../config';

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

async function consultar(authenticatedEthosFetch, { recurso, version }, parametros = {}) {
  if (typeof authenticatedEthosFetch !== 'function') {
    throw new ErrorApi(recurso, null, 'authenticatedEthosFetch no está disponible en useData()');
  }

  const busqueda = new window.URLSearchParams();
  Object.entries(parametros).forEach(([clave, valor]) => {
    if (valor !== undefined && valor !== null && valor !== '') busqueda.append(clave, String(valor));
  });
  const consulta = busqueda.toString();
  const ruta = consulta ? `${recurso}?${consulta}` : recurso;

  const respuesta = await authenticatedEthosFetch(ruta, {
    method: 'GET',
    headers: { Accept: aceptar(version) },
  });

  if (!respuesta) throw new ErrorApi(recurso, null, 'sin respuesta del proxy de Ethos');
  if (!respuesta.ok) {
    throw new ErrorApi(recurso, respuesta.status, await leerDetalleError(respuesta));
  }

  const cuerpo = await respuesta.json();
  if (Array.isArray(cuerpo)) return cuerpo;
  if (cuerpo && Array.isArray(cuerpo.data)) return cuerpo.data;
  return cuerpo ? [cuerpo] : [];
}

/* ---------- Identidad del docente ---------- */

export async function obtenerDocenteSesion(authenticatedEthosFetch) {
  const filas = await consultar(authenticatedEthosFetch, API.sesion);
  const fila = filas.find((f) => f && f.pidm !== undefined && f.pidm !== null);
  if (!fila) return null;
  return {
    pidm: Number(fila.pidm),
    idPersona: fila.idPersona || null,
    nombre: nombreCompleto(fila.nombres, fila.apellidos),
  };
}

/* ---------- Listado ---------- */

export async function listarAlumnosDelDocente(authenticatedEthosFetch, { pidm, term }) {
  const parametros = LISTA_FILTRADA_POR_SESION ? { term } : { pidmdocente: pidm, term };
  const filas = await consultar(authenticatedEthosFetch, API.lista, parametros);
  return agruparPorAlumno(filas, term);
}

export function agruparPorAlumno(filas, term) {
  const porAlumno = new Map();

  filas.forEach((f) => {
    if (!f || !f.idAlumno) return;
    if (!porAlumno.has(f.idAlumno)) {
      porAlumno.set(f.idAlumno, {
        idAlumno: f.idAlumno,
        nombres: nombrePropio(f.nombres),
        apellidos: nombrePropio(f.apellidos),
        nombreCompleto: nombreCompleto(f.nombres, f.apellidos),
        periodo: f.periodo || term,
        carrera: f.carrera ? nombrePropio(f.carrera) : null,
        discapacidades: [],
        secciones: [],
      });
    }
    const a = porAlumno.get(f.idAlumno);
    if (!a.carrera && f.carrera) a.carrera = nombrePropio(f.carrera);

    agregarDiscapacidad(a.discapacidades, f);

    if (f.nrc && !a.secciones.some((s) => s.nrc === f.nrc)) {
      a.secciones.push({
        nrc: f.nrc,
        curso: f.curso || [f.codMateria, f.numCurso].filter(Boolean).join(' '),
      });
    }
  });

  return Array.from(porAlumno.values())
    .map((a) => ({ ...a, discapacidades: ordenarDiscapacidades(a.discapacidades) }))
    .sort((x, y) => x.nombreCompleto.localeCompare(y.nombreCompleto, 'es'));
}

/* ---------- Detalle ---------- */

const cacheDetalle = new Map();

export async function obtenerDetalleAlumno(authenticatedEthosFetch, { idalumno, term }) {
  const clave = `${idalumno}|${term}`;
  if (!cacheDetalle.has(clave)) {
    const promesa = consultar(authenticatedEthosFetch, API.detalle, { idalumno, term })
      .then((filas) => construirFicha(filas, term));
    cacheDetalle.set(clave, promesa);
    promesa.catch(() => cacheDetalle.delete(clave));
  }
  return cacheDetalle.get(clave);
}

/* Completa la carrera de cada alumno con la API de detalle (el listado no la
   trae). Si una consulta falla, el alumno se muestra con su curso. */
export async function completarCarreras(authenticatedEthosFetch, alumnos, term) {
  const pendientes = alumnos.filter((a) => !a.carrera);
  const resultados = await Promise.allSettled(
    pendientes.map((a) => obtenerDetalleAlumno(authenticatedEthosFetch, { idalumno: a.idAlumno, term })),
  );
  const carreras = new Map();
  resultados.forEach((r, i) => {
    if (r.status === 'fulfilled' && r.value && r.value.carrera) {
      carreras.set(pendientes[i].idAlumno, r.value.carrera);
    }
  });
  return alumnos.map((a) => (carreras.has(a.idAlumno) ? { ...a, carrera: carreras.get(a.idAlumno) } : a));
}

export function construirFicha(filas, term) {
  const validas = filas.filter(Boolean);
  if (validas.length === 0) return null;

  // SGBSTDN se filtra con TERM_CODE_EFF <= term: vale el registro más reciente.
  const base = validas.reduce((mejor, f) => (
    String(f.periodoEfectivo || '') > String(mejor.periodoEfectivo || '') ? f : mejor
  ), validas[0]);

  const discapacidades = [];
  validas.forEach((f) => agregarDiscapacidad(discapacidades, f));
  const ordenadas = ordenarDiscapacidades(discapacidades);

  const hoy = new Date().toISOString().slice(0, 10);
  const vigente = validas.some((f) => !f.vigenteHasta || String(f.vigenteHasta).slice(0, 10) >= hoy);

  const ajustes = unicos(validas.map((f) => oracion(f.ajuste || f.ajusteCodigo)));

  return {
    idAlumno: base.idAlumno,
    nombres: nombrePropio(base.nombres),
    apellidos: nombrePropio(base.apellidos),
    nombreCompleto: nombreCompleto(base.nombres, base.apellidos),
    carrera: base.carrera ? nombrePropio(base.carrera) : (base.codCarrera || null),
    programa: base.programa || null,
    periodo: base.periodoDiscapacidad || term,
    discapacidades: ordenadas,
    vigente,
    vigenteDesde: primero(validas, 'vigenteDesde'),
    vigenteHasta: primero(validas, 'vigenteHasta'),
    fechaNacimiento: primero(validas, 'fechaNacimiento'),
    correo: elegirCorreo(validas),
    telefono: elegirTelefono(validas),
    direccion: elegirDireccion(validas, hoy),
    ajustes,
  };
}

function elegirCorreo(filas) {
  const correos = filas.filter((f) => f.correo && f.correoEstado !== 'I');
  const preferido = correos.find((f) => f.correoPreferido === 'Y') || correos[0];
  return preferido ? preferido.correo : null;
}

function elegirTelefono(filas) {
  const telefonos = filas.filter((f) => f.telefonoNumero && f.telefonoEstado !== 'I');
  const t = telefonos.find((f) => f.telefonoPrincipal === 'Y') || telefonos[0];
  if (!t) return null;
  return [t.telefonoArea, t.telefonoNumero].filter(Boolean).join(' ');
}

function elegirDireccion(filas, hoy) {
  const d = filas.find((f) => f.direccion && f.direccionEstado !== 'I'
    && (!f.direccionHasta || String(f.direccionHasta).slice(0, 10) >= hoy));
  if (!d) return null;
  return [d.direccion, d.ciudad].filter(Boolean).join(', ');
}

/* ---------- Utilidades ---------- */

function agregarDiscapacidad(lista, f) {
  if (!f.codDiscapacidad || lista.some((d) => d.codigo === f.codDiscapacidad)) return;
  lista.push({
    codigo: f.codDiscapacidad,
    descripcion: oracion(f.tipoDiscapacidad) || f.codDiscapacidad,
    principal: f.esPrincipal === 'Y',
  });
}

function ordenarDiscapacidades(lista) {
  return [...lista].sort((x, y) => Number(y.principal) - Number(x.principal));
}

function primero(filas, campo) {
  const f = filas.find((x) => x[campo]);
  return f ? f[campo] : null;
}

function unicos(valores) {
  return Array.from(new Set(valores.filter(Boolean).map((v) => String(v).trim()).filter(Boolean)));
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

/* "INTÉRPRETE DE LENGUA DE SEÑAS" → "Intérprete de lengua de señas". */
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
