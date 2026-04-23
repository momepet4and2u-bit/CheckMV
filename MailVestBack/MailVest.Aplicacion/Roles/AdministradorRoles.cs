using MailVest.Aplicacion.RelPermisosxRol;
using MailVest.Comun.Helpers;
using MailVest.Comun.Logger;
using MailVest.Datos.Repositorios.Roles;
using MailVest.Entidades.Dominio.Rol;
using MailVest.Entidades.Modelo;
using System.Transactions;

namespace MailVest.Aplicacion.Roles
{
    public class AdministradorRoles : IAdministradorRoles
    {

        private readonly IRepositorioRoles allRoles;
        private readonly IAdministradorRelPermisosxRol admPer;
        private readonly ILogs logs;

        public AdministradorRoles(IRepositorioRoles _allRoles, IAdministradorRelPermisosxRol _admPer, ILogs _logs)
        {
            allRoles = _allRoles;
            admPer = _admPer;
            logs = _logs;
        }

        public async Task<List<RolDto>> ObtenerTodosRolesAsync()
        {
            var us = await allRoles.obtenerTodosRolesAsync();

            return us;
        }

        public async Task<CatRoles?> GetRolByIdAsync(int id)
        {
            var rol = allRoles.GetRolByIdAsync(id);
            return await rol;
        }

        public async Task ActualizarRolAsync(int id, RolDto updateRol, bool puedeCambiar = false)
        {
            var currentRol = await GetRolByIdAsync(id);
            if (currentRol is null)
            {
                return;
            }

            bool tryChangeStatus = updateRol.Estatus != currentRol.Estatus;
            if (tryChangeStatus)
            {
                if (!puedeCambiar)
                {
                    updateRol.Estatus = currentRol.Estatus;
                }
            }

            bool esIgual =
                currentRol.Descripcion == updateRol.Descripcion &&
                currentRol.Estatus == updateRol.Estatus &&
                currentRol.ChipColorBorde == updateRol.ColorBorde &&
                currentRol.ChipColorTexto == updateRol.ColorTexto &&
                currentRol.ChipColorFondo == updateRol.ColorFondo;

            if (esIgual)
            {
                return;
            }
            await allRoles.ActualizarRolAsync(updateRol);
        }

        public async Task<bool> ExisteRolByDescripcionAsync(string rolDesc, string rolName)
        {
            return await allRoles.ExisteRolByDescripcionAsync(rolDesc, rolName);
        }

        public async Task CrearRolAsync(RolCreateDto newRol, string usuario)
        {
            await logs.LogInfo(origen: "CrearRolAsync", "Creacion de Roles", tipo: "Informacion");
            var crearRol = await allRoles.CrearRolAsync(newRol);
            
            await logs.LogInfo(origen: "CrearRolAsync", "Creacion de Roles y su relacion de permisos.", tipo: "Informacion");
            await admPer.UpdatePermisosxRolAsync(crearRol.Id, newRol.Permisos, usuario);
        }
    }
}
