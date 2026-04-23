using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Entidades.Modelo
{
    public class CatConfiguracion
    {
        public int Id { get; set; }
        public string Parametro { get; set; }
        public string Descripcion { get; set; }
        public string Valor { get; set; }
        public bool Estatus { get; set; }
        public DateTime Fecha_Creacion { get; set; }
        public DateTime? Fecha_Modificacion { get; set; }
        public string? UsuarioModifica { get; set; }
    }
}
