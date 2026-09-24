import React from 'react';
import { C, FUENTE, MOSTRAR_DIAGNOSTICO } from '../config';
import { IconoAlerta, IconoEscudo, IconoVolver } from './Iconos';

/* Lo que no se puede expresar con estilos en línea (hover, foco, responsive,
   animación) va aquí, con prefijo "bu-" para no chocar con Experience. */
const CSS = `
.bu-raiz, .bu-raiz * { box-sizing: border-box; }
.bu-raiz button { font-family: inherit; }
.bu-fila { transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease; }
.bu-fila:hover { transform: translateY(-2px); border-color: #BFDBFE !important;
  box-shadow: 0 4px 6px -1px rgba(0,0,0,.1), 0 2px 4px -2px rgba(0,0,0,.1) !important; }
.bu-fila:hover .bu-fila-icono { background: #EFF6FF !important; color: ${C.morado} !important; }
.bu-fila:hover .bu-fila-flecha { transform: translateX(2px); color: ${C.morado} !important; }
.bu-fila-flecha { transition: transform .15s ease, color .15s ease; }
.bu-fila:focus-visible, .bu-boton:focus-visible, .bu-volver:focus-visible {
  outline: 2px solid #2879A8; outline-offset: 2px; }
.bu-volver:hover { background: ${C.gris100} !important; color: ${C.texto} !important; }
.bu-boton-morado:hover { background: ${C.moradoHover} !important; }
.bu-boton-verde:hover { background: ${C.verdeHover} !important; }
.bu-boton:disabled { opacity: .6; cursor: progress !important; }
.bu-pulso { animation: bu-pulso 1.4s ease-in-out infinite; }
@keyframes bu-pulso { 0%,100% { opacity: 1; } 50% { opacity: .45; } }
@media (max-width: 639px) {
  .bu-contenedor { padding: 24px 16px !important; }
  .bu-barra { padding: 16px !important; }
  .bu-solo-escritorio { display: none !important; }
  .bu-apilar { flex-direction: column !important; align-items: stretch !important; }
  .bu-ancho-completo { width: 100% !important; justify-content: center; }
  .bu-dos-columnas, .bu-tres-columnas { grid-template-columns: 1fr !important; }
}
@media (min-width: 640px) and (max-width: 767px) {
  .bu-dos-columnas, .bu-tres-columnas { grid-template-columns: 1fr !important; }
}
`;

export const s = {
  raiz: {
    background: C.fondo,
    minHeight: '100%',
    color: C.texto,
    fontFamily: FUENTE,
    fontSize: 14,
    lineHeight: 1.5,
    WebkitFontSmoothing: 'antialiased',
  },
  contenedor: { maxWidth: 1024, margin: '0 auto', padding: '40px 32px' },
  antetitulo: {
    margin: '0 0 8px',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: C.moradoTexto,
  },
  titulo: {
    margin: 0,
    fontSize: 30,
    lineHeight: '36px',
    fontWeight: 600,
    letterSpacing: '-0.025em',
    color: C.texto,
  },
  bajada: { margin: '8px 0 0', fontSize: 14, color: C.textoSuave },
  nota: { margin: '32px 0 0', fontSize: 12, color: C.textoTenue },
};

