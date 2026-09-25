module.exports = {
    name: 'TarjetaDiscapacidad',
    publisher: 'USS',
    cards: [{
        type: 'TarjetaDiscapacidadCard',
        source: './src/cards/TarjetaDiscapacidadCard',
        title: 'Bienestar Universitario',
        displayCardType: 'TarjetaDiscapacidad Card',
        description: 'Gestión y seguimiento de los ajustes razonables.',
        pageRoute: {
            route: '/',
            excludeClickSelectors: ['a']
        }
    }],
    page: {
        source: './src/page/router.jsx',
    },
    ethos: {
        queries: [
            { queryId: 'x-persona-pidm', resource: 'x-persona-pidm', version: '1.0.0' },
            { queryId: 'x-bienestar-docente-lista', resource: 'x-bienestar-docente-lista', version: '1.0.1' },
            { queryId: 'x-discapacidad-detalle', resource: 'x-discapacidad-detalle', version: '1.0.0' },
            { queryId: 'x-asignacion-docente', resource: 'x-asignacion-docente', version: '1.0.0' }
        ]
    }
};