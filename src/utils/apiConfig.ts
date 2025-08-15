export interface SessionData {
    session_id: string;
    verified_image?: string;
    selfie_image?: string;
    id_front_image?: string;
    id_back_image?: string;
    passport_image?: string;
    liveness_image?: string[];
    ocr_data?: Record<string, any>;
    mrz_data?: string;
    face_match?: boolean;
    selfie_verified?: boolean;
    document_confirmed?: boolean;
    liveness_confirmed?: boolean;
    status?: string;
}

export interface SessionDetailsResponse {
    message: string;
    data: {
        session_id: string;
        session_data: SessionData;
    };
}

export interface ApiConfig {
    name: string;
    baseUrl: string;
    wsUrl: string;
}

export const API_CONFIGS: ApiConfig[] = [
    {
        name: "Production",
        baseUrl: "https://api.kycverification.live",
        wsUrl: "wss://api.kycverification.live",
    },
    {
        name: "Local Development",
        baseUrl: "http://localhost:8000",
        wsUrl: "ws://localhost:8000",
    },
];

// Store the selected API config in localStorage
const API_CONFIG_KEY = "kyc_api_config";

export const getApiConfig = (): ApiConfig => {
    try {
        const storedConfig = localStorage.getItem(API_CONFIG_KEY);
        if (storedConfig) {
            const config = JSON.parse(storedConfig);
            // Validate the config exists in our predefined configs
            const validConfig = API_CONFIGS.find((c) => c.name === config.name);
            if (validConfig) {
                return validConfig;
            }
        }
    } catch (error) {
        console.error("Error getting API config from localStorage:", error);
    }

    // Default to production
    return API_CONFIGS[0];
};

export const setApiConfig = (config: ApiConfig): void => {
    try {
        localStorage.setItem(API_CONFIG_KEY, JSON.stringify(config));
    } catch (error) {
        console.error("Error saving API config to localStorage:", error);
    }
};

export const getApiUrl = (endpoint: string): string => {
    const config = getApiConfig();
    return `${config.baseUrl}${endpoint}`;
};

export const getWsUrl = (endpoint: string): string => {
    const config = getApiConfig();
    return `${config.wsUrl}${endpoint}`;
};

// API function to get session details
export const getSessionDetails = async (
    sessionId: string
): Promise<SessionDetailsResponse> => {
    const response = await fetch(getApiUrl("/api/v1/session/session-details"), {
        method: "GET",
        headers: {
            accept: "application/json",
            "X-Session-ID": sessionId,
        },
    });

    if (!response.ok) {
        throw new Error(
            `Failed to get session details: ${response.statusText}`
        );
    }

    return await response.json();
};
