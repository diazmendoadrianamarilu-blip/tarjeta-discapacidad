import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { usePageControl, useData } from '@ellucian/experience-extension-utils';

import { C, CHIPS, LISTA_FILTRADA_POR_SESION } from '../config';
import { resolverDocente } from '../api/identidad';
import { cargarTablero, iniciales } from '../api/discapacidad';
import { crearXlsx, descargarBlob } from '../api/excel';
import { useEthosFetch } from '../api/useEthosFetch';
import {
  Aviso, Encabezado, NotaLegal, Pagina, describirError, s,
} from '../components/Estructura';
import {
  IconoAccesibilidad, IconoDescarga, IconoFlechaDerecha, IconoPersonas,
} from '../components/Iconos';

const e = {
  cabecera: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 20,
    marginBottom: 32,
  },
  contador: {
    background: C.blanco,
    border: `1px solid ${C.borde}`,
    borderRadius: 8,
    padding: '12px 16px',
    fontSize: 14,
    boxShadow: '0 1px 2px 0 rgba(0,0,0,.05)',
    whiteSpace: 'nowrap',
    alignSelf: 'flex-end',
  },
  contadorNumero: { marginLeft: 12, fontSize: 18, fontWeight: 700, color: C.texto },
  contadorDetalle: { display: 'block', marginTop: 2, fontSize: 12, color: C.textoTenue },
  lista: { display: 'flex', flexDirection: 'column', gap: 12 },
  periodos: { display: 'flex', flexDirection: 'column', gap: 32 },
  periodoTitulo: {
    margin: '0 0 12px',
    fontSize: 13,
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: C.textoSuave,
  },
  grupos: { display: 'flex', flexDirection: 'column', gap: 20 },
  grupo: {
    background: C.gris50,
    border: `1px solid ${C.borde}`,
    borderRadius: 14,
    padding: 16,
  },
  grupoCabecera: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    margin: '0 4px 12px',
  },
  grupoCodigo: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: 10,
    rowGap: 2,
    fontSize: 13,
    fontWeight: 600,
    color: C.moradoTexto,
  },
  grupoTitulo: { margin: '2px 0 0', fontSize: 17, lineHeight: '24px', fontWeight: 600, color: C.texto },
  grupoMeta: { margin: '2px 0 0', fontSize: 13, color: C.textoSuave },
  grupoCuenta: {
    flexShrink: 0,
    fontSize: 12,
    fontWeight: 600,
    color: C.textoSecundario,
    background: C.blanco,
    border: `1px solid ${C.borde}`,
    borderRadius: 999,
    padding: '2px 10px',
    whiteSpace: 'nowrap',
  },
  fila: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    width: '100%',
    padding: 16,
    background: C.blanco,
    border: `1px solid ${C.borde}`,
    borderRadius: 12,
    boxShadow: '0 1px 2px 0 rgba(0,0,0,.05)',
    textAlign: 'left',
    cursor: 'pointer',
    color: 'inherit',
    font: 'inherit',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    background: C.gris100,
    color: '#475569',
    fontSize: 14,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  nombreLinea: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  nombre: { fontSize: 16, fontWeight: 600, color: C.texto },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: 999,
    border: '1px solid',
    padding: '1px 8px',
    fontSize: 12,
    fontWeight: 500,
    lineHeight: '18px',
    whiteSpace: 'nowrap',
  },
  meta: {
    display: 'flex',
    flexWrap: 'wrap',
    columnGap: 20,
    rowGap: 4,
    marginTop: 6,
    fontSize: 14,
    color: C.textoSuave,
  },
  iconoFila: {
    width: 36,
    height: 36,
    borderRadius: 8,
    background: C.gris50,
    color: C.textoTenue,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    transition: 'background .15s ease, color .15s ease',
  },
  reporte: {
    marginTop: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    padding: 20,
    background: C.verdeFondo,
    border: `1px solid ${C.verdeBorde}`,
    borderRadius: 12,
  },
  reporteTitulo: { margin: 0, fontSize: 16, fontWeight: 600, color: C.verdeTitulo },
  reporteTexto: { margin: '4px 0 0', fontSize: 14, color: C.verdeTexto },
  botonVerde: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    height: 36,
    padding: '0 16px',
    border: 0,
    borderRadius: 6,
    background: C.verde,
    color: C.blanco,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    flexShrink: 0,
    boxShadow: '0 1px 2px 0 rgba(0,0,0,.05)',
  },
  esqueleto: { background: '#E2E8F0', borderRadius: 6 },
};

