using MailVest.Entidades.Dominio.DirectorioAprobadores;
using MailVest.Entidades.Modelo;

namespace MailVest.Aplicacion.DirectorioAprobadores
{
    public interface IAdministradorDirectAprobadores
    {
        Task<List<DirectAprobDto>> ObtenerAprobadoresAsync();

        Task<bool> ExisteAprobAsync(string usuario);
        Task<DirectorioAprobacion?> GetAprobadorAsync(int id);
        Task CrearAprobAsync(DirectAprobDto newParam);
        Task ActualizarAprobadorAsync(int id, DirectAprobDto updateParam, string usuario, bool puedeCambiar, bool puedeCambiarDefault, string ip);
        Task<List<DirectorioAprobacion>> GetManyAprobadoresAsync(IEnumerable<int> ids);
        Task<List<DirectorioAprobacion?>> ObtenerAprobadoresDefault();
    }
}
