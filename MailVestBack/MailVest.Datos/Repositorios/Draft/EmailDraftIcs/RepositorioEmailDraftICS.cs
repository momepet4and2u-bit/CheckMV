using MailVest.Datos.Contexto;
using MailVest.Entidades.Modelo;
using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Datos.Repositorios.Draft.EmailDraftIcs
{
    public class RepositorioEmailDraftICS : IRepositorioEmailDraftICS
    {
        private readonly MailVestDbContext db;

        public RepositorioEmailDraftICS(MailVestDbContext _db)
        {
            db = _db;
        }

        public async Task<IEnumerable<EmailDraftICS>> SaveUpdateICSAsync(IEnumerable<EmailDraftICS> ics)
        {
            var enti = ics;
            await db.EmailDraftICs.AddRangeAsync(enti);
            return enti;
        }
    }
}
