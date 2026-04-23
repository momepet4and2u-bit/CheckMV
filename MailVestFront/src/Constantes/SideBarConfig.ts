import { Permisos } from "./Permisos";

export type SideBarSubmodulo = {
    id: string;
    label: string;
    icon: string;
    to: string;
    permiso?: string;

    submodulos?: SideBarSubmodulo[];
}

export type SideBarModulo = {
    id: string;
    label: string;
    icon: string;
    permiso?: string;
    submodulos: SideBarSubmodulo[];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapSub = (sub: any): SideBarSubmodulo => ({
    id: sub.codigo,
    label: sub.label,
    icon: sub.icon,
    to: sub.ruta,
    permiso: sub.codigo,
    submodulos: sub.submodulos ? Object.values(sub.submodulos).map(mapSub) : [],
});

export const SideBar_Modulos: SideBarModulo[] = Object.values(Permisos).map(
    (mod) => ({
        id: mod.codigo,
        label: mod.label,
        icon: mod.icon,
        permiso: mod.codigo,
        submodulos: mod.submodulos ? Object.values(mod.submodulos).map(mapSub) : [],
    })
);