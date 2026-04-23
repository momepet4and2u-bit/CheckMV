using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Datos.Repositorios.UnitOfWork
{
    public interface IRepositorioUnitOfWork
    {
        Task<int> SaveChangesAsync(CancellationToken ct = default);
        Task<UnitOfWorkTransaction> BeginOrUseTransactionAsync(CancellationToken ct = default);
    }
}
