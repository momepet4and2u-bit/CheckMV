/* eslint-disable @typescript-eslint/no-explicit-any */
import * as yup from "yup";

export type UploadChoice = "IMAGE" | "FILE" | any;

export type UpdateTemplateLanguageItemFormValue = {
  Code: string;
  Name?: string;
  Subject: string;
  Html: string;
  ImageUrl?: string | null;
  ImageFile?: File | null;
};

export type UpdateTemplateAttachmentFormItem = {
  Id?: number;
  FileName: string;
  FileUlr?: string | null;
  File?: (File | null | undefined)[];
};

export type EmailTemplateUpdateFormValues = {
  Id?: number;
  Name: string;
  ClickUrl?: string;
  ValidoDesde?: string | null;
  ValidoHasta?: string | null;
  UploadChoice: UploadChoice;
  Attachments: UpdateTemplateAttachmentFormItem[];
  Languages: UpdateTemplateLanguageItemFormValue[];
};

// const optionalImage = yup
//   .mixed<File>()
//   .nullable()
//   .test("fileType", "Formato invalido (jpg/png/webp)", (file) => {
//     if (!file) return true; // ✅ null/undefined es válido

//     if (!(file instanceof File)) return false;
//     return ["image/jpeg", "image/png", "image/webp"].includes(file.type);
//   });

const allowedMimes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-powerpoint"
]);

const allowedExt = new Set(["pdf", "doc", "docx", "ppt", "pptx"]);


// export const emailTemplateUpdateSchema = yup
//   .object({
//     Name: yup.string().trim().required("Nombre es requerido"),
//     ClickUrl: yup.string().trim().required("La URL es requerida").url("La URL no es valida"),

//     ValidRange: yup
//       .array()
//       .of(yup.date().nullable())
//       .length(2, "Selecciona un rango de fechas")
//       .test("range-required", "Selecciona fecha inicio y fin.", (v) => {
//         if (!v) return false;
//         return !!v[0] && !!v[1];
//       })
//       .test("range-order", "La fecha inicio no puede ser mayor a la fecha fin", (v) => {
//         if (!v || !v[0] || !v[1]) return true;
//         return v[0] <= v[1];
//       }) as any,

//     ES: yup.object({
//       Subject: yup.string().trim().required("El asunto en español es requerido"),
//       Html: yup.string().trim().optional(),
//     }).required(),

//     EN: yup.object({
//       Subject: yup.string().trim().required("El asunto en ingles es requerido"),
//       Html: yup.string().trim().optional(),
//     }).required(),

//     ImagenES: optionalImage.optional().nullable(),
//     ImagenEN: optionalImage.optional().nullable(),

//     DeletedServerUrls: yup
//       .array()
//       .of(yup.string().trim().url().min(1))
//       .ensure()
//       .default([]),

//     Archivo: yup.array()
//       .of(
//         yup.mixed<File>()
//           .test("is-file-or-server", "Archivo inválido", (f) => !f || (typeof File !== "undefined" && f instanceof File))
//           .test("fileType", "Formato de archivo inválido", (f: any) => {
//             if (!f) return true;

//             const ext = (f.name.split(".").pop() || "").toLowerCase();
//             const mime = f.type || "";

//             const extOk = allowedExt.has(ext);
//             if (!mime) return extOk;

//             const mimeOk = allowedMimes.has(mime);
//             return mimeOk || extOk;
//           })
//       )
//       .ensure()
//       .default([]),

//     UploadChoice: yup.mixed<"IMAGE" | "FILE">().oneOf(["IMAGE", "FILE"]).optional(),
//   })
//   .test("exclusive-upload-update", function (values) {
//     const hasAnyImage = !!values?.ImagenES || !!values?.ImagenEN;
//     const hasFile = (values?.Archivo?.length ?? 0) > 0;

//     if (hasAnyImage && hasFile) {
//       return this.createError({
//         path: "UploadChoice",
//         message: "No puedes subir imágenes y archivos al mismo tiempo.",
//       });
//     }

//     return true;
//   })
//   .required();

