using MailVest.Datos.Repositorios.RelRolesxUser;
using MailVest.Entidades.Modelo;
using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Aplicacion.RelRolesxUser
{
    public class AdministradorRelRolesxUsuario : IAdministradorRelRolesxUsuario
    {
        private readonly IRepositorioRelRolesxUser relRolesxUser;

        public AdministradorRelRolesxUsuario(IRepositorioRelRolesxUser _relRolesxUser)
        {
            relRolesxUser = _relRolesxUser;
        }

        public Task CrearRelRolesxUsuarioAsync(int idUser, int idRol)
        {
            return relRolesxUser.CrearRelRolesxUsuarioAsync(idUser, idRol);
        }
        public Task ActualizarRolesUsuarioAsync(int idUser, int idRol, string user)
        {
            return  relRolesxUser.ActualizarRolesxUsuarioAsync(idUser, idRol, user);
        }

        public async Task<RelRolesxUsuario?> ObtenerRelRolxUserAsync(int idUsuario)
        {
            return await relRolesxUser.ObtenerRelRolxUserAsync(idUsuario);
        }
    }
}
