using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Entidades.Dominio.EmailDraft
{
    public class EmailDraftTableDto
    {
        public int Id { get; set; }
        public int TemplateId { get; set; }
        public string PlantillaNombre { get; set; }
        public int Estatus { get; set; }
        public int Revision { get; set; }
        public string CreadoPor { get; set; }
        public DateTime Creacion { get; set; }
        public DateTime Actualizado { get; set; }
        public bool IsApprover { get; set; }

        public int RequiredApprovers { get; set; } //cuantos aprovadores requeridos existen
        public int RequiredApprovalsDone { get; init; } //cuantas aprovaciones requeridas se tienen
        public bool HasRequiredRejection { get; init; } //algun rechazo de requeridos en la ronda actual?
        public bool AllRequiredApproved { get; init; } // RequiredApprovalsDone >= RequiredApprovers

        public bool ReadyToSend { get; set; } //AllRequiredApproved && !HasRequiredRejection && status allows
        public bool EnEdicion { get; set; }
        public string? EnEdicionPor { get; set; }
        public DateTime? EnEdicionDesde { get; set; }
        public DateTime? EdicionExpiro { get; set; }

    }
}
