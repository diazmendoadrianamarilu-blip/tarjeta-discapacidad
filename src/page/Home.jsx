import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { usePageControl, useData } from '@ellucian/experience-extension-utils';

import { CHIPS, FUENTE, LISTA_FILTRADA_POR_SESION } from '../config';
import { resolverDocente } from '../api/identidad';
import { cargarTablero, iniciales } from '../api/discapacidad';
import { crearXlsx, descargarBlob } from '../api/excel';
import { useEthosFetch } from '../api/useEthosFetch';

// Hemos eliminado Pagina y Encabezado de esta importación para quitar el título doble y la caja gris
import { Aviso, NotaLegal, describirError } from '../components/Estructura';
import { IconoDescarga, IconoFlechaDerecha, IconoPersonas } from '../components/Iconos';

/* PALETA CROMÁTICA OFICIAL USS */
const USS = {
  morado: '#5C2193',
  moradoClaro: '#763EAF',
  verdeLima: '#5FED00',
  verdeFondo: '#ECFFD9',
  verdeBorde: '#C0FF88',
  grisOscuro: '#333333',
  grisBorde: '#E5E7EB',
  blanco: '#FFFFFF'
};

const CSS = `
  /* Expansión total del ancho y fondo blanco puro */
  body, html {
    background-color: ${USS.blanco} !important;
  }

  .bu-lienzo-extendido {
    width: 100%;
    min-height: 100vh;
    background-color: ${USS.blanco};
    padding: 32px 48px;
    box-sizing: border-box;
    font-family: ${FUENTE}, sans-serif;
  }

  .bu-fila { transition: background-color 0.2s ease; border-bottom: 1px solid ${USS.grisBorde}; }
  .bu-fila:hover { background-color: #F9FAFB !important; }
  .bu-fila:last-child { border-bottom: none; }

  /* Diseño elegante y minimalista para la tarjeta de curso */
  .bu-tarjeta-curso {
    background: ${USS.blanco};
    border: 1px solid ${USS.grisBorde};
    border-left: 6px solid ${USS.morado};
    border-radius: 12px;
    margin-bottom: 32px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.04);
    overflow: hidden;
  }

  .bu-btn-paginacion {
    background: transparent;
    border: 1px solid ${USS.grisBorde};
    color: ${USS.morado};
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  .bu-btn-paginacion:hover:not(:disabled) {
    background: ${USS.verdeFondo};
    border-color: ${USS.verdeBorde};
  }
  .bu-btn-paginacion:disabled {
    color: #9CA3AF;
    cursor: not-allowed;
    opacity: 0.5;
  }

  @media (max-width: 768px) {
    .bu-lienzo-extendido { padding: 24px 16px !important; }
    .bu-cabecera-flex { flex-direction: column !important; align-items: flex-start !important; gap: 20px !important; }
    .bu-contador-movil { width: 100% !important; box-sizing: border-box; }
    .bu-grupo-cabecera { flex-direction: column !important; align-items: flex-start !important; gap: 16px !important; }
    .bu-grupo-cuenta { align-self: flex-start !important; }
    .bu-alumno-fila { flex-direction: column; align-items: flex-start !important; padding: 20px 16px !important; gap: 12px; }
    .bu-alumno-fila-der { width: 100%; display: flex; justify-content: space-between; align-items: center; margin-top: 8px; }
    .bu-reporte-flex { flex-direction: column !important; align-items: flex-start !important; gap: 16px !important; padding: 20px 16px !important; }
    .bu-btn-exportar { width: 100% !important; justify-content: center !important; }
  }
`;

