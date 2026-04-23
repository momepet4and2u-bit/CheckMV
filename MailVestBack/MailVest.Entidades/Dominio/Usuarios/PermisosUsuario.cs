using MailVest.Entidades.Modelo;
using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Entidades.Dominio.Usuarios
{
    public class PermisosUsuario
    {
        public PermisosUsuario()
        {

        }
        public string Usuario { get; set; }
        public List<CatSubModulo?> SubModulo { get; set; }
        public List<CatOpcion?> Opciones { get; set; }
    }
}
