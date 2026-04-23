using MailVest.Entidades.Modelo;
using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Datos.Repositorios.RelRolesxUser
{
    public interface IRepositorioRelRolesxUser
    {
        Task CrearRelRolesxUsuarioAsync(int idUser, int idRol);
        Task ActualizarRolesxUsuarioAsync(int idUser, int idRol, string usuario);
        Task<RelRolesxUsuario?> ObtenerRelRolxUserAsync(int idUser);
    }
}
