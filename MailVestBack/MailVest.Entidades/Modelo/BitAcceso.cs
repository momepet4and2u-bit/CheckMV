using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace MailVest.Entidades.Modelo
{
    public class BitAcceso
    {
        [Key]
        public long IdAcceso { get; set; }
        public string Usuario { get; set; }
        public DateTime Fecha { get; set; }
        public string IpRemota { get; set; }
        public string Mensaje { get; set; }
    }
}
