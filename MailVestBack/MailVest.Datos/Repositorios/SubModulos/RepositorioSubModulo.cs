using MailVest.Datos.Contexto;
using MailVest.Entidades.Modelo;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Datos.Repositorios.SubModulos
{
    public class RepositorioSubModulo : IRepositorioSubModulo
    {
        private readonly MailVestDbContext context;

        public RepositorioSubModulo( MailVestDbContext _context)
        {
            context = _context;
        }

        public async Task<CatSubModulo> GetSubModuloInfAsync(string descrSubMod)
        {
            var subModAll = await context.Set<CatSubModulo>()
                .Where(c => c.Nombre == descrSubMod)
                .FirstOrDefaultAsync();

            return subModAll;
        }

        public async Task<CatSubModulo> GetSubModuloInfAsync(int idSubmodulo)
        {
            var subModAll = await context.Set<CatSubModulo>()
                .Where(c => c.Id == idSubmodulo)
                .FirstOrDefaultAsync();

            return subModAll;
        }

        public async Task<List<CatSubModulo>> GetAllSubModuloInfAsync (IEnumerable<string> subModulos)
        {
            var set = new HashSet<string>(subModulos, StringComparer.OrdinalIgnoreCase);
            return await context.Set<CatSubModulo>()
                .Where(c => set.Contains(c.Nombre) || set.Contains(c.Id.ToString()))
                .ToListAsync();
        }

        public async Task<List<CatSubModulo>> GetAllSubModuloInfAsyncId (IEnumerable<int> ids)
        {
            return await context.Set<CatSubModulo>()
                .Where(s => ids.Contains(s.Id))
                .ToListAsync();
        }

    }
}
