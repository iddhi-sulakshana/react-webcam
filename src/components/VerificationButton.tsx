import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useVerificationStore } from "@/lib/store";
import { useState } from "react";
import CompletionModal from "./CompletionModal";

const VerificationButton = () => {
    const { getStepStatus } = useVerificationStore();
    const selfiStatus = getStepStatus("selfie");
    const documentStatus = getStepStatus("document");
    const livenessStatus = getStepStatus("liveness");
    const completeStatus = getStepStatus("complete");

    const [showCompletionModal, setShowCompletionModal] = useState(false);
    const navigate = useNavigate();

    const onClickContinue = () => {
        if (completeStatus === "completed") navigate("/");
        else if (livenessStatus === "completed") navigate("/complete");
        else if (documentStatus === "completed") navigate("/liveness");
        else if (selfiStatus === "completed") navigate("/document");
        else navigate("/selfie");
    };

    const onClickComplete = () => {
        setShowCompletionModal(true);
    };

    if (completeStatus === "completed")
        return (
            <>
                <motion.div
                    className="text-center"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.2 }}
                >
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Button
                            onClick={onClickComplete}
                            size="lg"
                            className="cursor-pointer bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-12 py-4 text-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 mb-10"
                        >
                            Verification Complete
                            <CheckCircle className="ml-3 w-6 h-6" />
                        </Button>
                    </motion.div>
                </motion.div>

                <CompletionModal
                    isOpen={showCompletionModal}
                    onClose={() => setShowCompletionModal(false)}
                />
            </>
        );

    return (
        <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.2 }}
        >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                    onClick={onClickContinue}
                    size="lg"
                    className="cursor-pointer bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-12 py-4 text-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 mb-10"
                >
                    {selfiStatus === "completed"
                        ? "Continue Verification"
                        : "Start Verification"}
                    <ArrowRight className="ml-3 w-6 h-6" />
                </Button>
            </motion.div>
        </motion.div>
    );
};

export default VerificationButton;
