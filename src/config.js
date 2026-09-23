/**
 * Configuración de la extensión "Bienestar Universitario".
 */

/** Periodo académico que consulta el tablero. */
export const PERIODO = '202646';

/**
 * Identidad del docente — respaldo manual.
 *
 * La tarjeta intenta primero resolver sola quién está logueado (ver
 * `src/api/identidad.js`). Si el SDK de Experience no expone el código Banner
 * en este tenant, usa estos valores.
 *
 * Deja los dos en null cuando la resolución automática ya funcione.
 */
export const DOCENTE_RESPALDO = {
  // Código Banner del docente, p. ej. 'S00580873'
  bannerId: null,
  // PIDM interno, p. ej. 567444. Si lo pones, se salta la llamada a x-persona-pidm.
  pidm: 567444,
};

/**
 * Muestra el panel de diagnóstico cuando no se puede identificar al usuario.
 * Déjalo en true hasta que la identificación automática quede resuelta.
 */
export const MOSTRAR_DIAGNOSTICO = true;

/** Paleta institucional. */
export const C = {
  morado: '#6B2FA5',
  moradoOscuro: '#4C1D7A',
  moradoSuave: '#F4EFFA',
  moradoTexto: '#7C3FB4',
  verde: '#1E7A4D',
  verdeSuave: '#EFF8F3',
  verdeBorde: '#D6EADF',
  fondo: '#F1F0F3',
  blanco: '#FFFFFF',
  borde: '#E7E5EA',
  texto: '#1A1A1F',
  textoSuave: '#6B6B76',
};
