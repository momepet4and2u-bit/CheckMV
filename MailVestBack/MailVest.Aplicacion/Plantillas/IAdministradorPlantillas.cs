using MailVest.Entidades.Dominio.EmailTemplates;
using MailVest.Entidades.Modelo;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Aplicacion.Plantillas
{
    public interface IAdministradorPlantillas
    {
        Task<List<EmailTemplatesDto>> ObtenerPlantillasAsync(CancellationToken ct);
        Task<EmailTemplatesDto?> GetByIdAsync(int id, CancellationToken ct);
        Task<EmailTemplatesDto?> CrearAsync(EmailTemplatesUpsertDto req, string user, CancellationToken ct);
        Task<EmailTemplatesDto?> UpdateAsync(int id, EmailTemplatesUpsertDto req, string user, CancellationToken ct);
        Task<bool> DeleteAsync(int id, string user, CancellationToken ct);
        Task<string> crearImagenesAsync(string nombre, IFormFile imagen);
        Task<string> crearArchivosAsync(IFormFile archivo);
        Task<bool> PlantillaIsBloquedAsync(int id, CancellationToken ct);
        Task<bool> BloquearPlantillaAsync(int id, string usuario, CancellationToken ct);
        Task<TemplateEditLockDto?> LockEditAsync(int id, string usuario, CancellationToken ct);
        Task<TemplateEditLockDto?> UnlockEditAsync(int id, string usuario, CancellationToken ct);
        Task<string> GetPreviewShellAsync(CancellationToken ct);
        Task<string> RenderPreviewAsync(TemplatePreviewRequestDto req, CancellationToken ct);
        Task<string?> RenderPreviewFromTemplateIdAsync(int id, string lang, CancellationToken ct);
    }
}
