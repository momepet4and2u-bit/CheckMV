import { iconMap } from "./attachmentConfig"

export const resolveFileIcon = (ext:string) => {
    const type = iconMap[ext.toLowerCase()];

    switch(type) {
        case "file-pdf":
            return "pi pi-file-pdf text-red-500";
        case "file-word":
            return "pi pi-file-word text-blue-500";
        case "file-ppt":
            return "pi pi-file-powerpoint text-yellow-500";
        default:
            return "pi pi-file";
    }
};