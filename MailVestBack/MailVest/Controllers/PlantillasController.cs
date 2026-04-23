using MailVest.Aplicacion.Autenticacion;
using MailVest.Aplicacion.Plantillas;
using MailVest.Comun.Constantes.Permisos;
using MailVest.Comun.MiddleWare;
using MailVest.Entidades.Dominio.EmailTemplates;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;

namespace MailVest.Back.Controllers
{
    [ApiController]
    [Route("plantillas")]
    public class PlantillasController : Controller
    {
        #region Constructor

        private readonly IAdministradorPlantillas plantillas;
        private readonly IOutputCacheStore cache;
        private const string plantillasCache = "plantillasAll";
        private const string plantilla = "plantilla";
        private readonly IUsuarioAuthCacheService authCache;
        #endregion

        public PlantillasController(IOutputCacheStore _cache, IAdministradorPlantillas _plantillas, IUsuarioAuthCacheService _autCache)
        {
            cache = _cache;
            plantillas = _plantillas;
            authCache = _autCache;
        }

        [HttpGet("all")]
        [OutputCache(Tags = [plantillasCache])]
        public async Task<ActionResult<List<EmailTemplatesDto>>> GetAll(CancellationToken ct)
        {
            var rows = await plantillas.ObtenerPlantillasAsync(ct);
            if (rows == null)
            {
                return Problem("No se pudieron recuperar las plantillas");
            }
            return Ok(rows);
        }
        [HttpGet("{id:int}")]
        [Authorize(Policy = Permisos.Correos.Plantillas.Cambio)]
        [OutputCache(Tags = [plantilla])]
        public async Task<IActionResult> GetById(int id, CancellationToken ct)
        {
            var row = await plantillas.GetByIdAsync(id, ct);
            return row is null ? NotFound("Plantilla no encontrada") : Ok(row);
        }
        [HttpPost("{id:int}/lockEdit")]
        public async Task<IActionResult> LockEditAsync(int id, CancellationToken ct)
        {
            var usuario = User?.Identity?.Name;
            var locked = await plantillas.LockEditAsync(id, usuario, ct);
            return locked is null ? Problem("No se pudo bloquear la edicion de la plantilla") :
                Ok(locked);
        }
        [HttpPost("{id:int}/unlockEdit")]
        public async Task<IActionResult> UnlockEdit(int id, CancellationToken ct)
        {
            var user = User?.Identity?.Name;
            await plantillas.UnlockEditAsync(id, user, ct);
            return Ok();
        }
        [HttpPost("createPlantilla")]
        [Authorize(Policy = Permisos.Correos.Plantillas.Alta)]
        [ErrorMessage("Ocurrio un error al guardar la plantilla. Contactar al administrador.", errorCode: "02")]
        public async Task<IActionResult> CrearPlantillaAsync([FromForm] EmailTemplatesUpsertDto req, CancellationToken ct)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var user = User?.Identity?.Name;

            var creado = await plantillas.CrearAsync(req, user, ct);
            await cache.EvictByTagAsync(plantillasCache, default);
            await cache.EvictByTagAsync(plantilla, default);
            return CreatedAtAction(nameof(GetById), new { id = creado.Id }, creado);
        }

        [HttpPut("updatePlantilla/{id:int}")]
        [Authorize(Policy = Permisos.Correos.Plantillas.Cambio)]
        [ErrorMessage("Ocurrio un error al actualizar la plantilla. Contactar al administrador.", errorCode: "01")]
        public async Task<IActionResult> UpdatePlantilla(int id, [FromForm] EmailTemplatesUpsertDto req, CancellationToken ct)
        {

            var user = User.Identity?.Name;
            var updated = await plantillas.UpdateAsync(id, req, user, ct);
            await cache.EvictByTagAsync(plantillasCache, default);
            await cache.EvictByTagAsync(plantilla, default);
            return updated is null ? NotFound() : Ok(updated);
        }

        [HttpDelete("delete/{id:int}")]
        [Authorize(Policy = Permisos.Correos.Plantillas.Baja)]
        [ErrorMessage("Ocurrio un error al desactivar/borrar la plantilla. Contactar al administrador.", errorCode: "05")]
        public async Task<IActionResult> DeletePlantillaAsync(int id, CancellationToken ct)
        {
            bool puedeCambiar = await authCache.HasPermisoAsync(User, Permisos.Correos.Plantillas.Baja);
            if (!puedeCambiar)
            {
                return Problem("No se cuenta con el permiso para realizar esta accion.");
            }

            var user = User.Identity?.Name;
            var ok = await plantillas.DeleteAsync(id, user, ct);
            await cache.EvictByTagAsync(plantillasCache, default);
            await cache.EvictByTagAsync(plantilla, default);
            return ok ? NoContent() : Ok(ok);
        }

        [HttpGet("previewShell")]
        public async Task<IActionResult> GetPreviewShell(CancellationToken ct)
        {
            var shell = await plantillas.GetPreviewShellAsync(ct);
            return Content(shell, "text/plain; charset=utf-8");
        }

        [HttpPost("preview")]
        [Authorize(Policy = Permisos.Correos.Plantillas.Cambio)]
        public async Task<IActionResult> Preview([FromBody] TemplatePreviewRequestDto req, CancellationToken ct)
        {
            var html = await plantillas.RenderPreviewAsync(req, ct);
            return Content(html, "text/html; charset=utf-8");
        }

        [HttpGet("{id:int}/preview")]
        public async Task<IActionResult> PreviewById(int id, [FromQuery] string lang = "ES", CancellationToken ct = default)
        {
            var html = await plantillas.RenderPreviewFromTemplateIdAsync(id, lang, ct);
            return html is null ? NotFound("Plantilla no encontrada") : Content(html, "text/html; charset=utf-8");
        }
    }
}
