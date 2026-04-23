using MailVest.Entidades.Modelo;
using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Datos.Repositorios.Draft.EmailDraftIcs
{
    public interface IRepositorioEmailDraftICS
    {
        Task<IEnumerable<EmailDraftICS>> SaveUpdateICSAsync(IEnumerable<EmailDraftICS> ics);
    }
}
