import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { usePageControl, useData } from '@ellucian/experience-extension-utils';

import { LISTA_FILTRADA_POR_SESION } from '../config';
import { resolverDocente } from '../api/identidad';
import { cargarTablero, iniciales } from '../api/discapacidad';
import { crearXlsx, descargarBlob } from '../api/excel';
import { useEthosFetch } from '../api/useEthosFetch';
import { Aviso, NotaLegal, describirError } from '../components/Estructura';
import {
  Badge, ChipDiscapacidad, EnlaceVolver, IconoDiscapacidad, IconoPanel, Lienzo, SOMBRA, USS, tipografia,
} from '../components/Tema';
import {
  IconoDescarga, IconoFlechaDerecha, IconoLibro, IconoPersonas,
} from '../components/Iconos';

/* Un docente puede tener 30 alumnos en un NRC: se muestran de 4 en 4. */
const ALUMNOS_POR_PAGINA = 4;
/* Y varios NRC: las tarjetas de curso se muestran de 3 en 3. */
const CURSOS_POR_PAGINA = 3;

const e = {
  cabecera: {
    display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, marginBottom: 28,
  },
  resumen: {
    display: 'flex', gap: 0, background: USS.superficie, border: `1px solid ${USS.borde}`, borderRadius: 12,
    boxShadow: SOMBRA, flexShrink: 0,
  },
  resumenCelda: { padding: '12px 20px', minWidth: 120 },
  resumenNumero: { display: 'block', fontSize: 24, lineHeight: '30px', fontWeight: 700, color: USS.texto },
  resumenEtiqueta: { display: 'block', fontSize: 12, color: USS.textoSuave },
  periodo: { margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: USS.textoSuave },
  cursos: { display: 'flex', flexDirection: 'column', gap: 20 },
  cursoCabecera: {
    display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, padding: '18px 20px',
    borderBottom: `1px solid ${USS.borde}`,
  },
  cursoCodigo: {
    display: 'flex', flexWrap: 'wrap', columnGap: 12, fontSize: 12, fontWeight: 700, letterSpacing: '0.04em',
    color: USS.textoSuave,
  },
  cursoTitulo: { margin: '2px 0 0', fontSize: 17, lineHeight: '24px', fontWeight: 700, color: USS.texto },
  cursoMeta: { margin: '2px 0 0', fontSize: 13, color: USS.textoSuave },
  fila: {
    display: 'flex', alignItems: 'center', gap: 14, width: '100%', padding: '14px 20px', border: 0,
    borderTop: `1px solid ${USS.borde}`, background: USS.superficie, textAlign: 'left', cursor: 'pointer',
    color: 'inherit', font: 'inherit',
  },
  avatar: {
    width: 40, height: 40, borderRadius: 999, background: USS.fondo, border: `1px solid ${USS.borde}`,
    color: USS.textoSuave, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center',
    justifyContent: 'center', flexShrink: 0,
  },
  nombreLinea: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  nombre: { fontSize: 15, fontWeight: 600, color: USS.texto },
  meta: { display: 'flex', flexWrap: 'wrap', columnGap: 16, rowGap: 2, marginTop: 4, fontSize: 13, color: USS.textoSuave },
  paginacion: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '12px 20px',
    borderTop: `1px solid ${USS.borde}`, background: USS.fondo,
  },
  paginacionTexto: { fontSize: 13, color: USS.textoSuave },
  paginacionCursos: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 20,
    padding: '12px 16px', background: USS.superficie, border: `1px solid ${USS.borde}`, borderRadius: 12,
    boxShadow: SOMBRA,
  },
  botonSec: {
    display: 'inline-flex', alignItems: 'center', gap: 6, height: 34, padding: '0 14px',
    border: `1px solid ${USS.borde}`, borderRadius: 8, background: USS.superficie, color: USS.morado,
    fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
  reporte: {
    marginTop: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '18px 20px',
  },
  reporteTitulo: { margin: 0, fontSize: 15, fontWeight: 700, color: USS.texto },
  reporteTexto: { margin: '2px 0 0', fontSize: 13, color: USS.textoSuave },
  botonPri: {
    display: 'inline-flex', alignItems: 'center', gap: 8, height: 40, padding: '0 18px', border: 0,
    borderRadius: 8, background: USS.morado, color: USS.superficie, fontSize: 14, fontWeight: 600,
    cursor: 'pointer', flexShrink: 0,
  },
  esqueleto: { background: USS.borde, borderRadius: 6 },
};

function FilaAlumno({ alumno, onAbrir }) {
  return (
    <button type="button" className="bu-fila" style={e.fila} onClick={() => onAbrir(alumno)}>
      <div style={e.avatar} aria-hidden="true">{iniciales(alumno.nombres, alumno.apellidos)}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={e.nombreLinea}>
          <span style={e.nombre}>{alumno.nombreCompleto}</span>
          {alumno.discapacidades.map((d) => <ChipDiscapacidad key={d.codigo} discapacidad={d} />)}
        </div>
        <div style={e.meta}>
          <span style={{ fontWeight: 600 }}>{alumno.idAlumno}</span>
          {alumno.carrera && <span>{alumno.carrera}</span>}
        </div>
      </div>
      <IconoDiscapacidad discapacidad={alumno.discapacidades[0]} />
      <span className="bu-fila-flecha" style={{ display: 'flex', color: USS.textoTenue }}>
        <IconoFlechaDerecha tamano={18} />
      </span>
    </button>
  );
}

