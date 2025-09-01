import { Routes, Route, useLocation, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Home from "./pages/Home";
import Selfie from "./pages/Selfie";
import Document from "./pages/Document";
import Liveness from "./pages/Liveness";
import Complete from "./pages/Complete";
import { useVerificationStore, type Step } from "@/stores/verificationStore";
import { useTokenStore } from "@/stores/tokenStore";
import { motion } from "framer-motion";
import {
    getSessionDetailsService,
    validateSessionService,
} from "./services/session.service";
import { AxiosError } from "axios";

function App() {
    const { getCompletedCount, setSteps } = useVerificationStore();
    const { isAuthenticated, setTokens, clearTokens, setIsAuthenticated } =
        useTokenStore();
    const completedCount = getCompletedCount();
    const totalSteps = 4;
    const location = useLocation();
    const [isLoading, setIsLoading] = useState(true);
    const [searchParams] = useSearchParams();
    const {
        data: sessionData,
        isLoading: isSessionLoading,
        isError: isSessionError,
        error: sessionError,
    } = validateSessionService();
    const {
        data: sessionDetailsData,
        isLoading: isSessionDetailsLoading,
        isError: isSessionDetailsError,
        error: sessionDetailsError,
    } = getSessionDetailsService();

    useEffect(() => {
        if (isSessionLoading) return;
        if (isSessionError) {
            if (sessionError instanceof AxiosError)
                toast.error(sessionError.response?.data?.detail);
            handleAuthFailure();
        } else if (sessionData) {
            setIsAuthenticated(true);

            setIsLoading(false);
        }
    }, [isSessionError, isLoading, sessionData]);

    useEffect(() => {
        if (isSessionDetailsLoading) return;
        if (isSessionDetailsError) {
            if (sessionDetailsError instanceof AxiosError)
                toast.error(sessionDetailsError.response?.data?.detail);
            handleAuthFailure();
        } else if (sessionDetailsData) {
            const newStep: Step = {
                selfie: sessionDetailsData.data.verification_result
                    .selfie_status,
                document:
                    sessionDetailsData.data.verification_result.document_status,
                liveness:
                    sessionDetailsData.data.verification_result.liveness_status,
                complete:
                    sessionDetailsData.data.verification_result.overall_status,
            };
            console.log(newStep);
            setSteps(newStep);
        }
    }, [isSessionDetailsError, isSessionDetailsLoading, sessionDetailsData]);

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const sessionId = searchParams.get("session_id");
                const sessionToken = searchParams.get("session_token");
                if (sessionId && sessionToken)
                    setTokens(sessionId, sessionToken);
                else throw new Error("No authentication tokens found.");
            } catch (error) {
                handleAuthFailure();
            }
        };

        initializeAuth();
    }, []);

    const handleAuthFailure = () => {
        clearTokens();
        toast.error(
            "Authentication required. Please provide valid session tokens."
        );
    };

    // Scroll to top on route change
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location.pathname]);

    // Show loading state while checking authentication
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Initializing...</p>
                </div>
            </div>
        );
    }

    // Show error if not authenticated
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-500 text-6xl mb-4">🔒</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Authentication Required
                    </h1>
                    <p className="text-gray-600 mb-4">
                        Valid session tokens are required to access this
                        application.
                    </p>
                    <p className="text-sm text-gray-500">
                        Please close this window and try again with proper
                        authentication.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
            {/* Global Progress Bar - Fixed at top */}
            <div className="fixed top-0 left-0 right-0 z-50">
                <motion.div
                    className="w-full h-2 bg-gray-200"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <motion.div
                        className="h-full bg-gradient-to-r from-green-500 to-blue-500"
                        initial={{ width: 0 }}
                        animate={{
                            width: `${(completedCount / totalSteps) * 100}%`,
                        }}
                        transition={{ duration: 1, delay: 0.5 }}
                    />
                </motion.div>
            </div>

            {/* Main Content with top margin to avoid progress bar */}
            <div className="pt-2">
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/selfie" element={<Selfie />} />
                    <Route path="/document" element={<Document />} />
                    <Route path="/liveness" element={<Liveness />} />
                    <Route path="/complete" element={<Complete />} />
                    {/* Add more routes here */}
                </Routes>
            </div>
        </div>
    );
}

export default App;
