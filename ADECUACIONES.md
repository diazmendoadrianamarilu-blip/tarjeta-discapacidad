# Adecuaciones: corrección del error 400 y cierre del flujo de datos

GAP Capacidad 8 · Bienestar Universitario · Tarjeta `TarjetaDiscapacidad` (USS)
Fecha: 26-sep-2026

## 0. Estado final (cierre)

| Pieza | Estado |
|---|---|
| Lista (Nivel 2) | `x-bienestar-lista-sesion` **1.0.2**, filtrada en el servidor por `SIRASGN_PIDM = SECURITY_PRINCIPAL_ID`. La tarjeta **no envía parámetros**: en este tenant, las APIs con autenticación de usuario los rechazan (400). El periodo es el valor predefinido de `term` en API Designer (202646); para cambiarlo hay que republicar. |
| Ficha (Nivel 3) | Se arma con las filas de la lista (1.0.2 trae SGBSTDN/STVMAJR y las vigencias de SGRDISA). **Ya no se llama a `x-discapacidad-detalle`**, que no admite `idalumno` con autenticación de usuario. |
| `src/config.js` | `lista: { version: '1.0.3', respaldo: '1.0.2' }`: si Ethos responde 406 con la 1.0.3, repite con la 1.0.2. `LISTA_FILTRADA_POR_SESION = true` |
| Pantalla 2 (27-sep) | Agrupada por **periodo → curso (materia, número, NRC, título)**, con los alumnos dentro. Si un alumno lleva dos cursos con el docente, aparece en ambos. El contador muestra alumnos únicos y cantidad de cursos. El Excel sale con una fila por alumno y curso, en el mismo orden. |
| Pantalla 3 (27-sep) | Descripción y código de campus, programa, nivel, escuela y departamento; ciclo y tutor si la API los trae; "Curso(s) contigo"; sección desplegable **Datos adicionales** (nacimiento, dirección, distrito, provincia, departamento, país, teléfono, correo) que se consulta solo al abrirla. |
| APIs pendientes | `x-bienestar-lista-sesion` 1.0.3, `x-bienestar-cursos-sesion` 1.0.0 y `x-bienestar-contacto-sesion` 1.0.0: ver el Paso G en `docs/INSTRUCCIONES-CLAUDE-NAVEGADOR.md`. La tarjeta funciona sin ellas (con menos datos). |
| Paginación | Corregido: si Ethos no enviaba `x-total-count`, se leía solo la primera página. |
| Ethos Integration | `x-bienestar-lista-sesion` registrada en **Banner Integration API → Recursos propios** y sincronizada con *Recursos de configuración automática* |
| API Designer | `x-bienestar-lista-sesion` 1.0.1 publicada sin el criterio `SIRASGN_PIDM = {pidmdocente}` (el parámetro quedó declarado, pero no se usa) |
| Despliegue | `npm run deploy-dev -- --env forceUpload` → "Upload complete" (Experience TEST) |

Cómo evolucionó el error: 400 (`getEthosQuery`) → 404 *Resource owner not
found* (recurso sin registrar en Ethos) → 400 *parámetros no esperados*
(registro manual sin contrato) → 406 *tipo de medio v1.0.0* (la tarjeta pedía
la versión anterior a la 1.0.1) → corregido en `config.js` y desplegado.

**Lección para las próximas APIs de API Designer:** publicar la API no la
registra en Ethos. Después de publicar, hay que ir a Ethos → Aplicaciones →
**Banner Integration API** → *Recursos de configuración automática*, y en
`config.js` usar exactamente la versión publicada. Si no coincide, Ethos
responde 406.

Pendiente opcional: borrar en API Designer los borradores `x-quien-soy` y
`x-discapacidad-docente` 1.1.0, y retirar `x-bienestar-docente-lista` cuando se
confirme que ninguna otra integración la usa.

## 1. Resumen

| | Antes | Ahora |
|---|---|---|
| Cómo se llama a Banner | `getEthosQuery` (proxy GraphQL `/api/ethos-query`) | `authenticatedEthosFetch` (proxy REST de Ethos, con el token del usuario) |
| Resultado | `400 Bad Request — Request Failed for the queryId : x-bienestar-docente-lista` | Consulta REST con encabezado `Accept` versionado |
| Identidad del docente | `erpId` del JWT enviado como PIDM (es el SPRIDEN_ID, no el PIDM) | `x-docente-sesion` → respaldo `erpId` + `x-persona-pidm` |
| `pidmdocente` | texto (el código Banner) | número entero (PIDM) validado |
| Paginación | ninguna (la API corta en 50 filas) | `offset`/`limit` hasta completar `x-total-count` |
| Ficha de detalle | rota: recibía `authenticatedEthosFetch` pero el código esperaba `getEthosQuery` | funciona con REST y muestra los campos reales de la API |

