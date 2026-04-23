/*
Empresa: 	        Banco del Bajío S.A., Institución de Banca Múltiple
Autor: 		        Alejandro Moreno Guerrero
Fecha creación:	    06/05/2020
*/
using System;
using System.Collections.Generic;
using System.Linq.Expressions;

namespace MailVest.Core.UoW
{
    /// <summary>
    /// Interface genérica que define las funciones de repositorio para persistencia de datos
    /// </summary>
    /// <typeparam name="TEntidad">Clase representativa del modelo de datos</typeparam>
    public interface IRepositorio<TEntidad> where TEntidad : class
    {
        #region Métodos Públicos
        List<TEntidad> SeleccionarTodos();

        List<TEntidad> Seleccionar(Expression<Func<TEntidad, bool>> expression);

        TEntidad Unico(Expression<Func<TEntidad, bool>> expression);

        void Crear(TEntidad entidad);

        void Crear(List<TEntidad> entidades);

        void Actualizar(TEntidad entidad);

        void Eliminar(Expression<Func<TEntidad, bool>> expression);
        #endregion

    }
}
