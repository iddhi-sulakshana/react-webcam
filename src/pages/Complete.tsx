import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Shield, Award, Star, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ProgressStepper from "@/components/ProgressStepper";
import CompletionModal from "@/components/CompletionModal";
import { useVerificationStore } from "@/stores/verificationStore";

const Complete = () => {
    const [showModal, setShowModal] = useState(false);
    const [isAnimationComplete, setIsAnimationComplete] = useState(false);
    const { setStepStatus, getStepStatus } = useVerificationStore();

    // Mark complete step as completed when component mounts
    useEffect(() => {
        setStepStatus("complete", "approved");

        // Start animation sequence
        const timer = setTimeout(() => {
            setIsAnimationComplete(true);
        }, 2000);

        return () => clearTimeout(timer);
    }, [setStepStatus]);

    const completedSteps = [
        {
            title: "Face Recognition",
            description: "Biometric verification completed",
            icon: CheckCircle,
            status: getStepStatus("selfie"),
        },
        {
            title: "Document Verification",
            description: "Identity document validated",
            icon: Shield,
            status: getStepStatus("document"),
        },
        {
            title: "Liveness Check",
            description: "Real person verification confirmed",
            icon: Award,
            status: getStepStatus("liveness"),
        },
    ];

    const handleFinishVerification = () => {
        setShowModal(true);
    };

    const handleModalClose = () => {
        setShowModal(false);
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <ProgressStepper currentStep={4} />

            <div className="max-w-3xl mx-auto">
                {/* Main Success Animation */}
                <motion.div
                    className="text-center mb-8"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, type: "spring" }}
                >
                    {/* Success Icon with Animation */}
                    <motion.div
                        className="relative inline-flex items-center justify-center mb-6"
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ duration: 1, type: "spring", delay: 0.3 }}
                    >
                        {/* Background Glow */}
                        <motion.div
                            className="absolute inset-0 bg-green-400 rounded-full blur-xl opacity-30"
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.3, 0.5, 0.3],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        />

                        {/* Main Success Circle */}
                        <div className="relative bg-gradient-to-br from-green-500 to-green-600 rounded-full p-8 shadow-2xl">
                            <CheckCircle className="w-24 h-24 text-white" />
                        </div>

                        {/* Floating Sparkles */}
                        {[...Array(6)].map((_, i) => (
                            <motion.div
                                key={i}
                                className="absolute"
                                style={{
                                    top: `${Math.random() * 100}%`,
                                    left: `${Math.random() * 100}%`,
                                }}
                                animate={{
                                    y: [-20, -40, -20],
                                    opacity: [0, 1, 0],
                                    scale: [0.8, 1.2, 0.8],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Infinity,
                                    delay: i * 0.3,
                                }}
                            >
                                <Sparkles className="w-4 h-4 text-green-400" />
                            </motion.div>
                        ))}
                    </motion.div>

                    {/* Success Title */}
                    <motion.h1
                        className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent mb-4"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                    >
                        Verification Complete!
                    </motion.h1>

                    {/* Success Subtitle */}
                    <motion.p
                        className="text-xl text-gray-600 mb-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.7 }}
                    >
                        Your identity has been successfully verified
                    </motion.p>

                    {/* Success Badge */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.9 }}
                    >
                        <Badge className="bg-green-100 text-green-800 px-6 py-2 text-lg font-semibold border-green-200">
                            <Star className="w-5 h-5 mr-2" />
                            Verification Successful
                        </Badge>
                    </motion.div>
                </motion.div>

                {/* Verification Steps Summary */}
                <motion.div
                    className="mb-8"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1.1 }}
                >
                    <Card className="bg-green-50 border-green-200 shadow-lg">
                        <CardContent className="p-6">
                            <h2 className="text-2xl font-bold text-green-900 mb-6 text-center">
                                Verification Summary
                            </h2>

                            <div className="space-y-4">
                                {completedSteps.map((step, index) => {
                                    const IconComponent = step.icon;
                                    return (
                                        <motion.div
                                            key={step.title}
                                            className="flex items-center p-4 bg-white rounded-lg border border-green-200"
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{
                                                duration: 0.6,
                                                delay: 1.3 + index * 0.2,
                                            }}
                                        >
                                            <div className="bg-green-500 text-white p-3 rounded-full mr-4">
                                                <IconComponent className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-900">
                                                    {step.title}
                                                </h3>
                                                <p className="text-gray-600 text-sm">
                                                    {step.description}
                                                </p>
                                            </div>
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                transition={{
                                                    duration: 0.4,
                                                    delay: 1.5 + index * 0.2,
                                                }}
                                            >
                                                <CheckCircle className="w-8 h-8 text-green-500" />
                                            </motion.div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Next Steps Card */}
                <motion.div
                    className="mb-8"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1.9 }}
                >
                    <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="p-6 text-center">
                            <div className="bg-blue-500 text-white p-4 rounded-full inline-flex mb-4">
                                <Award className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-blue-900 mb-2">
                                What Happens Next?
                            </h3>
                            <p className="text-blue-700 mb-4">
                                Your verification is complete and has been
                                submitted for review. You will be redirected to
                                complete the process.
                            </p>
                            <div className="flex items-center justify-center space-x-2 text-sm text-blue-600">
                                <CheckCircle className="w-4 h-4" />
                                <span>Secure and encrypted verification</span>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Action Button */}
                <motion.div
                    className="text-center"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 2.1 }}
                >
                    {isAnimationComplete && (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.6 }}
                        >
                            <Button
                                onClick={handleFinishVerification}
                                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-12 py-4 text-xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300"
                                size="lg"
                            >
                                <CheckCircle className="w-6 h-6 mr-3" />
                                Finish Verification
                            </Button>
                        </motion.div>
                    )}
                </motion.div>

                {/* Success Stats */}
                <motion.div
                    className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6"
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 2.3 }}
                >
                    {[
                        {
                            label: "Steps Completed",
                            value: "4/4",
                            icon: CheckCircle,
                        },
                        {
                            label: "Verification Status",
                            value: "Success",
                            icon: Shield,
                        },
                        { label: "Security Level", value: "High", icon: Award },
                    ].map((stat, index) => {
                        const IconComponent = stat.icon;
                        return (
                            <motion.div
                                key={stat.label}
                                className="text-center p-6 bg-white rounded-lg shadow-md border border-gray-200"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{
                                    duration: 0.6,
                                    delay: 2.5 + index * 0.1,
                                }}
                                whileHover={{ y: -5 }}
                            >
                                <div className="bg-green-100 text-green-600 p-3 rounded-full inline-flex mb-3">
                                    <IconComponent className="w-6 h-6" />
                                </div>
                                <div className="text-2xl font-bold text-gray-900 mb-1">
                                    {stat.value}
                                </div>
                                <div className="text-sm text-gray-600">
                                    {stat.label}
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>

                {/* Security Notice */}
                <motion.div
                    className="mt-8 text-center text-gray-500"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 2.8 }}
                >
                    <div className="flex items-center justify-center space-x-2 mb-2">
                        <Shield className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium">
                            Bank-level security
                        </span>
                    </div>
                    <p className="text-xs">
                        Your verification data is encrypted and stored securely
                        according to industry standards.
                    </p>
                </motion.div>
            </div>

            {/* Completion Modal */}
            <CompletionModal isOpen={showModal} onClose={handleModalClose} />
        </div>
    );
};

export default Complete;
