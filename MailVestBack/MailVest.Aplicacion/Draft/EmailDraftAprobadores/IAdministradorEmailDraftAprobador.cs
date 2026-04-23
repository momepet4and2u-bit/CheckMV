using MailVest.Entidades.Modelo;
using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Aplicacion.Draft.EmailDraftAprobadores
{
    public interface IAdministradorEmailDraftAprobador
    {
        Task<IEnumerable<EmailDraftAprobador>?> AgregarAprobadoresAsync(IEnumerable<EmailDraftAprobador> newAprobadores, CancellationToken ct);
    }
}
