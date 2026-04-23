using MailVest.Datos.Contexto;
using MailVest.Datos.Repositorios.Opciones_Permisos;
using MailVest.Entidades.Modelo;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Datos.Repositorios
{
    public class RepositorioOpciones : IRepositorioOpciones
    {
        private readonly MailVestDbContext context;

        public RepositorioOpciones(MailVestDbContext context)
        {
            this.context = context;
        }

        public async Task<List<CatOpcion>> GetPermisoByNameAsync(IEnumerable<string> nombres)
        {
            var set = new HashSet<string>(nombres, StringComparer.OrdinalIgnoreCase);

            return await context.Set<CatOpcion>()
                .Where(c => set.Contains(c.Nombre))
                .ToListAsync();
        }

        public async Task<List<CatOpcion>> GetPermisoByIdAsync(IEnumerable<int> ids)
        {
            var set = new HashSet<int>(ids);

            return await context.Set<CatOpcion>()
                .Where(c => set.Contains(c.Id))
                .ToListAsync();
        }
    }
}
