using MailVest.Aplicacion.Autenticacion;
using MailVest.Aplicacion.Bitacoras;
using MailVest.Aplicacion.Usuarios;
using MailVest.Comun.Constantes.Permisos;
using MailVest.Comun.Helpers;
using MailVest.Comun.Logger;
using MailVest.Comun.MiddleWare;
using MailVest.Entidades.Auth;
using MailVest.Entidades.Dominio.Usuarios;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;

namespace MailVest.Back.Controllers
{
    [ApiController]
    [Route("users")]
    public class UsuarioController : ControllerBase
    {
        #region Constructor
        private readonly IOutputCacheStore cacheStore;
        private const string cacheTag = "usuarios";
        private readonly IAdministradorUsuarios allUsers;
        private readonly ILogs logs;
        private readonly IUsuarioAuthCacheService authCache;
        private readonly IAdministradorBitacoras bitacora;
        #endregion

        public UsuarioController(IOutputCacheStore _cacheStore, IAdministradorUsuarios _allUsers, ILogs _logs, IUsuarioAuthCacheService _authCache, IAdministradorBitacoras _bitacora)
        {
            cacheStore = _cacheStore;
            allUsers = _allUsers;
            logs = _logs;
            authCache = _authCache;
            bitacora = _bitacora;
        }

        #region apis
        [HttpGet("all")]
        [OutputCache(Tags = [cacheTag])]
        public async Task<ActionResult<List<UsuariosDto>>> GetAllUsers()
        {
            var allUser = await allUsers.GetAllUsers();

            if (allUser == null)
            {
                return Problem("No se pudieron recuperar los usuarios");
            }
            return Ok(allUser);
        }

        [HttpPut("updateUser/{id:int}")]
        [Authorize(Policy = Permisos.Configuracion.AdminUsuarios.Cambio)]
        [ErrorMessage("Ocurrio un error al actualizar registro. Contactar al administrador", errorCode: "01")]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] UsuarioUpdateDto updateUser)
        {
            var user = User?.Identity?.Name;
            var ip = Request.HttpContext.Connection.RemoteIpAddress.ToString();
            if (id != updateUser.Id)
            {
                return BadRequest("El id de la ruta no coincide con el del cuerpo");
            }
            bool puedeCambiar = await authCache.HasPermisoAsync(User, Permisos.Configuracion.AdminRoles.Baja);
            await allUsers.ActualizarUsuarioAsync(id, updateUser, user, ip, puedeCambiar);
            await cacheStore.EvictByTagAsync(cacheTag, default);
            return Ok();
        }

        [HttpPost("addUser")]
        [Authorize(Policy = Permisos.Configuracion.AdminUsuarios.Alta)]
        [ErrorMessage("Ocurrio un error al guardar registro. Contactar al administrador", errorCode: "02")]
        public async Task<IActionResult> AddUser([FromBody] UsuarioCreateDto newUser)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var existeUser = await allUsers.ExisteUsuarioByUserAsync(newUser.Usuario);
            if (existeUser)
            {
                return Conflict("Ya existe un usuario registrado con ese nombre de Usuario.");
            }

            var existEmail = await allUsers.ExisteUsuarioByEmailAsync(newUser.Email);
            if (existEmail)
            {
                return Conflict("Ya existe un usuario registrado con ese email.");
            }

            await allUsers.CrearUsuarioAsync(newUser);
            await cacheStore.EvictByTagAsync(cacheTag, default);

            return Ok(new { success = true });
        }
        #endregion
    }
}
