export type LanguageCode = string;

export type EmailDraftLangDto = {
    Subject?: string;
    Html?: string;
    IcsFileName: string;
    IcsBody: string;
};

export type EmailDraftLanguagesDto = Record<LanguageCode, EmailDraftLangDto>;

export type EmailDraftDto = {
    Id: number;
    TemplateId: number | null;
    TemplateName?: string | null;
    Inicio?: string | null;
    Fin?: string | null;
    Languages: EmailDraftLanguagesDto;
};

export type EmailDraftLangFormItem = {
    Code: LanguageCode;
    Name?: string;
    Subject?: string;
    Html?: string;
    IcsFileName: string;
    IcsBody: string;
};

export type EmailDraftUiModel = {
    TempalteId: number | null;
    Inicio: Date | null;
    Fin: Date | null;
    Languages: EmailDraftLangFormItem[];
};