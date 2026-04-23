using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Entidades.Dominio.Usuarios
{
    public class UsuarioUpdateDto
    {
        public int Id { get; set; }
        public string Usuario { get; set; }
        public string Nombre { get; set; }
        public string Email { get; set; }
        public string Area { get; set; }
        public string Nomina { get; set; }
        public bool Activo { get; set; }
        public int IdRol { get; set; }
        public string Rol { get; set; }
    }
}
