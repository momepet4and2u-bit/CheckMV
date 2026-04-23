using MailVest.Datos.Contexto;
using MailVest.Entidades.Dominio.DirectorioAprobadores;
using MailVest.Entidades.Modelo;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Datos.Repositorios.DirectorioAprobadores
{
    public class RepositorioDirectAprobadores : IRepositorioDirectAprobadores
    {
        private readonly MailVestDbContext db;
        public RepositorioDirectAprobadores(MailVestDbContext _db)
        {
            db = _db;
        }

        public async Task<List<DirectAprobDto>> ObtenerTodosAprobadoresAsync()
        {
            var Aprob = (
                from Aproba in this.db.Set<DirectorioAprobacion>()
                select new DirectAprobDto
                {
                    Id = Aproba.Id,
                    Usuario = Aproba.Usuario,
                    Email = Aproba.Email,
                    UltimoUso = Aproba.UltimoUso,
                    IsDefault = Aproba.IsDefault,
                    Estatus = Aproba.IsEnabled
                }).ToListAsync();
            return await Aprob;
        }
        public async Task<bool> ExisteAprobAsync(string usuario)
        {
            return await db.DirectorioAprobacion.AsNoTracking()
                .AnyAsync(x => x.Usuario == usuario);
        }

        public async Task<DirectorioAprobacion?> GetAprobadorAsync(int id)
        {
            return await db.DirectorioAprobacion.AsNoTracking()
                .FirstOrDefaultAsync(ap => ap.Id == id);
        }
        public async Task CrearAprobAsync(DirectAprobDto newAprob)
        {
            var emailNormalizado = newAprob.Email.Trim().Normalize();
            var entity = new DirectorioAprobacion
            {
                Usuario = newAprob.Usuario,
                Email = newAprob.Email,
                EmailNormalizado = emailNormalizado,
                IsDefault = newAprob.IsDefault,
                IsEnabled = true,
                CreadoEn = DateTime.Now,
            };
            await db.DirectorioAprobacion.AddAsync(entity);
        }
        public async Task ActualzarAprobAsync(int id, DirectAprobDto updateAprob, string usuario)
        {
            var Aprob = await db.DirectorioAprobacion.FirstOrDefaultAsync(ap => ap.Id == id);

            if (Aprob is null)
            {
                throw new InvalidOperationException($"Aprobador {updateAprob.Usuario} no existe.");
            }
            Aprob.IsDefault = updateAprob.IsDefault;
            Aprob.Usuario = updateAprob.Usuario;
            Aprob.Email = updateAprob.Email;
            Aprob.EmailNormalizado = updateAprob.Email.Trim().Normalize();
            Aprob.IsEnabled = updateAprob.Estatus;
            Aprob.Actualizado = DateTime.Now;
            Aprob.UsuarioModifico = usuario;
        }
        public async Task<List<DirectorioAprobacion?>> GetManyAprobadoresAsync(IEnumerable<int> id)
        {
            var set = new HashSet<int>(id);

            #pragma warning disable CS8619 // La nulabilidad de los tipos de referencia del valor no coincide con el tipo de destino
            return await db.Set<DirectorioAprobacion>().Where(x => set.Contains(x.Id) && x.IsEnabled)
                .ToListAsync();
        }
        public async Task<List<DirectorioAprobacion?>> ObtenerAprobadoresDefault()
        {
            return await db.DirectorioAprobacion.Where(x => x.IsDefault).ToListAsync();
        }
    }
}
