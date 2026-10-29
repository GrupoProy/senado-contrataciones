import { Navigate, Route, Routes } from 'react-router-dom';
import { MainLayout } from '@/components/layout/main-layout';
import { ProtectedRoute } from './protected-route';
import { LoginPage } from '@/features/auth/pages/login-page';
import { DashboardPage } from '@/features/dashboard/pages/dashboard-page';
import { UsuariosPage } from '@/features/usuarios/pages/usuarios-page';
import { RolesPage } from '@/features/roles/pages/roles-page';
import { PersonasPage } from '@/features/personas/pages/personas-page';
import { CatalogosPage } from '@/features/catalogos/pages/catalogos-page';
import { RequerimientosPage } from '@/features/requerimientos/pages/requerimientos-page';
import { SeguimientoPage } from '@/features/seguimiento/pages/seguimiento-page';
import { ContratosPage } from '@/features/contratos/pages/contratos-page';
import { PerfilPage } from '@/features/perfil/pages/perfil-page';
import { CambiarPasswordPage } from '@/features/perfil/pages/cambiar-password-page';
import { SenadoresPage } from '@/features/senadores/pages/senadores-page';
import { CargosPage } from '@/features/cargos/pages/cargos-page';
import { UnidadesPage } from '@/features/unidades/pages/unidades-page';
import { PermisosPage } from '@/features/permisos/pages/permisos-page';
import { MenusPage } from '@/features/menus/pages/menus-page';
import { MatrizPage } from '@/features/matriz/pages/matriz-page';
import { FlujosPage } from '@/features/flujos/pages/flujos-page';
import { AuditoriaPage } from '@/features/auditoria/pages/auditoria-page';
import { ParametrosPage } from '@/features/parametros/pages/parametros-page';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/usuarios" element={<UsuariosPage />} />
        <Route path="/roles" element={<RolesPage />} />
        <Route path="/personas" element={<PersonasPage />} />
        <Route path="/catalogos" element={<CatalogosPage />} />
        <Route path="/requerimientos" element={<RequerimientosPage />} />
        <Route path="/seguimiento" element={<SeguimientoPage />} />

        <Route path="/contratos" element={<ContratosPage />} />
        <Route path="/perfil" element={<PerfilPage />} />
        <Route path="/perfil/cambiar-password" element={<CambiarPasswordPage />} />
        <Route path="/senadores" element={<SenadoresPage />} />
        <Route path="/cargos" element={<CargosPage />} />
        <Route path="/unidades" element={<UnidadesPage />} />
        <Route path="/permisos" element={<PermisosPage />} />
        <Route path="/menus" element={<MenusPage />} />
        <Route path="/matriz" element={<MatrizPage />} />
        <Route path="/flujos" element={<FlujosPage />} />
        <Route path="/auditoria" element={<AuditoriaPage />} />
        <Route path="/parametros" element={<ParametrosPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
