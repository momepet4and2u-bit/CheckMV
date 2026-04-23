using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Entidades.Auth
{
    public class UserAuth
    {
        public int Id { get; set; }

        public string Nombre { get; set; }
        public string Usuario { get; set; }

        public string Rol { get; set; }
        public List<string> SubModulos { get; set; }
        public List<string> Permisos { get; set; }
    }
}