function estiloChip(discapacidad) {
  const codigo = String(discapacidad.codigo || '').toUpperCase();
  const texto = String(discapacidad.descripcion || '').toLowerCase();
  if (['MO', 'FI'].includes(codigo) || /motor|f[ií]sic/.test(texto)) return CHIPS.motora;
  if (codigo === 'VI' || /visual|ceguera|baja visi/.test(texto)) return CHIPS.visual;
  if (codigo === 'AU' || /auditiv|sordera|hipoacus/.test(texto)) return CHIPS.auditiva;
  if (['IN', 'CO', 'TE', 'PS'].includes(codigo)
    || /cognitiv|intelectual|autis|espectro|mental|psico|aprendizaje/.test(texto)) return CHIPS.cognitiva;
  return CHIPS.otra;
}

function etiquetaChip(descripcion) {
  const limpio = String(descripcion || '').replace(/^discapacidad\s+/i, '').trim().toLowerCase();
  return limpio ? limpio.charAt(0).toUpperCase() + limpio.slice(1) : 'Sin tipo';
}

function Chip({ discapacidad }) {
  const c = estiloChip(discapacidad);
  return (
    <span style={{ ...e.chip, background: c.fondo, color: c.texto, borderColor: c.borde }}>
      {etiquetaChip(discapacidad.descripcion)}
    </span>
  );
}

function FilaAlumno({ alumno, curso, onAbrir }) {
  const [principal, ...otras] = alumno.discapacidades;

  return (
    <button type="button" className="bu-fila" style={e.fila} onClick={() => onAbrir(alumno, curso)}>
      <div style={e.avatar} aria-hidden="true">{iniciales(alumno.nombres, alumno.apellidos)}</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={e.nombreLinea}>
          <span style={e.nombre}>{alumno.nombreCompleto}</span>
          {principal && <Chip discapacidad={principal} />}
          {otras.map((d) => <Chip key={d.codigo} discapacidad={d} />)}
        </div>
        <div style={e.meta}>
          <span>{alumno.idAlumno}</span>
          {alumno.carrera && <span>{alumno.carrera}</span>}
        </div>
      </div>

      <div className="bu-fila-icono bu-solo-escritorio" style={e.iconoFila}>
        <IconoAccesibilidad tamano={20} />
      </div>
      <span className="bu-fila-flecha" style={{ color: C.iconoTenue, display: 'flex' }}>
        <IconoFlechaDerecha tamano={20} />
      </span>
    </button>
  );
}

/* Un curso (NRC) del docente con sus alumnos con discapacidad. */
function GrupoCurso({ curso, onAbrir }) {
  const n = curso.alumnos.length;
  return (
    <section style={e.grupo} aria-label={`${curso.codigo} NRC ${curso.nrc}`}>
      <div style={e.grupoCabecera}>
        <div style={{ minWidth: 0 }}>
          <div style={e.grupoCodigo}>
            {curso.codigo && <span>{curso.codigo}</span>}
            <span>NRC {curso.nrc}</span>
          </div>
          <h3 style={e.grupoTitulo}>{curso.titulo || 'Curso sin título registrado'}</h3>
          <p style={e.grupoMeta}>Periodo {curso.periodo}</p>
        </div>
        <span style={e.grupoCuenta}>{n} {n === 1 ? 'estudiante' : 'estudiantes'}</span>
      </div>
      <div style={e.lista}>
        {curso.alumnos.map((a) => (
          <FilaAlumno key={a.idAlumno} alumno={a} curso={curso} onAbrir={onAbrir} />
        ))}
      </div>
    </section>
  );
}

