using Microsoft.EntityFrameworkCore.Storage;
using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Datos.Repositorios.UnitOfWork
{
    public sealed class UnitOfWorkTransaction : IAsyncDisposable
    {
        private readonly IDbContextTransaction? tx;
        public bool IsOwner { get; }

        internal UnitOfWorkTransaction(IDbContextTransaction? _tx, bool isOwner)
        {
            tx = _tx;
            IsOwner = isOwner;
        }

        public Task CommitAsync(CancellationToken ct = default) => IsOwner && tx is not null ? tx.CommitAsync(ct) : Task.CompletedTask;

        public Task RollbackAsync(CancellationToken ct = default)
            => IsOwner && tx is not null ? tx.RollbackAsync(ct) : Task.CompletedTask;

        public async ValueTask DisposeAsync()
        {
            if(IsOwner && tx is not null)
            {
                await tx.DisposeAsync();
            }
        }
    }
}
