/* 
 * App Principal - Sistema Palma.PSD
 * @author Starmannweb (https://starmannweb.com.br)
 * @date 2026-01-21 19:30
 * @version 1.0.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { StoreProvider } from './store';
import { Layout } from './components/Layout';
import {
  Dashboard,
  NovaProducao,
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
