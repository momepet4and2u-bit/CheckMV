export type LanguageCode = string;

export type PortalLanguageDto = {
    Code: LanguageCode;
    Name: string;
    IsDefault?: boolean;
    Enabled?: boolean;
    Order?: number;
};