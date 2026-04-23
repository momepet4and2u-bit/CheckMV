using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Entidades.Modelo
{
    public class BitMovimientos
    {
        public long Id { get; set; }
        public string Movimiento { get; set; }
        public string Tabla { get; set; }
        public string Registro { get; set; }
        public string Usuario { get; set; }
        public DateTime Fecha { get; set; }
        public string IPRemota { get; set; }
    }
}
