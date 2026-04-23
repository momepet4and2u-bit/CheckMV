using MailVest.Entidades.Modelo;
using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Datos.Repositorios.Opciones_Permisos
{
    public interface IRepositorioOpciones
    {
        Task<List<CatOpcion>> GetPermisoByNameAsync(IEnumerable<string> nombres);
        Task<List<CatOpcion>> GetPermisoByIdAsync(IEnumerable<int> ids);
    }
}
