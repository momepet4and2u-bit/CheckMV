using MailVest.Entidades.Dominio.Rol;
using MailVest.Entidades.Dominio.Usuarios;
using MailVest.Entidades.Modelo;
using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Aplicacion.Roles
{
    public interface IAdministradorRoles
    {
        Task<List<RolDto>> ObtenerTodosRolesAsync();

        Task ActualizarRolAsync(int id, RolDto updateRol, bool puedeCambiar);
        Task<CatRoles?> GetRolByIdAsync(int id);
        Task<bool> ExisteRolByDescripcionAsync(string rolDesc, string rolName);
        Task CrearRolAsync(RolCreateDto newRol, string usuario);
    }
}
