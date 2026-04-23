using Microsoft.AspNetCore.Authorization;
using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Aplicacion.Autenticacion.Permiso
{
    [AttributeUsage(AttributeTargets.Method | AttributeTargets.Class, AllowMultiple = true)]
    public class HasPermissionAttribute : AuthorizeAttribute
    {

        public HasPermissionAttribute(string codigoPermiso)
        {
            Policy = $"Permiso.{codigoPermiso}";
        }
    }
}
