import React from 'react';
import { C } from '../config';

const e = {
  barra: {
    background: C.blanco,
    borderBottom: `1px solid ${C.borde}`,
    padding: '1rem 2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  izquierda: { display: 'flex', alignItems: 'center', gap: 14 },
  icono: {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: C.morado,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  titulo: { fontSize: 15, fontWeight: 700, color: C.texto, lineHeight: 1.2 },
  subtitulo: { fontSize: 12.5, color: C.textoSuave, marginTop: 2 },
  volver: {
    background: 'none',
    border: 0,
    color: C.texto,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 4px',
  },
};

export function EscudoBlanco({ tamano = 20 }) {
  return (
    <svg width={tamano} height={tamano} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2.5 4.5 5.5v6c0 4.6 3.2 8.9 7.5 10 4.3-1.1 7.5-5.4 7.5-10v-6L12 2.5Z"
        stroke="#FFFFFF"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="m9 12 2.2 2.2L15.5 10"
        stroke="#FFFFFF"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Encabezado({ subtitulo, textoVolver, alVolver }) {
  return (
    <div style={e.barra}>
      <div style={e.izquierda}>
        <div style={e.icono}>
          <EscudoBlanco />
        </div>
        <div>
          <div style={e.titulo}>Bienestar Universitario</div>
          <div style={e.subtitulo}>{subtitulo}</div>
        </div>
      </div>

      {textoVolver && (
        <button type="button" style={e.volver} onClick={alVolver}>
          <span aria-hidden="true">&larr;</span> {textoVolver}
        </button>
      )}
    </div>
  );
}
 