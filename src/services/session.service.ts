import { getSessionDetails, validateSession } from "@/api/session.api";
import { useQuery } from "@tanstack/react-query";
import { useTokenStore } from "@/stores/tokenStore";

export function validateSessionService() {
    const sessionId = useTokenStore.getState().sessionId;
    const query = useQuery({
        queryKey: ["sessionValidate"],
        queryFn: () => validateSession(sessionId!),
        enabled: !!sessionId,
        refetchInterval: 1000 * 60 * 5, // 5 minutes
    });

    return query;
}

export function getSessionDetailsService() {
    const isAuthenticated = useTokenStore.getState().isAuthenticated;
    const sessionId = useTokenStore.getState().sessionId;
    const query = useQuery({
        queryKey: ["sessionDetails"],
        queryFn: () => getSessionDetails(sessionId!),
        enabled: isAuthenticated && !!sessionId,
    });

    return query;
}
