using System;
using System.Collections.Generic;
using System.Text;
using Microsoft.AspNetCore.Http;

namespace MailVest.Entidades.Dominio.EmailTemplates
{
    public class EmailTemplatesUpsertDto
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string ClickUrl { get; set; }
        public IFormFile? imagenES { get; set; }
        public IFormFile? imagenEN { get; set; }
        public string ValidoDesde { get; set; }
        public string ValidoHasta { get; set; }
        public DateTime Creado { get; set; }
        public EmailTemplateLangDto ES { get; set; }
        public EmailTemplateLangDto EN { get; set; }
        public IEnumerable<IFormFile>? ArchivoAd { get; set; }
    }
}
