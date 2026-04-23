using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Entidades.Modelo
{
    public sealed class EmailDrafts
    {
        public int Id { get; set; }
        public int TemplateId { get; set; }
        public string ClickUrl { get; set; }
        public string ArchivoAd { get; set; }
        public DateTime? IcsStartUtc { get; set; }
        public DateTime? IcsEndUtc { get; set; }
        public byte Estatus { get; set; }
        public int Revision { get; set; }
        public string? CreadoPor { get; set; }
        public DateTime Fecha_Creacion { get; set; }
        public DateTime Actualizado { get; set; }
        public bool EsBorrado { get; set; }
        public bool EditLocked { get; set; }
        public DateTime? EditLockedAt { get; set; }
        public string? EditLockedBy { get; set; }
        public DateTime? EditLockExpiresAt { get; set; }
    }
}
