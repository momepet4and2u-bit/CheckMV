import type { TreeNode } from "primereact/treenode";

type PermisosMap = Record<string, string>;

type SubModulo = {
    codigo: string;
    label: string;
    icon?: string;
    ruta?: string;
    permisos?: PermisosMap;
};

type Modulo = {
    codigo: string;
    label: string;
    icon?: string;
    submodulos?: Record<string, SubModulo>;
};

type PermisosRoot = Record<string, Modulo>;

export function
buildPermisosTree(permisosRoot: PermisosRoot): TreeNode[] {
    
    const modulos = Object.values(permisosRoot);
    
    return modulos.map((mod) => {
        const submods = Object.values(mod.submodulos ?? {});

        const children: TreeNode[] = submods.map((sub) => {
            const permisos = sub.permisos ?? {};

            const permisoChildren: TreeNode[] = Object.entries(permisos).map(
                ([accion, codigoPermiso]) => ({
                    key: codigoPermiso,
                    label: `${accion} (${codigoPermiso})`,
                    data: { accion, codigoPermiso, submodulo: sub.codigo, modulo: mod.codigo},
                    leaf: true,
                })
            );

            return {
                key: `SUB:${mod.codigo}:${sub.codigo}`,
                label: sub.label,
                data: { submodulo: sub.codigo, modulo: mod.codigo, ruta: sub.ruta},
                children: permisoChildren,
            };
        });

        return {
            key: `MOD:${mod.codigo}`,
            label: mod.label,
            data: { modulo: mod.codigo},
            children,
        }
    })
}