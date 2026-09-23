import React, { useCallback, useEffect, useState } from 'react';
import { Typography, Button, CircularProgress } from '@ellucian/react-design-system/core';
// 1. Importamos useUserInfo para detectar tu sesión real
import { useData, useExtensionControl, useUserInfo } from '@ellucian/experience-extension-utils';

import {
  listarAlumnosDelDocente,
  mapaCursosDelDocente,
  descargarReporte,
  iniciales,
  obtenerPidm // 2. Importamos la función para traducir tu ID a PIDM
} from '../api/discapacidad';

const PERIODO_POR_DEFECTO = '202646';
const GRIS_TEXTO = '#6B7280';

const COLOR_CHIP = {
  MO: { fondo: '#EAF1FF', texto: '#1F5FCC' },
  FI: { fondo: '#EAF1FF', texto: '#1F5FCC' },
  VI: { fondo: '#F3EEFF', texto: '#6B3FD4' },
  AU: { fondo: '#FFF6E5', texto: '#B57400' },
  IN: { fondo: '#FDECEC', texto: '#C0392B' },
  SE: { fondo: '#EAF7F0', texto: '#1E7A4D' },
  TE: { fondo: '#EAF7F0', texto: '#1E7A4D' },
  DP: { fondo: '#F1F2F4', texto: '#4B5563' },
};
const CHIP_NEUTRO = { fondo: '#F1F2F4', texto: '#4B5563' };

const e = {
  pagina: { background: '#F7F8FA', minHeight: '100%', padding: '2rem' },
  antetitulo: {
    color: '#2A7DA8', fontSize: 12, fontWeight: 700,
    letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4,
  },
  titulo: { fontWeight: 700, color: '#101828' },
  encabezado: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 },
  contador: {
    background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: 10,
    padding: '0.9rem 1.25rem', display: 'flex', alignItems: 'center', gap: 14,
    whiteSpace: 'nowrap',
  },
  fila: {
    background: '#FFFFFF', border: '1px solid #E9EBEF', borderRadius: 12,
    padding: '1rem 1.25rem', marginBottom: 12, display: 'flex',
    alignItems: 'center', gap: 16, cursor: 'pointer', textAlign: 'left',
    width: '100%',
  },
  avatar: {
    width: 44, height: 44, borderRadius: '50%', background: '#EEF1F5',
    color: '#5B6470', fontWeight: 700, fontSize: 13, flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  chip: {
    display: 'inline-block', borderRadius: 999, padding: '2px 10px',
    fontSize: 12, fontWeight: 600, marginLeft: 10,
  },
  meta: { color: GRIS_TEXTO, fontSize: 13, marginTop: 2 },
  reporte: {
    background: '#EFF8F3', border: '1px solid #D6EADF', borderRadius: 12,
    padding: '1.25rem', display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', gap: 16, marginTop: 24,
  },
  vacio: {
    background: '#FFFFFF', border: '1px dashed #D8DCE3', borderRadius: 12,
    padding: '3rem 1.5rem', textAlign: 'center', color: GRIS_TEXTO,
  },
};

function Chip({ codigo, texto }) {
  const c = COLOR_CHIP[codigo] || CHIP_NEUTRO;
  return (
    <span style={{ ...e.chip, background: c.fondo, color: c.texto }}>{texto}</span>
  );
}

