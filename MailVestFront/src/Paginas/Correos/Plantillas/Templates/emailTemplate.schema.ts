/* eslint-disable @typescript-eslint/no-explicit-any */
import * as yup from "yup";


import { allowedExt, allowedMimes } from "../../../../Helpers/attachmentConfig";

//     Subject: string;
//     Html: string;
// };

// export type UploadChoice = "IMAGE" | "FILE" | any;

// export type EmailTemplateDraft = {
//     Name: string;
//     ClickUrl: string;

//     ValidRange: [Date | null, Date | null] | null;

//     ES: EmailLangForm;
//     EN: EmailLangForm;

//     ImagenES: File | null;
//     ImagenEN: File | null;

//     Archivo: File[];

//     DeletedServerUrls: string[];

//     UploadChoice: UploadChoice;
// }

// const optionalImage = yup
//     .mixed<File>()
//     .nullable()
//     .test("fileType", "Formato invalido (jpg/png/webp)", (file) => {
//         if (!file) return true; // ✅ null/undefined es válido

//         if (!(file instanceof File)) return false;
//         return ["image/jpeg", "image/png", "image/webp"].includes(file.type);
//     });

// export const emailTemplateSchema = yup
//     .object({
//         Name: yup.string().trim().required("Nombre es requerido"),
//         ClickUrl: yup.string().trim().required("La URL es requerida").url("La URL no es valida"),
//         ValidRange: yup
//             .array()
//             .of(yup.date().nullable())
//             .length(2, "Selecciona un rango de fechas")
//             .test("range-required", "Selecciona fecha inicio y fin.", (v) => {
//                 if (!v) return false;
//                 return !!v[0] && !!v[1];
//             })
//             .test("range-order", "La fecha inicio no puede ser mayor a la fecha fin", (v) => {
//                 if (!v || !v[0] || !v[1]) return true;
//                 return v[0] <= v[1];
//                 // eslint-disable-next-line @typescript-eslint/no-explicit-any
//             }) as any,
//         ES: yup.object({
//             Subject: yup.string().trim().required("El asunto en español es requerido"),
//             Html: yup.string().trim().optional(),
//         }).required(),
//         EN: yup.object({
//             Subject: yup.string().trim().required("El asunto en ingles es requerido"),
//             Html: yup.string().trim().optional(),
//         }).required(),

//         ImagenES: optionalImage.optional(),
//         ImagenEN: optionalImage.optional(),

//         Archivo: yup.array()
//             .of(yup.mixed<File>()
//                 .test("is-file", "Archivo inválido", (f) => !f || f instanceof File)
//                 .test("fileType", "Formato de archivo inválido", (f) => {
//                     if (!f) return true;

//                     const ext = f.name.split(".").pop()?.toLocaleLowerCase() ?? "";
//                     const mimeOk = f.type ? allowedMimes.has(f.type.toLowerCase()) : false;
//                     const extOk = allowedExt.has(ext);

//                     if (!f.type) return extOk;     // fallback si viene vacío
//                     return mimeOk || extOk;
//                 })
//             ).ensure()
//             .default([]),
//         UploadChoice: yup
//             .mixed<"IMAGE" | "FILE">()
//             .oneOf(["IMAGE", "FILE"], "Selecciona si subirás imágenes o archivos")
//             .required("Selecciona un modo de carga"),

//     }).test("upload-choice-enforced", function (values) {
//         const choice = values?.UploadChoice;

//         const hasAnyImage = !!values?.ImagenES || !!values?.ImagenEN;
//         const hasFile = (values?.Archivo?.length ?? 0) > 0;

//         // Regla de exclusividad estricta
//         if (hasAnyImage && hasFile) {
//             return this.createError({
//                 path: "UploadChoice",
//                 message: "No puedes subir imágenes y archivos al mismo tiempo. Selecciona solo uno.",
//             });
//         }

//         if (choice === "IMAGE") {
//             if (hasAnyImage) return true;
//             return this.createError({
//                 path: "UploadChoice",
//                 message: "En modo Imágenes debes subir al menos una imagen (ES o EN).",
//             });
//         }

//         if (choice === "FILE") {
//             if (hasFile) return true;
//             return this.createError({
//                 path: "UploadChoice",
//                 message: "En modo Archivos debes subir al menos un archivo.",
//             });
//         }

//         return this.createError({
//             path: "UploadChoice",
//             message: "Selecciona si subirás imágenes o archivos.",
//         });
//     })

//     .required();



