export const Permisos = {
    Configuracion: {
        codigo: "Configuracion",
        label: "Configuración",
        icon: "pi pi-cog",
        submodulos: {
            AdminUsuarios: {
                codigo: "AdminUsuarios",
                label: "Usuarios",
                icon: "pi pi-user",
                ruta: "/Usuarios",
                permisos: {
                    Acceso: "AdminUsuarios",
                    Alta: "UserAlta",
                    Baja: "UserBaja",
                    Cambio: "UserCambio",
                    Exportar: "UserExportar"
                }
            },
            AdminRoles: {
                codigo: "AdminRoles",
                label: "Roles",
                icon: "pi pi-address-book",
                ruta: "/Roles",
                permisos: {
                    Acceso: "AdminRoles",
                    Alta: "RolAlta",
                    Baja: "RolBaja",
                    Cambio: "RolCambio",
                    Exportar: "RolExportar"
                }
            },
        Catalogos: {
            codigo: "Catalogos",
            label: "Catalogos",
            icon: "fa-solid fa-folder-tree",
            submodulos: {
                AdminParametros: {
                    codigo: "AdminParametros",
                    label: "Parametros",
                    icon: "fa-solid fa-toolbox",
                    ruta: "/Parametros",
                    permisos: {
                        Acceso: "AdminParametros",
                        Alta: "ParametrosAlta",
                        Baja: "ParametrosBaja",
                        Cambio: "ParametrosCambio",
                    }
                },
                AdminAprobador: {
                    codigo: "AdminAprobadores",
                    label: "Aprobadores",
                    icon: "pi pi-users",
                    ruta: "/Aprobadores",
                    permisos: {
                        Acceso: "AdminAprobadores",
                        Alta: "AprobadorAlta",
                        Baja: "AprobadorBaja",
                        Cambio: "AprobadorCambio",
                        CambioDefault: "AprobadorCambDefault",
                    }
                }
            }
        },
        },
    },
    Correos: {
        codigo: "Correos",
        label: "Correos",
        icon: "pi pi-envelope",
        submodulos: {
            AdminObjetivos: {
                codigo: "AdminObjetivos",
                label: "Objetivos",
                icon: "",
                ruta: "/Objetivos",
                permisos: {
                    Acceso: "AdminObjetivos",
                    Alta: "ObjetivoAlta",
                    Baja: "ObjetivoBaja",
                    Cambio: "ObjetivoCambio"
                }
            },
            AdminPlantillas: {
                codigo: "AdminPlantillas",
                label: "Plantillas",
                icon: "fa-solid fa-envelope-open-text",
                ruta: "/Plantillas",
                permisos: {
                    Acceso: "AdminPlantillas",
                    Alta: "PlantillaAlta",
                    Baja: "PlantillaBaja",
                    Cambio: "PlantillaCambio",
                    Exportar: "PlantillaExportar"
                }
            },
            AdminCorreos: {
                codigo: "AdminCorreos",
                label: "Correos",
                icon: "fa-solid fa-paper-plane",
                ruta: "/Correos",
                permisos: {
                    Acceso: "AdminCorreos",
                    Alta: "CorreoAlta",
                    Envio: "CorreoEnvio",
                    Exportar: "CorreoExportar",
                    Cambio: "CorreoCambio",
                }
            },
        }
    },
} as const;