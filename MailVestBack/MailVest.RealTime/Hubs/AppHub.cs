using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using System.Collections.Concurrent;

namespace MailVest.RealTime.Hubs
{
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class AppHub : Hub
    {
        public Task Join(string grupo) => Groups.AddToGroupAsync(Context.ConnectionId, grupo);

        public Task Leave(string grupo) => Groups.RemoveFromGroupAsync(Context.ConnectionId, grupo);

        public record TemplateEditLockRequest (int Id, int DraftId);
        public record TemplateEditLockResponse (bool Ok, string? Reason = null, string? LockedBy = null);
        public record TemplateEditChange(int Id, bool EnEdicion, string? EnEdicionPor = null);
        private static readonly ConcurrentDictionary<int, (string ConnId, string User, DateTime LastSeen)> _editingLocks = new();
        private string CurrentUserDisplay()
        {
            return Context.User?.Identity?.Name ?? "Desconocido";
        }

        public async Task<TemplateEditLockResponse> TryLockPlantillaEdicion(TemplateEditLockRequest req)
        {
            var user = CurrentUserDisplay();
            var now = DateTime.UtcNow;

            //Limpieza simple por TTL (90s)
            foreach(var kv in _editingLocks)
            {
                if((now - kv.Value.LastSeen).TotalSeconds > 90)
                {
                    if (_editingLocks.TryRemove(kv.Key, out var removed))
                    {
                        await Clients.Group("plantillas").SendAsync("plantillaEdicionCambio", new TemplateEditChange(kv.Key, false, removed.User));
                        await Clients.Group($"plantilla-{req.Id}").SendAsync("plantillaEdicionCambio", new TemplateEditChange(kv.Key, false, removed.User));
                    }
                }
            }

            var connId = Context.ConnectionId;

            // Si ya existe lock:
            if (_editingLocks.TryGetValue(req.Id, out var existing))
            {
                //Si es el mismo cliente, refresca TLL y Ok
                if (existing.ConnId == connId)
                {
                    _editingLocks[req.Id] = (connId, user, now);
                    return await Task.FromResult(new TemplateEditLockResponse(true));
                }

                return await Task.FromResult(new TemplateEditLockResponse(false, "LOCKED", existing.User));
            }

            // Intentar tomar el lock
            if (_editingLocks.TryAdd(req.Id, (connId, user, now)))
            {
                //Notificar a todos los que esten escuchadno "plantillas"
                return await NotifyAndReturn(req.Id, true, user);
            }

            return await Task.FromResult(new TemplateEditLockResponse(false, "RACE"));
        }

        public async Task UnlockPlantillaEdicion(TemplateEditLockRequest req)
        {
            var connId = Context.ConnectionId;

            if (_editingLocks.TryGetValue(req.Id, out var existing) && existing.ConnId == connId)
            {
                _editingLocks.TryRemove(req.Id, out _);
                await Clients.Group("plantillas").SendAsync("plantillaEdicionCambio", new TemplateEditChange(req.Id, false));
                await Clients.Group($"plantilla-{req.Id}").SendAsync("plantillaEdicionCambio", new TemplateEditChange(req.Id, false));
            }
        }

        private async Task<TemplateEditLockResponse> NotifyAndReturn(int templateId, bool editing, string user)
        {
            await Clients.Group("plantillas").SendAsync("plantillaEdicionCambio", new TemplateEditChange(templateId, editing, user));
            await Clients.Group($"plantilla-{templateId}").SendAsync("plantillaEdicionCambio", new TemplateEditChange(templateId, editing, user));

            return new TemplateEditLockResponse(true, LockedBy: user);
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            //Libera locks de este connectionId
            var connId = Context.ConnectionId;

            var now = DateTime.UtcNow;
            foreach (var kv in _editingLocks)
            {
                if(kv.Value.ConnId == connId)
                {
                    if (_editingLocks.TryRemove(kv.Key, out var removed))
                    {
                        await Clients.Group("plantillas").SendAsync("plantillaEdicionCambio", new TemplateEditChange(kv.Key, false));
                        await Clients.Group($"plantilla-{kv.Key}").SendAsync("plantillaEdicionCambio", new TemplateEditChange(kv.Key, false));
                    }
                }
                if ((now - kv.Value.LastSeen).TotalSeconds > 120)
                {
                    _editingLocks.TryRemove(kv.Key, out _);
                }
            }

            await base.OnDisconnectedAsync(exception);
        }
    }
}
