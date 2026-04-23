using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Entidades.Dominio.EmailDraft
{
    public sealed class EmailDraftEditLockDto
    {
        public int Id { get; set; }
        public bool EnEdicion { get; set; }
        public string? EnEdicionPor { get; set; }
        public bool IsOwner { get; set; }
        public DateTime? EdicionExpira { get; set; }
    }
}
