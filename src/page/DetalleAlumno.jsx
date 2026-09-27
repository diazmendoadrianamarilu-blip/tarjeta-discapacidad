import React, { useCallback, useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { usePageControl } from '@ellucian/experience-extension-utils';

import { C, MOSTRAR_DIAGNOSTICO } from '../config';
import { formatearFecha, obtenerDatosPersonales, obtenerDetalleAlumno } from '../api/discapacidad';
import { useEthosFetch } from '../api/useEthosFetch';
import {
  Aviso, Encabezado, NotaLegal, Pagina, describirError, s,
} from '../components/Estructura';
import {
  IconoCalendario, IconoCorreo, IconoEscudo, IconoFlechaDerecha, IconoPersona, IconoPersonas,
  IconoTelefono, IconoUbicacion,
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
    margin: '4px 0 0', fontSize: 14, fontWeight: 500, color: C.textoCuerpo, overflowWrap: 'anywhere', whiteSpace: 'pre-line',
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
  codigo: { margin: '2px 0 0', fontSize: 12, color: C.textoTenue, overflowWrap: 'anywhere' },
  adicional: { border: `1px solid ${C.borde}`, borderRadius: 12, overflow: 'hidden' },
  adicionalBoton: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: '14px 16px',
    border: 0,
    background: C.blanco,
    color: C.texto,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'left',
  },
  adicionalCuerpo: { padding: 16, borderTop: `1px solid ${C.borde}` },
  adicionalNota: { margin: 0, fontSize: 14, color: C.textoSuave },
  adicionalReintentar: {
    marginTop: 8,
    padding: '6px 12px',
    border: `1px solid ${C.borde}`,
    borderRadius: 6,
    background: C.blanco,
    color: C.textoSecundario,
    fontSize: 13,
    cursor: 'pointer',
  },
};

/* valor: texto, o { codigo, descripcion } de una tabla de validación de Banner
   (se muestra la descripción y, debajo, el código). */
function Valor({ valor }) {
  if (valor && typeof valor === 'object') {
    const principal = valor.descripcion || valor.codigo;
    return (
      <>
        <p style={e.valor}>{principal}</p>
        {valor.descripcion && valor.codigo && <p style={e.codigo}>Código {valor.codigo}</p>}
      </>
    );
  }
  return valor
    ? <p style={e.valor}>{valor}</p>
    : <p style={{ ...e.valor, ...e.sinDato }}>No registrado</p>;
}

function textoTutor(tutor) {
  if (!tutor) return null;
  return [tutor.nombre, tutor.id].filter(Boolean).join(' · ');
}

/* Sección desplegable "Datos adicionales": se consulta solo al abrirla. */
function DatosAdicionales({ idAlumno }) {
  const authenticatedEthosFetch = useEthosFetch();
  const [abierto, setAbierto] = useState(false);
  const [estado, setEstado] = useState('inicial'); // inicial | cargando | listo | error
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    setEstado('cargando');
    setError(null);
    try {
      setDatos(await obtenerDatosPersonales(authenticatedEthosFetch, idAlumno));
      setEstado('listo');
    } catch (err) {
      console.error('[Bienestar]', err);
      setError(err);
      setEstado('error');
    }
  }, [authenticatedEthosFetch, idAlumno]);

  const alternar = () => {
    const siguiente = !abierto;
    setAbierto(siguiente);
    if (siguiente && estado === 'inicial') cargar();
  };

  let contenido = null;
  if (estado === 'cargando') {
    contenido = <p style={e.adicionalNota}>Cargando datos adicionales…</p>;
  } else if (estado === 'error') {
    contenido = (
      <div>
        <p style={e.adicionalNota}>No pudimos cargar los datos adicionales.</p>
        <button type="button" className="bu-volver" style={e.adicionalReintentar} onClick={cargar}>
          Reintentar
        </button>
        {MOSTRAR_DIAGNOSTICO && <p style={e.codigo}>{describirError(error)}</p>}
      </div>
    );
  } else if (estado === 'listo' && !datos) {
    contenido = <p style={e.adicionalNota}>No hay datos adicionales registrados para este estudiante.</p>;
  } else if (estado === 'listo') {
    const direccion = datos.direcciones[0];
    contenido = (
      <div className="bu-dos-columnas" style={e.dosColumnas}>
        <Dato
          icono={<IconoCalendario tamano={16} />}
          etiqueta="Fecha de nacimiento"
          valor={formatearFecha(datos.fechaNacimiento)}
        />
        <Dato
          icono={<IconoUbicacion tamano={16} />}
          etiqueta={direccion && direccion.tipo ? `Dirección (${direccion.tipo})` : 'Dirección'}
          valor={direccion ? direccion.linea : null}
        />
        <Dato icono={<IconoUbicacion tamano={16} />} etiqueta="Ciudad / distrito" valor={direccion && direccion.distrito} />
        <Dato icono={<IconoUbicacion tamano={16} />} etiqueta="Provincia" valor={direccion && direccion.provincia} />
        <Dato icono={<IconoUbicacion tamano={16} />} etiqueta="Departamento (región)" valor={direccion && direccion.region} />
        <Dato icono={<IconoUbicacion tamano={16} />} etiqueta="País" valor={direccion && direccion.pais} />
        <Dato
          icono={<IconoTelefono tamano={16} />}
          etiqueta="Teléfono"
          valor={datos.telefonos.map((t) => (t.tipo ? `${t.numero} (${t.tipo})` : t.numero)).join(' · ') || null}
        />
        <Dato
          icono={<IconoCorreo tamano={16} />}
          etiqueta="Correo"
          valor={datos.correos.map((c) => c.correo).join(' · ') || null}
        />
      </div>
    );
  }

  return (
    <div style={e.adicional}>
      <button
        type="button"
        className="bu-volver"
        style={e.adicionalBoton}
        aria-expanded={abierto}
        aria-controls="bu-datos-adicionales"
        onClick={alternar}
      >
        <span>Datos adicionales</span>
        <span style={{ display: 'flex', transition: 'transform .15s ease', transform: `rotate(${abierto ? 90 : 0}deg)` }}>
          <IconoFlechaDerecha tamano={18} />
        </span>
      </button>
      {abierto && <div id="bu-datos-adicionales" style={e.adicionalCuerpo}>{contenido}</div>}
    </div>
  );
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

