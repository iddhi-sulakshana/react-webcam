import {
    CreditCard,
    ScanFace,
    UserCircle,
    RefreshCw,
    Upload,
    Settings,
    Download,
} from "lucide-react";
import { useState, useEffect } from "react";
import UploadIdModal from "./UploadIdModal";
import LivenessCheck from "./LivenessCheck";
import UploadSelfieModal from "./UplaodSelfieModal"; // <-- Make sure this exists
import { toast } from "react-toastify";
import FinalReviewModal from "./FinalReviewModal";
import {
    API_CONFIGS,
    getApiConfig,
    setApiConfig,
    getApiUrl,
    getSessionDetails,
} from "../utils/apiConfig";
import type { SessionData, ApiConfig } from "../utils/apiConfig";

export default function VerificationSteps() {
    const [isOpenIdModal, setIsOpenIdModal] = useState(false);
    const [isOpenLivenessCheck, setIsOpenLivenessCheck] = useState(false);
    const [isOpenSelfieModal, setIsOpenSelfieModal] = useState(false);
    const [isFinalReviewOpen, setIsFinalReviewOpen] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(
        "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
    );
    const [sessionInputValue, setSessionInputValue] = useState<string>(
        sessionId || ""
    );
    const [isGeneratingSession, setIsGeneratingSession] = useState(false);

    const [idImage, setIdImage] = useState<
        | {
              front: string;
              back: string;
          }
        | {
              passport: string;
          }
        | null
    >(null);
    const [documentVerified, setDocumentVerified] = useState(false);
    const [livenessPassed, setLivenessPassed] = useState(false);
    const [selfieImage, setSelfieImage] = useState<string | null>(null);

    // API Configuration state
    const [currentApiConfig, setCurrentApiConfig] = useState<ApiConfig>(
        getApiConfig()
    );
    const [showApiSelector, setShowApiSelector] = useState(false);

    // Session details state
    const [sessionData, setSessionData] = useState<SessionData | null>(null);
    const [isLoadingSessionDetails, setIsLoadingSessionDetails] =
        useState(false);

    // Load session details when sessionId changes
    useEffect(() => {
        const loadSessionDetails = async () => {
            if (
                !sessionId ||
                sessionId === "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            )
                return;

            setIsLoadingSessionDetails(true);
            try {
                const response = await getSessionDetails(sessionId);
                setSessionData(response.data.session_data);

                // Pre-populate UI based on session data
                if (response.data.session_data.selfie_image) {
                    setSelfieImage(response.data.session_data.selfie_image);
                }

                // Handle ID images (front and back)
                if (
                    response.data.session_data.id_front_image &&
                    response.data.session_data.id_back_image
                ) {
                    setIdImage({
                        front: response.data.session_data.id_front_image,
                        back: response.data.session_data.id_back_image,
                    });
                }

                // Handle passport images
                if (response.data.session_data.passport_image) {
                    setIdImage({
                        passport: response.data.session_data.passport_image,
                    });
                }

                // Set document verification status
                if (response.data.session_data.document_confirmed) {
                    setDocumentVerified(true);
                }

                if (response.data.session_data.liveness_confirmed) {
                    setLivenessPassed(true);
                }

                toast.success("Session details loaded successfully!");
            } catch (error) {
                console.error("Error loading session details:", error);
                toast.error(
                    "Failed to load session details. Session may not exist."
                );
            } finally {
                setIsLoadingSessionDetails(false);
            }
        };

        loadSessionDetails();
    }, [sessionId]);

    // Handle API config change
    const handleApiConfigChange = (config: ApiConfig) => {
        setApiConfig(config);
        setCurrentApiConfig(config);
        setShowApiSelector(false);
        toast.success(`Switched to ${config.name} API`);
    };

    // API function to create a new session
    const createNewSession = async () => {
        setIsGeneratingSession(true);
        try {
            const response = await fetch(
                getApiUrl("/api/v1/session/create-session"),
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            if (!response.ok) {
                throw new Error("Failed to create session");
            }

            const data = await response.json();
            const newSessionId = data.data.session_id;
            setSessionId(newSessionId);
            setSessionInputValue(newSessionId);
            toast.success("New session created successfully!");
        } catch (error) {
            console.error("Error creating session:", error);
            toast.error("Failed to create new session. Please try again.");
        } finally {
            setIsGeneratingSession(false);
        }
    };

    const handleSessionIdSubmit = () => {
        if (sessionInputValue.trim()) {
            setSessionId(sessionInputValue.trim());
            toast.success("Session ID updated successfully!");
        } else {
            toast.error("Please enter a valid session ID");
        }
    };

    console.log("Session ID:", sessionId);
    return (
        <div className="w-full bg-white rounded-2xl shadow-lg p-4 sm:p-6 sm:px-10 mb-6">
            <div className="text-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Let's get you verified
                </h2>
                <p className="text-gray-600 text-sm">
                    Follow the simple steps below
                </p>
            </div>

            {/* API Configuration Selector */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                        API Environment
                    </span>
                    <button
                        onClick={() => setShowApiSelector(!showApiSelector)}
                        className="p-1 hover:bg-gray-200 rounded"
                    >
                        <Settings className="w-4 h-4 text-gray-600" />
                    </button>
                </div>
                <div className="text-xs text-gray-600">
                    Current: {currentApiConfig.name} ({currentApiConfig.baseUrl}
                    )
                </div>

                {showApiSelector && (
                    <div className="mt-3 space-y-2">
                        {API_CONFIGS.map((config) => (
                            <button
                                key={config.name}
                                onClick={() => handleApiConfigChange(config)}
                                className={`w-full p-2 text-left text-sm rounded border ${
                                    currentApiConfig.name === config.name
                                        ? "bg-blue-100 border-blue-300 text-blue-800"
                                        : "bg-white border-gray-200 hover:bg-gray-50"
                                }`}
                            >
                                <div className="font-medium">{config.name}</div>
                                <div className="text-xs text-gray-500">
                                    {config.baseUrl}
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Session ID Management */}
            <div className="mb-6 space-y-3">
                <div className="text-center">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                        Session Management
                    </p>
                </div>

                {/* Current Session ID Display */}
                <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-gray-500 font-medium">
                            Current Session ID
                        </p>
                        {sessionId &&
                            sessionId !==
                                "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" && (
                                <button
                                    onClick={() => window.location.reload()}
                                    disabled={isLoadingSessionDetails}
                                    className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800 disabled:text-gray-400"
                                >
                                    <Download
                                        className={`w-3 h-3 ${
                                            isLoadingSessionDetails
                                                ? "animate-spin"
                                                : ""
                                        }`}
                                    />
                                    <span>
                                        {isLoadingSessionDetails
                                            ? "Loading..."
                                            : "Reload"}
                                    </span>
                                </button>
                            )}
                    </div>
                    <p className="text-sm font-mono text-gray-800 break-all">
                        {sessionId || "No session ID"}
                    </p>
                </div>

                {/* Session Details Display */}
                {sessionData && (
                    <div className="bg-blue-50 p-3 rounded-lg">
                        <p className="text-xs text-blue-600 font-medium mb-2">
                            Session Status
                        </p>
                        <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                                <span>Selfie:</span>
                                <span
                                    className={
                                        sessionData.selfie_verified
                                            ? "text-green-600"
                                            : "text-gray-500"
                                    }
                                >
                                    {sessionData.selfie_verified
                                        ? "✅ Verified"
                                        : "⬜ Pending"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Document:</span>
                                <span
                                    className={
                                        sessionData.document_confirmed
                                            ? "text-green-600"
                                            : "text-gray-500"
                                    }
                                >
                                    {sessionData.document_confirmed
                                        ? "✅ Confirmed"
                                        : "⬜ Pending"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Liveness:</span>
                                <span
                                    className={
                                        sessionData.liveness_confirmed
                                            ? "text-green-600"
                                            : "text-gray-500"
                                    }
                                >
                                    {sessionData.liveness_confirmed
                                        ? "✅ Passed"
                                        : "⬜ Pending"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Face Match:</span>
                                <span
                                    className={
                                        sessionData.face_match
                                            ? "text-green-600"
                                            : "text-gray-500"
                                    }
                                >
                                    {sessionData.face_match
                                        ? "✅ Matched"
                                        : "⬜ Pending"}
                                </span>
                            </div>
                            {sessionData.status && (
                                <div className="flex justify-between font-medium">
                                    <span>Status:</span>
                                    <span className="text-blue-600">
                                        {sessionData.status}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Session ID Input */}
                <div className="space-y-2">
                    <input
                        type="text"
                        placeholder="Enter session ID"
                        value={sessionInputValue}
                        onChange={(e) => setSessionInputValue(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="flex space-x-2">
                        <button
                            onClick={handleSessionIdSubmit}
                            className="flex-1 flex items-center justify-center space-x-1 bg-green-600 text-white py-2 px-3 rounded-lg hover:bg-green-700 transition-colors text-sm"
                        >
                            <Upload className="w-4 h-4" />
                            <span>Use Session ID</span>
                        </button>
                        <button
                            onClick={createNewSession}
                            disabled={isGeneratingSession}
                            className="flex-1 flex items-center justify-center space-x-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 text-sm"
                        >
                            <RefreshCw
                                className={`w-4 h-4 ${
                                    isGeneratingSession ? "animate-spin" : ""
                                }`}
                            />
                            <span>
                                {isGeneratingSession
                                    ? "Generating..."
                                    : "New Session"}
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {/* Step 1: Upload Selfie */}
                <div
                    className={`flex items-center space-x-4 p-3 rounded-lg ${
                        selfieImage ? "bg-green-100" : "bg-blue-100"
                    }`}
                >
                    <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                            <UserCircle className="w-5 h-5 text-gray-600" />
                        </div>
                    </div>
                    <button
                        className="flex-1 text-left"
                        onClick={() => {
                            setIsOpenSelfieModal(true);
                        }}
                    >
                        <p className="text-xs text-gray-500 font-medium">
                            Step 1
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                            Upload a selfie
                        </p>
                    </button>
                </div>

                {/* Step 2: ID Document */}
                <div
                    className={`flex items-center space-x-4 p-3 rounded-lg ${
                        selfieImage && documentVerified
                            ? "bg-green-100"
                            : selfieImage
                            ? "bg-blue-100"
                            : "bg-gray-100"
                    }`}
                >
                    <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-gray-600" />
                        </div>
                    </div>
                    <button
                        className="flex-1 text-left"
                        onClick={() => {
                            if (!selfieImage) {
                                toast.error(
                                    "Please complete Step 1 (selfie) first."
                                );
                                return;
                            }
                            setIsOpenIdModal(true);
                        }}
                    >
                        <p className="text-xs text-gray-500 font-medium">
                            Step 2
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                            Provide identity document
                        </p>
                    </button>
                </div>

                {/* Step 3: Liveness Check */}
                <div
                    className={`flex items-center space-x-4 p-3 rounded-lg ${
                        selfieImage && documentVerified && livenessPassed
                            ? "bg-green-100"
                            : selfieImage && documentVerified
                            ? "bg-blue-100"
                            : "bg-gray-100"
                    }`}
                >
                    <div className="flex-shrink-0">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                            <ScanFace className="w-5 h-5 text-gray-600" />
                        </div>
                    </div>
                    <button
                        className="flex-1 text-left"
                        onClick={() => {
                            if (!selfieImage || !documentVerified) {
                                toast.error(
                                    "Please complete Steps 1 and 2 first."
                                );
                                return;
                            }
                            setIsOpenLivenessCheck(true);
                        }}
                    >
                        <p className="text-xs text-gray-500 font-medium">
                            Step 3
                        </p>
                        <p className="text-sm font-medium text-gray-900">
                            Perform a liveness check
                        </p>
                    </button>
                </div>
                {/* Continue Button */}
                <button
                    className="w-full disabled:bg-blue-100 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    disabled={
                        !selfieImage || !livenessPassed || !documentVerified
                    }
                    onClick={() => setIsFinalReviewOpen(true)}
                >
                    Continue
                </button>
            </div>

            {/* Modals */}

            <UploadSelfieModal
                isOpen={isOpenSelfieModal}
                onClose={() => setIsOpenSelfieModal(false)}
                onSuccess={(img) => {
                    setSelfieImage(img);
                    setIsOpenSelfieModal(false);
                    setIsOpenIdModal(true);
                    toast.success("Selfie uploaded!");
                }}
                sessionId={sessionId || ""}
            />

            <UploadIdModal
                isOpen={isOpenIdModal}
                onClose={() => setIsOpenIdModal(false)}
                onSuccess={(idImage) => {
                    setIdImage(idImage);
                    setDocumentVerified(true);
                    setIsOpenIdModal(false);
                    setIsOpenLivenessCheck(true);
                    toast.success("Document verified successfully!");
                }}
                sessionId={sessionId || ""} // Pass the session
            />

            <LivenessCheck
                isOpen={isOpenLivenessCheck}
                onClose={() => setIsOpenLivenessCheck(false)}
                onSuccess={() => {
                    setIsOpenLivenessCheck(false);
                    setLivenessPassed(true);
                    setIsFinalReviewOpen(true);
                    toast.success("Liveness check passed!");
                }}
                session_id={sessionId || ""} // Pass the session
            />
            <FinalReviewModal
                isOpen={isFinalReviewOpen}
                onClose={() => setIsFinalReviewOpen(false)}
                idImages={idImage}
                selfieImage={selfieImage}
                onSubmit={() => {
                    setIsFinalReviewOpen(false);
                    toast.success("Documents submitted for verification!");
                    // TODO: send data to backend
                }}
            />
        </div>
    );
}
