using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Entidades.Dominio.Rol
{
    public class RolDto
    {
        public int Id { get; set; }
        public string Descripcion { get; set; }
        public bool Estatus { get; set; }

        public string? ColorFondo { get; set; }
        public string? ColorTexto { get; set; }
        public string? ColorBorde { get; set; }
    }
}
