using MailVest.Datos.Contexto;
using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Datos.Repositorios.UnitOfWork
{
    public class RepositorioUnitOfWork : IRepositorioUnitOfWork
    {
        private readonly MailVestDbContext context;

        public RepositorioUnitOfWork(MailVestDbContext _context)
        {
            context = _context;
        }

        public async Task<int> SaveChangesAsync(CancellationToken ct = default)
        {
            return await context.SaveChangesAsync(ct);
        }
        public async Task<UnitOfWorkTransaction> BeginOrUseTransactionAsync(CancellationToken ct = default)
        {
            if (context.Database.CurrentTransaction is not null)
            {
                return new UnitOfWorkTransaction(_tx: null, isOwner: false);
            }

            var tx = await context.Database.BeginTransactionAsync(ct);
            return new UnitOfWorkTransaction(tx, isOwner: true);
        }
    }
}
