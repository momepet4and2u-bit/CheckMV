using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Entidades.Modelo
{
    public class DirectorioAprobacion
    {
        public int Id { get; set; }
        public string Usuario { get; set; }
        public string Email { get; set; }
        public string EmailNormalizado { get; set; }
        public bool IsDefault { get; set; }
        public bool IsEnabled { get; set; }
        public DateTime? UltimoUso { get; set; }
        public DateTime CreadoEn { get; set; }
        public DateTime? Actualizado { get; set; }
        public string? UsuarioModifico { get; set; }
    }
}
