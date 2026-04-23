using Ical.Net;
using Ical.Net.CalendarComponents;
using Ical.Net.DataTypes;
using Ical.Net.Serialization;
using MailVest.Comun.Helpers.Config;
using MailVest.Datos.Repositorios.Draft.EmailDraftIcs;
using MailVest.Entidades.Dominio.EmailDraft;
using MailVest.Entidades.Modelo;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;

namespace MailVest.Aplicacion.Draft.IcsDraft
{
    public class AdministradorIcsDraft : IAdministradorIcsDraft
    {
        private static HelperConfig config;
        private IRepositorioEmailDraftICS draftICS;


        public AdministradorIcsDraft(HelperConfig _config, IRepositorioEmailDraftICS _draftICS)
        {
            config = _config;
            draftICS = _draftICS;
        }
        public async Task<IEnumerable<EmailDraftICS>?> CrearEmailDraftICSAsync(int draftId, EmailDrafLangIcsDto ics, DateTime icsSTart, DateTime icsEnd, string user, string url)
        {

            var uid = $"{Guid.NewGuid():N}@mailvest";

            var correoSistema = config.ObtenerParametroConfig("CorreoSistema");

            var enICSURL = crearIcsAsync(uid, 1, icsSTart, icsEnd, ics.EN!.FileName, ics.EN.Body, correoSistema, "BanBajio", "EN", url);
            var esICSURL = crearIcsAsync(uid, 1, icsSTart, icsEnd, ics.ES!.FileName, ics.ES.Body, correoSistema, "BanBajio", "ES", url);

            if (enICSURL.Result is null || esICSURL.Result is null)
            {
                return null;
            }
            var list = new List<EmailDraftICS>(capacity: 2);

            if (ics?.EN is not null)
            {
                list.Add(new EmailDraftICS
                {
                    DraftId = draftId,
                    Revision = 0,
                    Lenguaje = "EN",
                    IcsUID = uid,
                    IcsSequence = 1,
                    IcsEmpiezaUTC = icsSTart,
                    IcsTerminaUTC = icsEnd,
                    IcsAsunto = ics.EN.FileName,
                    IcsDescripcion = ics.EN.Body,
                    PathRelativo = enICSURL.Result.ToString(),
                    CreadoPor = user,
                    CreadoEl = DateTime.Now
                });
            }

            if (ics?.ES is not null)
            {
                list.Add(new EmailDraftICS
                {
                    DraftId = draftId,
                    Revision = 0,
                    Lenguaje = "ES",
                    IcsUID = uid,
                    IcsSequence = 1,
                    IcsEmpiezaUTC = icsSTart,
                    IcsTerminaUTC = icsEnd,
                    IcsAsunto = ics.ES.FileName,
                    IcsDescripcion = ics.ES.Body,
                    PathRelativo = esICSURL.Result.ToString(),
                    CreadoPor = user,
                    CreadoEl = DateTime.Now
                });
            }

            return await SaveUpdateICSAsync(list);
        }

        public async Task<IEnumerable<EmailDraftICS>> SaveUpdateICSAsync(IEnumerable<EmailDraftICS> ics)
        {
            return await draftICS.SaveUpdateICSAsync(ics);
        }

        public async Task<string> crearIcsAsync(string uid, int sequence, DateTime startUtc, DateTime endUtc, string summary, string descripcion, string organizerEmail, string organizerName, string leng, string url)
        {
            startUtc = DateTime.SpecifyKind(startUtc, DateTimeKind.Utc);
            endUtc = DateTime.SpecifyKind(endUtc, DateTimeKind.Utc);

            var cal = new Calendar
            {
                ProductId = "-//BanBajio//MailVest//" + leng,
                Method = "PUBLISH"
            };

            var ev = new CalendarEvent
            {
                Uid = uid,
                Sequence = sequence,
                DtStamp = new CalDateTime(DateTime.UtcNow),
                DtStart = new CalDateTime(startUtc, "UTC"),
                DtEnd = new CalDateTime(endUtc, "UTC"),
                Summary = summary ?? "No se encontro el titulo del ICS",
                Description = descripcion ?? "No se encontro el contenido del ICS",
                Status = "CONFIRMED",
                Location = "Online Meeting",
                Url = new Uri(url)
            };

            //ev.Organizer = new Organizer
            //{
            //    CommonName = organizerName,
            //    Value = new Uri($"mailto:{organizerEmail}")
            //};

            cal.Events.Add(ev);

           var calIcs = new CalendarSerializer().SerializeToString(cal)!;
            return await guardarIcsAsync(summary, calIcs);
        }

        public async Task<string> guardarIcsAsync(string nombreICS, string icsContent)
        {
            var folderRoot = config.ObtenerParametroConfig("UrlFiles");

            var año = DateTime.Now.Year.ToString();
            var mes = DateTime.Now.Month.ToString().PadLeft(2, '0');
            var dia = DateTime.Now.Day.ToString().PadLeft(2, '0');

            var rutaFecha = Path.Combine(año, mes, dia);

            var ruta = Path.Combine(config.ObtenerParametroConfig("FolderICS"), rutaFecha);

            var rutaFinal = Path.Combine(folderRoot, ruta);
            if (!Directory.Exists(rutaFinal))
            {
                Directory.CreateDirectory(rutaFinal);
            }
            nombreICS = nombreICS.Replace(" ", "").Trim();
            var fileName = Path.Combine(rutaFinal, nombreICS + ".ics");

            var relPath = Path.Combine(rutaFecha, nombreICS + ".ics");

            if (Path.IsPathRooted(fileName))
            {
                if (File.Exists(fileName))
                {
                    File.Delete(fileName);
                }

                await File.WriteAllTextAsync(fileName, icsContent, new UTF8Encoding(false));

                return relPath;
            }
            else
            {
                return string.Empty;
            }
        }
    }
}
