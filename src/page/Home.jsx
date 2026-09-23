/* eslint-env browser */
import React, { useCallback, useEffect, useState } from 'react';
import {
  useData,
  useExtensionControl,
  useUserInfo,
} from '@ellucian/experience-extension-utils';

import Encabezado from './Encabezado';
import { C, PERIODO, MOSTRAR_DIAGNOSTICO } from '../config';
import { resolverDocente } from '../api/identidad';
import {
  listarAlumnosDelDocente,
  mapaCursosDelDocente,
  descargarReporte,
  iniciales,
} from '../api/discapacidad';

/* Color del chip según el código de STVDISA en USS. */
const COLOR_CHIP = {
  MO: { fondo: '#E8F0FE', texto: '#1A56C4' }, // Motora
  FI: { fondo: '#E8F0FE', texto: '#1A56C4' }, // Física
  VI: { fondo: '#F3EAFE', texto: '#7029C0' }, // Visual
  AU: { fondo: '#FFF4E0', texto: '#B26A00' }, // Auditiva
  IN: { fondo: '#FDE9E9', texto: '#C0392B' }, // Intelectual
  SE: { fondo: '#E6F6EE', texto: '#1E7A4D' }, // Sensorial
  TE: { fondo: '#E6F6EE', texto: '#1E7A4D' }, // Espectro autista
  DP: { fondo: '#EFEFF2', texto: '#55555F' }, // Diagnóstico pendiente
};
const CHIP_NEUTRO = { fondo: '#EFEFF2', texto: '#55555F' };

