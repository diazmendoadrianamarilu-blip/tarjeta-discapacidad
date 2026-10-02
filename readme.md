# Tarjeta Bienestar Universitario: integración con Banner

GAP Capacidad 8 · ACT-GAP-CAP10-2026-DTT-USS

## 1. Por qué fallaba (400 en `/api/ethos-query`)

`getEthosQuery` **no ejecuta APIs de API Designer**. Solo ejecuta consultas
**GraphQL** de Ethos (Data Access) declaradas dentro de cada tarjeta:

```js
cards: [{
  queries: {
    'mi-consulta': [{ resourceVersions: { sections: { min: 16 } }, query: `...` }]
  }
}]
// uso: getEthosQuery({ queryId: 'mi-consulta', properties: { ... } })
```

El bloque `ethos: { queries: [...] }` que tenía `extension.js` no es parte del
SDK. El `queryId` nunca llegaba al manifiesto y el servidor respondía **400**
("Request Failed for the queryId"), fuera cual fuera el formato de
`searchParameters` (ese parámetro tampoco existe: el correcto es `properties`).

Además, `jwt.user.erpId` (`100723307`) es el **código Banner (SPRIDEN_ID)**, no
el PIDM. Aunque la llamada hubiera funcionado, `pidmdocente=100723307` habría
devuelto una lista vacía o la de otra persona.

## 2. Cómo se llaman ahora

Las tres APIs se llaman por **REST** con `authenticatedEthosFetch` (hook
`useData()` del SDK), que pasa por el proxy de Ethos de Experience **con el token
del usuario de la sesión**. Es el mismo mecanismo que usa Ellucian para las
Business Process APIs (`userTokenBusinessProcessQuery` en
[experience-extension-extras](https://github.com/ellucian-developer/experience-extension-extras/blob/main/src/data/user-token-business-process-query.js)).

```
GET x-docente-sesion
    Accept: application/vnd.hedtech.integration.v1.0.0+json
GET x-bienestar-docente-lista?pidmdocente=<pidm>&term=202646
    Accept: application/vnd.hedtech.integration.v1.0.1+json
GET x-discapacidad-detalle?idalumno=<SPRIDEN_ID>&term=202646
    Accept: application/vnd.hedtech.integration.v1.0.0+json
```

Como la llamada va con token de usuario, **se conservan** la "Autenticación del
usuario" (rol `SELFSERVICE-FACULTY`) y el filtro `SECURITY_PRINCIPAL_ID`. **Ya
no hace falta** recrear las APIs con autenticación básica.

Flujo:

1. `x-docente-sesion`: Banner devuelve el PIDM del usuario autenticado
   (`SPRIDEN_PIDM = SECURITY_PRINCIPAL_ID`). No se lee ningún identificador del
   navegador.
2. `x-bienestar-docente-lista`: alumnos con discapacidad matriculados en los NRC del
   docente. Si no hay filas, se muestra el mensaje "No tienes estudiantes con
   discapacidad en tus cursos".
3. `x-discapacidad-detalle`: ficha del alumno. También completa la carrera en el
   listado, porque la API del listado no la trae.

Versiones y recursos: `src/config.js` → `API`.
Periodo: Card Management → Configurar → *Periodo académico*. Si se deja vacío,
se usa `PERIODO` de `src/config.js`.

## 3. Lista de verificación en el tenant (antes de desplegar)

1. **Primero despliega y prueba.** Si el panel de diagnóstico no aparece y la
   lista carga, no hay nada que configurar en Ethos Integration.
   Solo si el panel muestra **401, 403 o 404** para alguna API:
   - **No crees una aplicación nueva.** Experience ya usa una aplicación de
     Ethos que existía antes de la tarjeta. En
     `integrate.elluciancloud.com` → Aplicaciones (tenant `ee114c5f…`),
     búscala con el buscador ("Experience").
   - Si hay varias, la correcta es la que tiene la misma clave de API que
     aparece en Experience Setup para este ambiente.
   - En esa aplicación, revisa que `x-docente-sesion`, `x-bienestar-docente-lista`
     y `x-discapacidad-detalle` estén entre los recursos a los que tiene
     acceso. Si no están, agrégalas.
2. **API Designer**: las tres publicadas con *Autenticación del usuario*. El
   rol de la API (`SELFSERVICE-FACULTY`) tiene que estar asignado al docente en
   Banner.
3. Borradores que se pueden eliminar: `x-quien-soy` y el borrador 1.1.0 de
   `x-discapacidad-detalle` que se abrió solo para probar el checkbox.
4. Desplegar: `npm run deploy-dev -- --env forceUpload` (se cambió `extension.js`).

Si algo falla, el panel amarillo de la tarjeta muestra la API, el estado HTTP y
el mensaje de Ethos. Para ocultarlo en producción, cambia
`MOSTRAR_DIAGNOSTICO` a `false`.

## 4. Ficha de detalle y seguridad del listado

Ver [ADECUACIONES.md](ADECUACIONES.md): la ficha muestra solo los campos que
devuelve `x-discapacidad-detalle` 1.0.0 (ID, carrera, campus, programa, nivel,
tipos de discapacidad y vigencias), y se entrega el JSON de
`x-bienestar-lista-sesion` 1.0.0 (API nueva) con el filtro
`SIRASGN_PIDM = SECURITY_PRINCIPAL_ID`.
