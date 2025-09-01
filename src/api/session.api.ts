import api from "./api";

export async function validateSession(sessionId: string) {
    const data = await api.post(`/session/validate-session/${sessionId}`);
    return data;
}

export async function getSessionDetails(sessionId: string) {
    const data = await api.get(`/session/get-session/${sessionId}`);
    return data;
}