/* Controles "Anterior / n de m / Siguiente". No se muestra si hay una sola página. */
function Paginador({ etiqueta, texto, actual, paginas, onCambiar, style }) {
  if (paginas <= 1) return null;
  return (
    <nav className="bu-paginacion" style={style} aria-label={etiqueta}>
      <span style={e.paginacionTexto} aria-live="polite">{texto}</span>
      <div className="bu-paginacion-botones" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          type="button"
          className="bu-btn-sec"
          style={e.botonSec}
          onClick={() => onCambiar(actual - 1)}
          disabled={actual === 0}
        >
          <span style={{ display: 'flex', transform: 'scaleX(-1)' }}><IconoFlechaDerecha tamano={14} /></span>
          Anterior
        </button>
        <span className="bu-ocultar-movil" style={e.paginacionTexto}>{actual + 1} / {paginas}</span>
        <button
          type="button"
          className="bu-btn-sec"
          style={e.botonSec}
          onClick={() => onCambiar(actual + 1)}
          disabled={actual >= paginas - 1}
        >
          Siguiente
          <IconoFlechaDerecha tamano={14} />
        </button>
      </div>
    </nav>
  );
}

/* Tarjeta de un curso (NRC) con sus alumnos paginados. */
function TarjetaCurso({ curso, onAbrir }) {
  const [pagina, setPagina] = useState(0);
  const total = curso.alumnos.length;
  const paginas = Math.max(1, Math.ceil(total / ALUMNOS_POR_PAGINA));
  const actual = Math.min(pagina, paginas - 1);
  const inicio = actual * ALUMNOS_POR_PAGINA;
  const visibles = curso.alumnos.slice(inicio, inicio + ALUMNOS_POR_PAGINA);

  return (
    <section className="bu-tarjeta bu-tarjeta-curso" aria-label={`${curso.codigo} NRC ${curso.nrc}`}>
      <div className="bu-curso-cabecera" style={e.cursoCabecera}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, minWidth: 0 }}>
          <IconoPanel Icono={IconoLibro} tono="azul" />
          <div style={{ minWidth: 0 }}>
            <div style={e.cursoCodigo}>
              {curso.codigo && <span>{curso.codigo}</span>}
              <span>NRC {curso.nrc}</span>
            </div>
            <h3 style={e.cursoTitulo}>{curso.titulo || 'Curso sin título registrado'}</h3>
            <p style={e.cursoMeta}>Periodo {curso.periodo}</p>
          </div>
        </div>
        <Badge>{total} {total === 1 ? 'estudiante' : 'estudiantes'}</Badge>
      </div>

      <div>
        {visibles.map((a) => <FilaAlumno key={a.idAlumno} alumno={a} onAbrir={onAbrir} />)}
      </div>

      <Paginador
        etiqueta={`Páginas de ${curso.codigo} NRC ${curso.nrc}`}
        texto={`${inicio + 1}–${Math.min(inicio + ALUMNOS_POR_PAGINA, total)} de ${total} estudiantes`}
        actual={actual}
        paginas={paginas}
        onCambiar={setPagina}
        style={e.paginacion}
      />
    </section>
  );
}

