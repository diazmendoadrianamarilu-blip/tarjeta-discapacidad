# Tarea: corregir el 404 "Resource owner not found" de `x-bienestar-lista-sesion`

Instrucciones para Claude en el navegador. Contexto: tenant **ussipantest**
(TEST) de la Universidad Señor de Sipán, Ellucian SaaS (Banner + Ethos
Integration + Experience).

## 1. Objetivo

La tarjeta de Experience "Bienestar Universitario" (extensión
`TarjetaDiscapacidad`) debe listar los alumnos sin error. Hoy la consola del
navegador muestra:

```
[Bienestar] ErrorApi: x-bienestar-lista-sesion respondió 404:
Resource owner not found for the requested resource.
```

El código de la extensión está bien. El problema está en la **configuración
de Ethos Integration / API Designer**. Tu trabajo es encontrar qué falta en esa
configuración y corregirlo.

## 2. Reglas

1. **No borres** aplicaciones, APIs, versiones ni recursos. Si crees que algo
   debe eliminarse, detente y pregúntale al usuario.
2. **No regeneres ni rotes claves de API** (API keys) de ninguna aplicación.
   Eso rompería Experience y otras integraciones.
3. **No crees aplicaciones nuevas** en Ethos Integration salvo que el usuario
   lo apruebe de forma explícita.
4. No copies claves, tokens ni datos de estudiantes en tus respuestas.
5. Antes de guardar un cambio en una aplicación compartida (la de Banner o la
   de Experience), describe al usuario qué vas a cambiar y espera su visto
   bueno.
6. Anota cada cambio que hagas (pantalla, campo, valor anterior → nuevo) para
   el informe final.

## 3. Datos de referencia

### Lo que llama la tarjeta
Todas las llamadas usan el proxy REST de Ethos de Experience con el token del
usuario (`authenticatedEthosFetch`). La versión viaja en el encabezado
`Accept: application/vnd.hedtech.integration.v<versión>+json`.

| Paso | Recurso | Versión | Parámetros | Estado conocido |
|---|---|---|---|---|
| 1 | `x-docente-sesion` | 1.0.0 | ninguno (filtra `SPRIDEN_PIDM = %%SECURITY_PRINCIPAL_ID%%`) | Funciona |
| 1b | `x-persona-pidm` | 1.0.0 | `idpersona` | Respaldo |
| 2 | `x-bienestar-lista-sesion` | **1.0.0** | `pidmdocente` (number), `term` (string) | **404 Resource owner not found** |
| 3 | `x-discapacidad-detalle` | 1.0.0 | `idalumno`, `term` | Sin error reportado |

Todas usan paginación: `offset` y `limit` (50).

`x-bienestar-lista-sesion` es una API **nueva**. Se importó en API Designer
desde `docs/api-designer/x-bienestar-lista-sesion-1.0.0.json`. Es la misma
consulta que `x-bienestar-docente-lista` 1.0.1 (que ya existía y está
registrada), pero con:
- Autenticación de usuario con rol `SELFSERVICE-FACULTY`.
- Filtro de seguridad de usuario `SIRASGN.SIRASGN_PIDM = %%SECURITY_PRINCIPAL_ID%%`.
- `maxPageSize` 500.

Se creó como API nueva porque API Designer no permite cambiar la seguridad
de usuario en una API que ya tiene versiones publicadas.

### Hipótesis principal
"Resource owner not found" significa que **ninguna aplicación de Ethos
Integration tiene `x-bienestar-lista-sesion` entre sus recursos propios**, así
que el proxy no sabe a qué sistema autoritativo (Banner) enviar la petición.
Las APIs anteriores (`x-docente-sesion`, etc.) sí están registradas. La nueva
no quedó registrada al importarla.

## 4. Pasos

### Paso A: comprobar el estado de la API en API Designer
1. Abre API Designer y busca `x-bienestar-lista-sesion`.
2. Confirma y anota:
   - Estado: debe estar **PUBLICADA**, versión **1.0.0**, sin borrador pendiente que bloquee.
   - Nombre del recurso exactamente `x-bienestar-lista-sesion` (sin espacios ni mayúsculas).
   - Seguridad: autenticación del usuario, rol `SELFSERVICE-FACULTY` y filtro `SIRASGN_PIDM = SECURITY_PRINCIPAL_ID`.
