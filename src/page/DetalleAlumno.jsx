/* eslint-env browser */
import React, { useCallback, useEffect, useState } from 'react';
import { useData, useExtensionControl } from '@ellucian/experience-extension-utils';

import Encabezado from './Encabezado';
import { C } from '../config';
import { obtenerDetalleAlumno } from '../api/discapacidad';

const e = {
  raiz: { background: C.fondo, minHeight: '100%' },
  contenido: { padding: '2rem', maxWidth: 1100, margin: '0 auto' },
  antetitulo: {
    color: C.moradoTexto, fontSize: 12, fontWeight: 700,
    letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 6,
  },
  filaTitulo: { display: 'flex', alignItems: 'flex-start', gap: 16 },
  iconoPersona: {
    width: 52, height: 52, borderRadius: 12, background: C.moradoSuave,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  titulo: { fontSize: 27, fontWeight: 700, color: C.texto, margin: 0 },
  bajada: { color: C.textoSuave, fontSize: 14, marginTop: 6 },
  ficha: {
    background: C.blanco, border: `1px solid ${C.borde}`, borderRadius: 14,
    padding: '1.75rem', marginTop: 24,
  },
  nombre: { fontSize: 21, fontWeight: 700, color: C.texto, margin: 0 },
  sub: { color: C.textoSuave, fontSize: 14, marginTop: 4 },
  estado: {
    display: 'inline-block', background: '#E9F7EF', color: '#1E7A4D',
    borderRadius: 999, padding: '3px 12px', fontSize: 12, fontWeight: 600,
    marginTop: 12,
  },
  separador: { border: 0, borderTop: `1px solid ${C.borde}`, margin: '1.5rem 0' },
  parrilla: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '1.25rem 2.5rem',
  },
  dato: { display: 'flex', alignItems: 'flex-start', gap: 12 },
  iconoDato: {
    width: 36, height: 36, borderRadius: 9, background: C.moradoSuave,
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  etiqueta: { color: C.textoSuave, fontSize: 12.5 },
  valor: { fontWeight: 600, color: C.texto, fontSize: 14.5, marginTop: 2 },
  cajas: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 16, marginTop: 4,
  },
  caja: {
    background: '#F8F7FA', border: `1px solid ${C.borde}`, borderRadius: 10,
    padding: '0.9rem 1rem',
  },
  panel: {
    background: C.moradoSuave, border: '1px solid #E3D6F2', borderRadius: 10,
    padding: '1.25rem', marginTop: 20,
  },
  aviso: {
    background: C.blanco, border: '1px dashed #D8D6DD', borderRadius: 12,
    padding: '3rem 1.5rem', textAlign: 'center', color: C.textoSuave, marginTop: 24,
  },
  meta: { color: C.textoSuave, fontSize: 13 },
};

function IconoPersona() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3.6" stroke={C.morado} strokeWidth="1.7" />
      <path d="M4.8 20c.9-3.4 3.7-5.4 7.2-5.4s6.3 2 7.2 5.4"
        stroke={C.morado} strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function IconoEtiqueta() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15" rx="2.5"
        stroke={C.morado} strokeWidth="1.7" />
      <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3"
        stroke={C.morado} strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function Dato({ etiqueta, valor }) {
  return (
    <div style={e.dato}>
      <div style={e.iconoDato}><IconoEtiqueta /></div>
      <div>
        <div style={e.etiqueta}>{etiqueta}</div>
        <div style={e.valor}>{valor || '—'}</div>
      </div>
    </div>
  );
}

function Caja({ etiqueta, valor }) {
  return (
    <div style={e.caja}>
      <div style={e.etiqueta}>{etiqueta}</div>
      <div style={e.valor}>{valor || '—'}</div>
    </div>
  );
}

