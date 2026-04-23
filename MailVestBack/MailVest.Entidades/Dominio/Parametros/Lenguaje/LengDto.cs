using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Entidades.Dominio.Parametros.Lenguaje
{
    public class LengDto
    {
        public string Code { get; set; }
        public string Name { get; set; }
        public bool IsDefault { get; set; }
        public int Order { get; set; }
    }
}
