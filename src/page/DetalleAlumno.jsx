import React, { useCallback, useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { usePageControl } from '@ellucian/experience-extension-utils';

import { MOSTRAR_DIAGNOSTICO } from '../config';
import { formatearFecha, obtenerDatosPersonales, obtenerDetalleAlumno } from '../api/discapacidad';
import { useEthosFetch } from '../api/useEthosFetch';
import { Aviso, NotaLegal, describirError } from '../components/Estructura';
import {
  Badge, ChipDiscapacidad, EnlaceVolver, IconoDiscapacidad, IconoPanel, Lienzo, USS, tipografia,
} from '../components/Tema';
import {
  IconoBirrete, IconoCalendario, IconoCorreo, IconoFlechaDerecha, IconoLibro, IconoPersona, IconoTelefono,
  IconoUbicacion,
} from '../components/Iconos';

const e = {
  cabecera: {
    display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 16, marginBottom: 24,
  },
  estadoActivo: {
    display: 'inline-flex', alignItems: 'center', gap: 8, border: `1px solid ${USS.verdeBorde}`,
    background: USS.verdeFondo, color: USS.texto, borderRadius: 999, padding: '4px 12px',
    fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', alignSelf: 'flex-start',
  },
  estadoVencido: {
    display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid #FDE68A', background: '#FFFBEB',
    color: '#92400E', borderRadius: 999, padding: '4px 12px', fontSize: 13, fontWeight: 600,
    whiteSpace: 'nowrap', alignSelf: 'flex-start',
  },
  punto: { width: 8, height: 8, borderRadius: 999, flexShrink: 0 },
  columna: { display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 },
  panel: { padding: 20 },
  panelCabecera: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 },
  etiqueta: { margin: 0, fontSize: 12, fontWeight: 500, color: USS.textoSuave },
  valor: { margin: '2px 0 0', fontSize: 14, fontWeight: 500, color: USS.texto, overflowWrap: 'anywhere' },
  codigo: { margin: '1px 0 0', fontSize: 12, color: USS.textoTenue },
  sinDato: { margin: '2px 0 0', fontSize: 14, color: USS.textoTenue },
  destacado: { background: USS.verdeFondo, borderColor: USS.verdeBorde, boxShadow: 'none' },
  ajuste: { padding: '12px 0', borderTop: `1px solid ${USS.verdeBorde}` },
  ajusteNombre: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  ajusteVigencia: { margin: '6px 0 0', fontSize: 13, color: USS.textoSuave },
  curso: {
    display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', columnGap: 12, rowGap: 2, padding: '12px 0',
    borderTop: `1px solid ${USS.borde}`,
  },
  cursoCodigo: { fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', color: USS.textoSuave },
  cursoTitulo: { fontSize: 14, fontWeight: 600, color: USS.texto },
  cursoPeriodo: { fontSize: 13, color: USS.textoSuave },
  acordeon: {
    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
    padding: '16px 20px', border: 0, borderRadius: 12, background: USS.superficie, color: USS.textoSuave,
    fontSize: 14, fontWeight: 700, cursor: 'pointer', textAlign: 'left',
  },
  acordeonCuerpo: { padding: 20, borderTop: `1px solid ${USS.borde}` },
  nota: { margin: 0, fontSize: 14, color: USS.textoSuave },
  botonSec: {
    marginTop: 12, height: 34, padding: '0 14px', border: `1px solid ${USS.borde}`, borderRadius: 8,
    background: USS.superficie, color: USS.morado, fontSize: 13, fontWeight: 600, cursor: 'pointer',
  },
  diag: {
    marginTop: 12, padding: '10px 12px', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 8,
    fontSize: 12, color: '#78350F', whiteSpace: 'pre-wrap', fontFamily: 'ui-monospace, Consolas, monospace',
  },
  esqueleto: { background: USS.borde, borderRadius: 6 },
};

/* valor: texto, o { codigo, descripcion } de una tabla de validación de Banner. */
function Campo({ etiqueta, valor, icono }) {
  let contenido;
  if (valor && typeof valor === 'object') {
    contenido = (
      <>
        <dd style={{ ...e.valor, marginLeft: 0 }}>{valor.descripcion || valor.codigo}</dd>
        {valor.descripcion && valor.codigo && <dd style={{ ...e.codigo, marginLeft: 0 }}>{valor.codigo}</dd>}
      </>
    );
  } else if (valor) {
    contenido = <dd style={{ ...e.valor, marginLeft: 0 }}>{valor}</dd>;
  } else {
    contenido = <dd style={{ ...e.sinDato, marginLeft: 0 }}>No registrado</dd>;
  }
  const campo = (
    <div style={{ minWidth: 0 }}>
      <dt style={e.etiqueta}>{etiqueta}</dt>
      {contenido}
    </div>
  );
  if (!icono) return campo;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, minWidth: 0 }}>
      <span style={{ display: 'flex', marginTop: 2, color: USS.textoTenue }} aria-hidden="true">{icono}</span>
      {campo}
    </div>
  );
}

