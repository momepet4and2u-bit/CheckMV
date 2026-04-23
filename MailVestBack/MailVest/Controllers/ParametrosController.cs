using MailVest.Aplicacion.Autenticacion;
using MailVest.Aplicacion.Parametros_Config;
using MailVest.Aplicacion.RelPermisosxRol;
using MailVest.Aplicacion.Roles;
using MailVest.Comun.Constantes.Permisos;
using MailVest.Comun.Logger;
using MailVest.Comun.MiddleWare;
using MailVest.Entidades.Dominio.Parametros;
using MailVest.Entidades.Dominio.Parametros.Lenguaje;
using MailVest.Entidades.Dominio.RelPermisoRol;
using MailVest.Entidades.Dominio.Rol;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using System.Data;

namespace MailVest.Back.Controllers
{
    [ApiController]
    [Route("parametros")]
    public class ParametrosController : ControllerBase
    {
        #region Constructor

        private readonly IAdministradorParametros param;
        private readonly IOutputCacheStore cacheStore;
        private const string cacheTag = "parametros";
        private const string parametroUnic = "parametros";
        private const string lenguaCache = "lenguajes";
        private const string lengCache = "lenguaje";
        private readonly ILogs logs;
        private readonly IUsuarioAuthCacheService authCache;

        public ParametrosController(IOutputCacheStore _cacheStore, IAdministradorParametros _param, ILogs _logs, IUsuarioAuthCacheService _authCache)
        {
            cacheStore = _cacheStore;
            logs = _logs;
            authCache = _authCache;
            param = _param;
        }
        #endregion
        [HttpGet("all")]
        [OutputCache(Tags = [cacheTag])]
        public async Task<ActionResult<List<ParametrosDto>>> GetParametros()
        {
            var parametros = await param.ObtenerParametrosAsync();

            if (parametros is null)
            {
                return Problem("No se pudieron recuperar los parametros.");
            }
            return Ok(parametros);
        }

        [HttpGet("{parametroSearch}")]
        [OutputCache(Tags = [parametroUnic])]
        public async Task<ActionResult<string>> GetSpecificParam(string parametroSearch, CancellationToken ct)
        {
            var parametro = await param.ObtenerParametroValorAsync(parametroSearch);

            return Ok(parametro);
        }

        [HttpPost("newParam")]
        [Authorize(Policy = Permisos.Configuracion.Catalogos.AdminParametros.Alta)]
        [ErrorMessage("Ocurrio un error al guardar el parametro. Contactar al administrador.", errorCode: "02")]
        public async Task<IActionResult> AddParam([FromBody] ParametrosDto newParam)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var existeParam = await param.ExisteParamAsync(newParam.Parametro);
            if (existeParam)
            {
                return Conflict("Ya existe un parametro creado con ese nombre.");
            }

            await param.CrearParamAsync(newParam);
            await cacheStore.EvictByTagAsync(cacheTag, default);
            await cacheStore.EvictByTagAsync(parametroUnic, default);

            return Ok(new { success = true });
        }
        [HttpPut("updateParam/{idParam:int}")]
        [Authorize(Policy = Permisos.Configuracion.Catalogos.AdminParametros.Cambio)]
        [ErrorMessage("Ocurrio un error al actualizar el parametro. Contactar al Administrador.", errorCode: "01")]
        public async Task<IActionResult> UpdateParam(int idParam, [FromBody] ParametrosDto updateParam)
        {
            string user = User.Identity?.Name ?? string.Empty;
            var rolAct = await param.GetParamByIdAsync(idParam);
            if (rolAct is null)
            {
                return NotFound("No se encontro el rol a actualizar");
            }
            bool puedeCambiar = await authCache.HasPermisoAsync(User, Permisos.Configuracion.AdminRoles.Baja);
            await param.ActualizarParametroAsync(idParam, updateParam, user, puedeCambiar);
            await cacheStore.EvictByTagAsync(cacheTag, default);
            await cacheStore.EvictByTagAsync(parametroUnic, default);
            return Ok();
        }
        [HttpGet("languajes")]
        [OutputCache(Tags = [lenguaCache])]
        public async Task<IActionResult> ObtenerLenguajes()
        {
            var lenguajes = await param.ObtenerLenguajes();
            if (lenguajes is null)
            {
                return Problem("No se pudieron recuperar los lenguajes.");
            }
            return Ok(lenguajes);
        }
        [HttpGet("leng/{id:int}")]
        [OutputCache(Tags = [lengCache])]
        public async Task<IActionResult> GetLeng(string lengSearch, CancellationToken ct)
        {
            var leng = await param.ObtenerLenguajeAsync(lengSearch, ct);
            if (leng is null)
            {
                return Problem("No se pudo recuperar el lenguaje.");
            }
            return Ok(leng);
        }
        [HttpPost("newLeng")]
        [Authorize(Policy = Permisos.Configuracion.Catalogos.AdminParametros.Alta)]
        [ErrorMessage("Ocurrio un error al guardar el idioma. Contactar al administrador.", errorCode: "02")]
        public async Task<IActionResult> AddLeng([FromBody] LengDto newLeng, CancellationToken ct)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var existeParam = await GetLeng(newLeng.Name, ct);
            if (existeParam is null)
            {
                return Conflict("Ya existe un parametro creado con ese nombre.");
            }

            await param.CrearLengAsync(newLeng);
            await cacheStore.EvictByTagAsync(lenguaCache, default);
            await cacheStore.EvictByTagAsync(lengCache, default);

            return Ok(new { success = true });
        }
    }
}
