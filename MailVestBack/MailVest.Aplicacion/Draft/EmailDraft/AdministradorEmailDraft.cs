using MailVest.Aplicacion.DirectorioAprobadores;
using MailVest.Aplicacion.Draft.EmailDraftAprobadores;
using MailVest.Aplicacion.Draft.IcsDraft;
using MailVest.Aplicacion.Plantillas;
using MailVest.Comun.Helpers.Config;
using MailVest.Datos.Contexto;
using MailVest.Datos.Repositorios.Draft.EmailDraft;
using MailVest.Datos.Repositorios.UnitOfWork;
using MailVest.Entidades.Dominio.EmailDraft;
using MailVest.Entidades.Dominio.EmailTemplates;
using MailVest.Entidades.Modelo;
using MailVest.RealTime.Hubs;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using static MailVest.Comun.Constantes.Permisos.Permisos.Correos;

namespace MailVest.Aplicacion.Draft.CorreosDraft
{
    public class AdministradorEmailDraft : IAdministradorEmailDraft
    {
        private readonly IRepositorioEmailDraft emailDraft;
        private readonly IRepositorioUnitOfWork saveAll;
        private readonly IAdministradorPlantillas planti;
        private readonly IAdministradorIcsDraft ics;
        private readonly IAdministradorDirectAprobadores aprobadores;
        private readonly IAdministradorEmailDraftAprobador draftAprobadores;
        private readonly IHubContext<AppHub> hub;

        public AdministradorEmailDraft(IRepositorioUnitOfWork _saveAll, IAdministradorPlantillas _planti, IAdministradorIcsDraft _ics, HelperConfig _config,
            IRepositorioEmailDraft _emailDraft, IAdministradorDirectAprobadores _aprobadores, IAdministradorEmailDraftAprobador _draftAprobadores, IHubContext<AppHub> _hub)
        {
            saveAll = _saveAll;
            planti = _planti;
            ics = _ics;
            emailDraft = _emailDraft;
            aprobadores = _aprobadores;
            draftAprobadores = _draftAprobadores;
            hub = _hub;
        }
        public async Task<int?> CrearDraftAsync(EmailDraftCreateDto newMail, string usuario, CancellationToken ct)
        {
            await using var uowTx = await saveAll.BeginOrUseTransactionAsync(ct);

            try
            {
                //Bloqueamos plantilla
                var bloqu = await planti.BloquearPlantillaAsync(newMail.TemplateId, usuario, ct);

                var templateNow = await planti.GetByIdAsync(newMail.TemplateId, ct);
                if (!bloqu)
                {
                    return null;
                }
                if (templateNow.Attachment.Count() > 0)
                {
                    var rutaPorArchivo = templateNow.Attachment
                        .GroupBy(x => x.FileName, StringComparer.OrdinalIgnoreCase)
                        .ToDictionary(
                        g => g.Key,
                        g => g.Last().RelativePath,
                        StringComparer.OrdinalIgnoreCase);

                    var attachments = rutaPorArchivo
                        .Select(x => new Attachment
                        {
                            FileName = x.Key,
                            RelativePath = x.Value
                        })
                        .ToList();

                    templateNow.Attachment = attachments;
                }
                //Se crea el draft del correo
                var email = await emailDraft.CreateDraftAsync(newMail, templateNow!, usuario, ct);

                if (email is null)
                {
                    return null;
                }

                await saveAll.SaveChangesAsync(ct);

                //-----------------------------------------------------------------------------------//
                if (newMail.Ics is null)
                {
                    return null;
                }

                //Creamos los ICS
                await ics.CrearEmailDraftICSAsync(email.Id, newMail.Ics, newMail.IcsStart.UtcDateTime, newMail.IcsEnd.UtcDateTime, usuario, email.ClickUrl);


                await saveAll.SaveChangesAsync(ct);
                //Buscamos los aprobadores para el Draft
                var aprob = new List<EmailDraftAprobador>();

                if (newMail.RequiredApprovers > 2)
                {
                    if (newMail.AdditionalApproverIds is null || newMail.AdditionalApproverIds.Count == 0)
                    {
                        return null;
                    }

                    var requeridoById = newMail.AdditionalApproverIds.GroupBy(x => x.Id)
                        .ToDictionary(g => g.Key, g => g.First().Requerido);

                    var extraIds = requeridoById.Keys.ToList();

                    var aprobInf = await aprobadores.GetManyAprobadoresAsync(extraIds);

                    var foundIds = aprobInf.Select(a => a.Id).ToHashSet();
                    var missing = extraIds.Where(id => !foundIds.Contains(id)).ToList();

                    if (missing.Count > 0)
                    {
                        return null;
                    }

                    var agregate = aprobInf.Select(aprob => new EmailDraftAprobador
                    {
                        DraftId = email.Id,
                        DirectorioId = aprob.Id,
                        Email = aprob.Email,
                        EmailNormalizado = aprob.EmailNormalizado,
                        Kind = 1,
                        EsRequerido = requeridoById.TryGetValue(aprob.Id, out var req) && req
                    }).ToList();

                    aprob.AddRange(agregate);
                }

                var defaults = await aprobadores.ObtenerAprobadoresDefault();

                if (defaults is null)
                {
                    return null;
                }
                var agregateDefault = defaults.Select(def => new EmailDraftAprobador
                {
                    DraftId = email.Id,
                    DirectorioId = def.Id,
                    Email = def.Email,
                    EmailNormalizado = def.EmailNormalizado,
                    Kind = 0,
                    EsRequerido = true
                }).ToList();

                aprob.AddRange(agregateDefault);

                //Insertamos en la tabla para aprobadores del draft
                await draftAprobadores.AgregarAprobadoresAsync(aprob, ct);
                await saveAll.SaveChangesAsync(ct);

                await uowTx.CommitAsync(ct);

                await hub.Clients.Group($"plantillas")
                    .SendAsync("plantillaBloqueadaCambio", new { templateNow.Id, templateNow.Bloqueado }, ct);

                await hub.Clients.Group($"plantilla-{templateNow.Id}")
                    .SendAsync("plantillaBloqueadaCambio", new { templateNow.Id, templateNow.Bloqueado }, ct);

                return email.Id;
            }
            catch
            {
                await uowTx.RollbackAsync(ct);
                throw;
            }
        }
        public async Task<bool> TemplateBloquedAsync(int id, CancellationToken ct)
        {
            return await planti.PlantillaIsBloquedAsync(id, ct);
        }

