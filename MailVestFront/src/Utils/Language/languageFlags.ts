const LANGUAGE_FLAG_MAP: Record<string, string> = {
    ES: '🇲🇽',
    EN: '🇺🇸',
    PT: '🇵🇹',
    DE: '🇩🇪',
    FR: '🇫🇷',
    IT: '🇮🇹'
}

export function getFlagEmoji(code: string) {
    return LANGUAGE_FLAG_MAP[code?.toUpperCase()] ?? '🏴‍☠️';
}