export default function Home() {
  const { getEthosQuery } = useData();
  const { setPageTitle, navigateToPage } = useExtensionControl();
  
  // Extraemos la información de tu sesión actual
  const userInfo = useUserInfo(); 

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [alumnos, setAlumnos] = useState([]);

  const term = PERIODO_POR_DEFECTO;

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const ctx = { getEthosQuery };
      
      // 3. Capturamos tu ID de Banner (varía ligeramente según la configuración de USS)
      const bannerId = userInfo?.bannerId || userInfo?.accountId;
      if (!bannerId) {
          throw new Error("No se pudo identificar tu usuario (Banner ID) en esta sesión.");
      }

      // 4. Traducimos tu ID de Banner a tu PIDM interno
      const pidmReal = await obtenerPidm({ idpersona: bannerId }, ctx);
      if (!pidmReal) {
          throw new Error(`No se encontró un PIDM asociado al usuario ${bannerId}.`);
      }

      // 5. Ahora sí, buscamos a TUS estudiantes usando tu PIDM real
      const lista = await listarAlumnosDelDocente({ pidmdocente: pidmReal, term }, ctx);

      // 6. Completamos los nombres de los cursos
      let cursos = {};
      try {
        cursos = await mapaCursosDelDocente({ iddocente: bannerId, term }, ctx);
      } catch (errCursos) {
        console.warn('No se pudo resolver el nombre de los cursos:', errCursos);
      }
      
      lista.forEach((a) => {
        a.secciones.forEach((s) => { s.curso = cursos[s.nrc] || s.curso; });
      });

      setAlumnos(lista);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Ocurrió un error de conexión con la base de datos.');
    } finally {
      setCargando(false);
    }
  }, [getEthosQuery, userInfo, term]);

  useEffect(() => {
    if (setPageTitle) setPageTitle('Tablero de ajustes razonables');
    // Esperamos a que la información del usuario cargue antes de ejecutar la consulta
    if (userInfo) {
        cargar();
    }
  }, [cargar, setPageTitle, userInfo]);

  const abrirFicha = (idAlumno) => {
    navigateToPage({ route: `/alumno/${idAlumno}`, state: { term } });
  };

  if (cargando || !userInfo) {
    return (
      <div style={{ ...e.pagina, display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
        <CircularProgress />
      </div>
    );
  }

  return (
    <div style={e.pagina}>
      <div style={e.encabezado}>
        <div>
          <div style={e.antetitulo}>Panel administrativo</div>
          <Typography variant="h2" style={e.titulo}>
            Alumnos con Discapacidad Registrada
          </Typography>
          <Typography style={e.meta}>
            Estudiantes con discapacidad registrada en SGADISA, matriculados en
            las secciones que usted dicta en el periodo {term}.
          </Typography>
        </div>

        <div style={e.contador}>
          <span style={{ color: GRIS_TEXTO, fontSize: 13 }}>Total registrados</span>
          <span style={{ fontSize: 22, fontWeight: 700, color: '#101828' }}>
            {alumnos.length}
          </span>
        </div>
      </div>

      {error && (
        <div style={{ ...e.vacio, marginTop: 24, borderColor: '#E7B2B2', color: '#9B2C2C' }}>
          {error}
          <div style={{ marginTop: 12 }}>
            <Button color="secondary" onClick={cargar}>Reintentar</Button>
          </div>
        </div>
      )}

      {!error && alumnos.length === 0 && (
        <div style={{ ...e.vacio, marginTop: 24 }}>
          No hay estudiantes con discapacidad registrada en sus secciones para el
          periodo {term}.
        </div>
      )}

      {!error && alumnos.length > 0 && (
        <div style={{ marginTop: 24 }}>
          {alumnos.map((a) => {
            const principal = a.discapacidades[0];
            const seccion = a.secciones[0];
            const curso = seccion
              ? (seccion.curso || `${seccion.codMateria} ${seccion.numCurso}`)
              : '';
            const masNrc = a.secciones.length > 1
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
                    <span style={{ fontWeight: 600, color: '#101828' }}>
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
                    {curso}{masNrc} · Periodo {a.periodo || term}
                  </div>
                </div>

                <span style={{ color: '#9AA3AF', fontSize: 20 }}>&rsaquo;</span>
              </div>
            );
          })}
        </div>
      )}

      {!error && alumnos.length > 0 && (
        <div style={e.reporte}>
          <div>
            <div style={{ fontWeight: 600, color: '#101828' }}>
              Reporte de estudiantes registrados
            </div>
            <div style={{ ...e.meta, marginTop: 4 }}>
              Exporta la información para análisis y seguimiento institucional.
            </div>
          </div>
          <Button color="primary" onClick={() => descargarReporte(alumnos, term)}>
            Descargar reporte
          </Button>
        </div>
      )}

      <Typography style={{ ...e.meta, marginTop: 24, fontSize: 12 }}>
        Dato sensible (Ley 29733). Úselo únicamente para aplicar los ajustes
        razonables que correspondan y no lo difunda.
      </Typography>
    </div>
  );
}