const e = {
  raiz: { background: C.fondo, minHeight: '100%' },
  contenido: { padding: '2rem', maxWidth: 1100, margin: '0 auto' },
  antetitulo: {
    color: C.moradoTexto, fontSize: 12, fontWeight: 700,
    letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 6,
  },
  encabezado: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'flex-start', gap: 20, flexWrap: 'wrap',
  },
  titulo: { fontSize: 27, fontWeight: 700, color: C.texto, margin: 0 },
  bajada: { color: C.textoSuave, fontSize: 14, marginTop: 6 },
  contador: {
    background: C.blanco, border: `1px solid ${C.borde}`, borderRadius: 12,
    padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: 18,
    whiteSpace: 'nowrap',
  },
  fila: {
    background: C.blanco, border: `1px solid ${C.borde}`, borderRadius: 12,
    padding: '1rem 1.25rem', marginBottom: 12, display: 'flex',
    alignItems: 'center', gap: 16, cursor: 'pointer', width: '100%',
    textAlign: 'left',
  },
  avatar: {
    width: 44, height: 44, borderRadius: '50%', background: '#EEEDF1',
    color: '#5B5B66', fontWeight: 700, fontSize: 13, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  chip: {
    display: 'inline-block', borderRadius: 999, padding: '2px 10px',
    fontSize: 12, fontWeight: 600, marginLeft: 10, verticalAlign: 'middle',
  },
  meta: { color: C.textoSuave, fontSize: 13.5, marginTop: 3 },
  iconoFila: {
    width: 34, height: 34, borderRadius: 8, background: '#F3F2F5',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  reporte: {
    background: C.verdeSuave, border: `1px solid ${C.verdeBorde}`, borderRadius: 12,
    padding: '1.25rem 1.5rem', display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', gap: 16, marginTop: 24, flexWrap: 'wrap',
  },
  botonVerde: {
    background: C.verde, color: C.blanco, border: 0, borderRadius: 8,
    padding: '0.7rem 1.1rem', fontSize: 14, fontWeight: 600, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 8,
  },
  aviso: {
    background: C.blanco, border: `1px dashed #D8D6DD`, borderRadius: 12,
    padding: '3rem 1.5rem', textAlign: 'center', color: C.textoSuave,
    marginTop: 24,
  },
  diag: {
    background: '#FFFBEA', border: '1px solid #F0DFA8', borderRadius: 12,
    padding: '1.25rem 1.5rem', marginTop: 24, textAlign: 'left',
    fontSize: 13, color: '#6B5A16',
  },
  codigo: {
    display: 'block', background: '#FFFFFF', border: '1px solid #EDE6CC',
    borderRadius: 8, padding: '0.75rem', marginTop: 8, fontSize: 12,
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
    whiteSpace: 'pre-wrap', wordBreak: 'break-word', color: '#4A4A52',
  },
};

function Chip({ codigo, texto }) {
  const c = COLOR_CHIP[codigo] || CHIP_NEUTRO;
  return <span style={{ ...e.chip, background: c.fondo, color: c.texto }}>{texto}</span>;
}

function IconoAccesibilidad() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="4.2" r="1.9" fill="#6B6B76" />
      <path
        d="M5.5 8.2c2.2.7 4.3 1.1 6.5 1.1s4.3-.4 6.5-1.1M12 9.3v5m0 0 3.3 5.4M12 14.3l-3.3 5.4"
        stroke="#6B6B76"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconoDescarga() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 3.5v11m0 0 4-4m-4 4-4-4M4.5 18.5h15"
        stroke="#FFFFFF" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Home() {
  const { getEthosQuery, getExtensionJwt } = useData();
  const { setPageTitle, navigateToPage } = useExtensionControl();
  const userInfo = useUserInfo();

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [diagnostico, setDiagnostico] = useState(null);
  const [alumnos, setAlumnos] = useState([]);
  const [docente, setDocente] = useState(null);

  const term = PERIODO;

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    setDiagnostico(null);
    setDocente(null);

    try {
      const ctx = { getEthosQuery };

      const sesion = await resolverDocente({ userInfo, getExtensionJwt, getEthosQuery });
      console.info('[Bienestar] identidad del docente:', sesion);
      setDocente(sesion);

      if (!sesion.pidm) {
        setDiagnostico(sesion.diagnostico);
        throw new Error(
          'No fue posible identificar al docente en esta sesión. Revisa el detalle de abajo.',
        );
      }

      const lista = await listarAlumnosDelDocente(
        { pidmdocente: sesion.pidm, term }, ctx,
      );

      // El nombre del curso no viene en la API del listado: se completa aquí.
      if (sesion.bannerId) {
        try {
          const cursos = await mapaCursosDelDocente(
            { iddocente: sesion.bannerId, term }, ctx,
          );
          lista.forEach((a) => {
            a.secciones.forEach((s) => { s.curso = cursos[s.nrc] || s.curso; });
          });
        } catch (errCursos) {
          console.warn('[Bienestar] no se resolvió el nombre de los cursos:', errCursos);
        }
      }

      setAlumnos(lista);
    } catch (err) {
      console.error('[Bienestar]', err);
      setError(err.message || 'Ocurrió un error al consultar la información.');
    } finally {
      setCargando(false);
    }
  }, [getEthosQuery, getExtensionJwt, userInfo, term]);

  useEffect(() => {
    if (setPageTitle) setPageTitle('Tablero de ajustes razonables');
    cargar();
  }, [cargar, setPageTitle]);

  const abrirFicha = (idAlumno) => {
    navigateToPage({ route: `/alumno/${idAlumno}`, state: { term } });
  };

  return (
    <div style={e.raiz}>
      <Encabezado
        subtitulo="Tablero de ajustes razonables"
        textoVolver="Inicio"
        alVolver={() => window.history.back()}
      />

      <div style={e.contenido}>
        <div style={e.encabezado}>
          <div>
            <div style={e.antetitulo}>Panel institucional</div>
            <h1 style={e.titulo}>Alumnos con Discapacidad Registrada</h1>
            <div style={e.bajada}>
              Consulta los estudiantes asignados a tus cursos y gestiona sus
              ajustes razonables.
              {docente && docente.nombre && (
                <span> Sesión de <strong>{docente.nombre}</strong>.</span>
              )}
            </div>
          </div>

          <div style={e.contador}>
            <span style={{ color: C.textoSuave, fontSize: 13.5 }}>Total registrados</span>
            <span style={{ fontSize: 24, fontWeight: 700, color: C.texto }}>
              {cargando ? '—' : alumnos.length}
            </span>
          </div>
        </div>

        {cargando && (
          <div style={e.aviso}>Cargando estudiantes…</div>
        )}

        {!cargando && error && (
          <div style={{ ...e.aviso, borderColor: '#E3B7B7', color: '#96302C' }}>
            {error}
            <div style={{ marginTop: 14 }}>
              <button
                type="button"
                style={{ ...e.botonVerde, background: C.morado, margin: '0 auto' }}
                onClick={cargar}
              >
                Reintentar
              </button>
            </div>
          </div>
        )}

        {!cargando && diagnostico && MOSTRAR_DIAGNOSTICO && (
          <div style={e.diag}>
            <strong>Diagnóstico de identidad</strong>
            <div style={{ marginTop: 6 }}>
              La identificación la resuelve Banner: la API <code>x-docente-sesion</code>
              {' '}filtra <code>SPRIDEN_PIDM = SECURITY_PRINCIPAL_ID</code> con el usuario
              autenticado. Si no devuelve fila, revisa que la API esté publicada, que
              tenga marcada la <em>Autenticación del usuario</em> con el rol
              {' '}<code>FACULTY</code> y que ese rol esté asignado a tu usuario.
            </div>
            <code style={e.codigo}>
              {`Resuelto en → ${diagnostico.encontradoEn || 'ningún origen'}
useUserInfo() → ${(diagnostico.camposUserInfo || []).join(' | ') || 'sin campos'}
JWT extensión → ${(diagnostico.camposJwt || []).join(' | ') || 'sin campos'}
Notas → ${diagnostico.notas.length ? diagnostico.notas.join(' | ') : 'ninguna'}`}
            </code>
          </div>
        )}

        {!cargando && !error && alumnos.length === 0 && (
          <div style={e.aviso}>
            No hay estudiantes con discapacidad registrada en tus secciones para
            el periodo {term}.
          </div>
        )}

        {!cargando && !error && alumnos.length > 0 && (
          <div style={{ marginTop: 24 }}>
            {alumnos.map((a) => {
              const principal = a.discapacidades[0];
              const seccion = a.secciones[0];
              const curso = seccion
                ? (seccion.curso || `${seccion.codMateria} ${seccion.numCurso}`)
                : 'Sin sección asignada';
              const extra = a.secciones.length > 1
                ? ` · ${a.secciones.length} secciones`
                : (seccion ? ` · NRC ${seccion.nrc}` : '');

              return (
                <div
                  key={a.idAlumno}
                  role="button"
                  tabIndex={0}
                  style={e.fila}
                  onClick={() => abrirFicha(a.idAlumno)}
                  onKeyDown={(ev) => { if (ev.key === 'Enter') abrirFicha(a.idAlumno); }}
                >
                  <div style={e.avatar}>{iniciales(a.nombres, a.apellidos)}</div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div>
                      <span style={{ fontWeight: 600, color: C.texto, fontSize: 15 }}>
                        {a.nombreCompleto}
                      </span>
                      {principal && (
                        <Chip codigo={principal.codigo} texto={principal.descripcion} />
                      )}
                      {a.discapacidades.length > 1 && (
                        <Chip codigo="" texto={`+${a.discapacidades.length - 1}`} />
                      )}
                    </div>
                    <div style={e.meta}>
                      {curso}{extra} &nbsp;·&nbsp; Periodo {a.periodo || term}
                    </div>
                  </div>

                  <div style={e.iconoFila}><IconoAccesibilidad /></div>
                  <span style={{ color: '#A9A7B0', fontSize: 20 }}>&rsaquo;</span>
                </div>
              );
            })}
          </div>
        )}

        {!cargando && !error && alumnos.length > 0 && (
          <div style={e.reporte}>
            <div>
              <div style={{ fontWeight: 600, color: C.texto, fontSize: 15 }}>
                Reporte de estudiantes registrados
              </div>
              <div style={{ ...e.meta, marginTop: 4 }}>
                Exporta la información para análisis y seguimiento institucional.
              </div>
            </div>
            <button
              type="button"
              style={e.botonVerde}
              onClick={() => descargarReporte(alumnos, term)}
            >
              <IconoDescarga /> Descargar reporte
            </button>
          </div>
        )}

        <div style={{ ...e.meta, marginTop: 28, fontSize: 12 }}>
          Dato sensible (Ley 29733). Úselo únicamente para aplicar los ajustes
          razonables que correspondan y no lo difunda.
        </div>
      </div>
    </div>
  );
}
 