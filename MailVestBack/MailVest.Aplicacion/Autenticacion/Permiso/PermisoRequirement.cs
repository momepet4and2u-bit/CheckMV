using System;
using System.Collections.Generic;
using System.Text;
using Microsoft.AspNetCore.Authorization;

namespace MailVest.Aplicacion.Autenticacion.Permiso
{
    public class PermisoRequirement : IAuthorizationRequirement
    {
        public string CodigoPermiso { get; }

        public PermisoRequirement(string codigoPermiso)
        {
            CodigoPermiso = codigoPermiso;
        }
    }
}
