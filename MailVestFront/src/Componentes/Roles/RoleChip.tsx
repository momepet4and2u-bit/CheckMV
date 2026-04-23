import { getRoleColors } from "../../Helpers/Roles"
import type RolCatalogo from "../../Paginas/Roles/Modelos/Rol.model";

export const RoleChip: React.FC<RoleChipProps> = ({ nombre, rolCatalogo }) => {
    const color = getRoleColors(rolCatalogo);

    return (
        <span
        className="mv-role-chip"
        style={{
            backgroundColor: color.fondo,
            color: color.texto,
            borderColor: color.borde,
        }}
        >
            {nombre}
        </span>
    )
}

interface RoleChipProps{
    nombre: string;
    rolCatalogo?: RolCatalogo | null;
}