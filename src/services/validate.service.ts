import {
    validateID,
    validatePassport,
    validateSelfie,
} from "@/api/validate.api";
import { useTokenStore } from "@/stores/tokenStore";
import { useMutation } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";

export function validateSelfieService() {
    const queryClient = useQueryClient();
    const sessionId = useTokenStore.getState().sessionId;
    const mutation = useMutation({
        mutationFn: (file: File) => validateSelfie(sessionId!, file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sessionDetails"] });
        },
    });
    return mutation;
}

export function validatePassportService() {
    const queryClient = useQueryClient();
    const sessionId = useTokenStore.getState().sessionId;
    const mutation = useMutation({
        mutationFn: (file: File) => validatePassport(sessionId!, file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sessionDetails"] });
        },
    });
    return mutation;
}

export function validateIDService() {
    const queryClient = useQueryClient();
    const sessionId = useTokenStore.getState().sessionId;
    const mutation = useMutation({
        mutationFn: ({ front, back }: { front: File; back: File }) =>
            validateID(sessionId!, front, back),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["sessionDetails"] });
        },
    });
    return mutation;
}
