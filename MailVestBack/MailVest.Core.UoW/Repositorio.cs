/*
Empresa: 	        Banco del Bajío S.A., Institución de Banca Múltiple
Autor: 		        Alejandro Moreno Guerrero
Fecha creación:	    06/05/2020
*/
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;


namespace MailVest.Core.UoW
{
    /// <summary>
    /// Clase genérica para persistencia de datos
    /// </summary>
    /// <typeparam name="TEntidad"></typeparam>
    public class Repositorio<TEntidad> : IRepositorio<TEntidad> where TEntidad : class
    {

        #region Campos
        private IContexto contexto;
        #endregion

        #region Constructores
        public Repositorio(IContexto contexto)
        {
            this.contexto = contexto;
        }
        #endregion

        #region Propiedades
        protected IContexto Contexto
        {
            get { return this.contexto; }
        }
        #endregion

        #region Métodos Publicos

        public void Dispose()
        {
            Disposing(true);
            GC.SuppressFinalize(this);

        }

        protected virtual void Disposing(bool state)
        {
            if (state)
            {
                if (this.contexto != null)
                {
                    this.contexto.Dispose();
                    this.contexto = null;

                }
            }
        }

        public void Crear(TEntidad entidad)
        {
            this.entidad.Add(entidad);
        }

        public void Crear(List<TEntidad> entidades)
        {
            foreach (TEntidad entidad in entidades)
            {
                this.entidad.Add(entidad);
            }

        }

        public void Eliminar(Expression<Func<TEntidad, bool>> expression)
        {
            List<TEntidad> lista = this.Seleccionar(expression);
            foreach (TEntidad item in lista)
            {
                this.entidad.Remove(item);
            }

        }

        public List<TEntidad> Seleccionar(Expression<Func<TEntidad, bool>> expression)
        {
            return this.entidad.Where(expression).ToList();
        }

        public List<TEntidad> SeleccionarTodos()
        {
            return this.entidad.ToList();
        }

        public TEntidad Unico(Expression<Func<TEntidad, bool>> expression)
        {
            return this.entidad.Where(expression).FirstOrDefault();
        }

        public void Actualizar(TEntidad entidad)
        {
            ((DbContext)this.contexto).Entry(entidad).State = EntityState.Modified;
        }

        #endregion

        #region Métodos Privados
        private DbSet<TEntidad> entidad
        {
            get { return this.contexto.Set<TEntidad>(); }

        }
        #endregion
    }
}
