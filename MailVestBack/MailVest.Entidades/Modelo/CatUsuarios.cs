using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Entidades.Entidades
{
    public class CatUsuarios
    {
        public int Id { get; set; }
        public string Usuario { get; set; }
        public string Nombre { get; set; }
        public string Nomina { get; set; }
        public string Email { get; set; }
        public string Area { get; set; }
        public bool Estatus { get; set; }
        public DateTime? UltimoIngreso { get; set; }
        public DateTime FechaAlta { get; set; }
        public DateTime? FechaModificacion { get; set; }
        public string? UsuarioModifica { get; set; }

    }
}
