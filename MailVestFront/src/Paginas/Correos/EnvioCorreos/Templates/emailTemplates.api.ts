/* eslint-disable @typescript-eslint/no-explicit-any */
import API from "../../../../API/ClientApi";
import type AprobadoresCat from "../../../Aprobadores/Modelos/AprobadoresCat";
import type { EmailTemplateDto } from "../../emailTemplates.types";

export async function fetchAllPlantillas(signal?: AbortSignal): Promise<EmailTemplateDto[]>{
    const response = await API.get("/plantillas/all", { signal });
    const arr = Array.isArray(response.data) ? response.data : [];
    const data: EmailTemplateDto[] = arr.map((t: any) => {
        return {
            ...t,
            UploadChoice: (t.ImageUrlEN == null && t.ImageUrlES == null) ? "FILE" : "IMAGE"
        }
    });
    return data;
}

export async function fetchAprobadores(signal?: AbortSignal): Promise<number>{
    const response = await API.get("/parametros/AutorizadoresCorreos", { signal });
    const data = Number(response.data);
    return Number.isFinite(data) ? data : 2;
}

export async function fetchAllAprobadores(signal?: AbortSignal): Promise<AprobadoresCat[]>{
    const response = await API.get("/aprobadores/all", { signal });
    const arr = Array.isArray(response.data) ? response.data : [];
    return arr;
}