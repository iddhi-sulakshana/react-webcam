import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

interface CompletionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const CompletionModal = ({ isOpen, onClose }: CompletionModalProps) => {
    const [countdown, setCountdown] = useState(5);
    const navigate = useNavigate();
    const callbackUrl = "https://www.google.com";

    useEffect(() => {
        if (isOpen) {
            setCountdown(5);
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);

            return () => clearTimeout(timer);
        } else if (isOpen && countdown === 0) {
            // Redirect after countdown completes
            setTimeout(() => {
                onClose();
                window.location.href = callbackUrl;
            }, 500);
        }
    }, [isOpen, countdown, navigate, callbackUrl, onClose]);

    const handleClose = () => {
        onClose();
        window.location.href = callbackUrl;
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-md mx-auto bg-green-600 border-0 text-white p-8">
                <DialogHeader className="text-center">
                    <DialogTitle className="text-3xl text-center font-bold text-white mb-6">
                        Verification Complete
                    </DialogTitle>
                </DialogHeader>

                {/* Check Mark Icon */}
                <motion.div
                    className="text-center mb-6"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.6, delay: 0.2, type: "spring" }}
                >
                    <CheckCircle className="w-24 h-24 mx-auto text-white" />
                </motion.div>

                {/* Message */}
                <motion.p
                    className="text-2xl font-bold mb-6 text-green-100 text-center"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                >
                    Your verification is complete
                </motion.p>

                {/* Countdown Timer */}
                <motion.div
                    className="text-center mb-6"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                >
                    <p className="text-xl text-green-100">
                        Redirecting in {countdown} second
                        {countdown !== 1 ? "s" : ""}...
                    </p>
                </motion.div>

                {/* Progress Bar */}
                <motion.div
                    className="w-full h-2 bg-green-500 rounded-full overflow-hidden mb-4"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 5, delay: 0.8 }}
                >
                    <motion.div
                        className="h-full bg-white rounded-full"
                        initial={{ scaleX: 1 }}
                        animate={{ scaleX: 0 }}
                        transition={{ duration: 5, delay: 0.8 }}
                    />
                </motion.div>

                {/* Close Button */}
                <motion.button
                    onClick={handleClose}
                    className="w-full py-2 px-4 bg-white text-green-600 rounded-lg font-semibold hover:bg-green-50 transition-colors duration-200"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                >
                    Close
                </motion.button>
            </DialogContent>
        </Dialog>
    );
};

export default CompletionModal;
