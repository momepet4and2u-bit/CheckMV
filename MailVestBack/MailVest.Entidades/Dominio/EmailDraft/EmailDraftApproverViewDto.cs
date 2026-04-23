using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Entidades.Dominio.EmailDraft
{
    public class EmailDraftApproverViewDto
    {
        public int Id { get; set; }
        public string Usuario { get; set; }
        public string Nombre { get; set; }
        public string Email { get; set; }
        public bool Requerido { get; set; }
        public bool Adicional { get; set; }
        public int? Estatus { get; set; } //0-sin accion, 1=aprobado, 2=rechazado
        public string? Comentario { get; set; }
        public DateTime? Fecha { get; set; }
        public bool IsCurrentUser { get; set; }
    }
}