3. Compárala con `x-docente-sesion`, que funciona. Si hay alguna opción
   distinta, como "exponer en Ethos", una opción de publicación o el dominio
   (Student), anótala. Si la diferencia explica el error, corrígela para que
   quede igual a `x-docente-sesion`, respetando la regla 5.
4. Si `x-bienestar-lista-sesion` **no está publicada**, publícala y ve al Paso D.

### Paso B: registrar el recurso en la aplicación de Banner (causa más probable)
1. Ve a https://integrate.elluciancloud.com/applications (tenant de TEST de la USS).
2. Identifica la **aplicación autoritativa de Banner**. Es la que tiene
   `x-docente-sesion` entre sus recursos propios (*Owned resources* /
   *Recursos propios*). Si hay un buscador de recursos, busca
   `x-docente-sesion` y mira qué aplicación lo tiene.
3. En esa aplicación, abre sus recursos propios y busca `x-bienestar-lista-sesion`.
   - **Si no está:** usa la opción para agregar recursos o sincronizarlos
     (puede llamarse *Add resource*, *Refresh*, *Discover*, *Sync* o similar;
     el nombre varía). Agrega `x-bienestar-lista-sesion` versión 1.0.0 y
     guarda (regla 5).
   - **Si está pero con otra versión** o sin la 1.0.0: agrega o habilita la 1.0.0.
4. Anota el nombre de la aplicación y lo que cambiaste.

### Paso C: dar acceso a la aplicación de Experience
1. En Applications, identifica la aplicación que usa Experience. Suele
   llamarse "Experience" o "Experience Application". Es la que tiene la clave
   configurada en Experience Setup → Configuración del tablero; no copies la clave.
2. Revisa su configuración de acceso a APIs (*API access* / *Resource access*):
   - Si tiene acceso a todos los recursos, no hay que hacer nada.
   - Si tiene una lista de recursos permitidos, confirma que estén
     `x-docente-sesion`, `x-persona-pidm`, `x-discapacidad-detalle` y
     **`x-bienestar-lista-sesion`**, con permiso de lectura (GET). Agrega el que
     falte (regla 5).
3. Si la aplicación tiene una sección que indica qué aplicación atiende cada
   recurso (*owner overrides*), revisa que `x-bienestar-lista-sesion` apunte a
   la misma aplicación de Banner que `x-docente-sesion`.

### Paso D: verificar
1. Espera 1 o 2 minutos para que se propaguen los cambios.
2. Abre Experience TEST (`https://experience-test.elluciancloud.com/ussipantest/`)
   con un usuario **docente** que dicte secciones en el periodo 202646.
3. Abre DevTools → pestaña **Network**, filtra por `x-bienestar-lista-sesion`,
   y abre la tarjeta → "Abrir tablero de ajustes razonables".
4. Revisa la petición:
   - URL con `x-bienestar-lista-sesion?pidmdocente=<número>&term=202646&offset=0&limit=50`.
   - Encabezado `Accept: application/vnd.hedtech.integration.v1.0.0+json`.
     **Si dice `v1.0.1`**, la extensión desplegada tiene una configuración
     vieja. Detente y avísale al usuario que ejecute
     `npm run deploy-dev -- --env forceUpload` desde el proyecto.
5. Interpreta la respuesta:

| Respuesta | Significado | Acción |
|---|---|---|
| 200 con lista | Resuelto | Informe final |
| 200 con `[]` | Funciona, pero el docente no tiene alumnos con discapacidad en 202646 | Probar con otro docente y avisar al usuario |
| 404 "Resource owner not found" | Sigue sin propietario | Repetir B y C; revisar el nombre exacto del recurso |
| 404 con otro mensaje (versión no encontrada) | La versión 1.0.0 no está publicada o no está registrada | Paso A y B.3 |
| 401 / 403 | Falta permiso: el docente no tiene `SELFSERVICE-FACULTY` en Banner, o la aplicación de Experience no tiene acceso | Paso C; avisar al usuario sobre el rol en Banner |
| 400 | Parámetro inválido | Copiar el mensaje de error completo en el informe |

