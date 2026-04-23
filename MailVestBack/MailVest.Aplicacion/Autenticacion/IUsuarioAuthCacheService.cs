using MailVest.Entidades.Auth;
using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Text;

namespace MailVest.Aplicacion.Autenticacion
{
    public interface IUsuarioAuthCacheService
    {
        Task <UserAuth?> GetUserAuthAsync (string username);

        void InvalidateRolAsync(string roleName);
        Task InvalidateUserAsync(string userId);

        Task<bool> HasPermisoAsync(ClaimsPrincipal user, string codigoPermiso);
    }
}
