/* 
 * App Principal - Sistema Palma.PSD
 * @author Ricieri de Moraes (https://starmannweb.com.br)
 * @date 2026-01-22 09:10
 * @version 1.2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { StoreProvider } from './store';
import { AuthProvider } from './context/AuthContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import {
  Dashboard,
  NovaProducao,
  EditarProducao,
  Producoes,
  Fechamento,
  Clientes,
  Projetos,
  Login,
  Usuarios
} from './pages';

function App() {
  return (
    <AuthProvider>
      <StoreProvider>
        <BrowserRouter basename="/gestao-financeira">
          <Routes>
            {/* Rota pública */}
            <Route path="/login" element={<Login />} />

            {/* Rotas protegidas */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout><Dashboard /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/nova-producao" element={
              <ProtectedRoute>
                <Layout><NovaProducao /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/editar-producao/:id" element={
              <ProtectedRoute>
                <Layout><EditarProducao /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/producoes" element={
              <ProtectedRoute>
                <Layout><Producoes /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/fechamento" element={
              <ProtectedRoute>
                <Layout><Fechamento /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/clientes" element={
              <ProtectedRoute>
                <Layout><Clientes /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/projetos" element={
              <ProtectedRoute>
                <Layout><Projetos /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/usuarios" element={
              <ProtectedRoute requiredRole="admin">
                <Layout><Usuarios /></Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </StoreProvider>
    </AuthProvider>
  );
}

export default App;
