using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Entidades.Dominio.EmailTemplates
{
    public sealed class TemplateEditLockDto
    {
        public int Id { get; set; }
        public bool EnEdicion { get; set; }
        public string? EnEdicionPor { get; set; }
        public bool IsOwner { get; set; }
        public DateTime? EdicionExpira { get; set; }
    }
}
