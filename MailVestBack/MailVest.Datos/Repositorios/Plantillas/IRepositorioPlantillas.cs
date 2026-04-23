using MailVest.Entidades.Dominio.EmailTemplates;
using MailVest.Entidades.Modelo;
using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Datos.Repositorios.Plantillas
{
    public interface IRepositorioPlantillas
    {

        Task<List<EmailTemplates>> ObtenerTodasPlantillas(CancellationToken ct);
        Task<EmailTemplates?> GetByIdAsync(int id, CancellationToken ct);
        Task<EmailTemplates> AddAsync(EmailTemplates plantilla, CancellationToken ct);
        Task SoftDeleteAsync(int id, string user, CancellationToken ct);
        Task<bool> PlantillaIsBloquedAsync(int id, CancellationToken ct);
        Task<bool> BloquearPlantillaAsync(int id, string user, CancellationToken ct);
        Task<TemplateEditLockDto?> LockEditAsync(int id, string usuario, CancellationToken ct);
        Task<TemplateEditLockDto?> UnlockEditAsync(int id, string usuario, CancellationToken ct);
    }
}