Lint (`npx eslint src`) y compilación (`webpack --mode development`) pasan sin
errores. **Aún no se ha probado en el tenant**: ver la sección 6.

## 2. Causa del error 400

1. `getEthosQuery` solo ejecuta consultas **GraphQL** de Ethos Data Access
   declaradas en `cards[].queries` de `extension.js`. Las APIs de API Designer
   son **REST**; el proxy `/api/ethos-query` no las conoce.
2. El bloque `ethos: { queries: [...] }` de `extension.js` no forma parte del
   SDK: el `queryId` nunca llegaba al manifiesto de la extensión. Por eso el
   servidor respondía 400 con cualquier valor o tipo de `pidmdocente`.
   (Tampoco existe el parámetro `searchParameters`; el del SDK es `properties`.)
3. Aunque la llamada hubiera funcionado, `resolverDocente` tomaba `erpId` del
   JWT como PIDM. `erpId` es el código Banner (p. ej. `100723307`), así que la
   lista habría salido vacía o sería la de otra persona.

**No es un problema de las APIs de API Designer.** Las seis están bien
construidas. Las observaciones de la sección 4 son mejoras de seguridad y
limpieza.

## 3. Cambios en el código

### `extension.js`
- Se eliminó el bloque `ethos.queries` (no es parte del SDK y causaba el 400).
- Se restauró la configuración `periodo` para Card Management.
- `excludeClickSelectors: ['a', 'button']`: el clic en el botón de la tarjeta ya
  no dispara la navegación dos veces.
- Comentario con las versiones exactas que se consumen.

### `src/config.js`
```js
export const API = {
  sesion:  { recurso: 'x-docente-sesion',          version: '1.0.0' },
  persona: { recurso: 'x-persona-pidm',            version: '1.0.0' }, // nuevo
  lista:   { recurso: 'x-bienestar-docente-lista', version: '1.0.1' }, // antes 1.1.0 → 400/404
  detalle: { recurso: 'x-discapacidad-detalle',    version: '1.0.0' },
};
```

### `src/api/discapacidad.js` (reescrito)
- `consultar()` hace `GET <recurso>?<parámetros>&offset=N&limit=50` con
  `Accept: application/vnd.hedtech.integration.v<versión>+json`.
- Pagina hasta completar `x-total-count` (o hasta una página incompleta).
  Necesario porque `x-bienestar-docente-lista` 1.0.1 tiene `maxPageSize = 50`.
- `ErrorApi` guarda recurso, estado HTTP y mensaje de Ethos para el panel de
  diagnóstico.
- `obtenerDocenteSesion()` usa `x-docente-sesion`, sin parámetros.
- `obtenerPidmPorId(idpersona)` usa `x-persona-pidm` (nuevo).
- `listarAlumnosDelDocente()` envía `pidmdocente` como **número entero** y lanza
  un error si el PIDM no es válido, antes de llamar a Banner.
- `agruparPorAlumno()` agrupa por alumno las filas repetidas (una por NRC y
  por registro SGRDISA).
- `construirFicha()` arma la ficha con los campos reales de
  `x-discapacidad-detalle`: `campus`, `programa`, `nivel`, `carrera`/`codCarrera`,
  `estadoAlumno`, y las discapacidades con su propia vigencia
  (`vigenteDesde`/`vigenteHasta`). También separa `ajustesActivos` (vigentes
  hoy) de los vencidos.

### `src/api/identidad.js` (reescrito)
`resolverDocente(authenticatedEthosFetch, getExtensionJwt)` hace, en secuencia:
1. `x-docente-sesion`: Banner resuelve el PIDM con `%%SECURITY_PRINCIPAL_ID%%`.
2. Si no hay filas o la llamada falla: lee `erpId` (SPRIDEN_ID) del JWT de
   Experience y lo traduce con `x-persona-pidm?idpersona=<erpId>`.
3. Si ninguno funciona: lanza `ErrorIdentidad` con el resultado de cada
   intento. El panel de diagnóstico lo muestra.

### `src/page/Home.jsx` (Nivel 2)
- Usa `useEthosFetch()` (`authenticatedEthosFetch` estable) en lugar de
  `getEthosQuery`.
- Orden estricto: **identidad → lista → completar carreras**. La carrera se
  completa después, sin bloquear la lista.
- Errores con `try/catch`: un mensaje para la identidad y otro para la lista,
  con el detalle técnico (API, HTTP, mensaje).
