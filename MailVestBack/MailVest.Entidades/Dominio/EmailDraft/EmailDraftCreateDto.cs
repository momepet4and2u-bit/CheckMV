using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Entidades.Dominio.EmailDraft
{
    public sealed class EmailDraftICSDto
    {
        public string Body { get; set; } = "";
        public string FileName { get; set; } = "";
    }
    public sealed class EmailDrafLangIcsDto
    {
        public EmailDraftICSDto? ES { get; set; }
        public EmailDraftICSDto? EN { get; set; }
    }
    public sealed record AdditionalApproversDto (int Id, bool Requerido);
    public class EmailDraftCreateDto
    {
        public int Id { get; set; }
        public int TemplateId { get; set; }
        public DateTimeOffset IcsStart { get; set; }
        public DateTimeOffset IcsEnd { get; set; }
        public EmailDrafLangIcsDto? Ics { get; set; }
        public List<AdditionalApproversDto>? AdditionalApproverIds { get; set; }
        public int RequiredApprovers { get; set; }
    }
}
