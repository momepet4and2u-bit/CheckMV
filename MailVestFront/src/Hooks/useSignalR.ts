import * as signalR from "@microsoft/signalr";

export function createHubConnection(getToken: () => string) {
    return new signalR.HubConnectionBuilder()
        .withUrl(`${import.meta.env.VITE_API_BASE_URL}/hubs/app`, {
            accessTokenFactory: () => getToken() || "",
        })
        .withAutomaticReconnect()
        .build();
}