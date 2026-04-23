using Microsoft.AspNetCore.Authorization;
using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Aplicacion.Autenticacion.Permiso
{
    public class PermisoHandler : AuthorizationHandler<PermisoRequirement>
    {
        private readonly IUsuarioAuthCacheService authCache;

        public PermisoHandler(IUsuarioAuthCacheService _authCache)
        {
            authCache = _authCache;
        }

        protected override async Task HandleRequirementAsync(
            AuthorizationHandlerContext context,
            PermisoRequirement requiere
            )
        {
            var user = context.User;
            var tiene = await authCache.HasPermisoAsync(
                context.User,
                requiere.CodigoPermiso
                );

            if (tiene)
            {
                context.Succeed(requiere);
            }

        }
    }
}
