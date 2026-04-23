using MailVest.Aplicacion.Autenticacion;
using MailVest.Aplicacion.RelPermisosxRol;
using MailVest.Aplicacion.Roles;
using MailVest.Comun.Constantes.Permisos;
using MailVest.Comun.Helpers;
using MailVest.Comun.Logger;
using MailVest.Comun.MiddleWare;
using MailVest.Entidades.Dominio.Rol;
using MailVest.RealTime.Hubs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.AspNetCore.SignalR;

namespace MailVest.Back.Controllers
{
    [ApiController]
    [Route("roles")]
    public class RolesController : ControllerBase
    {
        #region Constructor

        private readonly IAdministradorRoles roles;
        private readonly IAdministradorRelPermisosxRol relPermisosxRol;
        private readonly IOutputCacheStore cacheStore;
        private const string cacheTag = "roles";
        private const string rolPermCache = "rolPermCache";
        private readonly ILogs logs;
        private readonly IUsuarioAuthCacheService authCache;
        private readonly IHubContext<AppHub> hub;
        private readonly IAdministradorAutenticacion auth;

        public RolesController(IOutputCacheStore _cacheStore, IAdministradorRoles _roles, ILogs _logs, IUsuarioAuthCacheService _authCache,
            IAdministradorRelPermisosxRol _relPermisosxRol, IHubContext<AppHub> _hub, IAdministradorAutenticacion auth)
        {
            roles = _roles;
            cacheStore = _cacheStore;
            logs = _logs;
            authCache = _authCache;
            relPermisosxRol = _relPermisosxRol;
            hub = _hub;
            this.auth = auth;
        }
        #endregion

        [HttpGet("all")]
        [OutputCache(Tags = [cacheTag])]
        public async Task<ActionResult<List<RolDto>>> GetRoles()
        {
            var rols = await roles.ObtenerTodosRolesAsync();

            string user = User.Identity?.Name ?? string.Empty;
            if (rols == null)
            {
                return Problem("No se pudieron recuperar los roles");
            }

            return Ok(rols);
        }
        [HttpPut("updateRol/{id:int}")]
        [Authorize(Policy = Permisos.Configuracion.AdminRoles.Cambio)]
        [ErrorMessage("Ocurrio un error al guardar el registro. Contactar al administrador.", errorCode: "01")]
        public async Task<IActionResult> UpdateRol(int id, [FromBody] RolDto updateRol)
        {
            if (id != updateRol.Id)
            {
                return BadRequest("El id de la ruta no coincide con el cuerpo");
            }
            string user = User.Identity?.Name ?? string.Empty;
            bool puedeCambiar = await authCache.HasPermisoAsync(User, Permisos.Configuracion.AdminRoles.Baja);
            await roles.ActualizarRolAsync(id, updateRol, puedeCambiar);
            await cacheStore.EvictByTagAsync(cacheTag, default);
            return Ok();
        }

        [HttpPost("createRol")]
        [Authorize(Policy = Permisos.Configuracion.AdminRoles.Alta)]
        [ErrorMessage("Ocurrio un problema al guardar rol. Contacte al administrador.", errorCode: "02")]
        public async Task<IActionResult> AddRol([FromBody] RolCreateDto newRol)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var existeRol = await roles.ExisteRolByDescripcionAsync(newRol.Descripcion, newRol.Nombre);
            if (existeRol)
            {
                return Conflict("Ya existe un rol creado con esa descripcion.");
            }

            string user = User.Identity?.Name ?? string.Empty;

            await roles.CrearRolAsync(newRol, user);
            await cacheStore.EvictByTagAsync(cacheTag, default);
            await cacheStore.EvictByTagAsync(rolPermCache, default);

            return Ok(new { success = true });
        }
        [HttpPost("updatePermisos/{idRol:int}")]
        [Authorize(Policy = Permisos.Configuracion.AdminRoles.Cambio)]
        [ErrorMessage("Ocurrio un problema al actualizar el rol. Contacte al administrador.", errorCode: "01")]
        public async Task<IActionResult> UpdatePermisosRol(int idRol, [FromBody] UpdatePermisosRol newPermisos)
        {
            string user = User.Identity?.Name ?? string.Empty;
            var rolAct = await roles.GetRolByIdAsync(idRol);
            if (rolAct is null)
            {
                return NotFound("No se encontro el rol a actualizar");
            }

            await relPermisosxRol.UpdatePermisosxRolAsync(idRol, newPermisos.Permisos, user);

            authCache.InvalidateRolAsync(rolAct.Descripcion);
            await authCache.InvalidateUserAsync(user);

            var nuevosDatos = await auth.LoginWindowsAsync(user);
            // Inyecta IHubContext<AuthHub> en el constructor
            await hub.Clients.Group(rolAct.Descripcion).SendAsync("NotifyPermissionsChanged", nuevosDatos);

            await cacheStore.EvictByTagAsync(cacheTag, default);
            await cacheStore.EvictByTagAsync(rolPermCache, default);
            return Ok();
        }

        [HttpGet("rolByPermisos/{idRol:int}")]
        [OutputCache(Tags = [rolPermCache])]
        [ErrorMessage("Ocurrio un problema al recuperar los permisos de los roles. Contactar administrador", errorCode: "03")]
        public async Task<ActionResult<List<string>>> ObtenerPermisoRol(int idRol)
        {
            string user = User.Identity?.Name ?? string.Empty;
            var perxRol = await relPermisosxRol.ObtenerPermisoxRolAsync(idRol);

            if (perxRol == null)
            {
                return Problem("No se pudieron recuoerar los permisos");
            }
            return Ok(perxRol);
        }
    }
}