function vigencia(d) {
  const desde = formatearFecha(d.vigenteDesde);
  const hasta = formatearFecha(d.vigenteHasta);
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
    const secciones = ficha.secciones || (resumen && resumen.secciones) || [];
    const cursos = secciones
      .map((c) => [c.codigo, `NRC ${c.nrc}`, c.titulo].filter(Boolean).join(' · '))
      .join('\n');
    // Si no hay registros vigentes se muestran todos, marcados como vencidos en el estado.
    const ajustes = ficha.ajustesActivos.length > 0 ? ficha.ajustesActivos : ficha.discapacidades;
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
            <Dato icono={<IconoPersona tamano={16} />} etiqueta="Código (ID Banner)" valor={ficha.idAlumno} />
            <Dato icono={<IconoUbicacion tamano={16} />} etiqueta="Campus" valor={ficha.campus} />
            <Dato icono={<IconoEscudo tamano={16} />} etiqueta="Programa" valor={ficha.programa} />
            <Dato icono={<IconoPersonas tamano={16} />} etiqueta="Nivel" valor={ficha.nivel} />
            <Dato icono={<IconoEscudo tamano={16} />} etiqueta="Escuela" valor={ficha.escuela} />
            <Dato icono={<IconoEscudo tamano={16} />} etiqueta="Departamento" valor={ficha.departamento} />
            {ficha.ciclo && <Dato icono={<IconoCalendario tamano={16} />} etiqueta="Ciclo" valor={ficha.ciclo} />}
            {ficha.tutor && <Dato icono={<IconoPersona tamano={16} />} etiqueta="Tutor" valor={textoTutor(ficha.tutor)} />}
          </div>

          <hr style={e.separador} />
          <div className="bu-tres-columnas" style={e.tresColumnas}>
            <Caja etiqueta="Carrera" valor={carrera} />
            <Caja etiqueta="Tipo de discapacidad" valor={tipos} />
            <Caja etiqueta="Curso(s) contigo" valor={cursos || null} />
          </div>

          <div style={e.ajustes}>
            <p style={e.ajustesTitulo}>Ajustes razonables activos</p>
            {ajustes.length > 0 ? ajustes.map((d) => (
              <div key={d.codigo}>
                <p style={e.ajustesTexto}>
                  {d.descripcion}
                  {d.principal ? ' (principal)' : ''}
                </p>
                <p style={e.ajustesVigencia}>{vigencia(d) || 'Sin fechas de vigencia registradas'}</p>
              </div>
            )) : (
              <p style={e.ajustesTexto}>
                No hay ajustes razonables registrados en SGADISA para este estudiante.
              </p>
            )}
          </div>

          <DatosAdicionales idAlumno={ficha.idAlumno} />
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
