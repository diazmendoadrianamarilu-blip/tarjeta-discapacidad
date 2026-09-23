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
    // BLOQUE CRÍTICO DE SEGURIDAD:
    // Autoriza a la extensión a consumir tus APIs creadas en Integration Designer
    ethos: {
        queries: [
            { queryId: 'x-discapacidad-docente', resource: 'x-discapacidad-docente' },
            { queryId: 'x-discapacidad-detalle', resource: 'x-discapacidad-detalle' },
            { queryId: 'x-asignacion-docente', resource: 'x-asignacion-docente' },
            { queryId: 'x-persona-pidm', resource: 'x-persona-pidm' }
        ]
    }
};

