using MailVest.Aplicacion.Autenticacion;
using MailVest.Aplicacion.Draft.CorreosDraft;
using MailVest.Comun.Constantes.Permisos;
using MailVest.Comun.MiddleWare;
using MailVest.Entidades.Dominio.EmailDraft;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using static MailVest.Comun.Constantes.Permisos.Permisos.Correos;

namespace MailVest.Back.Controllers
{
    [ApiController]
    [Route("correosDraft")]
    public class CorreosDraftController : Controller
    {
        #region Constructor

        private readonly IOutputCacheStore cache;
        private const string correoDraftCache = "correoDraft";
        private const string correosCache = "correos";
        private const string correoCache = "correo";
        private readonly IUsuarioAuthCacheService authCache;
        private readonly IAdministradorEmailDraft mailCraft;

        public CorreosDraftController(IOutputCacheStore _cache, IUsuarioAuthCacheService _authCache, IAdministradorEmailDraft _mailCraft)
        {
            cache = _cache;
            authCache = _authCache;
            mailCraft = _mailCraft;
        }
        #endregion

        [HttpPost("newDraft")]
        [Authorize(Policy = Permisos.Correos.CorreosC.Alta)]
        [ErrorMessage("Ocurrio un error al crear el ")]
        public async Task<IActionResult> CrearCorreosDraft([FromBody] EmailDraftCreateDto newDraft, CancellationToken ct)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var user = User?.Identity?.Name!;

            var templUsed = await mailCraft.TemplateBloquedAsync(newDraft.TemplateId, ct);

            if (templUsed)
            {
                return Problem("La plantilla seleccionada se encuentra bloqueada");
            }

            var crear = await mailCraft.CrearDraftAsync(newDraft, user, ct);

            if (crear is null)
            {
                return Problem("No se pudo crear el correo.");
            }
            return Ok(crear);
        }
        [HttpGet("all")]
        [OutputCache(Tags = [correosCache])]
        public async Task<ActionResult<List<EmailDraftTableDto>>> GetAll(CancellationToken ct)
        {
            var usuario = User?.Identity?.Name!;
            var drafts = await mailCraft.ObtenerCorreosDraft(usuario, ct);
            if (drafts == null)
            {
                return Problem("No se pudieron recuperar los correos");
            }
            return Ok(drafts);
        }

        [HttpGet("{id:int}")]
        [OutputCache(Tags = [correoCache])]
        public async Task<ActionResult<EmailDraftDetailDto>> GetById(int id, CancellationToken ct)
        {
            var usuario = User?.Identity?.Name!;
            var draft = await mailCraft.GetById(usuario, id, ct);
            if (draft is null)
            {
                return Problem("No se pudo recuperar el correo.");
            }
            return Ok(draft);
        }
        [HttpPost("{id:int}/lockEdit")]
        public async Task<IActionResult> LockEditAsync(int id, CancellationToken ct)
        {
            var usuario = User?.Identity?.Name;
            var locked = await mailCraft.LockEditAsync(id, usuario, ct);
            return locked is null ? Problem("No se pudo bloquear la edicion del correo") :
                Ok(locked);
        }
        [HttpPost("{id:int}/unlockEdit")]
        public async Task<IActionResult> UnlockEdit(int id, CancellationToken ct)
        {
            var user = User?.Identity?.Name;
            await mailCraft.UnlockEditAsync(id, user, ct);
            return Ok();
        }
    }
}
