using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace MailVest.Entidades.Modelo
{
    public sealed class EmailTemplates
    {
        public int Id { get; set; }
        [MaxLength(200)]
        public string Name { get; set; }
        [MaxLength(2000)]
        public string ClickUrl { get; set; }
        public string? AdjuntoURL { get; set; }
        public DateOnly ValidoDesde { get; set; }
        public DateOnly ValidoHasta { get; set; }
        public DateTime Creado { get; set; }
        public DateTime? Actualizado { get; set; }

        public bool EsBorrado { get; set; } = false;
        public string? UsuarioModifico { get; set; }

        public bool Bloqueado { get; set; } = false;
        public DateTime? BloqueadoAt { get; set; }
        public string? BloqueadoPor { get; set; }

        public bool EditLocked { get; set; }
        public DateTime? EditLockedAt { get; set; }
        public string? EditLockedBy { get; set; }
        public DateTime? EditLockExpiresAt { get; set; }
    }
}