function FilaCargando() {
  return (
    <div className="bu-pulso" style={{ ...e.fila, cursor: 'default' }} aria-hidden="true">
      <div style={{ ...e.avatar, background: '#E2E8F0' }} />
      <div style={{ flex: 1 }}>
        <div style={{ ...e.esqueleto, width: '40%', height: 16 }} />
        <div style={{ ...e.esqueleto, width: '25%', height: 12, marginTop: 10 }} />
      </div>
    </div>
  );
}

/* Una fila por alumno y curso, en el mismo orden que la pantalla: periodo
   (más reciente primero) → curso → apellidos. */
function exportarExcel(periodos) {
  const filas = [[
    'Periodo', 'Curso', 'NRC', 'Nombre del curso', 'Código', 'Apellidos', 'Nombres',
    'Carrera', 'Tipo de discapacidad', 'Discapacidad principal',
  ]];
  periodos.forEach((p) => p.cursos.forEach((c) => c.alumnos.forEach((a) => {
    const principal = a.discapacidades.find((d) => d.principal) || a.discapacidades[0];
    filas.push([
      c.periodo,
      c.codigo,
      c.nrc,
      c.titulo || '',
      a.idAlumno,
      a.apellidos,
      a.nombres,
      a.carrera || '',
      a.discapacidades.map((d) => d.descripcion).join(' / '),
      principal ? principal.descripcion : '',
    ]);
  })));
  const fecha = new Date().toISOString().slice(0, 10);
  const etiqueta = periodos.map((p) => p.periodo).join('-');
  descargarBlob(crearXlsx(filas, 'Alumnos por curso'), `alumnos-discapacidad-${etiqueta}-${fecha}.xlsx`);
}

