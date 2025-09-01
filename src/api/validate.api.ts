import api from "./api";

export async function validateSelfie(sessionId: string, file: File) {
    const formData = new FormData();
    formData.append("image", file);
    const data = await api.post(`/selfie/${sessionId}`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return data;
}
