import React from 'react';
import { BrowserRouter as Router, Route, Switch, useParams } from 'react-router-dom';
import { useCardInfo, usePageInfo } from '@ellucian/experience-extension-utils';

import Home from './Home';
import DetalleAlumno from './DetalleAlumno';
import { PERIODO } from '../config';

/* Periodo configurable en Card Management; si no se configuró, el de config.js. */
function usePeriodo() {
  const { configuration } = useCardInfo() || {};
  const valor = configuration && String(configuration.periodo || '').trim();
  return valor || PERIODO;
}

function DetalleDesdeRuta({ term }) {
  const { idAlumno } = useParams();
  return <DetalleAlumno key={idAlumno} idAlumno={decodeURIComponent(idAlumno)} term={term} />;
}

export default function RouterPage() {
  const { basePath } = usePageInfo() || {};
  const term = usePeriodo();

  return (
    <Router basename={basePath || '/'}>
      <Switch>
        <Route exact path="/">
          <Home term={term} />
        </Route>
        <Route path="/alumno/:idAlumno">
          <DetalleDesdeRuta term={term} />
        </Route>
      </Switch>
    </Router>
  );
}