function TarjetaCargando() {
  return (
    <div className="bu-tarjeta bu-tarjeta-curso" aria-busy="true" aria-label="Cargando estudiantes">
      <div style={e.cursoCabecera}>
        <div style={{ flex: 1 }}>
          <div style={{ ...e.esqueleto, width: 140, height: 12 }} />
          <div style={{ ...e.esqueleto, width: '45%', height: 18, marginTop: 10 }} />
        </div>
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ ...e.fila, cursor: 'default' }}>
          <div style={{ ...e.avatar, background: USS.borde, borderColor: USS.borde }} />
          <div style={{ flex: 1 }}>
            <div style={{ ...e.esqueleto, width: '40%', height: 14 }} />
            <div style={{ ...e.esqueleto, width: '25%', height: 12, marginTop: 8 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/* Una fila por alumno y curso, en el mismo orden que la pantalla. */
function exportarExcel(periodos) {
  const filas = [[
    'Periodo', 'Curso', 'NRC', 'Nombre del curso', 'Código', 'Apellidos', 'Nombres',
    'Carrera', 'Tipo de discapacidad', 'Discapacidad principal',
  ]];
  periodos.forEach((p) => p.cursos.forEach((c) => c.alumnos.forEach((a) => {
    const principal = a.discapacidades.find((d) => d.principal) || a.discapacidades[0];
    filas.push([
      c.periodo, c.codigo, c.nrc, c.titulo || '', a.idAlumno, a.apellidos, a.nombres,
      a.carrera || '', a.discapacidades.map((d) => d.descripcion).join(' / '),
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
  const [paginaCursos, setPaginaCursos] = useState(0);
  const solicitud = useRef(0);
  const inicioLista = useRef(null);

  // getExtensionJwt puede cambiar de referencia en cada render: se lee por ref.
  const jwtRef = useRef(getExtensionJwt);
  jwtRef.current = getExtensionJwt;

  const cargar = useCallback(async () => {
    const id = solicitud.current + 1;
    solicitud.current = id;
    setEstado('cargando');
    setError(null);

    try {
      // 1. Identidad (solo si la lista no filtra por sesión en el servidor).
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
      setPaginaCursos(0);
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

  const volverAlInicio = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      const tenant = window.location.pathname.split('/').filter(Boolean)[0];
      window.location.assign(tenant ? `/${tenant}` : '/');
    }
  };

  const { alumnos, periodos } = tablero;
  const totalCursos = periodos.reduce((n, p) => n + p.cursos.length, 0);

  // Paginación de cursos: se reparte la lista completa (todos los periodos) y
  // se reagrupa por periodo solo lo visible, para conservar sus encabezados.
  const cursos = periodos.flatMap((p) => p.cursos);
  const paginasCursos = Math.max(1, Math.ceil(cursos.length / CURSOS_POR_PAGINA));
  const paginaActual = Math.min(paginaCursos, paginasCursos - 1);
  const inicioCursos = paginaActual * CURSOS_POR_PAGINA;
  const gruposVisibles = [];
  cursos.slice(inicioCursos, inicioCursos + CURSOS_POR_PAGINA).forEach((c) => {
    const ultimo = gruposVisibles[gruposVisibles.length - 1];
    if (ultimo && ultimo.periodo === c.periodo) ultimo.cursos.push(c);
    else gruposVisibles.push({ periodo: c.periodo, cursos: [c] });
  });

  const cambiarPaginaCursos = (pagina) => {
    setPaginaCursos(pagina);
    if (inicioLista.current && inicioLista.current.scrollIntoView) {
      inicioLista.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  let cuerpo;
  if (estado === 'cargando') {
    cuerpo = <TarjetaCargando />;
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
        <div ref={inicioLista} style={{ display: 'flex', flexDirection: 'column', gap: 28, scrollMarginTop: 16 }}>
          {gruposVisibles.map((g) => (
            <section key={g.periodo} aria-label={`Periodo ${g.periodo}`}>
              {periodos.length > 1 && <h2 style={e.periodo}>Periodo {g.periodo}</h2>}
              <div style={e.cursos}>
                {g.cursos.map((c) => <TarjetaCurso key={c.clave} curso={c} onAbrir={abrirFicha} />)}
              </div>
            </section>
          ))}
        </div>

        <Paginador
          etiqueta="Páginas de cursos"
          texto={`Cursos ${inicioCursos + 1}–${Math.min(inicioCursos + CURSOS_POR_PAGINA, cursos.length)} de ${cursos.length}`}
          actual={paginaActual}
          paginas={paginasCursos}
          onCambiar={cambiarPaginaCursos}
          style={e.paginacionCursos}
        />

        <div className="bu-tarjeta bu-reporte" style={e.reporte}>
          <div>
            <p style={e.reporteTitulo}>Reporte de estudiantes registrados</p>
            <p style={e.reporteTexto}>Excel con una fila por estudiante y curso, en el mismo orden que esta pantalla.</p>
          </div>
          <button type="button" className="bu-btn-pri" style={e.botonPri} onClick={() => exportarExcel(periodos)}>
            <IconoDescarga tamano={16} /> Descargar reporte Excel
          </button>
        </div>
      </>
    );
  }

  return (
    <Lienzo>
      <EnlaceVolver texto="Inicio" onClick={volverAlInicio} />

      <div className="bu-cabecera" style={e.cabecera}>
        <div>
          <p style={tipografia.antetitulo}>Panel institucional</p>
          <h1 style={tipografia.titulo}>Directorio de Estudiantes</h1>
          <p style={tipografia.bajada}>
            Estudiantes con discapacidad registrada en tus cursos, para aplicar sus ajustes razonables.
          </p>
        </div>
        <div style={e.resumen} aria-live="polite">
          <div style={e.resumenCelda}>
            <strong style={e.resumenNumero}>{estado === 'listo' ? alumnos.length : '—'}</strong>
            <span style={e.resumenEtiqueta}>{alumnos.length === 1 ? 'Estudiante' : 'Estudiantes'}</span>
          </div>
          <div style={{ ...e.resumenCelda, borderLeft: `1px solid ${USS.borde}` }}>
            <strong style={e.resumenNumero}>{estado === 'listo' ? totalCursos : '—'}</strong>
            <span style={e.resumenEtiqueta}>{totalCursos === 1 ? 'Curso' : 'Cursos'}</span>
          </div>
        </div>
      </div>

      {cuerpo}

      <NotaLegal />
    </Lienzo>
  );
}
