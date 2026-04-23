using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Entidades.Modelo
{
    public class EmailDraftICS
    {
        public int Id { get; set; }
        public int DraftId { get; set; }
        public int Revision { get; set; }
        public string Lenguaje { get; set; }
        public int LenguajeId { get; set; }
        public string IcsUID { get; set; }
        public int IcsSequence { get; set; }
        public DateTime IcsEmpiezaUTC { get; set; }
        public DateTime IcsTerminaUTC { get; set; }
        public string IcsAsunto { get; set; }
        public string IcsDescripcion { get; set; }
        public string PathRelativo { get; set; }
        public DateTime CreadoEl { get; set; }
        public string CreadoPor { get; set; }
    }
}
