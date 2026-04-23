
using MailVest.Aplicacion.SubModulos;
using MailVest.Datos.Repositorios.RelSubModulosxRol;
using MailVest.Datos.Repositorios.UnitOfWork;
using MailVest.Entidades.Modelo;

namespace MailVest.Aplicacion.RelSubModulosxRol
{
    public class AdministradorRelSubModulosxRol : IAdministradorRelSubModulosxRol
    {
        private readonly IRepositorioRelSubModulosxRol relSubModRol;
        private readonly IAdministradorSubModulos admSubMod;
        private readonly IRepositorioUnitOfWork saveAll;

        public AdministradorRelSubModulosxRol(IRepositorioRelSubModulosxRol _relSubModRol, IAdministradorSubModulos _admSubMod, IRepositorioUnitOfWork _saveAll)
        {
            relSubModRol = _relSubModRol;
            admSubMod = _admSubMod;
            saveAll = _saveAll;
        }

        public async Task SyncSubModulosRolAsync(int idRol, List<string> newPermisos, string usuario)
        {
            var nuevosSubMod = new HashSet<string>(
               newPermisos
               .Where(p => !string.IsNullOrWhiteSpace(p) && p.Contains("Admin"))
               .Select(p => p.Trim()),
               StringComparer.OrdinalIgnoreCase);

            List<CatSubModulo> listSub = new();

            var ahora = DateTime.Now;

            var relSubExistentes = await GetByRolAsync(idRol);

            var idsSubMod = relSubExistentes
                .Select(r => r.IdSubModulo)
                .Distinct()
                .ToList();

            Dictionary<int, string> nombrePorId = new();

            if (idsSubMod.Count > 0)
            {
                var subMods = await admSubMod.GetAllSubModuloInfAsyncId(idsSubMod);

                nombrePorId = subMods.ToDictionary(
                    s => s.Id,
                    s => (s.Nombre ?? s.Descripcion ?? "").Trim(),
                    EqualityComparer<int>.Default);
            }


            foreach (var relSub in relSubExistentes)
            {
                nombrePorId.TryGetValue(relSub.IdSubModulo, out var nombreSub);
                nombreSub = (nombreSub ?? "").Trim();

                if (nuevosSubMod.Contains(nombreSub))
                {
                    if (!relSub.Estatus)
                    {
                        relSub.Estatus = true;
                        relSub.Fecha_Modificacion = ahora;
                        relSub.UsuarioModifica = usuario;
                    }
                    nuevosSubMod.Remove(nombreSub);
                }
                else
                {
                    if (relSub.Estatus)
                    {
                        relSub.Estatus = false;
                        relSub.Fecha_Modificacion = ahora;
                        relSub.UsuarioModifica = usuario;
                    }
                }
            }

            if (nuevosSubMod.Count > 0)
            {
                var subModulos = await admSubMod.GetAllSubModuloInfAsync(nuevosSubMod.ToList());
                var nuevasRelSub = new List<RelSubModuloxRol>();

                foreach (var sub in subModulos)
                {
                    nuevasRelSub.Add(new RelSubModuloxRol
                    {
                        IdCatRol = idRol,
                        IdSubModulo = sub.Id,
                        Estatus = true,
                        Fecha_CreacionRelacion = ahora,
                        UsuarioModifica = usuario
                    });
                }
                await relSubModRol.AgregarRelacionSubModRolAsync(nuevasRelSub);
            }
        }

        public async Task<bool> HasSubModuloRolAsync(int idRol, int SubMod)
        {
            return await relSubModRol.HasSubModuloRolAsync(idRol, SubMod);
        }

        public async Task AgregarRelacionSubModRolAsync(List<RelSubModuloxRol> relNew)
        {
            await relSubModRol.AgregarRelacionSubModRolAsync(relNew);
        }

        public async Task<List<RelSubModuloxRol>> GetByRolAsync(int idRol)
        {
            return await relSubModRol.GetByRolAsync(idRol);
        }
    }
}
