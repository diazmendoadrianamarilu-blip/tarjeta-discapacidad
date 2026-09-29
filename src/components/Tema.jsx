import React from 'react';
import { CHIPS, FUENTE } from '../config';
import {
  IconoAccesibilidad, IconoCerebro, IconoCorazon, IconoFlechaDerecha, IconoOido, IconoOjo,
} from './Iconos';

/* Paleta cromática oficial USS para las páginas del tablero. */
export const USS = {
  morado: '#5C2193',
  moradoClaro: '#763EAF',
  verdeLima: '#5FED00',
  verdeFondo: '#ECFFD9',
  verdeBorde: '#C0FF88',
  texto: '#374151',
  textoSuave: '#6B7280',
  textoTenue: '#9CA3AF',
  borde: '#E5E7EB',
  fondo: '#F8FAFC',
  superficie: '#FFFFFF',
};

export const SOMBRA = '0 1px 2px rgba(16, 24, 40, 0.04), 0 1px 3px rgba(16, 24, 40, 0.06)';

/* Estilos que no se pueden expresar en línea (hover, foco, responsive). Todo
   va bajo .bu-lienzo para no afectar al resto de Experience. */
const CSS = `
.bu-lienzo { background: ${USS.fondo}; min-height: 100%; font-family: ${FUENTE}; color: ${USS.texto};
  font-size: 14px; line-height: 1.5; -webkit-font-smoothing: antialiased; }
.bu-lienzo *, .bu-lienzo *::before, .bu-lienzo *::after { box-sizing: border-box; }
.bu-lienzo button { font-family: inherit; }
.bu-contenedor-principal { max-width: 1024px; margin: 0 auto; padding: 32px 24px 40px; }

.bu-tarjeta { background: ${USS.superficie}; border: 1px solid ${USS.borde}; border-radius: 12px;
  box-shadow: ${SOMBRA}; }
.bu-tarjeta-curso { border-left: 4px solid ${USS.morado}; overflow: hidden; }

.bu-fila { transition: background-color .15s ease; }
.bu-fila:hover { background: ${USS.fondo} !important; }
.bu-fila:hover .bu-fila-flecha { color: ${USS.morado} !important; transform: translateX(2px); }
.bu-fila-flecha { transition: transform .15s ease, color .15s ease; }

.bu-enlace-volver:hover { color: ${USS.morado} !important; }
.bu-btn-sec { transition: background-color .15s ease, border-color .15s ease; }
.bu-btn-sec:hover:not(:disabled) { background: ${USS.verdeFondo} !important; border-color: ${USS.verdeBorde} !important; }
.bu-btn-sec:disabled { color: ${USS.textoTenue} !important; cursor: not-allowed !important; opacity: .6; }
.bu-btn-pri { transition: background-color .15s ease; }
.bu-btn-pri:hover { background: ${USS.moradoClaro} !important; }
.bu-boton-morado:hover { background: ${USS.moradoClaro} !important; }
.bu-acordeon:hover { background: ${USS.fondo} !important; }

.bu-lienzo button:focus-visible, .bu-lienzo a:focus-visible {
  outline: 2px solid ${USS.moradoClaro}; outline-offset: 2px; }

.bu-datos dd { white-space: pre-line; }
.bu-pulso { animation: bu-pulso 1.4s ease-in-out infinite; }
@keyframes bu-pulso { 0%, 100% { opacity: 1; } 50% { opacity: .45; } }
@media (prefers-reduced-motion: reduce) {
  .bu-pulso { animation: none; }
  .bu-fila-flecha, .bu-fila { transition: none; }
}

.bu-ficha-grid { display: grid; grid-template-columns: minmax(0, 3fr) minmax(0, 2fr); gap: 20px; align-items: start; }
.bu-datos { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px 24px; margin: 0; }

@media (max-width: 768px) {
  .bu-contenedor-principal { padding: 20px 16px 32px; }
  .bu-cabecera { flex-direction: column !important; align-items: stretch !important; }
  .bu-ficha-grid { grid-template-columns: 1fr; }
  .bu-reporte { flex-direction: column !important; align-items: stretch !important; }
  .bu-reporte .bu-btn-pri { justify-content: center; }
}
@media (max-width: 560px) {
  .bu-datos { grid-template-columns: 1fr; }
  .bu-curso-cabecera { flex-direction: column !important; align-items: flex-start !important; }
  .bu-paginacion { flex-direction: column !important; align-items: stretch !important; }
  .bu-paginacion-botones { justify-content: space-between; }
  .bu-ocultar-movil { display: none !important; }
}
`;

/* Fondo de aplicación + contenedor centrado de 1024 px. */
export function Lienzo({ children }) {
  return (
    <div className="bu-lienzo">
      <style>{CSS}</style>
      <div className="bu-contenedor-principal">{children}</div>
    </div>
  );
}

export function EnlaceVolver({ texto, onClick }) {
  return (
    <button
      type="button"
      className="bu-enlace-volver"
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 0', marginBottom: 20,
        border: 0, background: 'none', color: USS.textoSuave, fontSize: 14, fontWeight: 600, cursor: 'pointer',
      }}
    >
      <span style={{ display: 'flex', transform: 'scaleX(-1)' }}><IconoFlechaDerecha tamano={16} /></span>
      {texto}
    </button>
  );
}

