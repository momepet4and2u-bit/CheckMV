/* eslint-disable @typescript-eslint/no-explicit-any */
import API from "../../../../API/ClientApi";
import { EmailTemplateFormValues } from "./emailTemplate.schema";

export type EmailTemplateLang = {
    Subject: string;
    Html: string;
};

export type EmailTemplate = {
    Id: number;
    Name: string;
    ClickUrl: string;

    ImageUrl?: string;

    ValidoDesde: string;
    ValidoHasta: string;
    CreatedAt: string;

    ES: EmailTemplateLang;
    EN: EmailTemplateLang;

    Bloqueado: boolean;
};

const mapTemplateFormToPayload = (values: EmailTemplateFormValues) => {
    return {
        Name: values.Name,
        ClickUrl: values.ClickUrl,
        ValidoDesde: values.ValidRange?.[0]?.toISOString(),
        ValidoHasta: values.ValidRange?.[1]?.toISOString(),
        UploadChoice: values.UploadChoice,
        Languages: values.Languages.map(l => ({ Code: l.Code, Subject: l.Subject, Html: l.Html })),
        Attachments: values.Attachments.map(a => ({ FileName: a.FileName }))
    };
};

type CreateTemplateInput = {
    payload: any;
    imageFiles: Array<{
        Code: string;
        File: File;
    }>;
    attachmentFiles: Array<{
        FileName: string;
        File: File;
    }>;
};

const pad2 = (n: number) => String(n).padStart(2, "0");
const dateISO = (date: Date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;


const EmailTemplateStore = {

    async list(): Promise<EmailTemplate[]> {
        const response = await API.get<EmailTemplate[]>("/plantillas/all");
        return Array.isArray(response.data) ? response.data : [];
    },

    async getById(id: number): Promise<EmailTemplate | null> {
        const response = await API.get<EmailTemplate>(`/plantillas/${id}`);
        return response.data ?? null;
    },

    async create(values: EmailTemplateDraft): Promise<EmailTemplate> {
        // if (!values.ImagenEN || !values.ImagenES) {
        //     throw new Error("Imagen es requerida");
        // }
        if (!values.ValidRange || !values.ValidRange[0] || !values.ValidRange[1]) {
            throw new Error("Rango de fechas valido, requerido");
        }

        const validFrom = dateISO(values.ValidRange[0]);
        const validTo = dateISO(values.ValidRange[1]);

        const form = new FormData();

        form.append("Name", values.Name.trim());
        form.append("ClickUrl", values.ClickUrl.trim());

        form.append("ValidoDesde", validFrom);
        form.append("ValidoHasta", validTo);

        form.append("ES.Subject", values.ES.Subject);
        form.append("ES.Html", values.ES.Html);

        form.append("EN.Subject", values.EN.Subject);
        form.append("EN.Html", values.EN.Html);


        if (values.ImagenES instanceof File) {
            form.append("imagenES", values.ImagenES, values.ImagenES.name);
        }

        if (values.ImagenEN instanceof File) {
            form.append("imagenEN", values.ImagenEN, values.ImagenEN.name);
        }


        (values.Archivo ?? []).forEach((f) => {
            if (f instanceof File) form.append("ArchivoAd", f, f.name);
        });


        const response = await API.post<EmailTemplate>("/plantillas/createPlantilla", form);

        return response.data;
    },

    async update(id: number, values: EmailTemplateDraft): Promise<EmailTemplate> {
        if (!values.ValidRange || !values.ValidRange[0] || !values.ValidRange[1]) {
            throw new Error("Rango de fechas valido, requerido");
        }

        const validFrom = dateISO(values.ValidRange[0]);
        const validTo = dateISO(values.ValidRange[1]);

        const fd = new FormData();

        fd.append("Name", values.Name.trim());
        fd.append("ClickUrl", values.ClickUrl.trim());

        fd.append("ValidoDesde", validFrom);
        fd.append("ValidoHasta", validTo);

        fd.append("ES.Subject", values.ES.Subject);
        fd.append("ES.Html", values.ES.Html);

        fd.append("EN.Subject", values.EN.Subject);
        fd.append("EN.Html", values.EN.Html);

        if (values.ImagenES) {
            if (values.ImagenES) {
                fd.append("imagenES", values.ImagenES, values.ImagenES.name);
            }
        }
        if (values.ImagenEN) {
            if (values.ImagenEN) {
                fd.append("imagenEN", values.ImagenEN, values.ImagenEN.name);
            }
        }

        (values.Archivo ?? []).forEach((f) => {
            if(f instanceof File) fd.append("ArchivoAd", f, f.name);
        });
        
        (values.DeletedServerUrls ?? []).forEach((url) => {
            fd.append("DeletedServerUrls", url);
        })

        const response = await API.put<EmailTemplate>(`/plantillas/updatePlantilla/${id}`, fd);

        return response.data;
    },

    async remove(id: number): Promise<void> {
        await API.delete(`/plantillas/delete/${id}`);
    },

    async lockEdit(id: number) {
        const { data } = await API.post(`/plantillas/${id}/lockEdit`);
        return data;
    },

    async unlockEdit(id: number) {
        const { data } = await API.post(`/plantillas/${id}/unlockEdit`);
        return data;
    },

    async getPreviewShell(): Promise<string> {
        const resp = await API.get("/plantillas/previewShell", { responseType: "text" as any });
        return (resp.data as any) ?? "";
    },

    async renderPreview(payload: { Lang: "ES" | "EN"; Title: string; HtmlRaw: string; ImageUrl?: string | null }): Promise<string> {
        const resp = await API.post("/plantillas/preview", payload, { responseType: "text" as any });
        return (resp.data as any) ?? "";
    },

    async getPreviewById(id: number, lang: "ES" | "EN"): Promise<string> {
        const resp = await API.get(`/plantillas/${id}/preview`, {
            params: { lang },
            responseType: "text" as any,
        });
        return (resp.data as any) ?? "";
    }
};

export default EmailTemplateStore;