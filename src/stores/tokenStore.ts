import { create } from "zustand";

interface TokenState {
    sessionId: string | null;
    sessionToken: string | null;
    isAuthenticated: boolean;
    setTokens: (sessionId: string, sessionToken: string) => void;
    clearTokens: () => void;
    validateTokens: () => boolean;
    setIsAuthenticated: (isAuthenticated: boolean) => void;
}

export const useTokenStore = create<TokenState>((set, get) => ({
    sessionId: null,
    sessionToken: null,
    isAuthenticated: false,

    setTokens: (sessionId: string, sessionToken: string) => {
        set({
            sessionId,
            sessionToken,
            isAuthenticated: false,
        });
    },

    setIsAuthenticated: (isAuthenticated: boolean) => {
        set({ isAuthenticated });
    },

    clearTokens: () => {
        set({
            sessionId: null,
            sessionToken: null,
            isAuthenticated: false,
        });
    },

    validateTokens: () => {
        const { sessionId, sessionToken } = get();
        return !!(sessionId && sessionToken);
    },
}));
