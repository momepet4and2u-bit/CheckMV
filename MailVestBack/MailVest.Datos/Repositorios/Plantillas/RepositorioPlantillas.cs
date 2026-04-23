using MailVest.Datos.Contexto;
using MailVest.Entidades.Dominio.EmailTemplates;
using MailVest.Entidades.Modelo;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Datos.Repositorios.Plantillas
{
    public class RepositorioPlantillas : IRepositorioPlantillas
    {
        private readonly MailVestDbContext context;

        public RepositorioPlantillas(MailVestDbContext _context)
        {
            context = _context;
        }

        public async Task<List<EmailTemplates>> ObtenerTodasPlantillas(CancellationToken ct)
        {
            return await context.Set<EmailTemplates>()
                .AsNoTracking()
                .Where(x => !x.EsBorrado)
                .OrderByDescending(x => x.Id)
                .ToListAsync(ct);
        }

        public async Task<EmailTemplates?> GetByIdAsync(int id, CancellationToken ct)
        {
            return await context.Set<EmailTemplates>()
                .FirstOrDefaultAsync(x => x.Id == id, ct);
        }

        public async Task<TemplateEditLockDto?> LockEditAsync(int id, string usuario, CancellationToken ct)
        {
            var tpl = await context.EmailTemplates.FirstOrDefaultAsync(x => x.Id == id, ct);

            if (tpl is null) return null;

            var now = DateTime.UtcNow;

            if (tpl.EditLocked && tpl.EditLockExpiresAt > now && tpl.EditLockedBy != usuario)
            {
                return new TemplateEditLockDto
                {
                    Id = tpl.Id,
                    EnEdicion = true,
                    EnEdicionPor = tpl.EditLockedBy,
                    IsOwner = false
                };
            }

            tpl.EditLocked = true;
            tpl.EditLockedBy = usuario;
            tpl.EditLockedAt = now;
            tpl.EditLockExpiresAt = now.AddMinutes(2);

            return new TemplateEditLockDto
            {
                Id = tpl.Id,
                EnEdicion = true,
                EnEdicionPor = usuario,
                IsOwner = true
            };
        }

        public async Task<TemplateEditLockDto?> UnlockEditAsync(int id, string usuario, CancellationToken ct)
        {
            var tpl = await context.EmailTemplates.FirstOrDefaultAsync(x => x.Id == id, ct);

            if (tpl is null) return null;

            if (tpl.EditLockedBy == usuario)
            {
                tpl.EditLocked = false;
                tpl.EditLockedBy = null;
                tpl.EditLockedAt = null;
                tpl.EditLockExpiresAt = null;
            }
            return new TemplateEditLockDto
            {
                Id = tpl.Id,
                EnEdicion = tpl.EditLocked,
                EnEdicionPor = tpl.EditLockedBy,
                EdicionExpira = tpl.EditLockExpiresAt
            };

        }
        public async Task<EmailTemplates> AddAsync(EmailTemplates plantilla, CancellationToken ct)
        {
            await context.EmailTemplates.AddAsync(plantilla);
            return plantilla;
        }

        public async Task SoftDeleteAsync(int id, string user, CancellationToken ct)
        {
            var entida = await context.EmailTemplates.FirstOrDefaultAsync(x => x.Id == id, ct);
            if (entida is null)
            {
                return;
            }

            entida.EsBorrado = true;
            entida.Actualizado = DateTime.Now;
            entida.UsuarioModifico = user;
        }
        public async Task<bool> PlantillaIsBloquedAsync (int id, CancellationToken ct)
        {
            return await context.EmailTemplates.AnyAsync(x => x.Id == id && x.Bloqueado == true);
        }

        public async Task<bool> BloquearPlantillaAsync(int id, string user, CancellationToken ct)
        {
            var now = DateTime.UtcNow;
            var entidad = await context.EmailTemplates.FirstOrDefaultAsync(x => x.Id == id, ct);

            if (entidad is null)
            {
                return false;
            }

            entidad.Bloqueado = true;
            entidad.BloqueadoPor = user;
            entidad.BloqueadoAt = now;
            entidad.Actualizado = DateTime.Now;
            entidad.UsuarioModifico = user;
            return true;
        }
    }
}