- Cada fila muestra ahora: nombre, chip del tipo de discapacidad, **curso(s),
  NRC**, carrera (cuando llega) y periodo.

### `src/page/DetalleAlumno.jsx` (Nivel 3)
- Se quitaron fecha de nacimiento, correo, teléfono y dirección: la API 1.0.0
  no los devuelve y siempre salían "No registrado".
- Muestra **Código (ID Banner), Campus, Programa, Nivel**, más Carrera, Periodo
  y Tipo de discapacidad.
- El recuadro **Ajustes razonables activos** lista cada tipo de discapacidad
  vigente con sus fechas de vigencia. Si ninguna está vigente, muestra todas y
  el estado "Registro vencido".

### `readme.md`
- Versión de la lista corregida a `v1.0.1`.
- Se reemplazaron las secciones 4 y 5 (planes anteriores con versiones
  1.1.0/1.2.0 que ya no aplican) por un enlace a este documento.

## 4. APIs de API Designer

| API | Versión | ¿La usa la tarjeta? | Recomendación |
|---|---|---|---|
| `x-docente-sesion` | 1.0.0 | Sí, identidad (paso 1) | **Mantener.** Correcta: tiene `userSecurity` `SPRIDEN_PIDM = %%SECURITY_PRINCIPAL_ID%%` y rol `SELFSERVICE-FACULTY`. |
| `x-persona-pidm` | 1.0.0 | Sí, identidad (respaldo) | **Mantener.** |
| `x-bienestar-docente-lista` | 1.0.1 | Sí, Nivel 2 | **Mantener** mientras no se publique `x-bienestar-lista-sesion` (sección 5); después, retirar. |
| `x-discapacidad-detalle` | 1.0.0 | Sí, Nivel 3 y carrera del listado | **Mantener.** |
| `x-discapacidad-docente` | 1.1.0 | **No** | **Eliminar.** Es un duplicado de `x-bienestar-docente-lista` y tiene un borrador abierto. |
| `x-asignacion-docente` | 1.0.0 | **No** | **Eliminar** (o dejarla sin acceso para la aplicación de Experience). La lista ya trae curso, NRC y sección. Además no tiene rol de seguridad y devuelve los cursos de cualquier docente a partir de su ID. |

Antes de eliminar, confirma que ninguna otra tarjeta o integración de la USS
use `x-discapacidad-docente` ni `x-asignacion-docente`.

## 5. JSON para importar (opcional, recomendado antes de producción)

Archivo: [`docs/api-designer/x-bienestar-lista-sesion-1.0.0.json`](docs/api-designer/x-bienestar-lista-sesion-1.0.0.json)

> **Por qué es una API nueva y no la 1.0.2:** al importar la 1.0.2 de
> `x-bienestar-docente-lista`, API Designer respondió *"User authentication
> security settings cannot be modified while published versions of the API are
> present"*. La 1.0.1 se publicó sin seguridad de usuario y esa configuración
> no se puede cambiar mientras haya versiones publicadas. Por eso la
> seguridad va en una API nueva, `x-bienestar-lista-sesion` 1.0.0.
> El archivo `docs/api-designer/x-bienestar-docente-lista.json` (la 1.0.2
> rechazada) ya no sirve y se puede borrar.

Es la misma consulta de `x-bienestar-docente-lista` 1.0.1 (mismas tablas,
criterios, parámetros y propiedades), con otro nombre y tres cambios:

| Cambio | Por qué |
|---|---|
| `userSecurity`: `SIRASGN.SIRASGN_PIDM = %%SECURITY_PRINCIPAL_ID%%` | Hoy cualquier docente puede cambiar `pidmdocente` en el navegador y ver los alumnos con discapacidad de otro docente (dato sensible). Con este filtro, Banner solo devuelve las secciones del usuario autenticado, aunque se envíe otro PIDM. |
| `securityRoles`: `SELFSERVICE-FACULTY` | La 1.0.1 no tiene rol. Queda igual que `x-docente-sesion` y `x-discapacidad-detalle`. |
| `maxPageSize`: 50 → 500 | Menos páginas por consulta. La tarjeta pagina igual en cualquier caso. |

El parámetro `pidmdocente` se mantiene, así que en el código solo cambia el
recurso. Se quitaron los identificadores generados por el servidor (`id`,
`apiSpecificationId`, `databaseCompiledQueryId`, `lastModified*`).

**Pasos:**
1. API Designer → Importar → `x-bienestar-lista-sesion-1.0.0.json`. Debe
   aparecer como API nueva, sin el aviso *"Ya existe una API publicada con el
   mismo nombre"*.
