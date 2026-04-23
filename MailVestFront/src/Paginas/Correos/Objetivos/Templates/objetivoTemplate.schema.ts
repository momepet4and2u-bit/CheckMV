/* eslint-disable @typescript-eslint/no-explicit-any */
import * as yup from "yup";

const campoConfigSchema = yup.object({
    Visible: yup.boolean().default(true),
    Requerido: yup.boolean().default(false),
    Bloqueado: yup.boolean().default(false),
    // Validación: Si está bloqueado, DEBE tener un valor por defecto en los idiomas
    // Esta parte la validamos más abajo a nivel de "Objetivo"
});

export const objetivoSchema = yup.object({
    Nombre: yup.string().required("El nombre es obligatorio"),
    Status: yup.string().oneOf(["DRAFT", "ACTIVE", "DISABLED"]).default("DRAFT"),
    IdiomaCodigo: yup.string().required("Debes seleccionar un idioma"), // NUEVO
    ListasDistribucion: yup.array().of(yup.string()), // NUEVO
    
    ConfigCampos: yup.object({
        Subject: campoConfigSchema,
        Body: campoConfigSchema,
        UrlReunion: campoConfigSchema,
    }),

    // Ahora el contenido es un objeto simple, no un mapa
    Contenido: yup.object({
        Subject: yup.string().when("$ConfigCampos.Subject", (config: any, schema: any) => {
            return config?.Bloqueado || config?.Requerido ? schema.required("Obligatorio") : schema.nullable();
        }),
        Html: yup.string().when("$ConfigCampos.Body", (config: any, schema: any) => {
            return config?.Bloqueado || config?.Requerido ? schema.required("Obligatorio") : schema.nullable();
        }),
        UrlReunion: yup.string().url("URL inválida").nullable(),
    }),
});
