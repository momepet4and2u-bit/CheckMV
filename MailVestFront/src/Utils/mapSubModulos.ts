import { Permisos } from "../Constantes/Permisos";

export const obtenerSubmodulosDeModulo = (modulo: keyof typeof Permisos) =>{
    const mod = Permisos[modulo];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return Object.values(mod).map((subm: any) => subm.Acceso);
}