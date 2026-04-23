using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Entidades.Dominio.Rol
{
    public sealed class UpdatePermisosRol
    {
        public List<string> Permisos { get; set; } = new();
    }
}
