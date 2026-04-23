using System;
using System.Collections.Generic;
using System.Text;

namespace MailVest.Comun.Constantes.Permisos
{
    public static class Permisos
    {

        public static class Configuracion
        {
            public static class AdminUsuarios
            {
                public const string Alta = "UserAlta";
                public const string Baja = "UserBaja";
                public const string Cambio = "UserCambio";
                public const string Exportar = "UserExportar";

                public static readonly string[] Todos =
                {
                    Alta,
                    Baja,
                    Cambio,
                    Exportar,
                };
            }

            public static class AdminRoles
            {
                public const string Alta = "RolAlta";
                public const string Baja = "RolBaja";
                public const string Cambio = "RolCambio";
                public const string Exportar = "RolExportar";
                public static readonly string[] Todos =
                    {
                    Alta,
                    Baja,
                    Cambio,
                    Exportar,
                };
            }
            public static class Catalogos
            {
                public static class AdminParametros
                {
                    public const string Alta = "ParametrosAlta";
                    public const string Baja = "ParametrosBaja";
                    public const string Cambio = "ParametrosCambio";
                    public static readonly string[] Todos = {
                    Alta,
                    Baja,
                    Cambio,
                    };
                }
                public static class AdminAprobadores
                {
                    public const string Alta = "AprobadorAlta";
                    public const string Baja = "AprobadorBaja";
                    public const string Cambio = "AprobadorCambio";
                    public const string CambioDefault = "AprobadorCambDefault";
                    public static readonly string[] Todos =
                    {
                        Alta,
                        Baja,
                        Cambio,
                        CambioDefault
                    };
                }
            }
        }

        public static class Correos
        {
            public static class Objetivos
            {
                public const string Alta = "ObjetivoAlta";
                public const string Cambio = "ObjetivoCambio";
                public const string Baja = "ObjetivoBaja";
                public static readonly string[] Todos =
                {
                    Alta,
                    Baja,
                    Cambio
                };
            }
            public static class Plantillas
            {
                public const string Alta = "PlantillaAlta";
                public const string Cambio = "PlantillaCambio";
                public const string Exportar = "PlantillaExportar";
                public const string Baja = "PlantillaBaja";
                public static readonly string[] Todos =
                {
                    Alta,
                    Baja,
                    Cambio,
                    Exportar,
                };
            }
            public static class CorreosC
            {
                public const string Alta = "CorreoAlta";
                public const string Cambio = "CorreoCambio";
                public const string Exportar = "CorreoExportar";
                public const string Envio = "CorreoEnvio";
                public const string Editar = "CorreoEditar";
                public static readonly string[] Todos =
                {
                    Alta,
                    Cambio,
                    Exportar,
                    Envio,
                    Editar,
                };
            }
        }
    }
}
