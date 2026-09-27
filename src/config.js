/* Paleta tomada del prototipo aprobado (ACT-GAP-CAP10-2026-DTT-USS). */
export const C = {
  // Marca
  morado: '#5C2193',
  moradoHover: '#763EAF',
  moradoTexto: '#763EAF',
  verdeLima: '#ECFFD9',

  // Neutros
  blanco: '#FFFFFF',
  fondo: '#F0F0F0',
  fondoTarjeta: '#F4F2F7',
  bordeTarjeta: '#D8D3DF',
  borde: '#E2E8F0',
  separador: '#E2E8F0',
  texto: '#0F172A',
  textoCuerpo: '#1E293B',
  textoSecundario: '#334155',
  textoSuave: '#64748B',
  textoTenue: '#94A3B8',
  iconoTenue: '#CBD5E1',
  gris50: '#F8FAFC',
  gris100: '#F1F5F9',
  textoTarjeta: '#333333',
  textoTarjetaSuave: '#555555',
  textoTarjetaPie: '#777777',

  // Reporte (esmeralda)
  verde: '#059669',
  verdeHover: '#047857',
  verdeFondo: 'rgba(236, 253, 245, 0.7)',
  verdeBorde: '#D1FAE5',
  verdeTitulo: '#022C22',
  verdeTexto: 'rgba(6, 95, 70, 0.7)',

  // Estado "Registro activo"
  activoFondo: '#ECFDF5',
  activoBorde: '#A7F3D0',
  activoTexto: '#047857',

  // Panel de ajustes razonables
  azulFondo: 'rgba(239, 246, 255, 0.7)',
  azulBorde: '#DBEAFE',
  azul50: '#EFF6FF',

  // Errores
  error: '#96302C',
  errorBorde: '#E3B7B7',
};

/* Chips por tipo de discapacidad. Se elige por el código de STVDISA y, si no
   coincide, por palabras de la descripción. */
export const CHIPS = {
  motora: { fondo: '#EFF6FF', texto: '#1D4ED8', borde: '#BFDBFE' },
  visual: { fondo: '#F5F3FF', texto: '#6D28D9', borde: '#DDD6FE' },
  auditiva: { fondo: '#FFFBEB', texto: '#B45309', borde: '#FDE68A' },
  cognitiva: { fondo: '#FFF1F2', texto: '#BE123C', borde: '#FECDD3' },
  otra: { fondo: '#F8FAFC', texto: '#475569', borde: '#E2E8F0' },
};

export const FUENTE =
  '"Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif';

/* Periodo por defecto. Se puede sobrescribir sin volver a desplegar desde
   Card Management → Configurar → "Periodo académico". */
export const PERIODO = '202646';

/* APIs de API Designer. Se llaman por REST a través del proxy de Ethos de
   Experience (authenticatedEthosFetch) con el token del usuario; la versión
   viaja en el encabezado Accept. */
export const API = {
  sesion: { recurso: 'x-docente-sesion', version: '1.0.0' },
  persona: { recurso: 'x-persona-pidm', version: '1.0.0' },
  // 1.0.2: filtra solo por sesión y trae los datos de la ficha (SGBSTDN/STVMAJR).
  // respaldo: si Ethos responde 406 (versión aún no registrada), se usa 1.0.1.
  lista: { recurso: 'x-bienestar-lista-sesion', version: '1.0.2', respaldo: '1.0.1' },
  detalle: { recurso: 'x-discapacidad-detalle', version: '1.0.0' },
};

/* true: x-bienestar-lista-sesion 1.0.1 filtra SIRASGN_PIDM = SECURITY_PRINCIPAL_ID
   en el servidor. La tarjeta no envía parámetros (ni PIDM ni term) y omite la
   llamada a x-docente-sesion. El periodo de la lista es el valor predefinido
   de term en API Designer (202646): para cambiarlo hay que republicar la API.
   PERIODO y la configuración de la tarjeta solo afectan textos y la ficha. */
export const LISTA_FILTRADA_POR_SESION = true;

/* Muestra el panel técnico cuando falla la identificación o una API. */
export const MOSTRAR_DIAGNOSTICO = true;
