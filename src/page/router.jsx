import React from 'react';
import { BrowserRouter as Router, Route, Switch, useParams, useLocation } from 'react-router-dom';

import Home from './Home';
import DetalleAlumno from './DetalleAlumno';

function DetalleDesdeRuta(props) {
    const { idAlumno } = useParams();
    const location = useLocation();
    const term = (location.state && location.state.term) || '202646';

    return <DetalleAlumno idAlumno={idAlumno} term={term} {...props} />;
}

const RouterPage = (props) => {
    // Protección contra el error de ruta indefinida de Ellucian
    const basePath = (props.pageInfo && props.pageInfo.basePath) ? props.pageInfo.basePath : '/';

    return (
        <Router basename={basePath}>
            <Switch>
                <Route exact path='/'>
                    <Home {...props} />
                </Route>
                <Route path='/alumno/:idAlumno'>
                    <DetalleDesdeRuta {...props} />
                </Route>
            </Switch>
        </Router>
    );
};

export default RouterPage;