function Panel({ titulo, icono, extra, destacado, children }) {
  return (
    <section className="bu-tarjeta" style={{ ...e.panel, ...(destacado ? e.destacado : null) }} aria-label={titulo}>
      <div style={e.panelCabecera}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          {icono}
          <h2 style={tipografia.panelTitulo}>{titulo}</h2>
        </div>
        {extra}
      </div>
      {children}
    </section>
  );
}

function vigencia(d) {
  const desde = formatearFecha(d.vigenteDesde);
  const hasta = formatearFecha(d.vigenteHasta);
  if (desde && hasta) return `Vigente del ${desde} al ${hasta}`;
  if (desde) return `Vigente desde el ${desde}`;
  if (hasta) return `Vigente hasta el ${hasta}`;
  return 'Sin fechas de vigencia registradas';
}

function textoTutor(tutor) {
  if (!tutor) return null;
  return [tutor.nombre, tutor.id].filter(Boolean).join(' · ');
}

/* "Datos adicionales": se consulta solo al abrirla. */
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
    contenido = <p style={e.nota}>Cargando datos adicionales…</p>;
  } else if (estado === 'error') {
    contenido = (
      <div>
        <p style={e.nota}>No pudimos cargar los datos adicionales.</p>
        <button type="button" className="bu-btn-sec" style={e.botonSec} onClick={cargar}>Reintentar</button>
        {MOSTRAR_DIAGNOSTICO && <div style={e.diag}>{describirError(error)}</div>}
      </div>
    );
  } else if (estado === 'listo' && !datos) {
    contenido = <p style={e.nota}>No hay datos adicionales registrados para este estudiante.</p>;
  } else if (estado === 'listo') {
    const dir = datos.direcciones[0] || {};
    contenido = (
      <dl className="bu-datos">
        <Campo icono={<IconoCalendario tamano={16} />} etiqueta="Fecha de nacimiento" valor={formatearFecha(datos.fechaNacimiento)} />
        <Campo icono={<IconoUbicacion tamano={16} />} etiqueta={dir.tipo ? `Dirección (${dir.tipo})` : 'Dirección'} valor={dir.linea} />
        <Campo icono={<IconoUbicacion tamano={16} />} etiqueta="Ciudad / distrito" valor={dir.distrito} />
        <Campo icono={<IconoUbicacion tamano={16} />} etiqueta="Provincia" valor={dir.provincia} />
        <Campo icono={<IconoUbicacion tamano={16} />} etiqueta="Departamento (región)" valor={dir.region} />
        <Campo icono={<IconoUbicacion tamano={16} />} etiqueta="País" valor={dir.pais} />
        <Campo
          icono={<IconoTelefono tamano={16} />}
          etiqueta="Teléfono"
          valor={datos.telefonos.map((t) => (t.tipo ? `${t.numero} (${t.tipo})` : t.numero)).join('\n') || null}
        />
        <Campo icono={<IconoCorreo tamano={16} />} etiqueta="Correo" valor={datos.correos.map((c) => c.correo).join('\n') || null} />
      </dl>
    );
  }

  return (
    <section className="bu-tarjeta" aria-label="Datos adicionales">
      <button
        type="button"
        className="bu-acordeon"
        style={{ ...e.acordeon, borderRadius: abierto ? '12px 12px 0 0' : 12 }}
        aria-expanded={abierto}
        aria-controls="bu-datos-adicionales"
        onClick={alternar}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
          <IconoPanel Icono={IconoPersona} />
          <span style={tipografia.panelTitulo}>Datos adicionales</span>
        </span>
        <span style={{ display: 'flex', transition: 'transform .15s ease', transform: `rotate(${abierto ? 90 : 0}deg)` }}>
          <IconoFlechaDerecha tamano={18} />
        </span>
      </button>
      {abierto && <div id="bu-datos-adicionales" style={e.acordeonCuerpo}>{contenido}</div>}
    </section>
  );
}

