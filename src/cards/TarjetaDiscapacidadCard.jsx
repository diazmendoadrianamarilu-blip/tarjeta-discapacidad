import React from 'react';
import { useCardControl } from '@ellucian/experience-extension-utils';

import { C, FUENTE } from '../config';
import portada from '../assets/portada';
import { IconoEscudo, IconoFlechaDerecha } from '../components/Iconos';

const CSS = `
.bu-tarjeta-boton { transition: background .15s ease; }
.bu-tarjeta-boton:hover { background: ${C.moradoHover} !important; }
.bu-tarjeta-boton:focus-visible { outline: 2px solid #2879A8; outline-offset: 2px; }
`;

const e = {
  contenedor: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    background: C.blanco,
    fontFamily: FUENTE,
    color: C.textoTarjeta,
    overflow: 'hidden',
  },
  franja: { height: 6, background: C.morado, flexShrink: 0 },
  portada: {
    position: 'relative',
    height: 144,
    flexShrink: 0,
    overflow: 'hidden',
    background: '#DCDCDC',
  },
  imagen: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: 'center',
    display: 'block',
  },
  velo: { position: 'absolute', inset: 0, background: 'rgba(23, 63, 112, 0.10)' },
  cuerpo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 24px 24px',
  },
  icono: {
    width: 40,
    height: 40,
    borderRadius: 12,
    background: C.verdeLima,
    color: C.morado,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  titulo: {
    margin: 0,
    fontSize: 23,
    lineHeight: '28px',
    fontWeight: 600,
    letterSpacing: '-0.025em',
    color: C.textoTarjeta,
  },
  bajada: { margin: '4px 0 0', fontSize: 14, lineHeight: '24px', color: C.textoTarjetaSuave },
  boton: {
    width: '100%',
    minHeight: 56,
    padding: '0 16px',
    border: 0,
    borderRadius: 6,
    background: C.morado,
    color: C.blanco,
    fontFamily: FUENTE,
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    boxShadow: '0 1px 2px 0 rgba(0,0,0,.05)',
  },
  pie: { margin: '16px 0 0', textAlign: 'center', fontSize: 12, color: C.textoTarjetaPie },
};

export default function TarjetaDiscapacidadCard() {
  const { navigateToPage } = useCardControl();

  const abrirTablero = (evento) => {
    evento.stopPropagation();
    navigateToPage({ route: '/' });
  };

  return (
    <div style={e.contenedor}>
      <style>{CSS}</style>
      <div style={e.franja} />
      <div style={e.portada}>
        <img
          src={portada}
          alt="Estudiante usando un computador en un espacio universitario"
          style={e.imagen}
        />
        <div style={e.velo} />
      </div>

      <div style={e.cuerpo}>
        <div style={e.icono}><IconoEscudo tamano={20} /></div>
        <h3 style={e.titulo}>Bienestar Universitario</h3>
        <p style={e.bajada}>Atención y acompañamiento para estudiantes.</p>

        <div style={{ marginTop: 'auto', paddingTop: 16 }}>
          <button type="button" className="bu-tarjeta-boton" style={e.boton} onClick={abrirTablero}>
            Abrir tablero de ajustes razonables
            <IconoFlechaDerecha tamano={16} />
          </button>
          <p style={e.pie}>Acceso institucional para docentes y personal administrativo.</p>
        </div>
      </div>
    </div>
  );
}
