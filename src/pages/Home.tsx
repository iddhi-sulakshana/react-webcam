import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, ArrowRight, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import documentImg from "../assets/images/document.png";
import selfieImg from "../assets/images/selfie.png";
import livenessImg from "../assets/images/liveness.png";
import completeImg from "../assets/images/complete.png";

const workflowSteps = [
    {
        id: 1,
        title: "Face Recognition",
        description:
            "Take a selfie for biometric verification and identity confirmation.",
        image: selfieImg,
        stepNumber: "1 step",
        color: "from-indigo-500 to-indigo-600",
    },
    {
        id: 2,
        title: "Document Verification",
        description:
            "Uploading a photo or taking a picture of a document with a phone or laptop camera.",
        image: documentImg,
        stepNumber: "2 step",
        color: "from-blue-500 to-blue-600",
    },
    {
        id: 3,
        title: "Liveness Check",
        description:
            "Complete liveness detection to prevent fraud and ensure real person verification.",
        image: livenessImg,
        stepNumber: "3 step",
        color: "from-amber-500 to-amber-600",
    },
    {
        id: 4,
        title: "Verification Complete",
        description:
            "The manager reviews the verification and determines whether to approve or decline the verification status.",
        image: completeImg,
        stepNumber: "4 step",
        color: "from-green-500 to-green-600",
    },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.3,
            delayChildren: 0.2,
        },
    },
};

const cardVariants = {
    hidden: {
        opacity: 0,
        y: 50,
        scale: 0.9,
    },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
            duration: 0.6,
            ease: "easeOut" as const,
        },
    },
    hover: {
        y: -10,
        scale: 1.02,
        transition: {
            duration: 0.3,
            ease: "easeOut" as const,
        },
    },
};

export default function Home() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
            <div className="container mx-auto px-4 py-12">
                {/* Header Section */}
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: -30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <motion.div
                        className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-8 shadow-2xl"
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Shield className="w-12 h-12 text-white" />
                    </motion.div>
                    <h1 className="text-5xl font-bold text-gray-900 mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        KYC Verification
                    </h1>
                    <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                        Effortless Identity Verification with Our Streamlined
                        Video Process
                    </p>
                </motion.div>

                {/* Steps Section */}
                <section className="steps-section">
                    <div className="max-w-4xl mx-auto">
                        <motion.div
                            className="text-center mb-8"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.4 }}
                        >
                            <h2 className="text-3xl font-bold text-gray-800 mb-4">
                                Simple 4-Step Process
                            </h2>
                            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                                Complete your verification in minutes with our
                                intuitive step-by-step process
                            </p>
                        </motion.div>

                        {/* Simple Action Button */}
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
                                    onClick={() =>
                                        console.log(
                                            "Continue to KYC verification"
                                        )
                                    }
                                    size="lg"
                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-12 py-4 text-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 mb-10"
                                >
                                    Start Verification
                                    <ArrowRight className="ml-3 w-6 h-6" />
                                </Button>
                            </motion.div>
                        </motion.div>

                        {/* Steps List */}
                        <motion.ul
                            className="space-y-8"
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                        >
                            {workflowSteps.map((step, index) => (
                                <motion.li
                                    key={step.id}
                                    className="group"
                                    variants={cardVariants}
                                    whileHover="hover"
                                >
                                    <Card className="border-0 shadow-xl bg-white/90 backdrop-blur-sm overflow-hidden group-hover:shadow-2xl transition-all duration-300">
                                        <CardContent className="p-0">
                                            <div className="flex flex-col lg:flex-row h-full">
                                                {/* Card Description */}
                                                <div className="flex-1 p-8 flex flex-col justify-center">
                                                    <div className="mb-4">
                                                        <Badge
                                                            className={`bg-gradient-to-r ${step.color} text-white border-0 px-4 py-2 text-sm font-semibold`}
                                                        >
                                                            {step.stepNumber}
                                                        </Badge>
                                                    </div>
                                                    <h3 className="text-2xl font-bold text-gray-800 mb-4 group-hover:text-blue-600 transition-colors duration-300">
                                                        {step.title}
                                                    </h3>
                                                    <p className="text-gray-600 leading-relaxed text-base">
                                                        {step.description}
                                                    </p>
                                                </div>

                                                {/* Card Image (hidden on mobile) */}
                                                <div className="hidden lg:block flex-shrink-0 w-1/4 h-auto overflow-hidden px-5 ">
                                                    <motion.img
                                                        src={step.image}
                                                        alt={step.title}
                                                        className="w-full h-full object-contain transition-transform duration-500"
                                                    />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.li>
                            ))}
                        </motion.ul>
                    </div>
                </section>

                {/* Simple Action Button */}
                <motion.div
                    className="mt-16 text-center"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.2 }}
                >
                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <Button
                            onClick={() =>
                                console.log("Continue to KYC verification")
                            }
                            size="lg"
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-12 py-4 text-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                        >
                            Start Verification
                            <ArrowRight className="ml-3 w-6 h-6" />
                        </Button>
                    </motion.div>
                </motion.div>

                {/* Footer Note */}
                <motion.div
                    className="text-center mt-12 text-gray-500"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 1.4 }}
                >
                    <div className="flex items-center justify-center space-x-2 mb-4">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-sm font-medium">
                            Bank-level security
                        </span>
                    </div>
                    <p className="text-sm">
                        Your privacy and security are our top priorities. All
                        data is encrypted and stored securely.
                    </p>
                </motion.div>
            </div>
        </div>
    );
}
