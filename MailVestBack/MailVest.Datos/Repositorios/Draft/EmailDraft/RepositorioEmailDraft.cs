using MailVest.Datos.Contexto;
using MailVest.Entidades.Dominio.EmailDraft;
using MailVest.Entidades.Dominio.EmailTemplates;
using MailVest.Entidades.Entidades;
using MailVest.Entidades.Modelo;
using Microsoft.EntityFrameworkCore;

namespace MailVest.Datos.Repositorios.Draft.EmailDraft
{
    public class RepositorioEmailDraft : IRepositorioEmailDraft
    {
        private readonly MailVestDbContext db;

        public RepositorioEmailDraft(MailVestDbContext _db)
        {
            db = _db;
        }

        public async Task<EmailDrafts?> CreateDraftAsync(EmailDraftCreateDto newMail, EmailTemplatesDto template, string usuario, CancellationToken ct)
        {
            var entity = new EmailDrafts
            {
                TemplateId = newMail.TemplateId,
                ClickUrl = template.ClickUrl,
                ArchivoAd = string.Join(",", template.Attachment.Select(r => r.RelativePath).Where(r => !string.IsNullOrEmpty(r))),
                IcsStartUtc = newMail.IcsStart.UtcDateTime,
                IcsEndUtc = newMail.IcsEnd.UtcDateTime,
                Estatus = 0,
                Revision = 0,
                CreadoPor = usuario,
                Fecha_Creacion = DateTime.Now,
                Actualizado = DateTime.Now,
                EsBorrado = false,
            };
            await db.EmailDraft.AddAsync(entity);
            return entity;
        }

