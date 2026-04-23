using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Entidades.Dominio.DirectorioAprobadores
{
    public class DirectAprobDto
    {
        public int Id { get; set; }
        public string Usuario { get; set; }
        public string Email { get; set; }
        public DateTime? UltimoUso { get; set; }
        public bool IsDefault { get; set; }
        public bool Estatus { get; set; }
    }
}
