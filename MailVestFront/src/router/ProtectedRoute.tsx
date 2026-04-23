import { Navigate } from "react-router";
import { useAuth } from "../Context/UserContext/AuthContext";
import type { ReactNode } from "react";
import { usePermiso } from "../Hooks/usePermiso";

export function ProtectedRoute({
    children,
    requiredSubModulo,
    requiredPermiso,
}: ProtectedRouteProps) {
    const {user, loading} = useAuth();
    const { tieneSubModulo, tienePermiso } = usePermiso();

    if(loading){
        return <div className="p-3">Validando permisos...</div>;
    }
    if(!user){
        return <Navigate to="/" replace state={{from: location}}/>;
    }

    if(requiredSubModulo && !tieneSubModulo(requiredSubModulo)){
        return <Navigate to= "/" replace />
    }
    if(requiredPermiso && !tienePermiso(requiredPermiso)){
        return <Navigate to= "/" replace />
    }
    return <>{children}</>
}

type ProtectedRouteProps = {
    children: ReactNode;
    requiredSubModulo?: string;
    requiredPermiso?: string;
}