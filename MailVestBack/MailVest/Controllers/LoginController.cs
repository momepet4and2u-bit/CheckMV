using MailVest.Aplicacion.Autenticacion;
using MailVest.Aplicacion.Bitacoras;
using MailVest.Aplicacion.Seguridad;
using MailVest.Comun.Helpers;
using MailVest.Comun.Logger;
using MailVest.Comun.MiddleWare;
using MailVest.Datos.Contexto;
using MailVest.Entidades.Auth;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Negotiate;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using System.Security.Claims;

namespace MailVestBack.Controllers
{

    [ApiController]
    [Route("auth")]
    public class LoginController : ControllerBase
    {
        #region Constructor

        private readonly IAdministradorAutenticacion autenticacion;
        private readonly ITokenService tokenService;
        private readonly ILogs logs;
        private readonly IAdministradorBitacoras bitacora;
        private readonly IUsuarioAuthCacheService authCache;

        public LoginController(IOutputCacheStore outputCacheStore, MailVestDbContext context, IAdministradorAutenticacion _autentication, ITokenService _tokenService, ILogs _logs,
            IAdministradorBitacoras _bitacora, IUsuarioAuthCacheService _authCache)
        {
            autenticacion = _autentication;
            tokenService = _tokenService;
            logs = _logs;
            bitacora = _bitacora;
            authCache = _authCache;
        }
        #endregion
        [HttpGet("me")]
        [Authorize(AuthenticationSchemes = NegotiateDefaults.AuthenticationScheme)]
        [ErrorMessage("Ocurrio un error al iniciar sesion. Contactar al administrador", errorCode: "01")]
        public async Task<IActionResult> GetCurrentUser()
        {
            var userAut = User?.Identity?.Name;
            await bitacora.BitacoraAcceso(userAut != null ? userAut : "No se comprobo el usuario", Request.HttpContext.Connection.RemoteIpAddress.ToString(), "Intento de inicio de sesion");
            if (string.IsNullOrWhiteSpace(userAut))
            {
                await bitacora.BitacoraAcceso(userAut != null ? userAut : "No se comprobo el usuario", Request.HttpContext.Connection.RemoteIpAddress.ToString(), "Inicio de sesion fallido.");
                return Unauthorized(new { succed = false, message = "No se detectó usuario de Windows." });
            }

            var user = userAut.Split("\\").Last();

            var userExist = await authCache.GetUserAuthAsync(user);

            if (userExist.Usuario == "")
            {
                await bitacora.BitacoraAcceso(user != null ? user : "No se comprobo el usuario", Request.HttpContext.Connection.RemoteIpAddress.ToString(), "Usuario no existe.");
                return Forbid();
            }
            else
            {
                var token = tokenService.GenerateToken(userExist);
                var response = new AuthResponse
                {
                    token = token,
                    user = userExist
                };
                await bitacora.BitacoraAcceso(user, Request.HttpContext.Connection.RemoteIpAddress.ToString(), "Inicio de sesion exitoso.");
                return Ok(response);
            }
        }
    }
}
