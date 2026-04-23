using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Entidades.Dominio.Rol
{
    public class RolCreateDto
    {
        public string Nombre { get; set; }
        public string Descripcion { get; set; }

        public string? ColorFondo { get; set; }
        public string? ColorTexto { get; set; }
        public string? ColorBorde { get; set; }

        public List<string> Permisos { get; set; }
    }
}
