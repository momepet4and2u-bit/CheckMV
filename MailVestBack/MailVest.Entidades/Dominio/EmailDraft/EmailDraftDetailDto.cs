using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Entidades.Dominio.EmailDraft
{
    public sealed class EmailDraftLangViewDto
    {
        public EmailDraftIcsViewDto? ES { get; set; }
        public EmailDraftIcsViewDto? EN { get; set; }
    }
    public sealed class EmailDraftIcsViewDto
    {
        public string Body { get; set; }
        public string FileName { get; set; }
        public string PathRelativo { get; set; }
    }
    public class EmailDraftDetailDto
    {
        public int Id { get; set; }
        public int TemplateId { get; set; }
        public string PlantillaNombre { get; set; }
        public int Estatus { get; set; }
        public int Revision { get; set; }
        public DateTime Creacion { get; set; }
        public DateTime? Actualizado { get; set; }
        public string CreadoPor { get; set; }
        public DateTime? IcsStart { get; set; }
        public DateTime? IcsEnd { get; set; }
        public EmailDraftLangViewDto Ics { get; set; }
        public List<EmailDraftApproverViewDto> Approvers { get; set; }

        public bool IsApprover { get; set; }
        public bool HasApproved { get; set; }
        public bool HasRejected { get; set; }
        public int RequiredApprovers { get; set; }
        public int RequiredApprovalsDone { get; set; }
        public bool HasRequiredRejection { get; set; }
        public bool ReadyToSend { get; set; }
    }
}