        public async Task<List<EmailDraftTableDto?>> ObtenerCorreosDraft(string usuario, CancellationToken ct)
        {
            return await emailDraft.ObtenerCorreosDraft(usuario, ct);
        }
        public async Task<EmailDraftDetailDto?> GetById(string usuario, int id, CancellationToken ct)
        {
            return await emailDraft.GetByIdAsync(id, usuario, ct);
        }
        public async Task<EmailDraftEditLockDto?> LockEditAsync(int id, string usuario, CancellationToken ct)
        {
            var draft = await emailDraft.LockEditAsync(id, usuario, ct);
            if (draft is null)
            {
                return null;
            }
            await saveAll.SaveChangesAsync(ct);

            await hub.Clients.Group("mailDraft")
                .SendAsync("mailDraftEdicionCambio", draft, ct);

            await hub.Clients.Group($"mailDraft-{draft.Id}")
                .SendAsync("mailDraftEdicionCambio", draft, ct);

            return draft;
        }
        public async Task<EmailDraftEditLockDto?> UnlockEditAsync(int id, string usuario, CancellationToken ct)
        {
            var draft = await emailDraft.UnlockEditAsync(id, usuario, ct);

            await saveAll.SaveChangesAsync(ct);

            await hub.Clients.Group("mailDraft")
                .SendAsync("mailDraftEdicionCambio", draft, ct);

            await hub.Clients.Group($"mailDraft-{draft.Id}")
                .SendAsync("mailDraftEdicionCambio", draft, ct);

            return draft;
        }
    }
}
