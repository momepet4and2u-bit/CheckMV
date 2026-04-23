using MailVest.Entidades.Dominio.Usuarios;
using MailVest.Entidades.Modelo;
using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Aplicacion.RelSubModulosxRol
{
    public interface IAdministradorRelSubModulosxRol
    {
        Task<bool> HasSubModuloRolAsync(int idRol, int SubMod);
        Task AgregarRelacionSubModRolAsync(List<RelSubModuloxRol> relNew);
        Task<List<RelSubModuloxRol>> GetByRolAsync(int idRol);
        Task SyncSubModulosRolAsync(int idRol, List<string> newPermisos, string usuario);
    }
}
