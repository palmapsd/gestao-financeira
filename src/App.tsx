/* 
 * App Principal - Sistema Palma.PSD
 * @author Ricieri de Moraes (https://starmannweb.com.br)
 * @date 2026-01-21 20:50
 * @version 1.1.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { StoreProvider } from './store';
import { Layout } from './components/Layout';
import {
  Dashboard,
  NovaProducao,
  EditarProducao,
  Producoes,
  Fechamento,
  Clientes,
  Projetos
} from './pages';

function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/nova-producao" element={<NovaProducao />} />
            <Route path="/editar-producao/:id" element={<EditarProducao />} />
            <Route path="/producoes" element={<Producoes />} />
            <Route path="/fechamento" element={<Fechamento />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/projetos" element={<Projetos />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </StoreProvider>
  );
}

export default App;
