module.exports = {
    name: 'TarjetaDiscapacidad',
    publisher: 'USS',
    cards: [{
        type: 'TarjetaDiscapacidadCard',
        source: './src/cards/TarjetaDiscapacidadCard',
        title: 'Bienestar Universitario',
        displayCardType: 'TarjetaDiscapacidad Card',
        description: 'Gestión y seguimiento de los ajustes razonables.',
        configuration: {
            client: [{
                key: 'periodo',
                label: 'Periodo académico (p. ej. 202646)',
                type: 'text',
                required: false
            }]
        },
        pageRoute: {
            route: '/',
            excludeClickSelectors: ['a', 'button']
        }
    }],
    page: {
        source: './src/page/router.jsx'
    }
    // Sin bloque "ethos"/"queries": las APIs de API Designer son REST y se
    // llaman con authenticatedEthosFetch (ver src/api/discapacidad.js), con la
    // versión en el encabezado Accept (src/config.js → API):
    //   x-docente-sesion          1.0.0
    //   x-persona-pidm            1.0.0
    //   x-bienestar-docente-lista 1.0.1
    //   x-discapacidad-detalle    1.0.0
    // getEthosQuery solo sirve para consultas GraphQL declaradas en
    // cards[].queries; con APIs de API Designer responde 400.
};