/* El morado queda para acentos (antetítulo, borde de curso, botón principal);
   títulos y datos van en grises para que la pantalla no se cargue. */
export const tipografia = {
  antetitulo: {
    margin: 0, fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: USS.moradoClaro,
  },
  titulo: { margin: '6px 0 0', fontSize: 26, lineHeight: '32px', fontWeight: 700, color: USS.texto },
  bajada: { margin: '6px 0 0', fontSize: 14, color: USS.textoSuave },
  panelTitulo: {
    margin: 0, fontSize: 13, fontWeight: 700, letterSpacing: '0.02em', color: USS.texto,
  },
};

/* Píldora discreta (contadores, estados). */
export function Badge({ children, tono = 'verde' }) {
  const colores = tono === 'verde'
    ? { background: USS.verdeFondo, borderColor: USS.verdeBorde, color: '#2F5F00' }
    : { background: USS.fondo, borderColor: USS.borde, color: USS.textoSuave };
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid', borderRadius: 999,
        padding: '2px 10px', fontSize: 12, fontWeight: 600, lineHeight: '18px', whiteSpace: 'nowrap', ...colores,
      }}
    >
      {children}
    </span>
  );
}

/* Categoría de la discapacidad (por código de STVDISA o por la descripción):
   define el color y el ícono con que se muestra en toda la tarjeta. */
const CATEGORIAS = {
  motora: { colores: CHIPS.motora, Icono: IconoAccesibilidad },
  visual: { colores: CHIPS.visual, Icono: IconoOjo },
  auditiva: { colores: CHIPS.auditiva, Icono: IconoOido },
  cognitiva: { colores: CHIPS.cognitiva, Icono: IconoCerebro },
  otra: { colores: CHIPS.otra, Icono: IconoCorazon },
};

export function categoriaDiscapacidad(discapacidad) {
  const codigo = String((discapacidad && discapacidad.codigo) || '').toUpperCase();
  const texto = String((discapacidad && discapacidad.descripcion) || '').toLowerCase();
  if (['MO', 'FI'].includes(codigo) || /motor|f[ií]sic/.test(texto)) return CATEGORIAS.motora;
  if (codigo === 'VI' || /visual|ceguera|baja visi/.test(texto)) return CATEGORIAS.visual;
  if (codigo === 'AU' || /auditiv|sordera|hipoacus/.test(texto)) return CATEGORIAS.auditiva;
  if (['IN', 'CO', 'TE', 'PS'].includes(codigo)
    || /cognitiv|intelectual|autis|espectro|mental|psico|aprendizaje/.test(texto)) return CATEGORIAS.cognitiva;
  return CATEGORIAS.otra;
}

function estiloChip(discapacidad) {
  return categoriaDiscapacidad(discapacidad).colores;
}

function etiquetaChip(descripcion) {
  const limpio = String(descripcion || '').replace(/^discapacidad\s+/i, '').trim().toLowerCase();
  return limpio ? limpio.charAt(0).toUpperCase() + limpio.slice(1) : 'Sin tipo';
}

/* Recuadro con el ícono del tipo de discapacidad, en el color de su categoría. */
export function IconoDiscapacidad({ discapacidad, tamano = 36 }) {
  const { colores, Icono } = categoriaDiscapacidad(discapacidad);
  return (
    <span
      title={discapacidad ? etiquetaChip(discapacidad.descripcion) : undefined}
      style={{
        width: tamano, height: tamano, borderRadius: 10, flexShrink: 0, display: 'inline-flex',
        alignItems: 'center', justifyContent: 'center', background: colores.fondo,
        border: `1px solid ${colores.borde}`, color: colores.texto,
      }}
    >
      <Icono tamano={Math.round(tamano * 0.5)} />
    </span>
  );
}

/* Ícono de encabezado de panel, en un recuadro de color suave. */
export function IconoPanel({ Icono, tono = 'neutro' }) {
  const colores = {
    azul: CHIPS.motora,
    violeta: CHIPS.visual,
    verde: { fondo: USS.superficie, texto: '#3F7D00', borde: USS.verdeBorde },
    neutro: { fondo: USS.fondo, texto: USS.textoSuave, borde: USS.borde },
  }[tono];
  return (
    <span
      aria-hidden="true"
      style={{
        width: 30, height: 30, borderRadius: 8, flexShrink: 0, display: 'inline-flex', alignItems: 'center',
        justifyContent: 'center', background: colores.fondo, color: colores.texto, border: `1px solid ${colores.borde}`,
      }}
    >
      <Icono tamano={16} />
    </span>
  );
}

/* Tipo de discapacidad: el color distingue la categoría (motora, visual…). */
export function ChipDiscapacidad({ discapacidad }) {
  const c = estiloChip(discapacidad);
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', border: '1px solid', borderRadius: 999, padding: '1px 8px',
        fontSize: 12, fontWeight: 500, lineHeight: '18px', whiteSpace: 'nowrap',
        background: c.fondo, color: c.texto, borderColor: c.borde,
      }}
    >
      {etiquetaChip(discapacidad.descripcion)}
    </span>
  );
}
