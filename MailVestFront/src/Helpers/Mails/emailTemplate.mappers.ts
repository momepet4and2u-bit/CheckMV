import type { EmailTemplateDto, EmailTemplateUiModel, UploadChoice } from "../../Paginas/Correos/emailTemplates.types";
import type { PortalLanguageDto } from "../../Utils/Language/portalLanguages.type";

export function createEmptyTempalteUIModel(
    languages: PortalLanguageDto[]
): EmailTemplateUiModel {
    return {
        Name: "",
        ClickUrl: "",
        ValidoDesde: null,
        ValidoHasta: null,
        UploadChoice: "IMAGE",
        Bloqueado: false,
        Attachments: [],
        Languages: languages.map((lang) => ({
            Code: lang.Code,
            Name: lang.Name,
            Subject: "",
            Html: "",
            ImageUrl: null,
            ImageFile: null,
        })),
    };
}

export function templateDtoToUIModel(
    dto: EmailTemplateDto,
    languages: PortalLanguageDto[]
): EmailTemplateUiModel {
    return {
        Id: dto.Id,
        Name: dto.Name,
        ClickUrl: dto.ClickUrl ?? "",
        ValidoDesde: dto.ValidoDesde ?? null,
        ValidoHasta: dto.ValidoHasta ?? null,
        Bloqueado: dto.Bloqueado,
        UploadChoice: (dto.UploadChoice ?? null) as UploadChoice,
        Attachments: (dto.Attachments ?? []).map((file) => ({
            Id: file.Id,
            FileName: file.FileName,
            FileUrl: file.FileUrl ?? null,
            File: null,
        })),
        Languages: languages.map((lang) => {
            const current = dto.Languages?.[lang.Code];
            return {
                Code: lang.Code,
                Name: lang.Name,
                Subject: current?.Subject ?? "",
                Html: current?.Html ?? "",
                ImageUrl: current?.ImageUrl ?? null,
                ImageFile: null,
            };
        }),
    };
}

export function templateUiModelToApi(
    ui: EmailTemplateUiModel
): Omit<EmailTemplateDto, "Id"> {
    return {
        Name: ui.Name,
        ClickUrl: ui.ClickUrl ?? "",
        ValidoDesde: ui.ValidoDesde ?? null,
        ValidoHasta: ui.ValidoHasta ?? null,
        UploadChoice: ui.UploadChoice ?? null,
        Bloqueado: false,
        Attachments: ui.Attachments?.map((file) => ({
            Id: file.Id,
            FileName: file.FileName,
            FileUrl: file.FileUrl ?? null,
        })),
        Languages: Object.fromEntries(
            ui.Languages.map((lang) => [
                lang.Code,
                {
                    Subject: lang.Subject,
                    Html: lang.Html,
                    ImageUrl: lang.ImageUrl ?? null,
                },
            ])
        ),
    };
}