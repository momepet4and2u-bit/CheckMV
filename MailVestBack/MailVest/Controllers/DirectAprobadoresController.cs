using MailVest.Aplicacion.Autenticacion;
using MailVest.Aplicacion.DirectorioAprobadores;
using MailVest.Comun.Constantes.Permisos;
using MailVest.Comun.MiddleWare;
using MailVest.Entidades.Dominio.DirectorioAprobadores;
using MailVest.Entidades.Dominio.Parametros;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;

namespace MailVest.Back.Controllers
{
    [ApiController]
    [Route("aprobadores")]
    public class DirectAprobadoresController : ControllerBase
    {
        #region Constructor

        private readonly IOutputCacheStore cacheStore;
        private readonly IUsuarioAuthCacheService authCache;
        private const string cacheTag = "aprobadores";
        private readonly IAdministradorDirectAprobadores Aprob;

        public DirectAprobadoresController(IOutputCacheStore _cacheStore, IUsuarioAuthCacheService _authCache, IAdministradorDirectAprobadores _Aprob)
        {
            cacheStore = _cacheStore;
            authCache = _authCache;
            Aprob = _Aprob;
        }
        #endregion

        [HttpGet("all")]
        [OutputCache(Tags = [cacheTag])]
        public async Task<ActionResult<List<DirectAprobDto>>> GetAprobadoresAsync()
        {
            var Aprobadores = await Aprob.ObtenerAprobadoresAsync();
            if (Aprobadores is null)
            {
                return Problem("No se pudieron recuperar los Aprobadores.");
            }
            return Ok(Aprobadores);
        }

        [HttpPost("newAprob")]
        [Authorize(Policy =Permisos.Configuracion.Catalogos.AdminAprobadores.Alta)]
        [ErrorMessage("Ocurrio un error al guardar el Aprobador. Contactar al administrador.", errorCode: "02")]
        public async Task<IActionResult> AgregarAprobador([FromBody] DirectAprobDto newParam)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var existeAprob = await Aprob.ExisteAprobAsync(newParam.Usuario);
            if (existeAprob)
            {
                return Conflict("Ya existe un Aprobador.");
            }

            await Aprob.CrearAprobAsync(newParam);
            await cacheStore.EvictByTagAsync(cacheTag, default);

            return Ok(new { success = true });
        }

        [HttpPut("updateAprob/{idAprob:int}")]
        [Authorize(Policy = Permisos.Configuracion.Catalogos.AdminAprobadores.Cambio)]
        [ErrorMessage("Ocurrio un error al actualizar el Aprobador. Contactar al Administrador.", errorCode: "01")]
        public async Task<IActionResult> UpdateProv(int idAprob, [FromBody] DirectAprobDto updateProv)
        {
            string user = User.Identity?.Name ?? string.Empty;
            var ip = Request.HttpContext.Connection.RemoteIpAddress.ToString();
            var actProv = await Aprob.GetAprobadorAsync(idAprob);
            if (actProv is null)
            {
                return NotFound("No se encontro el provedor a actualizar");
            }
            bool puedeCambiar = await authCache.HasPermisoAsync(User, Permisos.Configuracion.Catalogos.AdminAprobadores.Cambio);
            bool puedeCambiarDefault = await authCache.HasPermisoAsync(User, Permisos.Configuracion.Catalogos.AdminAprobadores.CambioDefault);
            await Aprob.ActualizarAprobadorAsync(idAprob, updateProv, user, puedeCambiar, puedeCambiarDefault, ip);
            await cacheStore.EvictByTagAsync(cacheTag, default);
            return Ok();
        }
    }
}
