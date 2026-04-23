using MailVest.Entidades.Dominio.EmailDraft;
using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Aplicacion.Draft.CorreosDraft
{
    public interface IAdministradorEmailDraft
    {
        Task<int?> CrearDraftAsync(EmailDraftCreateDto newMail, string usuario, CancellationToken ct);
        Task<bool> TemplateBloquedAsync(int id, CancellationToken ct);
        Task<List<EmailDraftTableDto?>> ObtenerCorreosDraft(string usuario, CancellationToken ct);
        Task<EmailDraftDetailDto?> GetById(string usuario, int id, CancellationToken ct);
        Task<EmailDraftEditLockDto?> LockEditAsync(int id, string usuario, CancellationToken ct);
        Task<EmailDraftEditLockDto?> UnlockEditAsync(int id, string usuario, CancellationToken ct);
    }
}
