import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Selfie from "./pages/Selfie";
import Document from "./pages/Document";
import Liveness from "./pages/Liveness";
import Complete from "./pages/Complete";
import { useVerificationStore } from "@/lib/store";
import { motion } from "framer-motion";

function App() {
    const { getCompletedCount } = useVerificationStore();
    const completedCount = getCompletedCount();
    const totalSteps = 4;

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
