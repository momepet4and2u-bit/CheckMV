using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using MailVest.Entidades.Entidades;
using MailVest.Core.UoW;
using MailVest.Datos.Contexto;
using Microsoft.EntityFrameworkCore;
using MailVest.Entidades.Modelo;
using MailVest.Entidades.Dominio.Usuarios;

namespace MailVest.Datos.Repositorios.Autonticacion
{
    public class RepositorioUsuarios : IRepositorioUsuarios
    {
        private readonly MailVestDbContext context;

        public RepositorioUsuarios(MailVestDbContext _context)
        {
            context = _context;
        }

        public async Task<List<UsuariosDto>> ObtenerTodosUsuarios()
        {
            var query =(
                from us in this.context.Set<CatUsuarios>()
                join ru in this.context.Set<RelRolesxUsuario>()
                on us.Id equals ru.IdCatUsuario
                join r in this.context.Set<CatRoles>() 
                on ru.IdCatRoles equals r.Id
                select new UsuariosDto
                {
                    Id = us.Id,
                    Usuario = us.Usuario,
                    Nombre = us.Nombre,
                    Nomina = us.Nomina,
                    Email = us.Email,
                    Activo = us.Estatus,
                    Puesto = us.Area,
                    Rol = r.Descripcion
                });
            return await query.ToListAsync();
        }

        public async Task ActualizarUserAsync(UsuarioUpdateDto updateUser, string userModifica)
        {
            var usuario = await context.CatUsuarios
                .FirstOrDefaultAsync(u => u.Id == updateUser.Id);

            if (usuario == null)
            {
                throw new InvalidOperationException($"Usuario {updateUser.Id} no existe.");
            }

            usuario.Usuario = updateUser.Usuario;
            usuario.Nombre = updateUser.Nombre;
            usuario.Email = updateUser.Email;
            usuario.Area = updateUser.Area;
            usuario.Nomina = updateUser.Nomina;
            usuario.Estatus = updateUser.Activo;
            usuario.UsuarioModifica = userModifica;
            usuario.FechaModificacion = DateTime.Now;

            await context.SaveChangesAsync();
        }

        public async Task<CatUsuarios?> GetUsuarioByIdAsync(int id)
        {
            return await context.CatUsuarios
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == id);
        }

        public async Task<bool> ExisteUsuarioByUserAsync(string usuario)
        {
            return await context.CatUsuarios
                .AsNoTracking()
                .AnyAsync(u => u.Usuario == usuario);
        }
        public async Task<bool> ExisteUsuarioByEmailAsync(string email)
        {
            return await context.CatUsuarios
                .AsNoTracking()
                .AnyAsync(u => u.Email == email);
        }
        public async Task<CatUsuarios> CrearUsuarioAsync (UsuarioCreateDto newUser)
        {
            var entity = new CatUsuarios
            {
                Nombre = newUser.Nombre,
                Usuario = newUser.Usuario,
                Nomina = newUser.Nomina,
                Email = newUser.Email,
                Area = newUser.Puesto,
                Estatus = newUser.Activo,
                FechaAlta = DateTime.Now,
            };

            await context.CatUsuarios.AddAsync(entity);
            await context.SaveChangesAsync();

            return entity;
        }
    }
}
