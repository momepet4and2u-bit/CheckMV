import API from "../../API/ClientApi";
import type { PortalLanguageDto } from "./portalLanguages.type";

export async function getPortalLanguages(): Promise<PortalLanguageDto[]> {
    const { data } = await API.get<PortalLanguageDto[]>("/parametros/languajes");
    return (data ?? []).filter((x) => x.Enabled !== false).sort((a,b) => (a.Order ?? 999) - (b.Order ?? 999));
}