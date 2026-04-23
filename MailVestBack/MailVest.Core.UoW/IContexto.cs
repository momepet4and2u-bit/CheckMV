/*
Empresa: 	        Banco del Bajío S.A., Institución de Banca Múltiple
Autor: 		        Alejandro Moreno Guerrero
Fecha creación:	    06/05/2020
*/

using Microsoft.EntityFrameworkCore;
using System;

namespace MailVest.Core.UoW
{
    /// <summary>
    /// Interface para definir un contexto generico de base de datos con EntityFramework
    /// </summary>
    public interface IContexto : IDisposable
    {
        DbSet<TEntidad> Set<TEntidad>() where TEntidad : class;

        int SaveChanges();
    }
}
