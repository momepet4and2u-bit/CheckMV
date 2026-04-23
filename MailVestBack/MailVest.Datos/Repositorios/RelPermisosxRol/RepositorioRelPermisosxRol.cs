using MailVest.Datos.Contexto;
using MailVest.Entidades.Dominio.RelPermisoRol;
using MailVest.Entidades.Modelo;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;
using System.Transactions;

namespace MailVest.Datos.Repositorios.RelPermisosxRol
{
    public class RepositorioRelPermisosxRol : IRepositorioRelPermisosxRol
    {
        private readonly MailVestDbContext context;

        public RepositorioRelPermisosxRol(MailVestDbContext _context)
        {
            context = _context;
        }
        public async Task<List<string>> ObtenerPermisoxRolAsync(int idRol)
        {
            var permxRol = await (from rols in this.context.Set<RelOpcionxRol>()
                                  join perm in this.context.Set<CatOpcion>()
                                  on rols.IdCatOpcion equals perm.Id
                                  where rols.IdCatRol == idRol && rols.Estatus == true
                                  select perm.Nombre
                ).Distinct().ToListAsync();

            return permxRol;
        }
        public async Task<List<RelOpcionxRol>> GetRelByRolAsync(int idRol)
        {
            return await context.Set<RelOpcionxRol>()
                .Where(x => x.IdCatRol == idRol)
                .ToListAsync();
        }

        public async Task AgregarRelacionAsync(List<RelOpcionxRol> rel)
        {
            await context.Set<RelOpcionxRol>().AddRangeAsync(rel);
        }
    }
}
