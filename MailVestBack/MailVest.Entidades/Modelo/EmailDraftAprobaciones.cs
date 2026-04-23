using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Entidades.Modelo
{
    public class EmailDraftAprobaciones
    {
        public int Id { get; set; }
        public int DraftId { get; set; }
        public int Revision { get; set; }
        public string EmailAprobacion { get; set; }
        public string EmailNormalizado { get; set; }
        public byte Estatus { get; set; }
        public DateTime? Fecha_Decision { get; set; }
        public string? Comentario { get; set; }
        public DateTime CreadoEl { get; set; }
    }
}