6. Compara con `x-docente-sesion` en la misma pestaña Network: debe dar 200.

### Paso E: error `400 Parámetros [term] de consulta no esperados` (estado al 26-sep)

Estado actual, ya desplegado:
- La tarjeta llama a `x-bienestar-lista-sesion` con
  `Accept: application/vnd.hedtech.integration.v1.0.1+json` y solo
  `?term=202646&offset=0&limit=50`, sin `pidmdocente`.
- En Ethos → Banner Integration API → Recursos propios, el recurso se dio de
  alta **a mano** como "recurso personalizado", sin contrato de parámetros.
  Después se ejecutó *Recursos de configuración automática*, que respondió
  "sin conflicto", pero al parecer **no reemplazó** el alta manual.
- `offset` y `limit` no se rechazan (son estándar); solo se rechaza `term`.
  Ethos valida los parámetros propios contra la definición registrada del
  recurso, y esa definición no los tiene.

Qué hacer:
1. En Banner Integration API → Recursos propios, abre
   **`x-bienestar-docente-lista`** (registrado de forma automática; acepta
   `pidmdocente` y `term`) y anota su configuración: versiones o
   representaciones, tipo de medio, parámetros de consulta / filtros,
   métodos y sobrepasos de URI.
2. Abre **`x-bienestar-lista-sesion`** y compáralo. Lo esperado es que le falte
   la representación `application/vnd.hedtech.integration.v1.0.1+json` o la
   lista de parámetros de consulta.
3. Corrección, en este orden de preferencia (regla 5: confirma con el usuario
   antes de guardar):
   a. Si el recurso se puede **editar**, déjalo igual a
      `x-bienestar-docente-lista`: representación v1.0.1 (y v1.0.0 si aparece)
      y parámetros de consulta `term` y `pidmdocente`. Guarda.
   b. Si no se puede editar, **pídele permiso explícito al usuario** para
      quitar solo el alta manual de `x-bienestar-lista-sesion` de los recursos
      propios (no borra la API en API Designer). Después vuelve a ejecutar
      *Recursos de configuración automática* (el usuario escribe la contraseña)
      para que se registre con el contrato completo leído de Banner. Verifica
      que el conteo vuelva a 497 y que el recurso tenga los parámetros.
4. Espera 1 o 2 minutos, recarga la tarjeta (Ctrl+F5) y revisa en Network la
   llamada a `x-bienestar-lista-sesion`. Lo esperado es HTTP 200.
5. **No hay que cambiar ni volver a desplegar el código** para este paso.

Si después de esto aparece `400` por `offset` o `limit`, o un `406`, anota el
mensaje exacto y entrégaselo al usuario.

### Paso F: la lista trae los datos de la ficha (x-bienestar-lista-sesion 1.0.2)

Contexto: en este tenant, las APIs con autenticación de usuario rechazan
parámetros de consulta, así que `x-discapacidad-detalle?idalumno=` da 400. La
tarjeta desplegada ya **no llama** a `x-discapacidad-detalle`: arma la ficha
con las filas de la lista. Solo falta que la lista traiga esos campos. Mientras
tanto, la ficha abre, pero Campus, Programa, Nivel, Carrera y vigencias salen
"No registrado".

**No quites la autenticación de usuario** a `x-discapacidad-detalle` ni a
ninguna otra API: sin ella, cualquier usuario de la tarjeta podría pedir la
ficha de discapacidad de cualquier alumno.

En API Designer → `x-bienestar-lista-sesion` → nuevo borrador desde **1.0.1**:
1. **No toques la seguridad** (autenticación de usuario, rol, filtro
   `SIRASGN_PIDM = SECURITY_PRINCIPAL_ID`) ni los criterios actuales.
2. Agrega entidades con **unión LEFT** (copia las uniones de
   `x-discapacidad-detalle`, que ya las tiene):

| Entidad | Unión LEFT |
|---|---|
| `SGBSTDN` | `SGBSTDN_PIDM = SPRIDEN_PIDM` |
| `STVMAJR` | `STVMAJR_CODE = SGBSTDN_MAJR_CODE_1` |

