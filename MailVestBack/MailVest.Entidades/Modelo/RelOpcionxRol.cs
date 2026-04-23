using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Entidades.Modelo
{
    public class RelOpcionxRol
    {
        public int Id { get; set; }
        public int IdCatRol { get; set; }
        public int IdCatOpcion { get; set; }
        public bool Estatus { get; set; }
        public DateTime Fecha_CreacionRelacion { get; set; }
        public DateTime? Fecha_Modificacion { get; set; }
        public string? UsuarioModifica { get; set; }
    }
}
