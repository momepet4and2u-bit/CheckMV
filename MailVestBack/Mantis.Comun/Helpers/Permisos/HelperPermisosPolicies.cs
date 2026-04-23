using System;
using System.Collections.Generic;
using System.Text;
using MailVest.Comun.Constantes.Permisos;

namespace MailVest.Aplicacion.Autenticacion.Permiso.Helper
{
    public static class HelperPermisosPolicies
    {
        public static IEnumerable<(string PolicyName, string CodigoPermiso)> Todas()
        {
            //Configuracion - usuarios
            foreach (var p in Permisos.Configuracion.AdminUsuarios.Todos)
            {
                yield return (p, p);
            }

            //Configuracion - Roles
            foreach (var rol in Permisos.Configuracion.AdminRoles.Todos)
            {
                yield return (rol, rol);
            }
            //Configuracion - Catalogos - Aprobadores
            foreach (var aprob in Permisos.Configuracion.Catalogos.AdminAprobadores.Todos)
            {
                yield return (aprob, aprob);
            }

            //Configuracion - Parametros
            foreach (var para in Permisos.Configuracion.Catalogos.AdminParametros.Todos)
            {
                yield return (para, para);
            }
            //Correos - Plantillas
            foreach (var planti in Permisos.Correos.Plantillas.Todos)
            {
                yield return (planti, planti);
            }

            //Correos - Correos
            foreach (var mail in Permisos.Correos.CorreosC.Todos)
            {
                yield return (mail, mail);
            }

            //Correos - Objetivos
            foreach (var obj in Permisos.Correos.Objetivos.Todos)
            {
                yield return (obj, obj);
            }
        }
    }
}
