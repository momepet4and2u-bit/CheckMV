using MailVest.Entidades.Dominio.Rol;
using MailVest.Entidades.Dominio.Usuarios;
using MailVest.Entidades.Modelo;
using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Datos.Repositorios.Roles
{
    public interface IRepositorioRoles
    {
        Task<List<RolDto>> obtenerTodosRolesAsync();
        Task ActualizarRolAsync(RolDto updateRol);
        Task<CatRoles?> GetRolByIdAsync(int id);
        Task<bool> ExisteRolByDescripcionAsync(string rolDesc, string rolName);
        Task<CatRoles> CrearRolAsync(RolCreateDto newRol);
    }
}