2. En la pestaña de seguridad, revisar que estén *Autenticación del usuario*,
   el rol `SELFSERVICE-FACULTY` y el filtro `SIRASGN_PIDM = SECURITY_PRINCIPAL_ID`.
   Publicar.
3. En Ethos Integration, darle acceso a `x-bienestar-lista-sesion` a la
   aplicación que usa Experience (readme, sección 3). Si falta este paso, la
   tarjeta recibirá 403 o 404.
4. En `src/config.js`:
   `lista: { recurso: 'x-bienestar-lista-sesion', version: '1.0.0' }`.
5. Volver a desplegar y probar con un docente real.
6. Cuando funcione, se pueden retirar `x-bienestar-docente-lista` y el
   borrador que haya quedado de la importación fallida, si lo hubiera.

**Error `404: Resource owner not found for the requested resource`:** Ethos
Integration no sabe qué aplicación atiende ese recurso. Una API recién creada
en API Designer no queda registrada sola.
- No hay que crear otra aplicación.
- Hay que agregar `x-bienestar-lista-sesion` a los **recursos propios** (*Owned
  resources*) de la aplicación de Banner que ya atiende `x-docente-sesion`.
- Luego hay que dar acceso de lectura a la aplicación de Experience.

Pasos en integrate.elluciancloud.com → Applications:
1. Abrir `x-docente-sesion` (que funciona) para ver qué aplicación lo tiene
   como recurso propio. Esa es la aplicación de Banner.
2. En esa aplicación → *Owned resources* → agregar o sincronizar
   `x-bienestar-lista-sesion` (v1.0.0) → Guardar.
3. En la aplicación de Experience (la de la clave configurada en Experience
   Setup) → *API access* → dar acceso GET a `x-bienestar-lista-sesion` si el
   acceso no es a "todos los recursos".
4. Esperar 1–2 minutos y recargar la tarjeta. Ya no hace falta volver a
   desplegar la extensión.

No generé JSON para las demás APIs porque no necesitan cambios para que la
tarjeta funcione.

## 6. Despliegue y verificación en el tenant

1. `npm run deploy-dev -- --env forceUpload` (`extension.js` cambió).
2. En Experience, abrir la tarjeta → "Abrir tablero de ajustes razonables".
3. En DevTools → Red, deben aparecer (ya **no** `api/ethos-query`):
   - `GET …/x-docente-sesion?offset=0&limit=50` → 200
   - `GET …/x-bienestar-docente-lista?pidmdocente=<número>&term=202646&offset=0&limit=50` → 200
   - `GET …/x-discapacidad-detalle?idalumno=…&term=202646…` → 200 (uno por alumno sin carrera y al abrir la ficha)
4. Si aparece el panel de diagnóstico:
   - **401/403**: el docente no tiene el rol `SELFSERVICE-FACULTY` en Banner, o la
     aplicación de Ethos que usa Experience no tiene acceso a esa API (readme,
     sección 3).
   - **404**: la versión del encabezado `Accept` no está publicada. Revisa
     `src/config.js`.
   - **"No pudimos identificar tu usuario docente"**: el panel lista cada
     intento (`x-docente-sesion` y `x-persona-pidm`) con su resultado.
5. En producción: `MOSTRAR_DIAGNOSTICO = false` en `src/config.js`.

## 7. Pendientes y supuestos

- **Paginación:** se asume que el proxy acepta `offset`/`limit` (estándar de
  Ethos). Si alguna API responde 400 por estos parámetros, avísame y los quito;
  en ese caso hay que usar `x-bienestar-lista-sesion` (`maxPageSize` 500).
- **Retiros:** `x-bienestar-docente-lista` no filtra `SFRSTCR_RSTS_CODE`, así
  que puede listar alumnos que se retiraron del NRC. Si se quiere excluirlos,
  agrega en `x-bienestar-lista-sesion` un criterio con los códigos de estado de matrícula activos
  de la USS (validar en STVRSTS).
- **Nivel:** la ficha muestra el código `SGBSTDN_LEVL_CODE` tal como viene. No
  incluí traducción porque no conozco los códigos de la USS.
- **Detalle sin SGBSTDN:** `x-discapacidad-detalle` usa un LEFT JOIN a SGBSTDN,
  pero filtra `SGBSTDN_TERM_CODE_EFF <= term` en *criteria*, y eso lo convierte
  en INNER. Un alumno sin registro en SGBSTDN para ese periodo aparece como
  "No encontramos el registro". Si ocurre, hay que mover ese filtro a la
  condición del join.
