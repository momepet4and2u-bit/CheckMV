using MailVest.Datos.Repositorios.Autonticacion;
using MailVest.Entidades.Auth;
using MailVest.Entidades.Dominio;
using Microsoft.Extensions.Caching.Memory;
using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Aplicacion.Autenticacion
{
    public class AdministradorAutenticacion : IAdministradorAutenticacion
    {
        private readonly IRepositorioAutenticacion usuario;
        private readonly IMemoryCache cache; // <--- Inyectar caché
        private readonly TimeSpan ttl = TimeSpan.FromMinutes(30);

        public AdministradorAutenticacion(IRepositorioAutenticacion _usuario, IMemoryCache _cache)
        {
            usuario = _usuario;
            cache = _cache;
        }

        public async Task<UserAuth> LoginWindowsAsync(string username)
        {
            string cacheKey = $"userauth:{username}";

            // 1. Intentar obtener de caché o ejecutar la lógica si no existe
            return await cache.GetOrCreateAsync(cacheKey, async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = ttl;

                // 2. Si no está en caché, hace todas las consultas pesadas a la BD
                var user = await usuario.ObtenerUsuariosAsync(username);

                if (user == null)
                {
                    entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(30); // No cachear fallos por mucho tiempo
                    return new UserAuth();
                }

                var rol = await usuario.ObtenerRolesXUserAsync(user.Id);
                var permisos = await usuario.ObtenerPermisosxUserAsync(user.Usuario);

                return new UserAuth
                {
                    Id = user.Id,
                    Nombre = user.Nombre,
                    Usuario = user.Usuario,
                    Rol = rol.Descripcion,
                    Permisos = permisos.Opciones.Select(o => o!.Nombre).Distinct().ToList(),
                    SubModulos = permisos.SubModulo.Select(o => o!.Nombre).Distinct().ToList()
                };
            });
        }

    }
}
