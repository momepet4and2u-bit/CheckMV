import { Route, Routes } from "react-router";
import Usuarios from "./Paginas/Usuarios/Usuarios";
import Layout from "./Componentes/Layout";
import { Permisos } from "./Constantes/Permisos";
import { ProtectedRoute } from "./router/ProtectedRoute";
import Roles from "./Paginas/Roles/Roles";
import Plantillas from "./Paginas/Correos/Plantillas/Plantillas";
import EditarPlantilla from "./Paginas/Correos/Plantillas/EditarPlantilla";
import Parametros from "./Paginas/Parametros/Parametros";
import Aprobadores from "./Paginas/Aprobadores/Aprobadores";
import EditarCorreo from "./Paginas/Correos/EnvioCorreos/EditarCorreo";
import Correos from "./Paginas/Correos/EnvioCorreos/Correos";
import EmailDraftPreview from "./Paginas/Correos/EnvioCorreos/Historiales/EmailDraftPreview";
import Idioma from "./Paginas/Parametros/Languajes/Idioma";
import Objetivos from "./Paginas/Correos/Objetivos/Objetivos";

export default function MailVestRoutes() {
    return (
        <Routes>
            <Route path="/" element={<Layout />} >
                <Route path={Permisos.Configuracion.submodulos.AdminUsuarios.ruta} element={
                    <ProtectedRoute
                        requiredSubModulo={Permisos.Configuracion.submodulos.AdminUsuarios.codigo}>
                        <Usuarios />
                    </ProtectedRoute>
                } />
                <Route path={Permisos.Configuracion.submodulos.AdminRoles.ruta} element={
                    <ProtectedRoute requiredSubModulo={Permisos.Configuracion.submodulos.AdminRoles.codigo}>
                        <Roles />
                    </ProtectedRoute>
                } />
                <Route path={Permisos.Configuracion.submodulos.Catalogos.submodulos.AdminParametros.ruta} element={
                    <ProtectedRoute requiredSubModulo={Permisos.Configuracion.submodulos.Catalogos.submodulos.AdminParametros.codigo}>
                        <Parametros />
                    </ProtectedRoute>
                } />
                <Route path="/Idiomas" element={
                    <ProtectedRoute requiredSubModulo={Permisos.Configuracion.submodulos.Catalogos.submodulos.AdminParametros.codigo}>
                        <Idioma />
                    </ProtectedRoute>
                } />
                <Route path={Permisos.Configuracion.submodulos.Catalogos.submodulos.AdminAprobador.ruta} element={
                    <ProtectedRoute requiredSubModulo={Permisos.Configuracion.submodulos.Catalogos.submodulos.AdminAprobador.codigo}>
                        <Aprobadores />
                    </ProtectedRoute>
                }>
                </Route>
                <Route path={Permisos.Correos.submodulos.AdminPlantillas.ruta} element={
                    <ProtectedRoute requiredSubModulo={Permisos.Correos.submodulos.AdminPlantillas.codigo}>
                        <Plantillas />
                    </ProtectedRoute>
                } />
                <Route path="/Plantillas/EditarPlantilla/:id" element={
                    <ProtectedRoute requiredPermiso={Permisos.Correos.submodulos.AdminPlantillas.permisos.Cambio}>
                        <EditarPlantilla />
                    </ProtectedRoute>
                } />
                <Route path={Permisos.Correos.submodulos.AdminCorreos.ruta} element={
                    <ProtectedRoute requiredSubModulo={Permisos.Correos.submodulos.AdminCorreos.codigo}>
                        <Correos />
                    </ProtectedRoute>
                } />
                <Route path="/Correos/EditarCorreo/:id" element={
                    <ProtectedRoute requiredPermiso={Permisos.Correos.submodulos.AdminCorreos.permisos.Cambio}>
                        <EditarCorreo />
                    </ProtectedRoute>
                } />
                <Route path="/Correos/VerCorreo/:id" element={
                    <EmailDraftPreview />
                } />
                <Route path={Permisos.Correos.submodulos.AdminObjetivos.ruta} element={
                    <ProtectedRoute requiredSubModulo={Permisos.Correos.submodulos.AdminObjetivos.codigo}>
                        <Objetivos />
                    </ProtectedRoute>
                } />
            </Route>
        </Routes>
    )
}   