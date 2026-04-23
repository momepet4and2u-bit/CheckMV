using MailVest.Datos.Contexto;
using MailVest.Entidades.Modelo;
using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Datos.Repositorios.Draft.EmailDraftAprobadores
{
    public class RepositorioEmailDraftAprobadores : IRepositorioEmailDraftAprobadores
    {
        private readonly MailVestDbContext db;
        
        public RepositorioEmailDraftAprobadores(MailVestDbContext _db)
        {
            db = _db;
        }

        public async Task<IEnumerable<EmailDraftAprobador>?> CreateDraftAsync(IEnumerable<EmailDraftAprobador> newAprobores, CancellationToken ct)
        {
            var entity = newAprobores;

            await db.EmailDraftAprobador.AddRangeAsync(entity);
            return entity;
        }
    }
}
