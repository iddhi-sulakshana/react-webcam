import { CheckCircle, Camera, FileText, Shield, Award } from "lucide-react";
import { motion } from "framer-motion";
import {
    useVerificationStore,
    type StepStatus,
} from "@/stores/verificationStore";

interface Step {
    id: number;
    title: string;
    storeKey: any;
    icon: any;
}

const steps: Step[] = [
    {
        id: 1,
        title: "Face Recognition",
        storeKey: "selfie",
        icon: Camera,
    },
    {
        id: 2,
        title: "Document Verification",
        storeKey: "document",
        icon: FileText,
    },
    {
        id: 3,
        title: "Liveness Check",
        storeKey: "liveness",
        icon: Shield,
    },
    {
        id: 4,
        title: "Verification Complete",
        storeKey: "complete",
        icon: Award,
    },
];

interface ProgressStepperProps {
    currentStep: number;
}

const ProgressStepper = ({ currentStep }: ProgressStepperProps) => {
    const { getStepStatus } = useVerificationStore();

    const getStepColor = (stepId: number, status: StepStatus) => {
        if (status === "approved") {
            return "text-green-600 bg-green-100 border-green-200";
        } else if (stepId === currentStep) {
            return "text-blue-600 bg-blue-100 border-blue-200";
        } else if (status === "rejected") {
            return "text-red-600 bg-red-100 border-red-200";
        } else {
            return "text-gray-400 bg-gray-100 border-gray-200";
        }
    };

    const getConnectorColor = (stepId: number) => {
        const currentStepStatus = getStepStatus(steps[stepId - 1]?.storeKey);
        if (currentStepStatus === "approved") {
            return "bg-green-400";
        } else if (stepId <= currentStep) {
            return "bg-blue-400";
        } else {
            return "bg-gray-300";
        }
    };

    const getStepIcon = (step: Step, status: StepStatus) => {
        if (status === "approved") {
            return <CheckCircle className="w-5 h-5" />;
        } else {
            return <step.icon className="w-5 h-5" />;
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
                {steps.map((step, index) => {
                    const status = getStepStatus(step.storeKey);
                    const isActive = step.id === currentStep;

                    return (
                        <div key={step.id} className="flex items-center flex-1">
                            {/* Step Circle */}
                            <motion.div
                                className="flex flex-col items-center"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{
                                    duration: 0.3,
                                    delay: index * 0.1,
                                }}
                            >
                                <motion.div
                                    className={`
                                        relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300
                                        ${getStepColor(step.id, status)}
                                        ${
                                            isActive
                                                ? "ring-4 ring-blue-200"
                                                : ""
                                        }
                                    `}
                                    whileHover={{ scale: 1.05 }}
                                    animate={
                                        isActive ? { scale: [1, 1.05, 1] } : {}
                                    }
                                    transition={{
                                        duration: isActive ? 2 : 0.3,
                                        repeat: isActive ? Infinity : 0,
                                    }}
                                >
                                    {getStepIcon(step, status)}
                                </motion.div>

                                {/* Step Label */}
                                <div className="mt-2 text-center">
                                    <p
                                        className={`
                                        text-xs font-medium transition-colors duration-300
                                        ${
                                            status === "approved"
                                                ? "text-green-600"
                                                : isActive
                                                ? "text-blue-600"
                                                : status === "rejected"
                                                ? "text-red-600"
                                                : "text-gray-500"
                                        }
                                    `}
                                    >
                                        {step.title}
                                    </p>
                                    <p
                                        className={`
                                        text-xs transition-colors duration-300
                                        ${
                                            status === "approved"
                                                ? "text-green-500"
                                                : isActive
                                                ? "text-blue-500"
                                                : status === "rejected"
                                                ? "text-red-500"
                                                : "text-gray-400"
                                        }
                                    `}
                                    >
                                        {status === "approved"
                                            ? "Complete"
                                            : isActive
                                            ? "Current"
                                            : status === "rejected"
                                            ? "Rejected"
                                            : "Pending"}
                                    </p>
                                </div>
                            </motion.div>

                            {/* Connector Line */}
                            {index < steps.length - 1 && (
                                <motion.div
                                    className="flex-1 h-1 mx-4 rounded-full transition-all duration-500"
                                    style={{
                                        background: `linear-gradient(to right, ${
                                            getConnectorColor(step.id).includes(
                                                "green"
                                            )
                                                ? "#22c55e"
                                                : getConnectorColor(
                                                      step.id
                                                  ).includes("blue")
                                                ? "#3b82f6"
                                                : "#d1d5db"
                                        }, ${
                                            getConnectorColor(
                                                step.id + 1
                                            ).includes("green")
                                                ? "#22c55e"
                                                : getConnectorColor(
                                                      step.id + 1
                                                  ).includes("blue")
                                                ? "#3b82f6"
                                                : "#d1d5db"
                                        })`,
                                    }}
                                    initial={{ scaleX: 0 }}
                                    animate={{ scaleX: 1 }}
                                    transition={{
                                        duration: 0.5,
                                        delay: (index + 1) * 0.1,
                                    }}
                                />
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ProgressStepper;
