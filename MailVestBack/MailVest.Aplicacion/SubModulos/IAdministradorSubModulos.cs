using MailVest.Entidades.Dominio.Rol;
using MailVest.Entidades.Dominio.Usuarios;
using MailVest.Entidades.Modelo;
using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Aplicacion.SubModulos
{
    public interface IAdministradorSubModulos
    {
        Task<CatSubModulo> GetSubModuloInfAsync(string descrSubMod);
        Task<CatSubModulo> GetSubModuloInfAsync(int idSubmodulo);
        Task<List<CatSubModulo>> GetAllSubModuloInfAsync(IEnumerable<string> subModulos);
        Task<List<CatSubModulo>> GetAllSubModuloInfAsyncId(IEnumerable<int> ids);
    }
}