// Íconos Dinámicos en SVG basados en el tipo de discapacidad
function IconoDinamico({ tipo }) {
  const t = String(tipo || '').toLowerCase();
  
  if (t.includes('visual') || t.includes('ceguera') || t === 'vi') {
    return <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
  }
  if (t.includes('auditiv') || t.includes('sordera') || t.includes('hipoacus') || t === 'au') {
    return <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M6 8.5a6.5 6.5 0 1 1 13 0c0 6-6 6-6 10a3.5 3.5 0 1 1-7 0"/><path d="M11 10.5a2.5 2.5 0 1 1 5 0"/></svg>;
  }
  if (t.includes('cognitiv') || t.includes('intelectual') || t.includes('psic') || t === 'in' || t === 'co') {
    return <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.9.5H7a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h.5V11H7a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h.5V4.5A2.5 2.5 0 0 1 9.5 2z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.9.5h.1a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2h-.5v-3h.5a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-.1V4.5A2.5 2.5 0 0 0 14.5 2z"/></svg>;
  }
  // Motora / Default (Silla de Ruedas)
  return <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="8" cy="16" r="5"/><path d="M19 19L16 12H11"/><path d="M11 12L13 6H16"/><circle cx="13" cy="3" r="1"/></svg>;
}

function estiloChip(discapacidad) {
  const codigo = String(discapacidad.codigo || '').toUpperCase();
  const texto = String(discapacidad.descripcion || '').toLowerCase();
  if (['MO', 'FI'].includes(codigo) || /motor|f[ií]sic/.test(texto)) return CHIPS.motora;
  if (codigo === 'VI' || /visual|ceguera|baja visi/.test(texto)) return CHIPS.visual;
  if (codigo === 'AU' || /auditiv|sordera|hipoacus/.test(texto)) return CHIPS.auditiva;
  if (['IN', 'CO', 'TE', 'PS'].includes(codigo) || /cognitiv|intelectual|autis|espectro|mental|psico|aprendizaje/.test(texto)) return CHIPS.cognitiva;
  return CHIPS.otra;
}

function etiquetaChip(descripcion) {
  const limpio = String(descripcion || '').replace(/^discapacidad\s+/i, '').trim().toLowerCase();
  return limpio ? limpio.charAt(0).toUpperCase() + limpio.slice(1) : 'Sin tipo';
}

function Chip({ discapacidad }) {
  const c = estiloChip(discapacidad);
  return (
    <span style={{ 
      display: 'inline-flex', alignItems: 'center', borderRadius: '999px', border: '1px solid', 
      padding: '2px 10px', fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap',
      background: c.fondo, color: c.texto, borderColor: c.borde 
    }}>
      {etiquetaChip(discapacidad.descripcion)}
    </span>
  );
}

function FilaAlumno({ alumno, curso, onAbrir }) {
  const [principal, ...otras] = alumno.discapacidades;

  return (
    <button type="button" className="bu-fila bu-alumno-fila" style={{
      display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 24px',
      width: '100%', borderTop: 'none', borderLeft: 'none', borderRight: 'none', 
      background: 'transparent', textAlign: 'left', cursor: 'pointer', fontFamily: FUENTE
    }} onClick={() => onAbrir(alumno, curso)}>
      
      <div style={{ width: 44, height: 44, borderRadius: '8px', background: USS.verdeFondo, border: `1px solid ${USS.verdeBorde}`, color: USS.morado, fontSize: '15px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {iniciales(alumno.nombres, alumno.apellidos)}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span style={{ fontSize: '16px', fontWeight: 700, color: USS.grisOscuro }}>{alumno.nombreCompleto}</span>
          {principal && <Chip discapacidad={principal} />}
          {otras.map((d) => <Chip key={d.codigo} discapacidad={d} />)}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', fontSize: '13px', color: '#6B7280' }}>
          <span style={{ fontWeight: 600, color: USS.morado }}>{alumno.idAlumno}</span>
          {alumno.carrera && <span>{alumno.carrera}</span>}
        </div>
      </div>

      <div className="bu-alumno-fila-der" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ color: USS.moradoClaro, display: 'flex', padding: '0 8px' }} title="Tipo de discapacidad">
          <IconoDinamico tipo={principal?.descripcion || principal?.codigo} />
        </div>
        <div style={{ color: '#9CA3AF', display: 'flex' }}>
          <IconoFlechaDerecha tamano={20} />
        </div>
      </div>
    </button>
  );
}

