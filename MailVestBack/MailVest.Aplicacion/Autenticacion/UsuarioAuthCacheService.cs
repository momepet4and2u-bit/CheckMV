using MailVest.Entidades.Auth;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Primitives;
using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Security.Claims;
using System.Text;

namespace MailVest.Aplicacion.Autenticacion
{
    public class UsuarioAuthCacheService : IUsuarioAuthCacheService
    {
        private readonly IMemoryCache cache;
        private readonly IAdministradorAutenticacion auth;
        private static readonly ConcurrentDictionary<string, CancellationTokenSource> roleSignals = new();
        private readonly TimeSpan ttl = TimeSpan.FromMinutes(30);

        private const string CacheKeyPrefix = "userauth:";

        public UsuarioAuthCacheService(
            IMemoryCache _cache,
            IAdministradorAutenticacion _auth)
        {
            cache = _cache;
            auth = _auth;
        }

        private static string Key(string userId) => $"{CacheKeyPrefix}{userId}";

        public async Task<UserAuth?> GetUserAuthAsync(string username)
        {
            var key = Key(username);

            return await cache.GetOrCreateAsync(key, async entry =>
            {
                entry.AbsoluteExpirationRelativeToNow = ttl;
                var userAuth = await auth.LoginWindowsAsync(username);

                if (userAuth is null)
                {
                    // Opcional: Cachear el "null" por poco tiempo para evitar spam a un usuario inexistente
                    entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromSeconds(30);
                    return null;
                }

                // 2. VINCULA AL ROL
                var cts = roleSignals.GetOrAdd(userAuth.Rol, _ => new CancellationTokenSource());
                entry.AddExpirationToken(new CancellationChangeToken(cts.Token));
                return userAuth;
            });
        }

        public void InvalidateRolAsync(string roleName)
        {
            if (roleSignals.TryRemove(roleName, out var cts))
            {
                cts.Cancel(); // Esto invalida TODAS las entradas vinculadas a este token
                cts.Dispose();
            }
        }

        public Task InvalidateUserAsync(string username)
        {
            cache.Remove(Key(username));
            return Task.CompletedTask;
        }

        public async Task<bool> HasPermisoAsync(ClaimsPrincipal user, string codigoPermiso)
        {
            var nameClaim = user.FindFirst(ClaimTypes.Name);

            if (nameClaim is null)
            {
                return false;
            }

            var username = nameClaim.Value;
            var userAuth = await GetUserAuthAsync(username);

            if (userAuth is null)
            {
                return false;
            }

            return userAuth.Permisos.Contains(codigoPermiso);
        }
    }
}