const e = {
  barra: { background: C.blanco, borderBottom: `1px solid ${C.borde}` },
  barraInterior: {
    maxWidth: 1024,
    margin: '0 auto',
    padding: '20px 32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  marca: { display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 },
  iconoMarca: {
    width: 40,
    height: 40,
    borderRadius: 8,
    background: C.morado,
    color: C.blanco,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  marcaTitulo: { margin: 0, fontSize: 14, fontWeight: 600, color: C.texto, lineHeight: '20px' },
  marcaSub: { margin: 0, fontSize: 12, color: C.textoSuave, lineHeight: '16px' },
  volver: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    height: 36,
    padding: '0 12px',
    border: 0,
    borderRadius: 6,
    background: 'transparent',
    color: '#475569',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  aviso: {
    background: C.blanco,
    border: `1px solid ${C.borde}`,
    borderRadius: 12,
    padding: '48px 24px',
    textAlign: 'center',
    boxShadow: '0 1px 2px 0 rgba(0,0,0,.05)',
  },
  avisoIcono: {
    width: 48,
    height: 48,
    borderRadius: 12,
    margin: '0 auto 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avisoTitulo: { margin: 0, fontSize: 16, fontWeight: 600, color: C.texto },
  avisoTexto: { margin: '6px auto 0', maxWidth: 520, fontSize: 14, color: C.textoSuave },
  botonMorado: {
    marginTop: 20,
    height: 36,
    padding: '0 16px',
    border: 0,
    borderRadius: 6,
    background: C.morado,
    color: C.blanco,
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
  },
  diag: {
    marginTop: 16,
    textAlign: 'left',
    background: '#FFFBEB',
    border: '1px solid #FDE68A',
    borderRadius: 8,
    padding: '12px 14px',
    fontSize: 12,
    color: '#78350F',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
};

export function Pagina({ children }) {
  return (
    <div className="bu-raiz" style={s.raiz}>
      <style>{CSS}</style>
      {children}
    </div>
  );
}

export function Encabezado({ subtitulo, textoVolver, alVolver }) {
  return (
    <header style={e.barra}>
      <div className="bu-barra" style={e.barraInterior}>
        <div style={e.marca}>
          <div style={e.iconoMarca}><IconoEscudo tamano={20} /></div>
          <div style={{ minWidth: 0 }}>
            <p style={e.marcaTitulo}>Bienestar Universitario</p>
            <p style={e.marcaSub}>{subtitulo}</p>
          </div>
        </div>
        {textoVolver && (
          <button type="button" className="bu-volver" style={e.volver} onClick={alVolver}>
            <IconoVolver tamano={16} /> {textoVolver}
          </button>
        )}
      </div>
    </header>
  );
}

/* Panel central para "sin alumnos", errores, etc. */
export function Aviso({ icono, tono = 'neutro', titulo, texto, accion, textoAccion, detalle }) {
  const colores = tono === 'error'
    ? { fondo: '#FEF2F2', color: C.error }
    : { fondo: C.gris100, color: C.textoSuave };
  return (
    <div style={e.aviso} role={tono === 'error' ? 'alert' : 'status'}>
      <div style={{ ...e.avisoIcono, background: colores.fondo, color: colores.color }}>
        {icono || <IconoAlerta tamano={22} />}
      </div>
      <p style={{ ...e.avisoTitulo, color: tono === 'error' ? C.error : C.texto }}>{titulo}</p>
      {texto && <p style={e.avisoTexto}>{texto}</p>}
      {accion && (
        <button type="button" className="bu-boton bu-boton-morado" style={e.botonMorado} onClick={accion}>
          {textoAccion}
        </button>
      )}
      {MOSTRAR_DIAGNOSTICO && detalle && <div style={e.diag}>{detalle}</div>}
    </div>
  );
}

export function NotaLegal() {
  return (
    <p style={s.nota}>
      Dato sensible (Ley N.° 29733). Úselo únicamente para aplicar los ajustes razonables que
      correspondan y no lo difunda.
    </p>
  );
}

/* Respuestas del proxy de Ethos y dónde se corrigen (docs/api-designer.md). */
const PISTAS = {
  401: 'el token de la sesión no fue aceptado; vuelve a iniciar sesión en Experience.',
  403: 'el usuario no tiene el rol de la API en Banner, o la aplicación de Experience no tiene acceso al recurso.',
  404: 'Ethos no conoce el recurso: ninguna aplicación lo tiene entre sus "Recursos propios". Actualiza los recursos de la aplicación de Banner que publica las APIs de API Designer.',
};

export function describirError(err) {
  if (!err) return null;
  if (err.name === 'ErrorApi') {
    const base = `API: ${err.recurso}\nEstado HTTP: ${err.estado || '—'}\nDetalle: ${err.detalle || '—'}`;
    const pista = PISTAS[err.estado];
    return pista ? `${base}\nQué revisar: ${pista}` : base;
  }
  return String(err.message || err);
}
