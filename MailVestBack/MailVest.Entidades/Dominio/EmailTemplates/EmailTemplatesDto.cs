using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Entidades.Dominio.EmailTemplates
{
    public sealed class EmailTemplateLangDto
    {
        public string Subject { get; set; } = "";
        public string? Html { get; set; } = "";
    }
    public sealed class Attachment
    {
        public string FileName { get; set; }
        public string RelativePath { get; set; }
    }
    public class EmailTemplatesDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string ClickUrl { get; set; }
        public string? ImageUrlES { get; set; }
        public string? ImageUrlEN { get; set; }
        public IEnumerable<Attachment> Attachment { get; set; }
        public string ValidoDesde { get; set; }
        public string ValidoHasta { get; set; }
        public DateTime Creado { get; set; }
        public EmailTemplateLangDto ES { get; set; }
        public EmailTemplateLangDto EN { get; set; }
        public bool Bloqueado { get; set; }
        public bool EnEdicion { get; set; }
        public string? EnEdicionPor { get; set; }
        public DateTime? EnEdicionDesde { get; set; }
        public DateTime? EdicionExpiro { get; set; }
    }
}
