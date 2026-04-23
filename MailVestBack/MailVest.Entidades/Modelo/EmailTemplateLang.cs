using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Entidades.Modelo
{
    public class EmailTemplateLang
    {
        public int Id { get; set; }
        public int TemplateId { get; set; }
        public string ImageUrl { get; set; }
        public string Subject { get; set; }
        public string HTML { get; set; }
        public string Lang { get; set; }
        public int LangId { get; set; }
    }
}
