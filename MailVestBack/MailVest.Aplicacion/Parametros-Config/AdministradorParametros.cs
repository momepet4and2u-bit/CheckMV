using MailVest.Datos.Repositorios.Parametros_Config;
using MailVest.Datos.Repositorios.UnitOfWork;
using MailVest.Entidades.Dominio.Parametros;
using MailVest.Entidades.Dominio.Parametros.Lenguaje;
using MailVest.Entidades.Modelo;
using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Aplicacion.Parametros_Config
{
    public class AdministradorParametros : IAdministradorParametros
    {

        private readonly IRepositorioParametros allParam;
        private readonly IRepositorioUnitOfWork saveAll;

        public AdministradorParametros(IRepositorioParametros _allParam, IRepositorioUnitOfWork _saveAll)
        {
            allParam = _allParam;
            saveAll = _saveAll;
        }
        public async Task<List<ParametrosDto>> ObtenerParametrosAsync()
        {
            var pa = await allParam.ObtenerTodosParametrosAsync();

            return pa;
        }
        public async Task<string> ObtenerParametroValorAsync(string parametro)
        {
            var parametroSearch = await allParam.ObtenerParametroAsync(parametro);
            return parametroSearch;
        }
        public async Task<bool> ExisteParamAsync(string parametro)
        {
            return await allParam.ExisteParamAsync(parametro);
        }
        public async Task CrearParamAsync(ParametrosDto newParam)
        {
            await allParam.CrearParamAsync(newParam);
            await saveAll.SaveChangesAsync();
        }

        public async Task<CatConfiguracion?> GetParamByIdAsync(int id)
        {
            return await allParam.GetParamByIdAsync(id);
        }

        public async Task ActualizarParametroAsync(int id, ParametrosDto updateParam, string usuario, bool puedeCambiar = false)
        {
            var currentParam = await GetParamByIdAsync(id);
            
            if (currentParam is null)
            {
                return;
            }

            bool tryChangeEstatus = updateParam.Estatus != currentParam.Estatus;
            if (tryChangeEstatus)
            {
                if (!puedeCambiar)
                {
                    updateParam.Estatus = currentParam.Estatus;
                }
            }

            await allParam.ActualizarParamAsync(id, updateParam, usuario);
            await saveAll.SaveChangesAsync();
        }
        public async Task<List<CatIdioma>> ObtenerLenguajes()
        {
            return await allParam.ObtenerLenguajes();
        }
        public async Task<LengDto?> ObtenerLenguajeAsync(string name, CancellationToken ct)
        {
            return await allParam.ObtenerLenguajeAsync(name, ct);
        }
        public async Task CrearLengAsync(LengDto lengNew)
        {
            await allParam.CrearLengAsync(lengNew);
        }
    }
}
