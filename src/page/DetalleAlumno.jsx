import React, { useCallback, useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { usePageControl } from '@ellucian/experience-extension-utils';

import { C } from '../config';
import { formatearFecha, obtenerDetalleAlumno } from '../api/discapacidad';
import { useEthosFetch } from '../api/useEthosFetch';
import {
  Aviso, Encabezado, NotaLegal, Pagina, describirError, s,
} from '../components/Estructura';
import {
  IconoCalendario, IconoCorreo, IconoPersona, IconoTelefono, IconoUbicacion,
} from '../components/Iconos';

const e = {
  cabecera: { display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 32 },
  iconoCabecera: {
    width: 56,
    height: 56,
    borderRadius: 16,
    background: C.azul50,
    color: C.morado,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  tarjeta: {
    background: C.blanco,
    border: `1px solid ${C.borde}`,
    borderRadius: 12,
    boxShadow: '0 1px 2px 0 rgba(0,0,0,.05)',
    padding: '24px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: 24,
  },
  tarjetaCabecera: { padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 6 },
  nombre: { margin: 0, fontSize: 20, lineHeight: '28px', fontWeight: 600, color: C.texto },
  sub: { margin: 0, fontSize: 14, color: C.textoSuave },
  estado: {
    marginTop: 8,
    alignSelf: 'flex-start',
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: 999,
    border: '1px solid',
    padding: '1px 8px',
    fontSize: 12,
    fontWeight: 500,
    lineHeight: '18px',
  },
  contenido: { padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 24 },
  separador: { height: 1, background: C.separador, border: 0, margin: 0 },
  dosColumnas: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 20 },
  tresColumnas: { display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 },
  dato: { display: 'flex', alignItems: 'flex-start', gap: 12 },
  datoIcono: {
    marginTop: 2,
    width: 36,
    height: 36,
    borderRadius: 8,
    background: C.gris100,
    color: C.textoSuave,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  etiqueta: { margin: 0, fontSize: 12, fontWeight: 500, color: C.textoSuave },
  valor: {
    margin: '4px 0 0', fontSize: 14, fontWeight: 500, color: C.textoCuerpo, overflowWrap: 'anywhere',
  },
  sinDato: { fontWeight: 400, color: C.textoTenue },
  caja: { background: C.gris50, borderRadius: 8, padding: 12 },
  ajustes: {
    background: C.azulFondo,
    border: `1px solid ${C.azulBorde}`,
    borderRadius: 12,
    padding: 16,
  },
  ajustesTitulo: {
    margin: 0,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color: C.moradoTexto,
  },
  ajustesTexto: { margin: '8px 0 0', fontSize: 14, lineHeight: '24px', color: C.textoSecundario },
  ajustesVigencia: { margin: '4px 0 0', fontSize: 12, color: C.textoSuave },
  esqueleto: { background: '#E2E8F0', borderRadius: 6 },
};

function Valor({ valor }) {
  return valor
    ? <p style={e.valor}>{valor}</p>
    : <p style={{ ...e.valor, ...e.sinDato }}>No registrado</p>;
}

function Dato({ icono, etiqueta, valor }) {
  return (
    <div style={e.dato}>
      <div style={e.datoIcono}>{icono}</div>
      <div style={{ minWidth: 0 }}>
        <p style={e.etiqueta}>{etiqueta}</p>
        <Valor valor={valor} />
      </div>
    </div>
  );
}

function Caja({ etiqueta, valor }) {
  return (
    <div style={e.caja}>
      <p style={{ ...e.etiqueta, fontWeight: 400 }}>{etiqueta}</p>
      <Valor valor={valor} />
    </div>
  );
}

function FichaCargando({ resumen }) {
  return (
    <div style={e.tarjeta} aria-busy="true">
      <div style={e.tarjetaCabecera}>
        {resumen
          ? <h2 style={e.nombre}>{resumen.nombreCompleto}</h2>
          : <div className="bu-pulso" style={{ ...e.esqueleto, width: 260, height: 22 }} />}
        <div className="bu-pulso" style={{ ...e.esqueleto, width: 220, height: 14, marginTop: 4 }} />
      </div>
      <div style={e.contenido}>
        <hr style={e.separador} />
        <div className="bu-pulso bu-dos-columnas" style={e.dosColumnas}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={e.dato}>
              <div style={{ ...e.datoIcono, background: '#E2E8F0' }} />
              <div style={{ flex: 1 }}>
                <div style={{ ...e.esqueleto, width: '45%', height: 10 }} />
                <div style={{ ...e.esqueleto, width: '70%', height: 14, marginTop: 8 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function vigencia(ficha) {
  const desde = formatearFecha(ficha.vigenteDesde);
  const hasta = formatearFecha(ficha.vigenteHasta);
  if (desde && hasta) return `Vigencia: del ${desde} al ${hasta}`;
  if (desde) return `Vigente desde el ${desde}`;
  if (hasta) return `Vigente hasta el ${hasta}`;
  return null;
}

export default function DetalleAlumno({ idAlumno, term }) {
  const authenticatedEthosFetch = useEthosFetch();
  const { setPageTitle } = usePageControl();
  const history = useHistory();
  const location = useLocation();
  const resumen = location.state && location.state.alumno;

  const [estado, setEstado] = useState('cargando');
  const [error, setError] = useState(null);
  const [ficha, setFicha] = useState(null);

  const cargar = useCallback(async () => {
    setEstado('cargando');
    setError(null);
    try {
      const datos = await obtenerDetalleAlumno(authenticatedEthosFetch, { idalumno: idAlumno, term });
      setFicha(datos);
      setEstado(datos ? 'listo' : 'vacio');
    } catch (err) {
      console.error('[Bienestar]', err);
      setError(err);
      setEstado('error');
    }
  }, [authenticatedEthosFetch, idAlumno, term]);

  useEffect(() => {
    if (setPageTitle) setPageTitle('Bienestar Universitario');
  }, [setPageTitle]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const volver = () => {
    if (history.length > 1 && resumen) history.goBack();
    else history.push('/');
  };

  let cuerpo;
  if (estado === 'cargando') {
    cuerpo = <FichaCargando resumen={resumen} />;
  } else if (estado === 'error') {
    cuerpo = (
      <Aviso
        tono="error"
        titulo="No pudimos cargar la ficha del estudiante"
        texto="Intenta nuevamente en unos segundos."
        accion={cargar}
        textoAccion="Reintentar"
        detalle={describirError(error)}
      />
    );
  } else if (estado === 'vacio') {
    cuerpo = (
      <Aviso
        titulo="No encontramos el registro del estudiante"
        texto={`El código ${idAlumno} no tiene una discapacidad registrada en SGADISA para el periodo ${term}.`}
      />
    );
  } else {
    const carrera = ficha.carrera || (resumen && resumen.carrera) || null;
    const tipos = ficha.discapacidades.map((d) => d.descripcion).join(', ');
    const textoVigencia = vigencia(ficha);
    const colorEstado = ficha.vigente
      ? { background: C.activoFondo, borderColor: C.activoBorde, color: C.activoTexto }
      : { background: '#FFFBEB', borderColor: '#FDE68A', color: '#B45309' };

    cuerpo = (
      <section style={e.tarjeta} aria-label={`Ficha de ${ficha.nombreCompleto}`}>
        <div style={e.tarjetaCabecera}>
          <h2 style={e.nombre}>{ficha.nombreCompleto}</h2>
          <p style={e.sub}>
            {carrera || 'Carrera no registrada'} · Periodo {ficha.periodo}
          </p>
          <span style={{ ...e.estado, ...colorEstado }}>
            {ficha.vigente ? 'Registro activo' : 'Registro vencido'}
          </span>
        </div>

        <div style={e.contenido}>
          <hr style={e.separador} />
          <div className="bu-dos-columnas" style={e.dosColumnas}>
            <Dato
              icono={<IconoCalendario tamano={16} />}
              etiqueta="Fecha de nacimiento"
              valor={formatearFecha(ficha.fechaNacimiento)}
            />
            <Dato icono={<IconoCorreo tamano={16} />} etiqueta="Correo institucional" valor={ficha.correo} />
            <Dato icono={<IconoTelefono tamano={16} />} etiqueta="Teléfono de contacto" valor={ficha.telefono} />
            <Dato icono={<IconoUbicacion tamano={16} />} etiqueta="Dirección registrada" valor={ficha.direccion} />
          </div>

          <hr style={e.separador} />
          <div className="bu-tres-columnas" style={e.tresColumnas}>
            <Caja etiqueta="Carrera" valor={carrera} />
            <Caja etiqueta="Periodo" valor={ficha.periodo} />
            <Caja etiqueta="Tipo de discapacidad" valor={tipos} />
          </div>

          <div style={e.ajustes}>
            <p style={e.ajustesTitulo}>Ajustes razonables</p>
            <p style={e.ajustesTexto}>
              {ficha.ajustes.length > 0
                ? ficha.ajustes.join(', ')
                : 'No hay ajustes razonables registrados en SGADISA para este estudiante.'}
            </p>
            {textoVigencia && <p style={e.ajustesVigencia}>{textoVigencia}</p>}
          </div>
        </div>
      </section>
    );
  }

  return (
    <Pagina>
      <Encabezado subtitulo="Ficha detallada del estudiante" textoVolver="Volver a alumnos" alVolver={volver} />

      <main className="bu-contenedor" style={s.contenedor}>
        <div style={e.cabecera}>
          <div style={e.iconoCabecera}><IconoPersona tamano={28} /></div>
          <div>
            <p style={s.antetitulo}>Ficha del estudiante · {idAlumno}</p>
            <h1 style={s.titulo}>Detalle del estudiante</h1>
            <p style={s.bajada}>
              Información registrada y vigencia de los ajustes razonables autorizados.
            </p>
          </div>
        </div>

        {cuerpo}

        <NotaLegal />
      </main>
    </Pagina>
  );
}
