using MailVest.Aplicacion.Bitacoras;
using MailVest.Aplicacion.RelRolesxUser;
using MailVest.Comun.Helpers;
using MailVest.Comun.Logger;
using MailVest.Datos.Repositorios.Autonticacion;
using MailVest.Entidades.Dominio.Usuarios;
using MailVest.Entidades.Entidades;
using Newtonsoft.Json;
using System.Transactions;

namespace MailVest.Aplicacion.Usuarios
{
    public class AdministradorUsuarios : IAdministradorUsuarios
    {

        private readonly IRepositorioUsuarios allUser;
        private readonly IAdministradorRelRolesxUsuario adminRolxUs;
        private readonly ILogs logs;
        private readonly IAdministradorBitacoras bitacora;

        public AdministradorUsuarios(IRepositorioUsuarios _allUser, IAdministradorRelRolesxUsuario _adminRolxUs, ILogs _logs, IAdministradorBitacoras _bitacora)
        {
            allUser = _allUser;
            adminRolxUs = _adminRolxUs;
            logs = _logs;
            bitacora = _bitacora;
        }

        public async Task<List<UsuariosDto>> GetAllUsers()
        {
            var us = await allUser.ObtenerTodosUsuarios();

            return us;
        }

        public async Task ActualizarUsuarioAsync(int id, UsuarioUpdateDto updateUser, string userModifica, string ip, bool puedeCambiar = false)
        {
            var currentUser = await GetUsuarioByIdAsync(id);
            await bitacora.BitacoraMovimientos("Update", "CatUsuarios y sus Relaciones para permisos", "Datos antes de actualizar -> " + JsonConvert.SerializeObject(currentUser)+ "   | Datos a actualizar -> " + JsonConvert.SerializeObject(updateUser), userModifica, ip);
            if (currentUser is null)
            {
                await bitacora.BitacoraMovimientos("Update", "CatUsuarios y sus Relaciones para permisos", "Datos antes de actualizar -> " + JsonConvert.SerializeObject(currentUser) + "   | Datos a actualizar -> " + JsonConvert.SerializeObject(updateUser) + "  | FALLO ACTUALIZACION", userModifica, ip);
                return;
            }

            bool intentaCambiarActivo = updateUser.Activo != currentUser.Estatus;

            if (intentaCambiarActivo)
            {
                if (!puedeCambiar)
                {
                    updateUser.Activo = currentUser.Estatus;
                }
            }

            var userOG = await adminRolxUs.ObtenerRelRolxUserAsync(updateUser.Id);

            var rolOriginalId = userOG.IdCatRoles;
            var rolNuevoId = updateUser.IdRol;

            bool rolCambio = rolOriginalId != rolNuevoId;

            using var tscope = new TransactionScope(
                TransactionScopeAsyncFlowOption.Enabled);

            await allUser.ActualizarUserAsync(updateUser, userModifica);
            var updatedUser = await GetUsuarioByIdAsync(id);
            await bitacora.BitacoraMovimientos("Update", "CatUsuarios y sus Relaciones para permisos", "Datos actualizados -> " + JsonConvert.SerializeObject(updatedUser), userModifica, ip);

            if (rolCambio)
            {
                await adminRolxUs.ActualizarRolesUsuarioAsync(updateUser.Id, rolNuevoId, userModifica);
            }
            tscope.Complete();
        }

        public async Task <CatUsuarios?> GetUsuarioByIdAsync(int id)
        {
            var user = allUser.GetUsuarioByIdAsync(id);
            return await user;
        }

        public async Task<bool> ExisteUsuarioByUserAsync(string usuario)
        {
            var userExis = allUser.ExisteUsuarioByUserAsync(usuario);
            return await userExis;
        }
        public async Task<bool> ExisteUsuarioByEmailAsync(string email)
        {
            var userExis = allUser.ExisteUsuarioByEmailAsync(email);
            return await userExis;
        }
        public async Task CrearUsuarioAsync(UsuarioCreateDto newUser)
        {
            using var tscope = new TransactionScope(TransactionScopeAsyncFlowOption.Enabled);

            var creado = await allUser.CrearUsuarioAsync(newUser);

            await adminRolxUs.CrearRelRolesxUsuarioAsync(creado.Id, newUser.IdRol);

            await logs.LogInfo(origen: "CrearUsuarioAsync", "Creacion de Usuario y su relacion de roles", tipo: "Informacion");

            tscope.Complete();
        }
    }
}
