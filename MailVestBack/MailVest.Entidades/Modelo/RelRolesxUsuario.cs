using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Entidades.Modelo
{
    public class RelRolesxUsuario
    {
        public int Id { get; set; }
        public int IdCatUsuario { get; set; }
        public int IdCatRoles { get; set; }
        public bool Estatus { get; set; }
        public DateTime? Fecha_Modificacion { get; set; }
        public string? UsuarioModifica { get; set; }
    }
}
