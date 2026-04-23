import API from "../API/ClientApi";

const toAbsouluteUrl = (path?: string) => {
    if (!path) return "";
    if (/^https?:\/\//i.test(path)) {
        return path;
    }

    const base = (API.defaults.baseURL ?? "").replace(/\/+$/, "") + "/";
    return new URL(path.replace(/^\/+/, ""), base).toString();
}

export default toAbsouluteUrl;