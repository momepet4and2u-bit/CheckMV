using MailVest.Entidades.Dominio.EmailDraft;
using MailVest.Entidades.Dominio.EmailTemplates;
using MailVest.Entidades.Modelo;

namespace MailVest.Datos.Repositorios.Draft.EmailDraft
{
    public interface IRepositorioEmailDraft
    {
        Task<EmailDrafts?> CreateDraftAsync(EmailDraftCreateDto newMail, EmailTemplatesDto template, string usuario, CancellationToken ct);
        Task<List<EmailDraftTableDto?>> ObtenerCorreosDraft(string usuaario, CancellationToken ct);
        Task<EmailDraftDetailDto?> GetByIdAsync(int id, string usuario, CancellationToken ct);
        Task<EmailDraftEditLockDto?> LockEditAsync(int id, string usuario, CancellationToken ct);
        Task<EmailDraftEditLockDto?> UnlockEditAsync(int id, string usuario, CancellationToken ct);
    }
}
