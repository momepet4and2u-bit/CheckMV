using MailVest.Entidades.Dominio.Parametros;
using MailVest.Entidades.Dominio.Parametros.Lenguaje;
using MailVest.Entidades.Modelo;

namespace MailVest.Aplicacion.Parametros_Config
{
    public interface IAdministradorParametros
    {
        Task<List<ParametrosDto>> ObtenerParametrosAsync();
        Task<bool> ExisteParamAsync(string parametro);
        Task ActualizarParametroAsync(int id, ParametrosDto updateParam, string usuario, bool puedeCambiar);
        Task<CatConfiguracion?> GetParamByIdAsync(int id);
        Task CrearParamAsync(ParametrosDto newParam);
        Task<string> ObtenerParametroValorAsync(string parametro);
        Task<List<CatIdioma>> ObtenerLenguajes();
        Task<LengDto?> ObtenerLenguajeAsync(string name, CancellationToken ct);
        Task CrearLengAsync(LengDto lengNew);
    }
}
