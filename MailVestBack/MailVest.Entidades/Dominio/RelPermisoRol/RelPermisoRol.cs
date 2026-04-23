using MailVest.Entidades.Modelo;
using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Entidades.Dominio.RelPermisoRol
{
    public class RelPermisoRol
    {
        public int Id { get; set; }
        public int IdCatRol { get; set; }
        public int IdCatOpcion { get; set; }
        public bool Estatus { get; set; }
        public CatOpcion Permiso { get; set; }
        public DateTime Fecha_CreacionRelacion { get; set; }
        public DateTime Fecha_Modificacion { get; set; }
        public string UsuarioModifica { get; set; }
    }
}
