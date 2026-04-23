using System;
using System.Collections.Generic;
using System.Data.Common;
using System.Text;

namespace MailVest.Entidades.Dominio.Usuarios
{
    public class UsuariosDto
    {
        public int Id { get; set; }
        public string Usuario { get; set; }
        public string Nombre { get; set; }
        public string Email { get; set; }
        public bool Activo { get; set; }
        public string Puesto { get; set; }
        public string Nomina { get; set; }
        public string Rol { get; set; }
    }
}
