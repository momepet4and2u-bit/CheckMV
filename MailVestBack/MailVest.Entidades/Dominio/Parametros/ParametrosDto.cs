using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Entidades.Dominio.Parametros
{
    public class ParametrosDto
    {
        public int Id { get; set; }
        public string Parametro { get; set; }
        public string Descripcion { get; set; }
        public string Valor { get; set; }
        public bool Estatus { get; set; }
    }
}
