import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { usePageControl, useData } from '@ellucian/experience-extension-utils';

import { C, CHIPS } from '../config';
import { resolverDocente } from '../api/identidad';
import { iniciales, listarAlumnosDelDocente } from '../api/discapacidad';
import { crearXlsx, descargarBlob } from '../api/excel';
import {
  Aviso, Encabezado, NotaLegal, Pagina, s,
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
  lista: { display: 'flex', flexDirection: 'column', gap: 12 },
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

function FilaAlumno({ alumno, onAbrir }) {
  const [principal, ...otras] = alumno.discapacidades;
  const seccion = alumno.secciones[0];
  const detalleAcademico = alumno.carrera || (seccion ? seccion.curso : null);

  return (
    <button type="button" className="bu-fila" style={e.fila} onClick={() => onAbrir(alumno)}>
      <div style={e.avatar} aria-hidden="true">{iniciales(alumno.nombres, alumno.apellidos)}</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={e.nombreLinea}>
          <span style={e.nombre}>{alumno.nombreCompleto}</span>
          {principal && <Chip discapacidad={principal} />}
          {otras.map((d) => <Chip key={d.codigo} discapacidad={d} />)}
        </div>
        <div style={e.meta}>
          {detalleAcademico && <span>{detalleAcademico}</span>}
          <span style={{ color: C.textoTenue }}>Periodo {alumno.periodo}</span>
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

function exportarExcel(alumnos, term) {
  const filas = [[
    'Código', 'Apellidos', 'Nombres', 'Carrera', 'Tipo de discapacidad',
    'Discapacidad principal', 'Curso(s)', 'NRC', 'Periodo',
  ]];
  alumnos.forEach((a) => {
    const principal = a.discapacidades.find((d) => d.principal) || a.discapacidades[0];
    filas.push([
      a.idAlumno,
      a.apellidos,
      a.nombres,
      a.carrera || '',
      a.discapacidades.map((d) => d.descripcion).join(' / '),
      principal ? principal.descripcion : '',
      a.secciones.map((x) => x.curso).filter(Boolean).join(' / '),
      a.secciones.map((x) => x.nrc).join(' / '),
      a.periodo || term,
    ]);
  });
  const fecha = new Date().toISOString().slice(0, 10);
  descargarBlob(crearXlsx(filas, 'Alumnos'), `alumnos-discapacidad-${term}-${fecha}.xlsx`);
}

export default function Home({ term = '202646' }) {
  const { getEthosQuery, getExtensionJwt } = useData(); 
  const { setPageTitle } = usePageControl();
  const history = useHistory();

  const [estado, setEstado] = useState('cargando');
  const [errorMsg, setErrorMsg] = useState(null);
  const [alumnos, setAlumnos] = useState([]);
  const solicitud = useRef(0);

  const cargar = useCallback(async () => {
    const id = solicitud.current + 1;
    solicitud.current = id;
    setEstado('cargando');
    setErrorMsg(null);

    try {
      // 1. Resolvemos quién eres leyendo tu sesión 
      const { pidm } = await resolverDocente(getExtensionJwt);
      if (!pidm) {
        throw new Error('No pudimos identificar tu PIDM en la sesión actual.');
      }

      // 2. Buscamos tus alumnos pasándole a Ellucian tu PIDM y el conector oficial
      const lista = await listarAlumnosDelDocente(getEthosQuery, { pidmdocente: pidm, term });
      if (solicitud.current !== id) return;
      
      setAlumnos(lista);
      setEstado('listo');
    } catch (err) {
      if (solicitud.current !== id) return;
      console.error('[Bienestar]', err);
      setErrorMsg(err.message || 'Ocurrió un problema al consultar la información.');
      setEstado('error');
    }
  }, [getEthosQuery, getExtensionJwt, term]);

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

  let cuerpo;
  if (estado === 'cargando') {
    cuerpo = (
      <div style={e.lista} aria-busy="true" aria-label="Cargando estudiantes">
        <FilaCargando /><FilaCargando /><FilaCargando />
      </div>
    );
  } else if (estado === 'error') {
    cuerpo = (
      <Aviso
        tono="error"
        titulo="No pudimos cargar la lista de estudiantes"
        texto={errorMsg}
        accion={cargar}
        textoAccion="Reintentar"
      />
    );
  } else if (alumnos.length === 0) {
    cuerpo = (
      <Aviso
        icono={<IconoPersonas tamano={22} />}
        titulo="No tienes estudiantes con discapacidad en tus cursos"
        texto={`En el periodo ${term} ninguno de los estudiantes matriculados en tus secciones tiene una discapacidad registrada. Si crees que falta alguien, comunícate con Bienestar Universitario.`}
      />
    );
  } else {
    cuerpo = (
      <>
        <div style={e.lista}>
          {alumnos.map((a) => <FilaAlumno key={a.idAlumno} alumno={a} onAbrir={abrirFicha} />)}
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
            onClick={() => exportarExcel(alumnos, term)}
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
          </div>
        </div>

        {cuerpo}

        <NotaLegal />
      </main>
    </Pagina>
  );
}