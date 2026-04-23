using MailVest.Entidades.Dominio.Parametros;
using MailVest.Entidades.Dominio.Parametros.Lenguaje;
using MailVest.Entidades.Dominio.Rol;
using MailVest.Entidades.Modelo;
using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Datos.Repositorios.Parametros_Config
{
    public interface IRepositorioParametros
    {
        Task<List<ParametrosDto>> ObtenerTodosParametrosAsync();
        Task<bool> ExisteParamAsync(string parametro);
        Task ActualizarParamAsync(int id, ParametrosDto updateParam, string usuario);
        Task<CatConfiguracion?> GetParamByIdAsync(int id);
        Task CrearParamAsync(ParametrosDto newParam);
        Task<string> ObtenerParametroAsync(string parametro);
        Task<List<CatIdioma>> ObtenerLenguajes();
        Task<LengDto?> ObtenerLenguajeAsync(string name, CancellationToken ct);
        Task CrearLengAsync(LengDto lengNew);
    }
}
