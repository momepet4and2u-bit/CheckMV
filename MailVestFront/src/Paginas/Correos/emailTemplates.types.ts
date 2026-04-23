
export type LanguageCode = string;

export interface EmailTemplateLangDto {
    Subject: string;
    Html?: string;
    ImageUrl?: string | null;
}

export type TemplateAttachmentDto = {
    Id?: number;
    FileName: string;
    FileUrl?: string | null;
}

export type EmailTemplateLanguagesDto = Record<LanguageCode, EmailTemplateLangDto>;

export type UploadChoice = "IMAGE" | "FILE" | null;

export type EmailTemplateDto = {
    Id: number;
    Name: string;
    ClickUrl?: string | null;
    ValidoDesde?: string | null;
    ValidoHasta?: string | null;
    Bloqueado?: boolean;
    UploadChoice?: UploadChoice;
    Attachments?: TemplateAttachmentDto[];

    Languages: EmailTemplateLanguagesDto;
}

export type EmailTemplateListItemDto = {
    Id: number;
    Name: string;
    ValidoDesde?: string | null;
    ValidoHasta?: string | null;
    Bloqueado?: boolean;
    Attachments?: TemplateAttachmentDto[];
    Languages: EmailTemplateLanguagesDto;
};

export type EmailTemplatePreviewRequest = {
    TemplateId: number;
    Lang: LanguageCode;
};

export type EmailTemplatePreviewResponse = {
    Html: string;
    Subject?: string;
    Lang: LanguageCode;
};

export type EmailTemplateLangFormItem = {
    Code: LanguageCode;
    Name?: string;
    Subject: string;
    Html: string;
    ImageUrl?: string | null;
    ImageFile?: File | null;
};

export type TemplateAttachmentFormItem = {
    Id?: number;
    FileName: string;
    FileUrl?: string | null;
    File?: File | null;
}

export type EmailTemplateUiModel = {
    Id?: number;
    Name: string;
    ClickUrl?: string;
    ValidoDesde?: string | null;
    ValidoHasta?: string | null;
    Bloqueado?: boolean;
    UploadChoice: UploadChoice;
    Attachments?: TemplateAttachmentFormItem[];
    Languages: EmailTemplateLangFormItem[];
}