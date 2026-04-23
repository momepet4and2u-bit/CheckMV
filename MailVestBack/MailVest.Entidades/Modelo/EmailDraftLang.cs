using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Entidades.Modelo
{
    public class EmailDraftLang
    {
        public int Id { get; set; }
        public int DraftId { get; set; }
        public string Subject { get; set; }
        public string HTML { get; set; }
        public string ImageUrl { get; set; }
        public string Lang { get; set; }
        public int LangId { get; set; }
    }
}
