using MailVest.Entidades.Modelo;
using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Datos.Repositorios.Draft.EmailDraftAprobadores
{
    public interface IRepositorioEmailDraftAprobadores
    {
        Task<IEnumerable<EmailDraftAprobador>?> CreateDraftAsync(IEnumerable<EmailDraftAprobador> newAprobores, CancellationToken ct);
    }
}
