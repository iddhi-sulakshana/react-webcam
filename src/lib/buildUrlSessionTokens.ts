import { useTokenStore } from "@/stores/tokenStore";

export default function buildUrlSessionTokens() {
    const sessionId = useTokenStore.getState().sessionId;
    const sessionToken = useTokenStore.getState().sessionToken;
    if (sessionId && sessionToken)
        return `?session_id=${sessionId}&session_token=${sessionToken}`;
    else return "";
}
