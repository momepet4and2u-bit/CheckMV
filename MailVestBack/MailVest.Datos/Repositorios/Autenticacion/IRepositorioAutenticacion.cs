using MailVest.Entidades.Dominio.Usuarios;
using MailVest.Entidades.Entidades;
using MailVest.Entidades.Modelo;
using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Datos.Repositorios.Autonticacion
{
    public interface IRepositorioAutenticacion
    {
        Task<CatUsuarios?> ObtenerUsuariosAsync(string user);
        Task<CatRoles?> ObtenerRolesXUserAsync(int idUser);
        Task<PermisosUsuario?> ObtenerPermisosxUserAsync(string user);
    }
}
