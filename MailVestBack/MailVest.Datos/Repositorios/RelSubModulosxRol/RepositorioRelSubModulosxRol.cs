using MailVest.Datos.Contexto;
using MailVest.Entidades.Modelo;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;

namespace MailVest.Datos.Repositorios.RelSubModulosxRol
{
    public class RepositorioRelSubModulosxRol : IRepositorioRelSubModulosxRol
    {
        private readonly MailVestDbContext context;

        public RepositorioRelSubModulosxRol(MailVestDbContext _context)
        {
            context = _context;
        }

        public async Task<bool> HasSubModuloRolAsync(int idRol, int idSubMod)
        {
            return await context.Set<RelSubModuloxRol>().AnyAsync(relS => relS.IdCatRol == idRol && relS.IdSubModulo == idSubMod);
        }

        public async Task<List<RelSubModuloxRol>> ObtenerSubModulosxRolAsync(int idRol)
        {
            var todosSubxRol = await (
                from rol in this.context.Set<RelSubModuloxRol>()
                join subMod in this.context.Set<CatSubModulo>()
                on rol.IdSubModulo equals subMod.Id
                where rol.IdCatRol == idRol
                select rol
                ).Distinct().ToListAsync();

            return todosSubxRol;
        }

        public async Task AgregarRelacionSubModRolAsync(List<RelSubModuloxRol> relNew)
        {
            await context.Set<RelSubModuloxRol>().AddRangeAsync(relNew);
        }

        public async Task<List<RelSubModuloxRol>> GetByRolAsync(int idRol)
        {
            try
            {
                return await context.Set<RelSubModuloxRol>()
                    .Where(c => c.IdCatRol == idRol)
                    .ToListAsync();
            }
            catch (Exception e)
            {
                return null;
            }
        }
    }
}
