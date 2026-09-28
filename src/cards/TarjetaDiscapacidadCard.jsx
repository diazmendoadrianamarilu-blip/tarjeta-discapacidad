import React from 'react';
import { useCardControl } from '@ellucian/experience-extension-utils';

import { C, FUENTE } from '../config';
import portada from '../assets/portada.jpg';
import { IconoEscudo, IconoFlechaDerecha } from '../components/Iconos';

const CSS = `
.bu-tarjeta-boton {
  width: 100%;
  min-height: 36px;
  padding: 0 16px;
  border: 1.5px solid ${C.morado}; /* Borde morado en lugar de fondo sólido */
  border-radius: 6px;
  background: transparent; /* Fondo limpio */
  color: ${C.morado}; /* Texto morado */
  font-family: ${FUENTE};
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all .2s ease;
}

.bu-tarjeta-boton:hover { 
  background: rgba(0, 0, 0, 0.04) !important; /* Fondo sutil al pasar el mouse */
}
.bu-tarjeta-boton:focus-visible { outline: 2px solid #2879A8; outline-offset: 2px; }

@media (max-width: 768px) {
  .seccion-inferior-web {
    display: none !important;
  }
}
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
    minHeight: 144,
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
    padding: '12px 16px 12px', /* Relleno superior e inferior reducido a 12px */
  },
  encabezadoTitulo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '2px', /* Margen inferior reducido */
  },
  icono: {
    width: 24,
    height: 24,
    borderRadius: 8,
    background: '#ECFFD9', 
    color: '#5C2193',     
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  titulo: {
    margin: 0,
    fontSize: 18,
    lineHeight: '24px',
    fontWeight: 600,
    letterSpacing: '-0.025em',
    color: C.textoTarjeta,
  },
  bajada: { margin: 0, fontSize: 13, lineHeight: '20px', color: C.textoTarjetaSuave },
  pie: { margin: '8px 0 0', textAlign: 'center', fontSize: 11, color: C.textoTarjetaPie }, /* Margen superior reducido de 12px a 8px */
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
          alt="Estudiante USS"
          style={e.imagen}
        />
        <div style={e.velo} />
      </div>

      <div style={e.cuerpo}>
        {/* Ícono y título unificados en una sola fila */}
        <div style={e.encabezadoTitulo}>
          <div style={e.icono}><IconoEscudo tamano={14} /></div>
          <h3 style={e.titulo}>Gestión de Discapacidad</h3>
        </div>
        <p style={e.bajada}>Atención y acompañamiento para estudiantes.</p>

        {/* Le asignamos la clase 'seccion-inferior-web' para que desaparezca en celular */}
        <div className="seccion-inferior-web" style={{ marginTop: 'auto', paddingTop: 16 }}>
          <button type="button" className="bu-tarjeta-boton" onClick={abrirTablero}>
            VER DETALLES
            <IconoFlechaDerecha tamano={14} />
          </button>
          <p style={e.pie}>Acceso institucional para docentes y personal.</p>
        </div>
      </div>
    </div>
  );
}