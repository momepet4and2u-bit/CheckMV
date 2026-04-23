using MailVest.Entidades.Dominio.RelPermisoRol;
using MailVest.Entidades.Modelo;
using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Datos.Repositorios.RelPermisosxRol
{
    public interface IRepositorioRelPermisosxRol
    {
        Task<List<string>> ObtenerPermisoxRolAsync(int idRol);
        Task<List<RelOpcionxRol>> GetRelByRolAsync(int idRol);
        Task AgregarRelacionAsync(List<RelOpcionxRol> rel);
    }
}
