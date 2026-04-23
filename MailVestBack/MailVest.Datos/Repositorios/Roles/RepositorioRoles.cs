using MailVest.Datos.Contexto;
using MailVest.Entidades.Dominio.Rol;
using MailVest.Entidades.Dominio.Usuarios;
using MailVest.Entidades.Modelo;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Datos.Repositorios.Roles
{
    public class RepositorioRoles : IRepositorioRoles
    {
        private readonly MailVestDbContext context;

        public RepositorioRoles(MailVestDbContext _context)
        {
            context = _context;
        }

        public async Task<CatRoles?> GetRolByIdAsync (int id)
        {
            return await context.CatRoles
                .AsNoTracking()
                .FirstOrDefaultAsync(r => r.Id == id);
        }
        public async Task<List<RolDto>> obtenerTodosRolesAsync()
        {
            var roles = (
                from rols in this.context.Set<CatRoles>()
                where rols.Estatus == true
                select new RolDto
                {
                    Id = rols.Id,
                    Descripcion = rols.Descripcion,
                    ColorFondo = rols.ChipColorFondo,
                    ColorTexto = rols.ChipColorTexto,
                    ColorBorde = rols.ChipColorBorde,
                    Estatus = rols.Estatus
                }).ToListAsync();

            return await roles;
        }

        public async Task ActualizarRolAsync(RolDto updateRol)
        {
            var rol = await context.CatRoles
                .FirstOrDefaultAsync(r => r.Id == updateRol.Id);

            if (rol == null)
            {
                throw new InvalidOperationException($"Rol {updateRol.Descripcion} no existe.");
            }

            rol.Id = updateRol.Id;
            rol.Descripcion = updateRol.Descripcion;
            rol.Estatus = updateRol.Estatus;
            rol.ChipColorBorde = updateRol.ColorBorde;
            rol.ChipColorFondo = updateRol.ColorFondo;
            rol.ChipColorTexto = updateRol.ColorTexto;
        }

        public async Task<bool> ExisteRolByDescripcionAsync(string rolDesc, string rolName)
        {
            return await context.CatRoles
                .AsNoTracking()
                .AnyAsync(r => r.Descripcion == rolDesc || r.Nombre == rolName);
        }

        public async Task<CatRoles> CrearRolAsync(RolCreateDto newRol)
        {
            var entity = new CatRoles
            {
                Descripcion = newRol.Descripcion,
                ChipColorBorde = newRol.ColorBorde,
                ChipColorFondo = newRol.ColorFondo,
                ChipColorTexto = newRol.ColorTexto,
                Estatus = true,
                Nombre = newRol.Nombre
            };

            await context.CatRoles.AddAsync(entity);

            return entity;
        }
    }
}
