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
    public class RepositorioAutenticacion : IRepositorioAutenticacion
    {
        private readonly MailVestDbContext context;

        public RepositorioAutenticacion(MailVestDbContext _context)
        {
            context = _context;
        }

        public async Task<CatUsuarios?> ObtenerUsuariosAsync(string user)
        {
            var resul = await context.CatUsuarios.FirstOrDefaultAsync(u => u.Usuario == user && u.Estatus == true);

            resul!.UltimoIngreso = DateTime.Now;
            await context.SaveChangesAsync();
            
            return resul;
        }
        public async Task<CatRoles?> ObtenerRolesXUserAsync(int idUser)
        {
            var rolUser = (from usuario in this.context.Set<CatUsuarios>()
                           join rolesusuario in this.context.Set<RelRolesxUsuario>()
                           on usuario.Id equals rolesusuario.IdCatUsuario
                           join roles in this.context.Set<CatRoles>()
                           on rolesusuario.IdCatRoles equals roles.Id
                           where usuario.Id == idUser && roles.Estatus == true
                           select roles).FirstOrDefaultAsync();

            return await rolUser;
        }

        public async Task<PermisosUsuario?> ObtenerPermisosxUserAsync(string user)
        {
            PermisosUsuario permisUser = new PermisosUsuario
            {
                SubModulo = await (from userSub in this.context.Set<CatUsuarios>()
                             join rolRelacion in this.context.Set<RelRolesxUsuario>()
                             on userSub.Id equals rolRelacion.IdCatUsuario
                             join subModu in this.context.Set<RelSubModuloxRol>()
                             on rolRelacion.IdCatRoles equals subModu.IdCatRol
                             join detalleSubMod in this.context.Set<CatSubModulo>()
                             on subModu.IdSubModulo equals detalleSubMod.Id
                             where userSub.Usuario == user && detalleSubMod.Estatus == true && subModu.Estatus == true
                             select detalleSubMod).Distinct().ToListAsync(),

                Opciones = await (from userOp in this.context.Set<CatUsuarios>()
                            join rolRelacion in this.context.Set<RelRolesxUsuario>()
                            on userOp.Id equals rolRelacion.IdCatUsuario
                            join relacion in this.context.Set<RelOpcionxRol>()
                            on rolRelacion.IdCatRoles equals relacion.IdCatRol
                            join permisos in this.context.Set<CatOpcion>()
                            on relacion.IdCatOpcion equals permisos.Id
                            where userOp.Usuario == user && permisos.Estatus == true && relacion.Estatus == true
                            select permisos).Distinct().ToListAsync()
            };

            return permisUser;
        }
    }
}
