using MailVest.Datos.Repositorios.Roles;
using MailVest.Datos.Repositorios.SubModulos;
using MailVest.Entidades.Dominio.Rol;
using MailVest.Entidades.Modelo;
using System.Transactions;

namespace MailVest.Aplicacion.SubModulos
{
    public class AdministradorSubModulos : IAdministradorSubModulos
    {

        private readonly IRepositorioSubModulo allSub;

        public AdministradorSubModulos(IRepositorioSubModulo _allSub)
        {
            allSub = _allSub;
        }

        public async Task<CatSubModulo> GetSubModuloInfAsync(string descrSubMod)
        {
            return await allSub.GetSubModuloInfAsync(descrSubMod);
        }
        public async Task<CatSubModulo> GetSubModuloInfAsync(int idSubmodulo)
        {
            return await allSub.GetSubModuloInfAsync(idSubmodulo);
        }
        public async Task<List<CatSubModulo>> GetAllSubModuloInfAsync(IEnumerable<string> subModulos)
        {
            return await allSub.GetAllSubModuloInfAsync(subModulos);
        }
        public async Task<List<CatSubModulo>> GetAllSubModuloInfAsyncId(IEnumerable<int> ids)
        {
            return await allSub.GetAllSubModuloInfAsyncId(ids);
        }
    }
}
