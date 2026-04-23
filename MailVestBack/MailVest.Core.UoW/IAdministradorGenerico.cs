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
    public interface IAdministradorGenerico<TEntidad> where TEntidad : class
    {
        public List<TEntidad> ObtenerCatalogo();
        public List<TEntidad> ObtenerCatalogo(Expression<Func<TEntidad, bool>> expression);
        public List<TEntidad> Seleccionar(Expression<Func<TEntidad, bool>> expression);
        public TEntidad Unico(Expression<Func<TEntidad, bool>> expression);
        public bool InsertarEntidad(TEntidad entidad);
        public bool InsertarEntidades(List<TEntidad> entidades);
        public bool EliminarEntidad(Expression<Func<TEntidad, bool>> expression);
        public bool ActualizarEntidad(TEntidad entidad);


    }
}

