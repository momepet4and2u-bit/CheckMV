using MailVest.Entidades.Dominio.Usuarios;
using MailVest.Entidades.Modelo;
using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Aplicacion.RelRolesxUser
{
    public interface IAdministradorRelRolesxUsuario
    {
        Task CrearRelRolesxUsuarioAsync(int idUser, int idRol);
        Task ActualizarRolesUsuarioAsync(int idUser, int idRol, string user);
        Task<RelRolesxUsuario?> ObtenerRelRolxUserAsync(int idUsuario);
    }
}