function GrupoCurso({ curso, onAbrir }) {
  const [pagina, setPagina] = useState(1);
  const ALUMNOS_POR_PAGINA = 5;
  const n = curso.alumnos.length;
  const totalPaginas = Math.ceil(n / ALUMNOS_POR_PAGINA);
  
  const inicio = (pagina - 1) * ALUMNOS_POR_PAGINA;
  const alumnosPagina = curso.alumnos.slice(inicio, inicio + ALUMNOS_POR_PAGINA);

  return (
    <section className="bu-tarjeta-curso" aria-label={`${curso.codigo} NRC ${curso.nrc}`}>
      <div className="bu-grupo-cabecera" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: `1px solid ${USS.grisBorde}`, background: USS.blanco }}>
        <div>
          <div style={{ display: 'flex', gap: '8px', color: USS.moradoClaro, fontSize: '13px', fontWeight: 700, letterSpacing: '0.03em' }}>
            {curso.codigo && <span>{curso.codigo}</span>}
            <span>NRC {curso.nrc}</span>
          </div>
          <h3 style={{ margin: '4px 0 0', fontSize: '20px', fontWeight: 700, color: USS.morado, fontFamily: FUENTE }}>
            {curso.titulo || 'Curso sin título registrado'}
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#6B7280' }}>Periodo {curso.periodo}</p>
        </div>
        <span className="bu-grupo-cuenta" style={{ background: USS.verdeFondo, border: `1px solid ${USS.verdeBorde}`, color: USS.morado, padding: '6px 16px', borderRadius: '999px', fontSize: '13px', fontWeight: 800, whiteSpace: 'nowrap' }}>
          {n} {n === 1 ? 'estudiante' : 'estudiantes'}
        </span>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {alumnosPagina.map((a) => (
          <FilaAlumno key={a.idAlumno} alumno={a} curso={curso} onAbrir={onAbrir} />
        ))}
      </div>

      {totalPaginas > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', background: '#FAFAFA', borderTop: `1px solid ${USS.grisBorde}` }}>
          <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: 500 }}>
            Mostrando {inicio + 1} - {Math.min(inicio + ALUMNOS_POR_PAGINA, n)} de {n}
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="bu-btn-paginacion" onClick={() => setPagina(p => p - 1)} disabled={pagina === 1}>
              Anterior
            </button>
            <button className="bu-btn-paginacion" onClick={() => setPagina(p => p + 1)} disabled={pagina === totalPaginas}>
              Siguiente
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function FilaCargando() {
  return (
    <div className="bu-fila bu-alumno-fila" style={{ display: 'flex', gap: '16px', padding: '16px 24px', cursor: 'default' }} aria-hidden="true">
      <div style={{ width: 44, height: 44, borderRadius: '8px', background: USS.grisBorde }} />
      <div style={{ flex: 1 }}>
        <div style={{ background: USS.grisBorde, height: 16, width: '40%', borderRadius: 4, marginBottom: 8 }} />
        <div style={{ background: USS.grisBorde, height: 12, width: '25%', borderRadius: 4 }} />
      </div>
    </div>
  );
}

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
  const [estado, setEstado] = useState('cargando'); 
  const [error, setError] = useState(null);
  const [tablero, setTablero] = useState({ alumnos: [], periodos: [] });
  const solicitud = useRef(0);

  const jwtRef = useRef(getExtensionJwt);
  jwtRef.current = getExtensionJwt;

  const cargar = useCallback(async () => {
    const id = solicitud.current + 1;
    solicitud.current = id;
    setEstado('cargando');
    setError(null);

    try {
      let pidm = null;
      if (!LISTA_FILTRADA_POR_SESION) {
        const docente = await resolverDocente(authenticatedEthosFetch, jwtRef.current);
        pidm = docente.pidm;
      }
      if (solicitud.current !== id) return;

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

  let cuerpo;
  if (estado === 'cargando') {
    cuerpo = (
      <div className="bu-tarjeta-curso" aria-busy="true" aria-label="Cargando estudiantes" style={{ display: 'flex', flexDirection: 'column' }}>
        <FilaCargando /><FilaCargando /><FilaCargando />
      </div>
    );
  } else if (estado === 'error') {
    const esIdentidad = error && error.tipo === 'identidad';
    cuerpo = (
      <Aviso
        tono="error"
        titulo={esIdentidad ? 'No pudimos identificar tu usuario docente en Banner' : 'No pudimos cargar la lista de estudiantes'}
        texto={esIdentidad ? 'Tu sesión no devolvió un registro docente. Si el problema continúa, comunícate con Tecnología.' : 'Ocurrió un problema al consultar la información. Intenta nuevamente.'}
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
        texto="Ninguno de los estudiantes matriculados en tus secciones vigentes tiene una discapacidad registrada."
      />
    );
  } else {
    cuerpo = (
      <>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {periodos.map((p) => (
            <div key={p.periodo}>
              {p.cursos.map((c) => <GrupoCurso key={c.clave} curso={c} onAbrir={abrirFicha} />)}
            </div>
          ))}
        </div>

        <div className="bu-reporte-flex" style={{
          marginTop: '16px', padding: '24px 32px', background: USS.verdeFondo,
          border: `1px solid ${USS.verdeBorde}`, borderRadius: '12px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div>
            <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: USS.morado, fontFamily: FUENTE }}>Reporte de estudiantes registrados</h4>
            <p style={{ margin: '4px 0 0', fontSize: '14px', color: USS.grisOscuro, fontFamily: FUENTE }}>Exporta la información para análisis y seguimiento institucional.</p>
          </div>
          <button
            type="button"
            className="bu-btn-exportar"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              height: '42px', padding: '0 24px', border: 'none', borderRadius: '8px',
              background: USS.morado, color: USS.blanco, fontSize: '14px', fontWeight: 600, cursor: 'pointer', flexShrink: 0,
              fontFamily: FUENTE, boxShadow: '0 2px 4px rgba(0,0,0,.1)'
            }}
            onClick={() => exportarExcel(periodos)}
          >
            <IconoDescarga tamano={18} /> Descargar reporte Excel
          </button>
        </div>
      </>
    );
  }

  return (
    <div className="bu-lienzo-extendido">
      <style>{CSS}</style>

      {/* Botón de volver al inicio customizado para evitar errores de compilación */}
      <button 
        type="button" 
        onClick={volverAlInicio} 
        style={{ 
          background: 'none', border: 'none', color: USS.moradoClaro, cursor: 'pointer', 
          display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '14px', 
          fontWeight: 600, padding: 0, marginBottom: '24px', fontFamily: FUENTE 
        }}
      >
        <span style={{ transform: 'scaleX(-1)', display: 'flex' }}>
          <IconoFlechaDerecha tamano={14} />
        </span>
        Inicio
      </button>

      <div className="bu-cabecera-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '24px', borderBottom: `1px solid ${USS.grisBorde}`, marginBottom: '32px' }}>
        <div>
          <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: USS.moradoClaro, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Panel Institucional
          </p>
          <h1 style={{ margin: '8px 0 0', fontSize: '28px', fontWeight: 800, color: USS.morado }}>
            Directorio de Estudiantes
          </h1>
          <p style={{ margin: '8px 0 0', fontSize: '15px', color: '#4B5563' }}>
            Consulta los estudiantes asignados a tus cursos y gestiona sus ajustes razonables.
          </p>
        </div>
        
        <div className="bu-contador-movil" style={{ background: USS.verdeFondo, border: `1px solid ${USS.verdeBorde}`, borderRadius: '12px', padding: '16px 24px', textAlign: 'center', flexShrink: 0 }} aria-live="polite">
          <span style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: USS.morado }}>TOTAL ASIGNADOS</span>
          <strong style={{ display: 'block', fontSize: '36px', fontWeight: 800, color: USS.morado, lineHeight: 1, margin: '8px 0' }}>
            {estado === 'listo' ? alumnos.length : '—'}
          </strong>
          {estado === 'listo' && totalCursos > 0 && (
            <span style={{ display: 'block', fontSize: '12px', color: USS.moradoClaro, fontWeight: 600 }}>
              en {totalCursos} {totalCursos === 1 ? 'curso' : 'cursos'}
            </span>
          )}
        </div>
      </div>

      {cuerpo}

      <div style={{ marginTop: '40px' }}>
        <NotaLegal />
      </div>
    </div>
  );
}