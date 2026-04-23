import { useAuth } from "../Context/UserContext/AuthContext"

export const usePermiso = () =>{
    const {user} = useAuth();

    const submodulos: string[] = (user?.SubModulos ?? []) as string[];
    const permisos: string[] = (user?.Permisos ?? []) as string[];

    const tieneSubModulo = (codigo?: string) =>
        !codigo || submodulos.includes(codigo);

    const tienePermiso = (codigo?: string) =>
        !codigo || permisos.includes(codigo);

    return {
        tieneSubModulo,
        tienePermiso,
        submodulos,
        permisos
    }
};