export default function DetalleAlumno({ idAlumno, term }) {
  const { getEthosQuery } = useData();
  const { setPageTitle, navigateToPage } = useExtensionControl();

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [alumno, setAlumno] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const datos = await obtenerDetalleAlumno(
        { idalumno: idAlumno, term }, { getEthosQuery },
      );
      if (!datos) setError('No se encontró el registro del estudiante.');
      else setAlumno(datos);
    } catch (err) {
      console.error('[Bienestar]', err);
      setError('No se pudo cargar la ficha del estudiante.');
    } finally {
      setCargando(false);
    }
  }, [getEthosQuery, idAlumno, term]);

  useEffect(() => {
    if (setPageTitle) setPageTitle('Ficha detallada del estudiante');
    cargar();
  }, [cargar, setPageTitle]);

  const volver = () => navigateToPage({ route: '/' });

  const cuerpo = () => {
    if (cargando) return <div style={e.aviso}>Cargando ficha…</div>;
    if (error) {
      return (
        <div style={{ ...e.aviso, borderColor: '#E3B7B7', color: '#96302C' }}>
          {error}
        </div>
      );
    }

    const nombre = `${alumno.nombres || ''} ${alumno.apellidos || ''}`.trim();
    const vigencia = (alumno.vigenteDesde || alumno.vigenteHasta)
      ? `${alumno.vigenteDesde || 'sin inicio'} — ${alumno.vigenteHasta || 'sin fin'}`
      : 'Sin fechas registradas';
    const periodo = alumno.periodoDiscapacidad || term;

    return (
      <div style={e.ficha}>
        <h2 style={e.nombre}>{nombre}</h2>
        <div style={e.sub}>
          {alumno.carrera || alumno.codCarrera || 'Carrera no registrada'} · Periodo {periodo}
        </div>
        <span style={e.estado}>
          {alumno.estadoAlumno === 'AS'
            ? 'Registro activo'
            : `Estado ${alumno.estadoAlumno || '—'}`}
        </span>

        <hr style={e.separador} />

        <div style={e.parrilla}>
          <Dato etiqueta="Código del alumno" valor={alumno.idAlumno} />
          <Dato etiqueta="Programa de estudios" valor={alumno.programa} />
          <Dato etiqueta="Nivel" valor={alumno.nivel} />
          <Dato etiqueta="Campus" valor={alumno.campus} />
          <Dato etiqueta="Tipo de alumno" valor={alumno.tipoAlumno} />
          <Dato etiqueta="Vigencia del registro" valor={vigencia} />
        </div>

        <hr style={e.separador} />

        <div style={e.cajas}>
          <Caja etiqueta="Carrera" valor={alumno.carrera} />
          <Caja etiqueta="Periodo" valor={periodo} />
          <Caja etiqueta="Tipo de discapacidad" valor={alumno.tipoDiscapacidad} />
        </div>

        <div style={e.panel}>
          <div style={{ ...e.antetitulo, marginBottom: 8 }}>Ajustes razonables</div>
          <div style={{ color: '#3E3A45', fontSize: 14.5 }}>
            No hay ajustes registrados para este estudiante.
          </div>
          <div style={{ ...e.meta, marginTop: 8, fontSize: 12 }}>
            Se registran en el bloque <strong>Disability Services</strong> de
            SGADISA (tabla SGRDSER), que hoy está vacío en este ambiente.
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={e.raiz}>
      <Encabezado
        subtitulo="Ficha detallada del estudiante"
        textoVolver="Volver a alumnos"
        alVolver={volver}
      />

      <div style={e.contenido}>
        <div style={e.filaTitulo}>
          <div style={e.iconoPersona}><IconoPersona /></div>
          <div>
            <div style={e.antetitulo}>
              Ficha del estudiante{alumno ? ` · ${alumno.idAlumno}` : ''}
            </div>
            <h1 style={e.titulo}>Detalle del estudiante</h1>
            <div style={e.bajada}>
              Información registrada y vigencia de los ajustes razonables autorizados.
            </div>
          </div>
        </div>

        {cuerpo()}

        <div style={{ ...e.meta, marginTop: 28, fontSize: 12 }}>
          Dato sensible (Ley 29733). Úselo únicamente para aplicar los ajustes
          razonables que correspondan y no lo difunda.
        </div>
      </div>
    </div>
  );
}
