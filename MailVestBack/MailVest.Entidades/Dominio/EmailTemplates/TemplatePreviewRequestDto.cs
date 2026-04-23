using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Entidades.Dominio.EmailTemplates
{
    public sealed class TemplatePreviewRequestDto
    {
        public string Lang { get; set; } = "ES"; // "ES" | "EN"
        public string Title { get; set; } = "";
        public string HtmlRaw { get; set; } = "";
        public string? ImageURL { get; set; }
    }
}
