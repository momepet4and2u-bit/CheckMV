using MailVest.Comun.Helpers;
using MailVest.Comun.Helpers.Config;
using MailVest.Comun.Logger;
using MailVest.Datos.Repositorios.Plantillas;
using MailVest.Datos.Repositorios.UnitOfWork;
using MailVest.Entidades.Dominio.EmailTemplates;
using MailVest.Entidades.Modelo;
using MailVest.RealTime.Hubs;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Net;
using System.Text;
using static System.Net.Mime.MediaTypeNames;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace MailVest.Aplicacion.Plantillas
{
    public class AdministradorPlantillas : IAdministradorPlantillas
    {
        private readonly IRepositorioPlantillas plantillas;
        private readonly IRepositorioUnitOfWork allRep;
        private readonly ILogs logs;
        private static HelperConfig config;
        private readonly IHubContext<AppHub> hub;

        private readonly IWebHostEnvironment env;
        private static string? cachedShell;
        private static readonly object shellLock = new();

        public AdministradorPlantillas(IRepositorioPlantillas _plantillas, IRepositorioUnitOfWork _allRep, ILogs _logs, HelperConfig _config,
            IHubContext<AppHub> _hub,IWebHostEnvironment _env)
        {
            plantillas = _plantillas;
            allRep = _allRep;
            logs = _logs;
            config = _config;
            hub = _hub;
            env = _env;
        }

        public async Task<List<EmailTemplatesDto>> ObtenerPlantillasAsync(CancellationToken ct)
        {
            var rows = await plantillas.ObtenerTodasPlantillas(ct);
            return rows.Select(ToDto).ToList();
        }

        public async Task<EmailTemplatesDto?> GetByIdAsync(int id, CancellationToken ct)
        {
            var row = await plantillas.GetByIdAsync(id, ct);
            return row is null ? null : ToDto(row);
        }

        public async Task<TemplateEditLockDto?> LockEditAsync(int id, string usuario, CancellationToken ct)
        {
            var dto = await plantillas.LockEditAsync(id, usuario, ct);
            if (dto is null)
            {
                return null;
            }

            await allRep.SaveChangesAsync(ct);

            await hub.Clients.Group("plantillas")
                .SendAsync("plantillaEdicionCambio", dto, ct);

            await hub.Clients.Group($"plantilla-{dto.Id}")
                .SendAsync("plantillaEdicionCambio", dto, ct);

            return dto;
        }

        public async Task<TemplateEditLockDto?> UnlockEditAsync(int id, string usuario, CancellationToken ct)
        {
            var dto = await plantillas.UnlockEditAsync(id, usuario, ct);

            await allRep.SaveChangesAsync(ct);

            await hub.Clients.Group("plantillas")
                .SendAsync("plantillaEdicionCambio", dto, ct);

            await hub.Clients.Group($"plantilla-{id}")
                .SendAsync("plantillaEdicionCambio", dto, ct);
            return dto;
        }

        public async Task<EmailTemplatesDto?> CrearAsync(EmailTemplatesUpsertDto req, string user, CancellationToken ct)
        {

            var imageURLES = await crearImagenesAsync(req.ES.Subject, req.imagenES!);
            var imageURLEN = await crearImagenesAsync(req.EN.Subject, req.imagenEN!);

            var rutasAdj = Array.Empty<string>();

            if (req.ArchivoAd != null && req.ArchivoAd.Any())
            {
                rutasAdj = await Task.WhenAll(req.ArchivoAd.Select(a => crearArchivosAsync(a)));
            }

            var archivosURL = string.Join(",", rutasAdj.Where(r => !string.IsNullOrEmpty(r)));

            var entity = new EmailTemplates
            {
                Name = (req.Name ?? "").Trim(),
                ClickUrl = (req.ClickUrl ?? "").Trim(),
                AdjuntoURL = archivosURL,
                ValidoDesde = DateOnly.ParseExact(req.ValidoDesde, "yyyy-MM-dd", CultureInfo.InvariantCulture),
                ValidoHasta = DateOnly.ParseExact(req.ValidoHasta, "yyyy-MM-dd", CultureInfo.InvariantCulture),
                Creado = DateTime.Now,
                UsuarioModifico = user
            };

            var saved = await plantillas.AddAsync(entity, ct);
            await allRep.SaveChangesAsync(ct);
            return ToDto(saved);
        }

        public async Task<EmailTemplatesDto?> UpdateAsync(int id, EmailTemplatesUpsertDto req, string user, CancellationToken ct)
        {

            var entidad = await plantillas.GetByIdAsync(id, ct);
            if (entidad is null)
            {
                return null;
            }

            var imageURLES = await crearImagenesAsync(req.ES.Subject, req.imagenES);
            var imageURLEN = await crearImagenesAsync(req.EN.Subject, req.imagenEN);

            var rutasAdj = Array.Empty<string>();

            if (req.ArchivoAd != null && req.ArchivoAd.Any())
            {
                rutasAdj = await Task.WhenAll(req.ArchivoAd.Select(a => crearArchivosAsync(a)));
            }
            var archivosURL = string.Join(",", rutasAdj.Where(r => !string.IsNullOrEmpty(r)));

            entidad.Name = (req.Name ?? "").Trim();
            entidad.ClickUrl = (req.ClickUrl ?? "").Trim();
            entidad.AdjuntoURL = (archivosURL == "" ? entidad.AdjuntoURL : archivosURL);
            entidad.ValidoDesde = DateOnly.ParseExact(req.ValidoDesde, "yyyy-MM-dd", CultureInfo.InvariantCulture);
            entidad.ValidoHasta = DateOnly.ParseExact(req.ValidoHasta, "yyyy-MM-dd", CultureInfo.InvariantCulture);
            entidad.Actualizado = DateTime.Now;
            entidad.UsuarioModifico = user;

            await allRep.SaveChangesAsync(ct);

            await hub.Clients.Group($"plantillas")
                .SendAsync("plantillaBloqueadaCambio", new { entidad.Id, Bloqueado = true }, ct);

            await hub.Clients.Group($"plantilla-{entidad.Id}")
                .SendAsync("plantillaBloqueadaCambio", new { entidad.Id, Bloqueado = true }, ct);

            return ToDto(entidad);
        }

        public async Task<bool> DeleteAsync(int id, string user, CancellationToken ct)
        {
            var existe = await plantillas.GetByIdAsync(id, ct);
            if (existe is null)
            {
                return false;
            }

            await plantillas.SoftDeleteAsync(id, user, ct);
            await allRep.SaveChangesAsync(ct);
            await hub.Clients.Group($"plantilla-{existe.Id}")
                .SendAsync("plantillaBloqueadaCambio", new { existe.Id, existe.Bloqueado }, ct);
            return true;
        }
        public async Task<bool> PlantillaIsBloquedAsync(int id, CancellationToken ct)
        {
            return await plantillas.PlantillaIsBloquedAsync(id, ct);
        }

        public async Task<string> crearImagenesAsync(string nombre, IFormFile imagen)
        {
            try
            {
                if (imagen != null)
                {
                    var rutaBase = config.ObtenerParametroConfig("UrlFiles");

                    var año = DateTime.Now.Year.ToString();
                    var mes = DateTime.Now.Month.ToString().PadLeft(2, '0');
                    var dia = DateTime.Now.Day.ToString().PadLeft(2, '0');
                    var rutaFecha = Path.Combine(año, mes, dia);

                    var ruta = Path.Combine(config.ObtenerParametroConfig("FolderImagenes"), rutaFecha);

                    var rutaFinal = Path.Combine(rutaBase, ruta);
                    if (!Directory.Exists(Path.Combine(rutaFinal)))
                    {
                        Directory.CreateDirectory(Path.Combine(rutaFinal));
                    }

                    var ext = Path.GetExtension(imagen.FileName);
                    if (string.IsNullOrEmpty(ext))
                    {
                        ext = ".jpg";
                    }
                    nombre = nombre.Replace(" ", "").Trim();
                    var imagenName = Path.Combine(rutaFinal, nombre + ext);
                    var rutaRel = Path.Combine(rutaFecha, nombre + ext);

                    if (Path.IsPathRooted(imagenName))
                    {
                        if (File.Exists(imagenName))
                        {
                            File.Delete(imagenName);
                        }

                        using (var stream = File.Create(imagenName))
                        {
                            await imagen.CopyToAsync(stream);
                        }
                        return rutaRel;
                    }
                    else
                    {
                        return "";
                    }

                }
                else
                {
                    return null;
                }
            }
            catch (IOException ex)
            {
                await logs.LogErrorEncrypt(ex, origen: "Crear imagen", mensajeOverride: "Error al crear la imagen " + ex.Message);
                return "";
            }
        }

        public async Task<string> crearArchivosAsync(IFormFile archivo)
        {
            try
            {
                if (archivo != null)
                {
                    var rutaBase = config.ObtenerParametroConfig("UrlFiles");

                    var año = DateTime.Now.Year.ToString();
                    var mes = DateTime.Now.Month.ToString().PadLeft(2, '0');
                    var dia = DateTime.Now.Day.ToString().PadLeft(2, '0');
                    var rutaFecha = Path.Combine(año, mes, dia);

                    var ruta = Path.Combine(config.ObtenerParametroConfig("FolderImagenes"), rutaFecha);

                    var rutaFinal = Path.Combine(rutaBase, ruta);
                    if (!Directory.Exists(Path.Combine(rutaFinal)))
                    {
                        Directory.CreateDirectory(Path.Combine(rutaFinal));
                    }

                    var ext = Path.GetExtension(archivo.FileName);
                    if (string.IsNullOrEmpty(ext))
                    {
                        ext = ".pdf";
                    }
                    var archivoName = Path.Combine(rutaFinal, archivo.FileName);
                    var rutaRel = Path.Combine(rutaFecha, archivo.FileName);

                    if (Path.IsPathRooted(archivoName))
                    {
                        if (File.Exists(archivoName))
                        {
                            File.Delete(archivoName);
                        }

                        using (var stream = File.Create(archivoName))
                        {
                            await archivo.CopyToAsync(stream);
                        }
                        return rutaRel;
                    }
                    else
                    {
                        return "";
                    }

                }
                else
                {
                    return null;
                }
            }
            catch (IOException ex)
            {
                await logs.LogErrorEncrypt(ex, origen: "Crear archivo", mensajeOverride: "Error al crear el archivo " + ex.Message);
                return "";
            }
        }

        public async Task<bool> BloquearPlantillaAsync(int id, string user, CancellationToken ct)
        {
            return await plantillas.BloquearPlantillaAsync(id, user, ct);
        }

        public Task<string> GetPreviewShellAsync(CancellationToken ct)
        {
            if (cachedShell != null)
            {
                return Task.FromResult(cachedShell);
            }
            lock (shellLock)
            {
                if(cachedShell != null) return Task.FromResult(cachedShell);

                var path = Path.Combine(env.ContentRootPath, "Templates", "EmailShell.html");
                cachedShell = File.ReadAllText(path, Encoding.UTF8);
                return Task.FromResult(cachedShell);
            }
        }

        public async Task<string> RenderPreviewAsync(TemplatePreviewRequestDto req, CancellationToken ct)
        {
            var shell = await GetPreviewShellAsync(ct);

            var title = WebUtility.HtmlEncode(req.Title ?? "");
            var raw = req.HtmlRaw ?? "";

            var imageSection = "";

            if (!string.IsNullOrWhiteSpace(req.ImageURL))
            {
                var safeUrl = WebUtility.HtmlEncode(req.ImageURL);
                imageSection =
                    $@"<div style=""margin:0 0 12px 0"">
                            <img src=""{safeUrl}"" alt=""""
                            style=""max-width:100%;height:auto;display:block;border:0;border-radius:10px;   ;object-fit:contain;"" />
                    </div>";
            }

            return shell
                .Replace("{{TITLE}}", title)
                .Replace("{{IMAGE_SECTION}}", imageSection)
                .Replace("{{CONTENT}}", raw);
        }

        public async Task<string?> RenderPreviewFromTemplateIdAsync(int id, string lang, CancellationToken ct)
        {
            var tpl = await GetByIdAsync(id, ct);
            if (tpl is null) return null;

            var isEs = string.Equals(lang, "ES", StringComparison.OrdinalIgnoreCase);
            var title = "";
            if (tpl.ImageUrlEN is null && tpl.ImageUrlES is null)
            {
              title = isEs ? "Estimado {0}" : "Dear {0}";
            } else
            {
                title = "";
            }
            var raw = isEs ? (tpl.ES?.Html ?? "") : (tpl.EN?.Html ?? "");
            var img = isEs ? tpl.ImageUrlES : tpl.ImageUrlEN;

            return await RenderPreviewAsync(new TemplatePreviewRequestDto
            {
                Lang = isEs ? "ES" : "EN",
                Title = title,
                HtmlRaw = raw,
                ImageURL = img
            }, ct);
        }

        #region HelperPrivado
        private static EmailTemplatesDto ToDto(EmailTemplates x)
        {

            var path = x.AdjuntoURL?.ToString();

            var normalized = (path ?? string.Empty)
                .Replace('/', '\\')
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .Where(s => !string.IsNullOrWhiteSpace(s))
                .Select(ruta => new
                {
                    RelativePath = ruta,
                    FileName = ruta.Split('\\', StringSplitOptions.RemoveEmptyEntries).LastOrDefault()
                })
                .Where(x => !string.IsNullOrWhiteSpace(x.FileName))
                .ToList();

            // Diccionario: FileName -> RelativePath
            // Si hay duplicados por FileName, ToDictionary fallará.
            // Para mantener el ÚLTIMO por clave, usamos GroupBy/Last:
            var rutaPorArchivo = normalized
                .GroupBy(x => x.FileName, StringComparer.OrdinalIgnoreCase)
                .ToDictionary(
                    g => g.Key,
                    g => g.Last().RelativePath,
                    StringComparer.OrdinalIgnoreCase);

            // Lista de Attachment
            var attachments = normalized
                .Select(x => new Attachment
                {
                    FileName = x.FileName,
                    RelativePath = x.RelativePath
                })
                .ToList();


            return new EmailTemplatesDto
            {
                Id = x.Id,
                Name = x.Name,
                ClickUrl = x.ClickUrl,
                Attachment = attachments,
                ValidoDesde = x.ValidoDesde.ToString("yyyy-MM-dd"),
                ValidoHasta = x.ValidoHasta.ToString("yyyy-MM-dd"),
                Creado = x.Creado,
                Bloqueado = x.Bloqueado,
                EnEdicion = x.EditLocked,
                EnEdicionPor = x.EditLockedBy,
                EnEdicionDesde = x.EditLockedAt.GetValueOrDefault(),
                EdicionExpiro = x.EditLockExpiresAt.GetValueOrDefault(),
            };
        }
        #endregion
    }
}
