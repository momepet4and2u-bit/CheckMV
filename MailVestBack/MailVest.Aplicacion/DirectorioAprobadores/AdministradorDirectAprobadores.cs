using MailVest.Aplicacion.Bitacoras;
using MailVest.Datos.Repositorios.DirectorioAprobadores;
using MailVest.Datos.Repositorios.UnitOfWork;
using MailVest.Entidades.Dominio.DirectorioAprobadores;
using MailVest.Entidades.Modelo;
using Newtonsoft.Json;
using static MailVest.Entidades.Dominio.Exceptions.ExceptionsCustom;

namespace MailVest.Aplicacion.DirectorioAprobadores
{
    public class AdministradorDirectAprobadores : IAdministradorDirectAprobadores
    {
        private readonly IRepositorioDirectAprobadores allAprob;
        private readonly IRepositorioUnitOfWork saveAll;
        private readonly IAdministradorBitacoras bitacoras;

        public AdministradorDirectAprobadores(IRepositorioDirectAprobadores _allAprob, IRepositorioUnitOfWork _saveAll, IAdministradorBitacoras _bitacoras)
        {
            allAprob = _allAprob;
            saveAll = _saveAll;
            bitacoras = _bitacoras;
        }

        public async Task<List<DirectAprobDto>> ObtenerAprobadoresAsync()
        {
            return await allAprob.ObtenerTodosAprobadoresAsync();
        }
        public async Task<bool> ExisteAprobAsync(string usuario)
        {
            return await allAprob.ExisteAprobAsync(usuario);
        }
        public async Task<DirectorioAprobacion?> GetAprobadorAsync(int id)
        {
            return await allAprob.GetAprobadorAsync(id);
        }

        public async Task CrearAprobAsync(DirectAprobDto newAprob)
        {
            var aprobAll = await ObtenerAprobadoresAsync();
            var cuantosDefa = aprobAll.Count(x => x.IsDefault);
            if (newAprob.IsDefault)
            {
                if (cuantosDefa >= 2)
                {
                    throw new BusinessRuleException("MAX_DEFUALTS", "No se puede marcar como Default. Ya existen 2 aprobadores por default,");
                }
            }
            await allAprob.CrearAprobAsync(newAprob);
            await saveAll.SaveChangesAsync();
        }
        public async Task ActualizarAprobadorAsync(int id, DirectAprobDto updateAprob, string usuario, bool puedeCambiar, bool puedeCambiarDefault, string ip)
        {
            var currentAprob = await GetAprobadorAsync(id);
            await bitacoras.BitacoraMovimientos("Update", "DirectorioAprobacion", " Datos antes de actualizar -> " + JsonConvert.SerializeObject(currentAprob) + "   |  Datos a actualizar -> " + JsonConvert.SerializeObject(updateAprob), usuario, ip);
            if (currentAprob is null)
            {
                await bitacoras.BitacoraMovimientos("Update", "DirectorioAprobacion", "No se actualizo aprobador", usuario, ip);
                return;
            }

            var aprobAll = await ObtenerAprobadoresAsync();
            var cuantosDefa = aprobAll.Where(x => x.IsDefault == true).ToList();
            bool tryChangeDefault = updateAprob.IsDefault != currentAprob.IsDefault;
            if (tryChangeDefault)
            {
                if (tryChangeDefault)
                {
                    if (!puedeCambiarDefault)
                    {
                        updateAprob.IsDefault = currentAprob.IsDefault;
                    }
                }
                if (cuantosDefa.Count() == 2)
                {
                    throw new BusinessRuleException("MAX_DEFUALTS", "No se puede marcar como Default. Ya existen 2 aprobadores por default,");
                }
            }

            bool tryChange = updateAprob.Estatus != currentAprob.IsEnabled;
            if (tryChange)
            {
                if (!puedeCambiar)
                {
                    updateAprob.Estatus = currentAprob.IsEnabled;
                }
            }
            await allAprob.ActualzarAprobAsync(id, updateAprob, usuario);
            await saveAll.SaveChangesAsync();
            var updatedAprob = await GetAprobadorAsync(id);
            await bitacoras.BitacoraMovimientos("Update", "DirectorioAprobacion", " Datos actualizados -> " + JsonConvert.SerializeObject(updatedAprob), usuario, ip);
        }

        public async Task<List<DirectorioAprobacion?>> GetManyAprobadoresAsync(IEnumerable<int> ids)
        {
            return await allAprob.GetManyAprobadoresAsync(ids);
        }
        public async Task<List<DirectorioAprobacion?>> ObtenerAprobadoresDefault()
        {
            return await allAprob.ObtenerAprobadoresDefault();
        }
    }
}
