using MailVest.Entidades.Dominio.Rol;
using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Aplicacion.RelPermisosxRol
{
    public interface IAdministradorRelPermisosxRol
    {
        Task UpdatePermisosxRolAsync(int idRol, List<string> newPermisos, string usuario);

        Task<List<string>> ObtenerPermisoxRolAsync(int idRol);
    }
}
