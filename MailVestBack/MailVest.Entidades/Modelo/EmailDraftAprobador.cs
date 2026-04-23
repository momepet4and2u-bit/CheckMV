using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Entidades.Modelo
{
    public sealed class EmailDraftAprobador
    {
        public int Id { get; set; }
        public int DraftId { get; set; }
        public int DirectorioId { get; set; }
        public string Email { get; set; }
        public string EmailNormalizado { get; set; }
        public byte Kind { get; set; }
        public bool EsRequerido { get; set; }
        public DateTime Creado { get; set; }
    }
}
