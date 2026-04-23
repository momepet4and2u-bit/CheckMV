using MailVest.Entidades.Modelo;
using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Datos.Repositorios.RelSubModulosxRol
{
    public interface IRepositorioRelSubModulosxRol
    {
        Task<List<RelSubModuloxRol>> ObtenerSubModulosxRolAsync(int idRol);
        Task AgregarRelacionSubModRolAsync(List<RelSubModuloxRol> relNew);
        Task<bool> HasSubModuloRolAsync(int idRol, int SubMod);
        Task<List<RelSubModuloxRol>> GetByRolAsync(int idRol);
    }
}
