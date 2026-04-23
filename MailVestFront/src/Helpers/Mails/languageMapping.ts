import type { LanguageCode, PortalLanguageDto } from "../../Utils/Language/portalLanguages.type";

export function buildLanguageRecord<T>(
    languages: PortalLanguageDto[],
    factory: (lang: PortalLanguageDto) => T
): Record<LanguageCode, T> {
    return Object.fromEntries(
        languages.map((lang) => [lang.Code, factory(lang)])
    );
}

export function languageRecordToArray<T>(
    record: Record<LanguageCode, T> | undefined,
    languages: PortalLanguageDto[]
): Array<{ Code: LanguageCode; Name?: string; Value: T }> {
    return languages.map((lang) => ({
        Code: lang.Code,
        Name: lang.Name,
        Value: record?.[lang.Code] as T,
    }));
}

export function languageArrayToRecord<T extends { Code: LanguageCode }>(
    items: T[]
): Record<LanguageCode, Omit<T, "Code">>{
    return Object.fromEntries(
        items.map(({ Code, ...rest }) => [Code, rest])
    );
}