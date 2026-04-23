import type { EmailDraftDto, EmailDraftUiModel } from "../../Paginas/Correos/EnvioCorreos/Draft/emailDraft.types";
import type { PortalLanguageDto } from "../../Utils/Language/portalLanguages.type";

export function createEmptyDraftUiModel(
    languages: PortalLanguageDto[]
): EmailDraftUiModel {
    return {
        TempalteId: null,
        Inicio: null,
        Fin: null,
        Languages: languages.map((l) => ({
            Code: l.Code,
            Name: l.Name,
            Subject: "",
            Html: "",
            IcsFileName: "",
            IcsBody: "",
        })),
    };
}

export function draftDtoToUiModel(
    dto: EmailDraftDto,
    languages: PortalLanguageDto[]
): EmailDraftUiModel {
    return {
        TempalteId: dto.TemplateId,
        Inicio: dto.Inicio ? new Date(dto.Inicio) : null,
        Fin: dto.Fin ? new Date(dto.Fin) : null,
        Languages: languages.map((l) => {
            const current = dto.Languages?.[l.Code];
            return {
                Code: l.Code,
                Name: l.Name,
                Subject: current?.Subject ?? "",
                Html: current?.Html ?? "",
                IcsFileName: current?.IcsFileName ?? "",
                IcsBody: current?.IcsBody ?? "",
            };
        }),
    };
}

export function draftUiModelToApi(ui: EmailDraftUiModel) {
    return {
        TemplateId: ui.TempalteId,
        Inicio: ui.Inicio ? ui.Inicio.toISOString() : null,
        Fin: ui.Fin ? ui.Fin.toISOString() : null,
        Languages: Object.fromEntries(
            ui.Languages.map((lang) => [
                lang.Code,
                {
                    Subject: lang.Subject ?? "",
                    Html: lang.Html ?? "",
                    IcsFileName: lang.IcsFileName,
                    IcsBody: lang.IcsBody,
                },
            ])
        ),
    };
}