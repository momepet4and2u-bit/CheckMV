/* eslint-disable @typescript-eslint/no-explicit-any */
export const allowedExt = new Set(
    import.meta.env.VITE_ALLOWED_ATTACHMENTS?.split(",").map((e: any) => e.trim().toLowerCase()) ?? []
);

export const allowedMimes = new Set(
    import.meta.env.VITE_ALLOWED_ATTACHMENTS_MIMES.split(",").map((m: any) => m.trim().toLowerCase()) ?? []
);

export const iconMap = Object.fromEntries(
    import.meta.env.VITE_ATTACHMENTS_ICON_MAP.split(",").map((p: any) => {
        const [ext, type] = p.split(":");
        return [ext.trim().toLowerCase(), type.trim()];
    }) ?? []
)