function FichaCargando({ resumen }) {
  const linea = (ancho, alto, extra) => (
    <div className="bu-pulso" style={{ ...e.esqueleto, width: ancho, height: alto, ...extra }} />
  );
  return (
    <div aria-busy="true" aria-label="Cargando ficha">
      <div style={e.cabecera}>
        <div style={{ flex: 1 }}>
          {linea(120, 12)}
          {resumen
            ? <h1 style={tipografia.titulo}>{resumen.nombreCompleto}</h1>
            : linea('50%', 28, { marginTop: 10 })}
          {linea('35%', 14, { marginTop: 10 })}
        </div>
      </div>
      <div className="bu-ficha-grid">
        {[0, 1].map((i) => (
          <div key={i} className="bu-tarjeta" style={e.panel}>
            {linea(140, 12)}
            {[0, 1, 2].map((j) => <div key={j}>{linea('60%', 14, { marginTop: 18 })}</div>)}
          </div>
        ))}
      </div>
    </div>
  );
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
        texto={`El código ${idAlumno} no figura entre los estudiantes con discapacidad de tus cursos vigentes.`}
      />
    );
  } else {
    const carrera = ficha.carrera || (resumen && resumen.carrera) || null;
    const secciones = ficha.secciones || (resumen && resumen.secciones) || [];
    // Si no hay registros vigentes se muestran todos, con el estado "vencido".
    const ajustes = ficha.ajustesActivos.length > 0 ? ficha.ajustesActivos : ficha.discapacidades;

    cuerpo = (
      <>
        <div className="bu-cabecera" style={e.cabecera}>
          <div style={{ minWidth: 0 }}>
            <p style={tipografia.antetitulo}>Ficha del estudiante</p>
            <h1 style={tipografia.titulo}>{ficha.nombreCompleto}</h1>
            <p style={tipografia.bajada}>
              {[ficha.idAlumno, carrera, `Periodo ${ficha.periodo}`].filter(Boolean).join(' · ')}
            </p>
          </div>
          {ficha.vigente ? (
            <span style={e.estadoActivo}>
              <span style={{ ...e.punto, background: USS.verdeLima }} aria-hidden="true" />
              Registro activo
            </span>
          ) : (
            <span style={e.estadoVencido}>
              <span style={{ ...e.punto, background: '#F59E0B' }} aria-hidden="true" />
              Registro vencido
            </span>
          )}
        </div>

        <div className="bu-ficha-grid">
          <div style={e.columna}>
            <Panel titulo="Datos académicos" icono={<IconoPanel Icono={IconoBirrete} tono="azul" />}>
              <dl className="bu-datos">
                <Campo etiqueta="Código (ID Banner)" valor={ficha.idAlumno} />
                <Campo etiqueta="Carrera" valor={carrera} />
                <Campo etiqueta="Programa" valor={ficha.programa} />
                <Campo etiqueta="Campus" valor={ficha.campus} />
                <Campo etiqueta="Facultad" valor={ficha.escuela} />
                <Campo etiqueta="Escuela profesional" valor={ficha.departamento} />
                <Campo etiqueta="Nivel" valor={ficha.nivel} />
                {ficha.ciclo && <Campo etiqueta="Ciclo" valor={ficha.ciclo} />}
                {ficha.tutor && <Campo etiqueta="Tutor" valor={textoTutor(ficha.tutor)} />}
              </dl>
            </Panel>

            <Panel
              titulo="Cursos contigo"
              icono={<IconoPanel Icono={IconoLibro} />}
              extra={<Badge>{secciones.length} {secciones.length === 1 ? 'curso' : 'cursos'}</Badge>}
            >
              {secciones.length === 0 ? (
                <p style={e.nota}>Sin cursos registrados.</p>
              ) : (
                <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                  {secciones.map((c, i) => (
                    <li key={c.clave || c.nrc} style={{ ...e.curso, ...(i === 0 ? { borderTop: 0, paddingTop: 0 } : null) }}>
                      <span style={e.cursoCodigo}>{[c.codigo, `NRC ${c.nrc}`].filter(Boolean).join(' · ')}</span>
                      <span style={e.cursoTitulo}>{c.titulo || 'Curso sin título registrado'}</span>
                      {c.periodo && <span style={e.cursoPeriodo}>Periodo {c.periodo}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>

          <div style={e.columna}>
            <Panel
              titulo="Discapacidad y ajustes razonables"
              icono={<IconoDiscapacidad discapacidad={ajustes[0]} tamano={30} />}
              destacado
            >
              {ajustes.length === 0 ? (
                <p style={e.nota}>No hay ajustes razonables registrados en SGADISA para este estudiante.</p>
              ) : ajustes.map((d, i) => (
                <div key={d.codigo} style={{ ...e.ajuste, ...(i === 0 ? { borderTop: 0, paddingTop: 0 } : null) }}>
                  <div style={e.ajusteNombre}>
                    <ChipDiscapacidad discapacidad={d} />
                    {d.principal && ajustes.length > 1 && <Badge tono="neutro">Principal</Badge>}
                  </div>
                  <p style={e.ajusteVigencia}>{vigencia(d)}</p>
                </div>
              ))}
            </Panel>
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          <DatosAdicionales idAlumno={ficha.idAlumno} />
        </div>
      </>
    );
  }

  return (
    <Lienzo>
      <EnlaceVolver texto="Volver a alumnos" onClick={volver} />
      {cuerpo}
      <NotaLegal />
    </Lienzo>
  );
}