        public async Task<List<EmailDraftTableDto?>> ObtenerCorreosDraft(string usuario, CancellationToken ct)
        {
            var userEmailNorm = await db.Set<CatUsuarios>()
                .AsNoTracking()
                .Where(u => u.Usuario == usuario)
                .Select(u => u.Email)
                .FirstOrDefaultAsync(ct);

            userEmailNorm = userEmailNorm is null ? "_NO_CORREO" : userEmailNorm.Normalize().Trim();

            var query =(
                from d in db.Set<EmailDrafts>().AsNoTracking()
                join t in db.Set<EmailTemplates>().AsNoTracking()
                on d.TemplateId equals t.Id

                //aprovadores requeridos (conteos)
                join aReq in db.Set<EmailDraftAprobador>().AsNoTracking().Where(x => x.EsRequerido)
                on d.Id equals aReq.DraftId into reqJoin
                from req in reqJoin.DefaultIfEmpty()

                //aprovadores no requeridos(conteo)
                join aNReq in db.Set<EmailDraftAprobador>().AsNoTracking()
                on d.Id equals aNReq.DraftId into nReqJoin
                from nReq in nReqJoin.DefaultIfEmpty()

                    //aprovaciones matching aprovadores requeridos
                join ap in db.Set<EmailDraftAprobaciones>().AsNoTracking()
                on new { DraftId = d.Id, Rev = d.Revision, Email = req.EmailNormalizado }
                equals new { DraftId = ap.DraftId, Rev = ap.Revision, Email = ap.EmailNormalizado }
                into apJoin
                from ap in apJoin.DefaultIfEmpty()

                //unirse a filas que hagan match con el usuario actual como aprobador
                join me in db.Set<EmailDraftAprobador>().AsNoTracking()
                .Where(x => x.EmailNormalizado == userEmailNorm)
                on d.Id equals me.DraftId into meJoin
                from me in meJoin.DefaultIfEmpty()

                where d.EsBorrado == false

                group new { d, t, req, ap, me } by new
                {
                    d.Id,
                    d.TemplateId,
                    PlantillaNombre = t.Name,
                    d.Estatus,
                    d.Revision,
                    d.CreadoPor,
                    d.Fecha_Creacion,
                    d.Actualizado,
                    d.EditLocked,
                    d.EditLockedBy,
                    d.EditLockedAt,
                    d.EditLockExpiresAt,
                }
                into g
                select new EmailDraftTableDto
                {
                    Id = g.Key.Id,
                    TemplateId = g.Key.TemplateId,
                    PlantillaNombre = g.Key.PlantillaNombre,
                    Estatus = g.Key.Estatus,
                    Revision = g.Key.Revision,
                    CreadoPor = g.Key.CreadoPor,
                    Creacion = g.Key.Fecha_Creacion,
                    Actualizado = g.Key.Actualizado,

                    IsApprover = g.Any(x => x.me != null),

                    RequiredApprovers = g.Count(x => x.req != null),
                    RequiredApprovalsDone = g.Count(x => x.ap != null && x.ap.Estatus == 1),
                    HasRequiredRejection = g.Any(x => x.ap != null && x.ap.Estatus == 2),

                    ReadyToSend = false,
                    EnEdicion = g.Key.EditLocked,
                    EnEdicionPor = g.Key.EditLockedBy,
                    EnEdicionDesde = g.Key.EditLockedAt,
                    EdicionExpiro = g.Key.EditLockExpiresAt
                }
            ).ToListAsync(ct);

            var rows = await query;

            foreach (var r in rows)
            {
                r.ReadyToSend = 
                    r.RequiredApprovers > 0 &&
                    r.RequiredApprovalsDone >= r.RequiredApprovers &&
                    !r.HasRequiredRejection &&
                    r.Estatus == 1;
            }
            return rows;
        }
        public async Task<EmailDraftDetailDto?> GetByIdAsync(int id, string usuario, CancellationToken ct)
        {
            var now = DateTime.Now;

            var userEmailNorm = await db.Set<CatUsuarios>()
                .AsNoTracking()
                .Where(u => u.Usuario == usuario)
                .Select(u => u.Email)
                .FirstOrDefaultAsync(ct);

            userEmailNorm = userEmailNorm is null ? "_NO_CORREO" : userEmailNorm.Normalize().Trim();

            var draft = 
                from d in db.Set<EmailDrafts>().AsNoTracking()
                join t in db.Set<EmailTemplates>().AsNoTracking()
                on d.TemplateId equals t.Id
                where d.Id == id
                select new
                {
                    Draft = d,
                    Template = t
                };

            var icsQuery =
                from ics in db.EmailDraftICs.AsNoTracking()
                where ics.DraftId == id
                select new
                {
                    ics.Lenguaje,
                    ics.IcsDescripcion,
                    ics.IcsAsunto,
                    ics.IcsEmpiezaUTC,
                    ics.IcsTerminaUTC,
                    ics.PathRelativo
                };

            var approvers =
                from a in db.EmailDraftAprobador.AsNoTracking()
                where a.DraftId == id
                select a;

            var approvals =
                from ap in db.EmailDraftAprobaciones.AsNoTracking()
                where ap.DraftId == id
                select ap;

            var direcApp =
                from a in approvers
                join dA in db.DirectorioAprobacion.AsNoTracking()
                on a.DirectorioId equals dA.Id
                join userApp in db.CatUsuarios.AsNoTracking()
                on dA.Usuario equals userApp.Usuario
                select new
                {
                    DirectorioId = a.DirectorioId,
                    Usuario = dA.Usuario,
                    Nombre = userApp.Nombre,
                };

            var result =
                await (
                from baseDraft in draft

                let approver = approvers.ToList()

                let approval = approvals.Where(x => x.Revision == baseDraft.Draft.Revision)
                .ToList()

                let requiredApprovers =
                approver.Where(x => x.EsRequerido).ToList()

                let approverNames = direcApp.ToList()

                let requiredApprovalsDone = approval
                .Where(x => requiredApprovers.Any(r => r.EmailNormalizado == x.EmailNormalizado) && x.Estatus == 1)
                .Count()

                let hasRequiredRejection =
                approval.Any(x => requiredApprovers.Any(r => r.EmailNormalizado == x.EmailNormalizado) && x.Estatus == 2)

                let currentUserApproval =
                approval.FirstOrDefault(x => x.EmailNormalizado == userEmailNorm)

                select new EmailDraftDetailDto
                {
                    Id = baseDraft.Draft.Id,
                    TemplateId = baseDraft.Draft.TemplateId,
                    PlantillaNombre = baseDraft.Template.Name,

                    Estatus = baseDraft.Draft.Estatus,
                    Revision = baseDraft.Draft.Revision,

                    Creacion = baseDraft.Draft.Fecha_Creacion,
                    Actualizado = baseDraft.Draft.Actualizado,
                    CreadoPor = baseDraft.Draft.CreadoPor,

                    IcsStart = icsQuery.Select(x => x.IcsEmpiezaUTC).FirstOrDefault(),
                    IcsEnd = icsQuery.Select(x => x.IcsTerminaUTC).FirstOrDefault(),

                    Ics = new EmailDraftLangViewDto
                    {
                        ES = icsQuery
                        .Where(x => x.Lenguaje == "ES")
                        .Select(x => new EmailDraftIcsViewDto
                        {
                            Body = x.IcsDescripcion,
                            FileName = x.IcsAsunto,
                            PathRelativo = x.PathRelativo,
                        }).FirstOrDefault(),
                        EN = icsQuery
                        .Where(x => x.Lenguaje == "EN")
                        .Select(x => new EmailDraftIcsViewDto
                        {
                            Body = x.IcsDescripcion,
                            FileName = x.IcsAsunto,
                            PathRelativo = x.PathRelativo,
                        }).FirstOrDefault()
                    },
                    Approvers = approver
                    .Select(a => new EmailDraftApproverViewDto
                    {
                        Id = a.DirectorioId,
                        Usuario = approverNames.Where(predicate: x => x.DirectorioId == a.DirectorioId).Select(x => x.Usuario).FirstOrDefault(),
                        Nombre = approverNames.Where(predicate: x => x.DirectorioId == a.DirectorioId).Select(x => x.Nombre).FirstOrDefault(),
                        Email = a.Email,
                        Requerido = a.EsRequerido,
                        Adicional = a.Kind != 0 ? true : false,

                        Estatus = approval
                        .Where(ap => ap.EmailNormalizado == a.EmailNormalizado &&
                        ap.Revision == baseDraft.Draft.Revision)
                        .Select(ap => (int?)ap.Estatus)
                        .FirstOrDefault(),

                        Comentario = approval
                        .Where(ap =>
                        ap.EmailNormalizado == a.EmailNormalizado && ap.Revision == baseDraft.Draft.Revision)
                        .Select(ap => ap.Comentario)
                        .FirstOrDefault(),

                        IsCurrentUser = a.EmailNormalizado == userEmailNorm
                    }).ToList(),

                    IsApprover = approver.Any(x => x.EmailNormalizado == userEmailNorm),
                    HasApproved = currentUserApproval.Estatus == 1,
                    HasRejected = currentUserApproval.Estatus == 2,

                    RequiredApprovers = requiredApprovers.Count,
                    RequiredApprovalsDone = requiredApprovalsDone,
                    HasRequiredRejection = hasRequiredRejection,

                    ReadyToSend = requiredApprovalsDone == requiredApprovers.Count &&
                    !hasRequiredRejection
                }
                ).FirstOrDefaultAsync(ct);

            return result;
        }
        public async Task<EmailDraftEditLockDto?> LockEditAsync(int id, string usuario, CancellationToken ct)
        {
            var tpl = await db.EmailDraft.FirstOrDefaultAsync(x => x.Id == id, ct);

            if (tpl is null) return null;

            var now = DateTime.UtcNow;

            if (tpl.EditLocked && tpl.EditLockExpiresAt > now && tpl.EditLockedBy != usuario)
            {
                return new EmailDraftEditLockDto
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

            return new EmailDraftEditLockDto
            {
                Id = tpl.Id,
                EnEdicion = true,
                EnEdicionPor = usuario,
                IsOwner = true
            };
        }
        public async Task<EmailDraftEditLockDto?> UnlockEditAsync(int id, string usuario, CancellationToken ct)
        {
            var tpl = await db.EmailDraft.FirstOrDefaultAsync(x => x.Id == id, ct);

            if (tpl is null) return null;

            if (tpl.EditLockedBy == usuario)
            {
                tpl.EditLocked = false;
                tpl.EditLockedBy = null;
                tpl.EditLockedAt = null;
                tpl.EditLockExpiresAt = null;
            }
            return new EmailDraftEditLockDto
            {
                Id = tpl.Id,
                EnEdicion = tpl.EditLocked,
                EnEdicionPor = tpl.EditLockedBy,
                EdicionExpira = tpl.EditLockExpiresAt
            };

        }
    }
}
