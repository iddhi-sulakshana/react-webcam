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

export async function validatePassport(sessionId: string, file: File) {
    const formData = new FormData();
    formData.append("image", file);
    const data = await api.post(`/document/passport/${sessionId}`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return data;
}

export async function validateID(sessionId: string, front: File, back: File) {
    const formData = new FormData();
    formData.append("front_image", front);
    formData.append("back_image", back);
    const data = await api.post(`/document/id-card/${sessionId}`, formData, {
        headers: {
            "Content-Type": "multipart/form-data",
        },
    });
    return data;
}
