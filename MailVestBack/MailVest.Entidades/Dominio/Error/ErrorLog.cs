using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Entidades.Dominio.Error
{
    public class ErrorLog
    {
        public int Id { get; set; }
        public DateTime Fecha { get; set; }
        public string Origen { get; set; }
        public string Mensaje { get; set; }
        public string Detalle { get; set; }
        public string? Usuario { get; set; }
        public string? EndPoint { get; set; }
        public string? ClientInfo { get; set; }
        public string? CorrelationId { get; set; }

        public bool EsEncriptado { get; set; }
    }
}
