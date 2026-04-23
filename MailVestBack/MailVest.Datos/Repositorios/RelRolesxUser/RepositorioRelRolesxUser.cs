using MailVest.Datos.Contexto;
using MailVest.Entidades.Modelo;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Datos.Repositorios.RelRolesxUser
{
    public class RepositorioRelRolesxUser : IRepositorioRelRolesxUser
    {
        private readonly MailVestDbContext context;

        public RepositorioRelRolesxUser(MailVestDbContext _context)
        {
            context = _context;
        }

        public async Task CrearRelRolesxUsuarioAsync(int idUser, int idRol)
        {
            await context.RelRolesxUsuario.AddAsync(new RelRolesxUsuario
            {
                IdCatUsuario = idUser,
                IdCatRoles = idRol,
                Estatus = true
            });

            await context.SaveChangesAsync();
        }

        public async Task ActualizarRolesxUsuarioAsync(int idUser, int idRol, string usuario)
        {
            var relRol = await context.RelRolesxUsuario
                .FirstOrDefaultAsync(r => r.IdCatUsuario == idUser);

            if (relRol == null)
            {
                await CrearRelRolesxUsuarioAsync (idUser, idRol);
            }
            else
            {
                relRol.IdCatRoles = idRol;
                relRol.Estatus = true;
                relRol.UsuarioModifica = usuario;
            }

            await context.SaveChangesAsync();
        }

        public async Task <RelRolesxUsuario?> ObtenerRelRolxUserAsync(int idUser)
        {
            return await context.RelRolesxUsuario
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.IdCatUsuario == idUser);
        }
    }
}