// // export const emailTemplateUpdateSchema = emailTemplateSchema.shape({
// //     ImagenES: optionalImage,
// //     ImagenEN: optionalImage,
// // });
export type UploadChoice = "IMAGE" | "FILE" | any;

export type TemplateLanguageItemFormValues = {
    Code: string;
    Name?: string;
    Subject: string;
    Html?: string;
    ImageUrl?: string | null;
    ImageFile?: File | null;
};

export type TemplateAttachmentFormItem = {
    Id?: number;
    FileName: string;
    FileUlr?: string | null;
    File?: File | null | undefined;
};

export type EmailTemplateFormValues = {
    Name: string;
    ClickUrl: string;
    ValidRange: [Date | null, Date | null] | null;
    UploadChoice: UploadChoice;
    Attachments: TemplateAttachmentFormItem[];
    Languages: TemplateLanguageItemFormValues[];
};

export const templateLanguageItemSchema: yup.ObjectSchema<TemplateLanguageItemFormValues> = yup.object({
    Code: yup
        .string()
        .trim()
        .required("El código de idioma es requerido"),
    Name: yup.string().optional(),
    Subject: yup.string().trim().required("El asunto es requerido"),
    Html: yup.string().trim().optional(),
    ImageUrl: yup.string().nullable().optional(),
    ImageFile: yup
        .mixed<File>()
        .nullable()
        .test("fileType", "Formato invalido (jpg/png/webp)", (file) => {
            debugger;
            if (!file) return true; // ✅ null/undefined es válido

            if (!(file instanceof File)) return false;
            return ["image/jpeg", "image/png", "image/webp"].includes(file.type);
        })
});

export const templateAttachmentSchema: yup.ObjectSchema<TemplateAttachmentFormItem> = yup.object({
    Id: yup.number().optional(),
    FileName: yup.string().trim().required("El nombre del archivo es requerido"),
    FileUlr: yup.string().nullable().optional(),
    File: yup.mixed<File>()
        .nullable()
        .optional()
        .test("is-file", "Archivo inválido", (f) => f === null || f === undefined || f instanceof File)
        .test("fileType", "Formato de archivo inválido", (f) => {
            debugger;
            if (!f || !(f instanceof File)) return true;

            const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
            const mimeOk = f.type ? allowedMimes.has(f.type.toLowerCase()) : false;
            const extOk = allowedExt.has(ext);

            return f.type ? (mimeOk || extOk) : extOk;
        }),
});

export const emailTemplateSchema: yup.ObjectSchema<EmailTemplateFormValues> = yup.object({
    Name: yup.string().trim().required("El nombre es requerido."),
    ClickUrl: yup.string().trim().required("La URL es requerida.").url("La URL no es válida."),
    ValidRange: yup
        .mixed<[Date | null, Date | null]>()
        .nullable()
        .test("range-required", "Selecciona fecha inicio y fin.", (v) => {
            if (!v) return false;
            return !!v[0] && !!v[1];
        })
        .test("range-order", "La fecha inicio no puede ser mayor a la fecha fin", (v) => {
            if (!v || !v[0] || !v[1]) return true;
            return v[0] <= v[1];
        })
        .required("El rango es requerido"),
    UploadChoice: yup.mixed<UploadChoice>().oneOf(["IMAGE", "FILE"]).required("Selecciona un modo de carga"),
    Attachments: yup.array().of(templateAttachmentSchema).required().default([]),
    Languages: yup.array().of(templateLanguageItemSchema).min(1, "Debe existir al menos un idioma.").required("Debe existir al menos un idioma.")
}).test(
    "attachments-required-when-file",
    "Debes cargar al menos un archivo cuando el tipo de carga seleccionado es 'Archivos'.",
    function (v) {
        debugger;
        if (!v || v.UploadChoice !== "FILE") return true;

        if ((v.Attachments ?? []).length === 0) {
            return this.createError({
                path: "Attachments",
                message: "Debes cargar al menos un archivo.",
            });
        }

        return true;
    }
).test(
    "images-required-when-image",
    "Debes cargar al menos una imagen cuando el tipo de carga seleccionado es 'Imágenes'.",
    function (v) {
        debugger;
        if (!v || v.UploadChoice !== "IMAGE") return true;

        const hasAnyImage = (v.Languages ?? []).some(
            (lang) => !!lang.ImageFile || !!lang.ImageUrl
        );

        if (!hasAnyImage) {
            return this.createError({
                path: "Images",
                message: "Debes cargar al menos una imagen.",
            });
        }

        return true;
    }
);