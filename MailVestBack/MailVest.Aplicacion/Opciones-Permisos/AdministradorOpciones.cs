using MailVest.Datos.Repositorios.Opciones_Permisos;
using MailVest.Entidades.Modelo;
using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Aplicacion.Opciones_Permisos
{
    public class AdministradorOpciones : IAdministradorOpciones
    {
        private readonly IRepositorioOpciones repoOpcion;

        public AdministradorOpciones(IRepositorioOpciones _repoOpcion)
        {
            repoOpcion = _repoOpcion;
        }

        public async Task<List<CatOpcion>> GetPermisoByNameAsync(IEnumerable<string> nombres)
        {
            return await repoOpcion.GetPermisoByNameAsync(nombres);
        }
        public async Task<List<CatOpcion>> GetPermisoByIdAsync(IEnumerable<int> id)
        {
            return await repoOpcion.GetPermisoByIdAsync(id);
        }
    }
}
