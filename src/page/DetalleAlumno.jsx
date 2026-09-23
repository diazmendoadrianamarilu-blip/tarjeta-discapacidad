import React, { useCallback, useEffect, useState } from 'react';
import { Typography, Button, CircularProgress } from '@ellucian/react-design-system/core';
import { useData, useExtensionControl } from '@ellucian/experience-extension-utils';

import { obtenerDetalleAlumno } from '../api/discapacidad';

const GRIS_TEXTO = '#6B7280';

const e = {
  pagina: { background: '#F7F8FA', minHeight: '100%', padding: '2rem' },
  antetitulo: {
    color: '#2A7DA8', fontSize: 12, fontWeight: 700,
    letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4,
  },
  ficha: {
    background: '#FFFFFF', border: '1px solid #E9EBEF', borderRadius: 12,
    padding: '1.75rem', marginTop: 24,
  },
  estado: {
    display: 'inline-block', background: '#EAF7F0', color: '#1E7A4D',
    borderRadius: 999, padding: '3px 12px', fontSize: 12, fontWeight: 600,
    marginTop: 10,
  },
  separador: { border: 0, borderTop: '1px solid #EDEFF2', margin: '1.5rem 0' },
  cajas: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 16,
  },
  caja: {
    background: '#F7F8FA', border: '1px solid #EDEFF2', borderRadius: 10,
    padding: '0.9rem 1rem',
  },
  etiqueta: { color: GRIS_TEXTO, fontSize: 12, marginBottom: 4 },
  valor: { fontWeight: 600, color: '#101828' },
  panel: {
    background: '#F2F7FC', border: '1px solid #DCE8F4', borderRadius: 10,
    padding: '1.25rem', marginTop: 20,
  },
  meta: { color: GRIS_TEXTO, fontSize: 13 },
};

function Caja({ etiqueta, valor }) {
  return (
    <div style={e.caja}>
      <div style={e.etiqueta}>{etiqueta}</div>
      <div style={e.valor}>{valor || '—'}</div>
    </div>
  );
}

/**
 * Ficha del alumno. `idAlumno` y `term` llegan por la ruta/estado de la pagina;
 * ajusta la lectura segun como tengas configurado router.jsx.
 */
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
        { idalumno: idAlumno, term },
        { getEthosQuery },
      );
      if (!datos) {
        setError('No se encontró el registro del estudiante.');
      } else {
        setAlumno(datos);
      }
    } catch (err) {
      console.error(err);
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

  if (cargando) {
    return (
      <div style={{ ...e.pagina, display: 'flex', justifyContent: 'center', paddingTop: '4rem' }}>
        <CircularProgress />
      </div>
    );
  }

  if (error) {
    return (
      <div style={e.pagina}>
        <Button color="secondary" onClick={volver}>&lsaquo; Volver a alumnos</Button>
        <div style={{ ...e.ficha, color: '#9B2C2C' }}>{error}</div>
      </div>
    );
  }

  const nombreCompleto = `${alumno.nombres || ''} ${alumno.apellidos || ''}`.trim();
  const vigencia = (alumno.vigenteDesde || alumno.vigenteHasta)
    ? `${alumno.vigenteDesde || 'sin inicio'} — ${alumno.vigenteHasta || 'sin fin'}`
    : 'Sin fechas registradas';

  return (
    <div style={e.pagina}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={e.antetitulo}>Registro SGADISA · {alumno.idAlumno}</div>
          <Typography variant="h2" style={{ fontWeight: 700, color: '#101828' }}>
            Detalles del Estudiante
          </Typography>
          <Typography style={e.meta}>
            Información registrada en Banner y ajustes autorizados.
          </Typography>
        </div>
        <Button color="secondary" onClick={volver}>&lsaquo; Volver a alumnos</Button>
      </div>

      <div style={e.ficha}>
        <Typography variant="h3" style={{ fontWeight: 700, color: '#101828' }}>
          {nombreCompleto}
        </Typography>
        <Typography style={{ ...e.meta, marginTop: 2 }}>
          {alumno.carrera || alumno.codCarrera || 'Carrera no registrada'} · Periodo {alumno.periodoDiscapacidad || term}
        </Typography>
        <span style={e.estado}>
          {alumno.estadoAlumno === 'AS' ? 'Registro activo' : `Estado ${alumno.estadoAlumno || '—'}`}
        </span>

        <hr style={e.separador} />

        <div style={e.cajas}>
          <Caja etiqueta="Carrera" valor={alumno.carrera} />
          <Caja etiqueta="Programa" valor={alumno.programa} />
          <Caja etiqueta="Periodo" valor={alumno.periodoDiscapacidad || term} />
          <Caja etiqueta="Tipo de discapacidad" valor={alumno.tipoDiscapacidad} />
          <Caja etiqueta="¿Es la principal?" valor={alumno.esPrincipal === 'Y' ? 'Sí' : 'No'} />
          <Caja etiqueta="Vigencia del registro" valor={vigencia} />
          <Caja etiqueta="Nivel" valor={alumno.nivel} />
          <Caja etiqueta="Campus" valor={alumno.campus} />
          <Caja etiqueta="Tipo de alumno" valor={alumno.tipoAlumno} />
        </div>

        <div style={e.panel}>
          <div style={{ ...e.antetitulo, color: '#1F5FCC' }}>Ajustes razonables</div>
          <Typography style={{ color: '#374151' }}>
            No hay ajustes registrados para este estudiante.
          </Typography>
          <Typography style={{ ...e.meta, marginTop: 8, fontSize: 12 }}>
            Se registran en el bloque <strong>Disability Services</strong> de
            SGADISA (tabla SGRDSER). Hoy está vacío en este ambiente.
          </Typography>
        </div>
      </div>

      <Typography style={{ ...e.meta, marginTop: 24, fontSize: 12 }}>
        Dato sensible (Ley 29733). Úselo únicamente para aplicar los ajustes
        razonables que correspondan y no lo difunda.
      </Typography>
    </div>
  );
}