3. **No agregues criterios sobre SGBSTDN** (ni `SGBSTDN_TERM_CODE_EFF <= term`).
   En *criteria* convertiría el LEFT en INNER y desaparecerían de la lista los
   alumnos sin registro SGBSTDN. La tarjeta ya elige el registro vigente
   (`periodoEfectivo` más reciente que no pase del periodo).
4. Agrega estas columnas al *select*, con **exactamente** estos nombres de
   propiedad (son los que lee el código):

| Columna | Propiedad |
|---|---|
| `SGRDISA_DISA_EFF_FROM_DATE` | `vigenteDesde` |
| `SGRDISA_DISA_EFF_TO_DATE` | `vigenteHasta` |
| `SGBSTDN_TERM_CODE_EFF` | `periodoEfectivo` |
| `SGBSTDN_CAMP_CODE` | `campus` |
| `SGBSTDN_PROGRAM_1` | `programa` |
| `SGBSTDN_LEVL_CODE` | `nivel` |
| `SGBSTDN_MAJR_CODE_1` | `codCarrera` |
| `SGBSTDN_STST_CODE` | `estadoAlumno` |
| `STVMAJR_DESC` | `carrera` |

5. `maxPageSize`: 500 (hay más filas por el cruce con SGBSTDN; la tarjeta pagina).
6. Publica como **1.0.2**. Si se pierde el valor predefinido de `term`
   (202646), vuelve a ponerlo.
7. Ethos → Aplicaciones → **Banner Integration API** → *Recursos de
   configuración automática* (el usuario escribe la contraseña) para que se
   registre la representación v1.0.2. Revisa en "Detalles de la API" de
   `x-bienestar-lista-sesion` que aparezca v1.0.2.
8. Avísale al usuario para que cambie en `src/config.js`
   `lista.version` a `'1.0.2'` y vuelva a desplegar (lo hace Claude Code en el
   proyecto). Si se despliega antes de que exista la 1.0.2, la lista da 406.
9. Verificación: en Network, la llamada a `x-bienestar-lista-sesion` da 200 y
   las filas traen `campus`, `carrera`, `vigenteDesde`. Al abrir un alumno,
   **no** debe aparecer ninguna llamada a `x-discapacidad-detalle`.

### Plan B: si no se puede registrar el recurso
Si después de A–C el 404 sigue, o no tienes permisos para editar las
aplicaciones:
1. Detente sin forzar cambios.
2. Dile al usuario que la tarjeta funciona hoy con la API anterior cambiando
   una línea en `src/config.js`:
   `lista: { recurso: 'x-bienestar-docente-lista', version: '1.0.1' }`
   y volviendo a desplegar. Esa API ya está registrada, pero no tiene el filtro
   de seguridad por docente.
3. Recomiéndale abrir un caso en el Centro de Soporte de Ellucian con el texto
   de la sección 6.

## 5. Informe final (entrégalo al usuario)

```
Resultado: RESUELTO / NO RESUELTO
Causa encontrada:
Cambios hechos:
  - [Pantalla] [Aplicación/API] [Campo]: [antes] → [después]
Verificación (Network):
  - x-docente-sesion: HTTP ___
  - x-bienestar-lista-sesion: HTTP ___ (mensaje: ___)
  - Accept enviado: v___
Pendientes para el usuario:
```

## 6. Texto para un caso de soporte con Ellucian (si hace falta)

> Tenant ussipantest (TEST). Creamos en API Designer la API
> `x-bienestar-lista-sesion` v1.0.0 (publicada, autenticación de usuario, rol
> SELFSERVICE-FACULTY, userSecurity SIRASGN_PIDM = SECURITY_PRINCIPAL_ID). Al
> consumirla desde una extensión de Experience con `authenticatedEthosFetch`
> (proxy REST de Ethos, token del usuario), Ethos responde
> `404 Resource owner not found for the requested resource`. Otras APIs de API
> Designer del mismo tenant (`x-docente-sesion` v1.0.0) funcionan con el mismo
> mecanismo. Solicitamos indicar cómo registrar la nueva API como recurso
> propio de la aplicación de Banner en Ethos Integration y darle acceso a la
> aplicación de Experience.
