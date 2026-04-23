using MailVest.Core.UoW;
using MailVest.Datos.Contexto;
using MailVest.Entidades.Dominio.Parametros;
using MailVest.Entidades.Dominio.Parametros.Lenguaje;
using MailVest.Entidades.Modelo;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Datos.Repositorios.Parametros_Config
{
    public class RepositorioParametros : IRepositorioParametros
    {
        private readonly MailVestDbContext db;

        public RepositorioParametros(MailVestDbContext _db)
        {
            db = _db;
        }

        public async Task<List<ParametrosDto>> ObtenerTodosParametrosAsync()
        {
            var parametros = (
                from param in this.db.Set<CatConfiguracion>()
                select new ParametrosDto
                {
                    Id = param.Id,
                    Descripcion = param.Descripcion,
                    Parametro = param.Parametro,
                    Valor = param.Valor,
                    Estatus = param.Estatus,
                }).ToListAsync();
            return await parametros;
        }
        public async Task<bool> ExisteParamAsync(string parametro)
        {
            return await db.CatConfiguracion
                .AsNoTracking()
                .AnyAsync(p => p.Parametro == parametro);
        }
        public async Task<string> ObtenerParametroAsync(string parametro)
        {

            return await db.CatConfiguracion
                .AsNoTracking()
                .Where(x => x.Parametro == parametro)
                .Select(x => x.Valor)   // ajusta el nombre del campo (p.ej. Valor)
                .FirstOrDefaultAsync();

        }
        public async Task CrearParamAsync(ParametrosDto newParam)
        {
            var entity = new CatConfiguracion
            {
                Parametro = newParam.Parametro,
                Descripcion = newParam.Descripcion,
                Valor = newParam.Valor,
                Estatus = true,
                Fecha_Creacion = DateTime.Now,
            };
            await db.CatConfiguracion.AddAsync(entity);
        }

        public async Task<CatConfiguracion?> GetParamByIdAsync(int id)
        {
            return await db.CatConfiguracion.AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == id);
        }
        
        public async Task ActualizarParamAsync(int id, ParametrosDto updateParam, string usuario)
        {
            var param = await db.CatConfiguracion.FirstOrDefaultAsync(p => p.Id == id);

            if (param == null)
            {
                throw new InvalidOperationException($"Parametro {updateParam.Parametro} no existe.");
            }
            param.Parametro = updateParam.Parametro;
            param.Descripcion = updateParam.Descripcion;
            param.Estatus = updateParam.Estatus;
            param.Valor = updateParam.Valor;
            param.Fecha_Modificacion = DateTime.Now;
            param.UsuarioModifica = usuario;
        }
        public async Task<List<CatIdioma>> ObtenerLenguajes()
        {
            var leng = await db.CatLenguajes.AsNoTracking().ToListAsync();
            return leng;
        }
        public async Task<LengDto?> ObtenerLenguajeAsync(string name, CancellationToken ct)
        {
            var leng = await db.CatLenguajes.Where(x => x.Name == name).FirstOrDefaultAsync();
            if(leng == null)
            {
                return null;
            }
            var lengR = new LengDto {
                Code = leng.Code,
                Name = leng.Name,
                IsDefault = leng.IsDefault,
                Order = leng.Order,
            };
            return lengR;
        }
        public async Task CrearLengAsync(LengDto lengNew)
        {
            var entity = new CatIdioma
            {
                Code = lengNew.Code,
                Name = lengNew.Name,
                IsDefault = lengNew.IsDefault,
                Order = lengNew.Order,
            };
            await db.AddAsync(entity);
            await db.SaveChangesAsync();
        }
    }
}
