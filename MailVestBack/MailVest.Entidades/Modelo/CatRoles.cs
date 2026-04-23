using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Entidades.Modelo
{
    public class CatRoles
    {
        public int Id { get; set; }
        public string Nombre { get; set; }
        public string Descripcion { get; set; }
        public bool Estatus { get; set; }
        public string? ChipColorFondo { get; set; }
        public string? ChipColorTexto { get; set; }
        public string? ChipColorBorde { get; set; }
    }
}