export const updateTemplateLanguageItemSchema: yup.ObjectSchema<UpdateTemplateLanguageItemFormValue> =
  yup.object({
    Code: yup.string().trim().required("El código de idioma es requerido"),
    Name: yup.string().optional(),
    Subject: yup.string().trim().required("El asunto es requerido"),
    Html: yup.string().trim().required("El contenido HTML es requerido"),
    ImageUrl: yup.string().nullable().optional(),
    ImageFile: yup
      .mixed<File>()
      .nullable()
      .test("fileType", "Formato invalido (jpg/png/webp)", (file) => {
        if (!file) return true; // ✅ null/undefined es válido

        if (!(file instanceof File)) return false;
        return ["image/jpeg", "image/png", "image/webp"].includes(file.type);
      })
  });

export const updateTemplateAttachmentSchema: yup.ObjectSchema<UpdateTemplateAttachmentFormItem> = yup.object({
  Id: yup.number().optional(),
  FileName: yup.string().trim().required("El nombre del archivo es requerido"),
  FileUlr: yup.string().nullable().optional(),
  File: yup.array()
    .of(
      yup.mixed<File>().nullable().optional()
        .test("is-file-or-server", "Archivo inválido", (f) => !f || (typeof File !== "undefined" && f instanceof File))
        .test("fileType", "Formato de archivo inválido", (f: any) => {
          if (!f || !(f instanceof File)) return true;

          const ext = (f.name.split(".").pop() || "").toLowerCase();
          const mime = f.type || "";

          const extOk = allowedExt.has(ext);
          if (!mime) return extOk;

          const mimeOk = allowedMimes.has(mime);
          return mimeOk || extOk;
        })
    )
    .ensure()
    .default([]),
});

export const emailTemplateUpdateSchema: yup.ObjectSchema<EmailTemplateUpdateFormValues> = yup.object({
  Id: yup.number().required(),
  Name: yup.string().trim().required("El nombre es requerido"),
  ClickUrl: yup.string().trim().required("La URL es requerida").url("La URL no es válida"),
  ValidoDesde: yup.string().nullable().required("La fecha de inicio es requerida"),
  ValidoHasta: yup.string().nullable().required("La fecha de fin es requerida"),
  UploadChoice: yup.mixed<UploadChoice>().oneOf(["IMAGE", "FILE", null]).nullable().required("Selecciona un modo de carga"),
  Attachments: yup.array().of(updateTemplateAttachmentSchema).required().default([]),
  Languages: yup.array().of(updateTemplateLanguageItemSchema).min(1, "Debe existir al menos un idioma").required("Debe existir al menos un idioma"),
  DeletedServerUrls: yup
    .array()
    .of(yup.string().trim().url().min(1))
    .ensure()
    .default([]),
}).test(
  "unique-languade-codes",
  "No puede haber idiomas duplicados.",
  (value) => {
    if (!value?.Languages) return true;
    const codes = value.Languages.map((x) => x?.Code).filter(Boolean);
    return new Set(codes).size === codes.length;
  }
).test(
  "vlid-date-range",
  "La fecha final debe ser mayor o igual a la fecha inicial.",
  function (value) {
    if (!value?.ValidoDesde || !value?.ValidoHasta) return true;

    const from = new Date(value.ValidoDesde);
    const to = new Date(value.ValidoHasta);

    if (isNaN(from.getTime()) || isNaN(to.getTime())) return true;

    if (from > to) {
      return this.createError({
        path: "ValidoHasta",
        message: "La fecha final debe ser mayor o igual a la fecha inicial."
      });
    }

    return true;
  }
).test(
  "attachments-requires-when-file",
  "Debes cargar al menos un archivo cuando el tipo de carga seleccionado es 'Archivos'.",
  function (value) {
    if (!value || value.UploadChoice !== "FILE") return true;

    if ((value.Attachments ?? []).length === 0) {
      return this.createError({
        path: "Attachments",
        message: "Debes cargar al menos un archivo.",
      });
    }

    return true;
  }
).test(
  "images-requires-when-image",
  "Debes cargar al menos una imagen cuando el tipo de carga seleccionado es 'Imágenes'.",
  function (value) {
    if (!value || value.UploadChoice !== "IMAGE") return true;

    const hasAnyImage = (value.Languages ?? []).some(
      (lang) => !!lang.ImageFile || !!lang.ImageUrl
    );

    if (!hasAnyImage) {
      return this.createError({
        path: "Languages",
        message: "Debes cargar al menos una imagen.",
      });
    }

    return true;
  }

)