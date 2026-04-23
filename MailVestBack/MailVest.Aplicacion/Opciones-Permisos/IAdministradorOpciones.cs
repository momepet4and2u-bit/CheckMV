using MailVest.Entidades.Modelo;
using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Aplicacion.Opciones_Permisos
{
    public interface IAdministradorOpciones
    {
        Task<List<CatOpcion>> GetPermisoByNameAsync(IEnumerable<string> nombres);
        Task<List<CatOpcion>> GetPermisoByIdAsync(IEnumerable<int> id);
    }
}
