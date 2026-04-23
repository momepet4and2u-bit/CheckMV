/*
Empresa: 	        Banco del Bajío S.A., Institución de Banca Múltiple
Autor: 		        Alejandro Moreno Guerrero
Fecha creación:	    06/05/2020
*/
using System;
using System.Collections.Generic;
using System.Linq.Expressions;

namespace MailVest.Core.UoW
{   /// <summary>
    /// Clase genérica de aplicación para operaciones con entidades de bases de datos
    /// </summary>
    /// <typeparam name="TEntidad">Clase que representa una entidad de la base de datos</typeparam>
    public class AdministradorGenerico<TEntidad> : IAdministradorGenerico<TEntidad> where TEntidad : class
    {
        private IContexto ProyectoContexto;

        public AdministradorGenerico(IContexto ProyectoContexto)
        {
            this.ProyectoContexto = ProyectoContexto;
        }
        public List<TEntidad> ObtenerCatalogo()
        {
            IRepositorio<TEntidad> repositorio = new Repositorio<TEntidad>(ProyectoContexto);
            return repositorio.SeleccionarTodos();
        }
        public List<TEntidad> ObtenerCatalogo(Expression<Func<TEntidad, bool>> expression)
        {
            IRepositorio<TEntidad> repositorio = new Repositorio<TEntidad>(ProyectoContexto);
            return repositorio.Seleccionar(expression);
        }
        public List<TEntidad> Seleccionar(Expression<Func<TEntidad, bool>> expression)
        {
            IRepositorio<TEntidad> repositorio = new Repositorio<TEntidad>(ProyectoContexto);
            return repositorio.Seleccionar(expression);
        }
        public TEntidad Unico(Expression<Func<TEntidad, bool>> expresion)
        {
            IRepositorio<TEntidad> repositorio = new Repositorio<TEntidad>(ProyectoContexto);
            return repositorio.Unico(expresion);
        }
        public bool InsertarEntidades(List<TEntidad> entidades)
        {
            IRepositorio<TEntidad> repositorio = new Repositorio<TEntidad>(ProyectoContexto);
            repositorio.Crear(entidades);
            return ProyectoContexto.SaveChanges() > 0;
        }
        public bool InsertarEntidad(TEntidad entidad)
        {
            IRepositorio<TEntidad> repositorio = new Repositorio<TEntidad>(ProyectoContexto);
            repositorio.Crear(entidad);
            return ProyectoContexto.SaveChanges() > 0;
        }
        public bool EliminarEntidad(Expression<Func<TEntidad, bool>> expression)
        {
            IRepositorio<TEntidad> repositorio = new Repositorio<TEntidad>(ProyectoContexto);
            repositorio.Eliminar(expression);
            return ProyectoContexto.SaveChanges() > 0;
        }
        public bool ActualizarEntidad(TEntidad entidad)
        {
            IRepositorio<TEntidad> repositorio = new Repositorio<TEntidad>(ProyectoContexto);
            repositorio.Actualizar(entidad);
            return ProyectoContexto.SaveChanges() > 0;
        }

    }
}
