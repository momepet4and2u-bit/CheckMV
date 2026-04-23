using MailVest.Entidades.Validaciones;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Text;

namespace MailVest.Entidades.Dominio.Usuarios
{
    public class UsuarioCreateDto
    {
        [Required]
        public string Usuario { get; set; } = default!;
        [Required]
        public string Nombre { get; set; } = default!;
        [Required, EmailAddress]
        [EmailDomainValidacion("Correo:Dominios")]
        public string Email { get; set; } = default!;
        [Required]
        public string Puesto { get; set; } = default!;
        [Required]
        public string Nomina { get; set; } = default!;
        public bool Activo { get; set; } = true;
        [Required]
        public int IdRol { get; set; }
        [Required]
        public string Rol { get; set; } = default!;
    }
}
