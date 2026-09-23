import React from 'react';
import { useExtensionControl } from '@ellucian/experience-extension-utils';
import { C } from '../config';

const e = {
  contenedor: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    margin: -16,           // la tarjeta de Experience trae padding propio
  },
  franja: { height: 6, background: C.moradoOscuro, flexShrink: 0 },
  portada: {
    height: 116,
    flexShrink: 0,
    background: `linear-gradient(135deg, ${C.morado} 0%, ${C.moradoOscuro} 100%)`,
    position: 'relative',
    overflow: 'hidden',
  },
  cuerpo: {
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  icono: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: C.moradoSuave,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '0.9rem',
  },
  titulo: {
    fontSize: 19,
    fontWeight: 700,
    color: C.texto,
    margin: 0,
    marginBottom: 6,
  },
  bajada: { fontSize: 14, color: C.textoSuave, margin: 0, lineHeight: 1.45 },
  boton: {
    marginTop: 'auto',
    width: '100%',
    background: C.morado,
    color: C.blanco,
    border: 0,
    borderRadius: 8,
    padding: '0.85rem 1rem',
    fontSize: 14.5,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  pie: {
    marginTop: 12,
    textAlign: 'center',
    fontSize: 11.5,
    color: C.textoSuave,
  },
};

function EscudoMorado() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2.5 4.5 5.5v6c0 4.6 3.2 8.9 7.5 10 4.3-1.1 7.5-5.4 7.5-10v-6L12 2.5Z"
        stroke={C.morado}
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="m9 12 2.2 2.2L15.5 10"
        stroke={C.morado}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Silueta decorativa de la portada — evita depender de una imagen externa. */
function Portada() {
  return (
    <div style={e.portada} aria-hidden="true">
      <svg
        viewBox="0 0 400 120"
        preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      >
        <circle cx="330" cy="30" r="70" fill="#FFFFFF" opacity="0.07" />
        <circle cx="60" cy="110" r="55" fill="#FFFFFF" opacity="0.06" />
        <path d="M0 95 Q 100 60 200 85 T 400 70 L400 120 L0 120 Z" fill="#FFFFFF" opacity="0.08" />
      </svg>
    </div>
  );
}

const TarjetaDiscapacidadCard = () => {
  const { navigateToPage } = useExtensionControl();

  const abrirTablero = () => {
    try {
      navigateToPage({ route: '/' });
    } catch (error) {
      console.error('Error al intentar navegar:', error);
    }
  };

  return (
    <div style={e.contenedor}>
      <div style={e.franja} />
      <Portada />

      <div style={e.cuerpo}>
        <div style={e.icono}>
          <EscudoMorado />
        </div>

        <h3 style={e.titulo}>Bienestar Universitario</h3>
        <p style={e.bajada}>Atención y acompañamiento para estudiantes.</p>

        <button type="button" style={e.boton} onClick={abrirTablero}>
          Abrir tablero de ajustes razonables
          <span aria-hidden="true">&rsaquo;</span>
        </button>

        <div style={e.pie}>
          Acceso institucional para docentes y personal administrativo.
        </div>
      </div>
    </div>
  );
};

export default TarjetaDiscapacidadCard;
 