export default function Home({ term }) {
  const authenticatedEthosFetch = useEthosFetch();
  const { getExtensionJwt } = useData();
  const { setPageTitle } = usePageControl();
  const history = useHistory();

  const [estado, setEstado] = useState('cargando'); // cargando | listo | error
  const [error, setError] = useState(null);
  const [tablero, setTablero] = useState({ alumnos: [], periodos: [] });
  const solicitud = useRef(0);

  // getExtensionJwt puede cambiar de referencia en cada render: se lee por ref
  // para no volver a disparar la carga.
  const jwtRef = useRef(getExtensionJwt);
  jwtRef.current = getExtensionJwt;

  const cargar = useCallback(async () => {
    const id = solicitud.current + 1;
    solicitud.current = id;
    setEstado('cargando');
    setError(null);

    try {
      // 1. Identidad (secuencial): x-docente-sesion → respaldo JWT erpId + x-persona-pidm.
      let pidm = null;
      if (!LISTA_FILTRADA_POR_SESION) {
        const docente = await resolverDocente(authenticatedEthosFetch, jwtRef.current);
        pidm = docente.pidm;
      }
      if (solicitud.current !== id) return;

      // 2. Alumnos con discapacidad de los NRC del docente, agrupados por periodo y curso.
      const datos = await cargarTablero(authenticatedEthosFetch, { pidm, term });
      if (solicitud.current !== id) return;
      setTablero(datos);
      setEstado('listo');
    } catch (err) {
      if (solicitud.current !== id) return;
      console.error('[Bienestar]', err);
      setError(err);
      setEstado('error');
    }
  }, [authenticatedEthosFetch, term]);

  useEffect(() => {
    if (setPageTitle) setPageTitle('Bienestar Universitario');
  }, [setPageTitle]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const abrirFicha = (alumno) => {
    history.push(`/alumno/${encodeURIComponent(alumno.idAlumno)}`, { alumno });
  };

  const { alumnos, periodos } = tablero;
  const totalCursos = periodos.reduce((n, p) => n + p.cursos.length, 0);

  const volverAlInicio = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      const tenant = window.location.pathname.split('/').filter(Boolean)[0];
      window.location.assign(tenant ? `/${tenant}` : '/');
    }
  };

  let cuerpo;
  if (estado === 'cargando') {
    cuerpo = (
      <div style={e.lista} aria-busy="true" aria-label="Cargando estudiantes">
        <FilaCargando /><FilaCargando /><FilaCargando />
      </div>
    );
  } else if (estado === 'error') {
    const esIdentidad = error && error.tipo === 'identidad';
    cuerpo = (
      <Aviso
        tono="error"
        titulo={esIdentidad
          ? 'No pudimos identificar tu usuario docente en Banner'
          : 'No pudimos cargar la lista de estudiantes'}
        texto={esIdentidad
          ? 'Tu sesión no devolvió un registro docente. Si el problema continúa, comunícate con la Dirección de Tecnología y Transformación.'
          : 'Ocurrió un problema al consultar la información. Intenta nuevamente en unos segundos.'}
        accion={cargar}
        textoAccion="Reintentar"
        detalle={esIdentidad ? error.intentos.join('\n') : describirError(error)}
      />
    );
  } else if (alumnos.length === 0) {
    cuerpo = (
      <Aviso
        icono={<IconoPersonas tamano={22} />}
        titulo="No tienes estudiantes con discapacidad en tus cursos"
        texto="Ninguno de los estudiantes matriculados en tus secciones vigentes tiene una discapacidad registrada. Si crees que falta alguien, comunícate con Bienestar Universitario."
      />
    );
  } else {
    cuerpo = (
      <>
        <div style={e.periodos}>
          {periodos.map((p) => (
            <section key={p.periodo} aria-label={`Periodo ${p.periodo}`}>
              {periodos.length > 1 && <h2 style={e.periodoTitulo}>Periodo {p.periodo}</h2>}
              <div style={e.grupos}>
                {p.cursos.map((c) => <GrupoCurso key={c.clave} curso={c} onAbrir={abrirFicha} />)}
              </div>
            </section>
          ))}
        </div>

        <div className="bu-apilar" style={e.reporte}>
          <div>
            <p style={e.reporteTitulo}>Reporte de estudiantes registrados</p>
            <p style={e.reporteTexto}>Exporta la información para análisis y seguimiento institucional.</p>
          </div>
          <button
            type="button"
            className="bu-boton bu-boton-verde bu-ancho-completo"
            style={e.botonVerde}
            onClick={() => exportarExcel(periodos)}
          >
            <IconoDescarga tamano={16} /> Descargar reporte Excel
          </button>
        </div>
      </>
    );
  }

  return (
    <Pagina>
      <Encabezado
        subtitulo="Tablero de ajustes razonables"
        textoVolver="Inicio"
        alVolver={volverAlInicio}
      />

      <main className="bu-contenedor" style={s.contenedor}>
        <div className="bu-apilar" style={e.cabecera}>
          <div>
            <p style={s.antetitulo}>Panel institucional</p>
            <h1 style={s.titulo}>Alumnos con Discapacidad Registrada</h1>
            <p style={s.bajada}>
              Consulta los estudiantes asignados a tus cursos y gestiona sus ajustes razonables.
            </p>
          </div>
          <div style={e.contador} aria-live="polite">
            <span style={{ color: C.textoSuave }}>Total registrados</span>
            <strong style={e.contadorNumero}>{estado === 'listo' ? alumnos.length : '—'}</strong>
            {estado === 'listo' && totalCursos > 0 && (
              <span style={e.contadorDetalle}>
                en {totalCursos} {totalCursos === 1 ? 'curso' : 'cursos'}
              </span>
            )}
          </div>
        </div>

        {cuerpo}

        <NotaLegal />
      </main>
    </Pagina>
  );
}