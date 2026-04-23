/* eslint-disable @typescript-eslint/no-explicit-any */
import API from "../../../../API/ClientApi";

const EmailDraftStore = {
    async lockEdit (id: number) {
        const { data } = await API.post(`/correosDraft/${id}/lockEdit`);
        return data;
    },
    async unlockEdit (id: number) {
        const { data } = await API.post(`/correosDraft/${id}/unlockEdit`);
        return data;
    },
}

export default EmailDraftStore;