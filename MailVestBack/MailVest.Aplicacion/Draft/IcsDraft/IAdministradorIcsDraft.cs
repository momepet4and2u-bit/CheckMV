using MailVest.Entidades.Dominio.EmailDraft;
using MailVest.Entidades.Modelo;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;

namespace MailVest.Aplicacion.Draft.IcsDraft
{
    public interface IAdministradorIcsDraft
    {
        Task<string> crearIcsAsync(string uid, int sequence, DateTime startUtc, DateTime endUtc, string summary, string descripcion, string organizerEmail, string organizerName, string leng, string url);
        Task<string> guardarIcsAsync(string nombreICS, string icsContent);
        Task<IEnumerable<EmailDraftICS>?> CrearEmailDraftICSAsync(int draftId, EmailDrafLangIcsDto ics, DateTime icsSTart, DateTime icsEnd, string user, string url);
        Task<IEnumerable<EmailDraftICS>> SaveUpdateICSAsync(IEnumerable<EmailDraftICS> ics);
    }
}
