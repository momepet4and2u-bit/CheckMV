using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Entidades.Modelo
{
    public class CatSubModulo
    {
        public int Id { get; set; }
        public string Nombre { get; set; }
        public string Descripcion { get; set; }
        public bool Estatus {  get; set; }
        public int IdCatModulo { get; set; }
    }
}
