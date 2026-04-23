using MailVest.Entidades.Dominio.DirectorioAprobadores;
using MailVest.Entidades.Modelo;
using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Datos.Repositorios.DirectorioAprobadores
{
    public interface IRepositorioDirectAprobadores
    {
        Task<List<DirectAprobDto>> ObtenerTodosAprobadoresAsync();
        Task<bool> ExisteAprobAsync(string usuario);
        Task ActualzarAprobAsync(int id, DirectAprobDto updateParam, string usuario);
        Task<DirectorioAprobacion?> GetAprobadorAsync(int id);
        Task CrearAprobAsync(DirectAprobDto newAprob);
        Task<List<DirectorioAprobacion?>> GetManyAprobadoresAsync(IEnumerable<int> id);
        Task<List<DirectorioAprobacion?>> ObtenerAprobadoresDefault();


    }
}
