import type RolCatalogo from "../Paginas/Roles/Modelos/Rol.model";

export function getRoleColors(rol?: RolCatalogo | null) {
    if(!rol){
        return {
            fondo: '#f3f4f6',
            texto: '#374151',
            borde: '#e5e7eb',
        };
    }

    return {
        fondo: rol.ColorFondo || '#f3f4f6',
        texto: rol.ColorTexto || '#374151',
        borde: rol.ColorBorde || '#e5e7eb',
    };
}