import React from 'react';
import { Typography, Button } from '@ellucian/react-design-system/core';
import { useCardControl } from '@ellucian/experience-extension-utils';

const AZUL = '#1F3864';

const estilos = {
  contenedor: {
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },
  icono: {
    width: 48,
    height: 48,
    borderRadius: 12,
    background: '#EEF2F7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1rem',
  },
  titulo: { color: AZUL, marginBottom: '0.5rem', fontWeight: 700 },
  pie: {
    marginTop: '0.75rem',
    textAlign: 'center',
    fontSize: 11,
    color: '#6B7280',
  },
};

/** Escudo, para no depender de un set de iconos externo. */
function IconoEscudo() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2.5 4.5 5.5v6c0 4.6 3.2 8.9 7.5 10 4.3-1.1 7.5-5.4 7.5-10v-6L12 2.5Z"
        stroke={AZUL}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="m9 12 2.2 2.2L15.5 10"
        stroke={AZUL}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const TarjetaDiscapacidadCard = () => {
  const { navigateToPage } = useCardControl();

  const abrirTablero = () => {
    try {
      if (navigateToPage) {
        navigateToPage({ route: '/' });
      } else {
        console.error('navigateToPage no esta disponible en este entorno.');
      }
    } catch (error) {
      console.error('Error al intentar navegar:', error);
    }
  };

  return (
    <div style={estilos.contenedor}>
      <div style={estilos.icono}>
        <IconoEscudo />
      </div>

      <Typography variant="h3" style={estilos.titulo}>
        Bienestar Universitario
      </Typography>
      <Typography variant="body1" color="textSecondary">
        Gestión y seguimiento de los ajustes razonables para nuestra comunidad
        estudiantil.
      </Typography>

      <div style={{ marginTop: 'auto' }}>
        <Button color="primary" fullWidth onClick={abrirTablero}>
          Abrir Tablero de Ajustes Razonables &nbsp;&rsaquo;
        </Button>
        <Typography style={estilos.pie}>
          Sistema de Gestión Académica · SGADISA
        </Typography>
      </div>
    </div>
  );
};

export default TarjetaDiscapacidadCard;