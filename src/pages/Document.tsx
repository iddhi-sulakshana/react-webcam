import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Camera,
    Upload,
    RotateCcw,
    Check,
    X,
    CreditCard,
    FileText,
    Plane,
    ArrowLeft,
    Smartphone,
    QrCode,
} from "lucide-react";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Webcam from "react-webcam";
import ProgressStepper from "@/components/ProgressStepper";
import { useVerificationStore } from "@/lib/store";
import { useNavigate } from "react-router-dom";

type DocumentType = "id" | "driver_license" | "passport" | null;
type CaptureStep = "front" | "back" | "single";

interface CapturedImages {
    front?: string;
    back?: string;
    single?: string;
}

const Document = () => {
    const webcamRef = useRef<Webcam>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedDocumentType, setSelectedDocumentType] =
        useState<DocumentType>(null);
    const [capturedImages, setCapturedImages] = useState<CapturedImages>({});
    const [currentCaptureStep, setCurrentCaptureStep] =
        useState<CaptureStep>("front");
    const [isWebcamActive, setIsWebcamActive] = useState(false);
    const [facingMode, setFacingMode] = useState<"user" | "environment">(
        "environment"
    );
    const [isProcessing, setIsProcessing] = useState(false);
    const [showQRCode, setShowQRCode] = useState(false);

    const { setStepStatus } = useVerificationStore();
    const navigate = useNavigate();

    const documentTypes = [
        {
            type: "id" as DocumentType,
            title: "National ID Card",
            description: "Government-issued identification card",
            icon: CreditCard,
            requiredSides: ["front", "back"],
            color: "from-blue-500 to-blue-600",
        },
        {
            type: "driver_license" as DocumentType,
            title: "Driver's License",
            description: "Valid driver's license",
            icon: FileText,
            requiredSides: ["front", "back"],
            color: "from-green-500 to-green-600",
        },
        {
            type: "passport" as DocumentType,
            title: "Passport",
            description: "International passport",
            icon: Plane,
            requiredSides: ["single"],
            color: "from-purple-500 to-purple-600",
        },
    ];

    const getSelectedDocumentConfig = () => {
        return documentTypes.find((doc) => doc.type === selectedDocumentType);
    };

    const getRequiredImages = () => {
        const config = getSelectedDocumentConfig();
        return config?.requiredSides || [];
    };

    const getCurrentStepTitle = () => {
        const config = getSelectedDocumentConfig();
        if (!config) return "";

        if (config.requiredSides.includes("single")) {
            return `${config.title} - Main Page`;
        }

        return currentCaptureStep === "front"
            ? `${config.title} - Front Side`
            : `${config.title} - Back Side`;
    };

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
            setCapturedImages((prev) => ({
                ...prev,
                [currentCaptureStep]: imageSrc,
            }));
            setIsWebcamActive(false);

            // Move to next step if needed
            const requiredImages = getRequiredImages();
            const currentIndex = requiredImages.indexOf(currentCaptureStep);
            if (currentIndex < requiredImages.length - 1) {
                setCurrentCaptureStep(
                    requiredImages[currentIndex + 1] as CaptureStep
                );
            }
        }
    }, [webcamRef, currentCaptureStep, getRequiredImages]);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setCapturedImages((prev) => ({
                    ...prev,
                    [currentCaptureStep]: e.target?.result as string,
                }));

                // Move to next step if needed
                const requiredImages = getRequiredImages();
                const currentIndex = requiredImages.indexOf(currentCaptureStep);
                if (currentIndex < requiredImages.length - 1) {
                    setCurrentCaptureStep(
                        requiredImages[currentIndex + 1] as CaptureStep
                    );
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const switchCamera = () => {
        setFacingMode(facingMode === "user" ? "environment" : "user");
    };

    const retakeCurrentPhoto = () => {
        setCapturedImages((prev) => {
            const newImages = { ...prev };
            delete newImages[currentCaptureStep];
            return newImages;
        });
        setIsWebcamActive(true);
    };

    const goToPreviousStep = () => {
        const requiredImages = getRequiredImages();
        const currentIndex = requiredImages.indexOf(currentCaptureStep);
        if (currentIndex > 0) {
            setCurrentCaptureStep(
                requiredImages[currentIndex - 1] as CaptureStep
            );
            // Remove the current step's image
            setCapturedImages((prev) => {
                const newImages = { ...prev };
                delete newImages[currentCaptureStep];
                return newImages;
            });
        }
    };

    const isAllImagesCaptures = () => {
        const requiredImages = getRequiredImages();
        return requiredImages.every(
            (step) => capturedImages[step as keyof CapturedImages]
        );
    };

    const handleSubmit = async () => {
        if (!isAllImagesCaptures()) return;

        setIsProcessing(true);

        // Simulate processing
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Update store status
        setStepStatus("document", "completed");

        setIsProcessing(false);

        // Navigate to next step
        navigate("/liveness");
    };

    const resetDocumentSelection = () => {
        setSelectedDocumentType(null);
        setCapturedImages({});
        setCurrentCaptureStep("front");
        setIsWebcamActive(false);
    };

    const videoConstraints = {
        width: 1280,
        height: 720,
        facingMode: facingMode,
    };

    const getCurrentUrl = () => {
        return window.location.href;
    };

    const copyUrlToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(getCurrentUrl());
            // You could add a toast notification here
        } catch (err) {
            console.error("Failed to copy: ", err);
        }
    };

    // Document Type Selection Screen
    if (!selectedDocumentType) {
        return (
            <div className="container mx-auto px-4 py-8">
                <ProgressStepper currentStep={2} />

                <div className="max-w-4xl mx-auto">
                    <motion.div
                        className="text-center mb-8"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">
                            Choose Document Type
                        </h1>
                        <p className="text-gray-600 text-lg">
                            Select the type of document you'd like to verify
                        </p>
                    </motion.div>

                    <motion.div
                        className="grid md:grid-cols-3 gap-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        {documentTypes.map((docType, index) => {
                            const Icon = docType.icon;
                            return (
                                <motion.div
                                    key={docType.type}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{
                                        duration: 0.6,
                                        delay: 0.3 + index * 0.1,
                                    }}
                                    whileHover={{ y: -5 }}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    <Card
                                        className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-300"
                                        onClick={() =>
                                            setSelectedDocumentType(
                                                docType.type
                                            )
                                        }
                                    >
                                        <CardContent className="p-6 text-center">
                                            <div
                                                className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${docType.color} rounded-full mb-4 shadow-lg`}
                                            >
                                                <Icon className="w-8 h-8 text-white" />
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-2">
                                                {docType.title}
                                            </h3>
                                            <p className="text-gray-600 mb-4">
                                                {docType.description}
                                            </p>
                                            <Badge
                                                className="bg-gray-100 text-gray-700"
                                                variant="secondary"
                                            >
                                                {docType.requiredSides
                                                    .length === 1
                                                    ? "1 image required"
                                                    : "2 images required"}
                                            </Badge>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </motion.div>
                </div>
            </div>
        );
    }

    // Document Capture Screen
    const config = getSelectedDocumentConfig()!;
    const currentImage = capturedImages[currentCaptureStep];
    const requiredImages = getRequiredImages();
    const currentStepIndex = requiredImages.indexOf(currentCaptureStep);
    const totalSteps = requiredImages.length;

    return (
        <div className="container mx-auto px-4 py-8">
            <ProgressStepper currentStep={2} />

            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <motion.div
                    className="text-center mb-6"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="flex items-center justify-center mb-4">
                        <Button
                            onClick={resetDocumentSelection}
                            variant="ghost"
                            size="sm"
                            className="absolute left-0"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                        <h1 className="text-3xl font-bold text-gray-900">
                            {getCurrentStepTitle()}
                        </h1>
                    </div>
                    <p className="text-gray-600 text-lg">
                        {config.requiredSides.length > 1
                            ? `Step ${currentStepIndex + 1} of ${totalSteps}`
                            : "Capture the document clearly"}
                    </p>
                </motion.div>

                {/* Mobile QR Code Section */}
                <motion.div
                    className="mb-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                >
                    <Card className="bg-blue-50 border-blue-200">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="bg-blue-500 text-white p-2 rounded-lg mr-3">
                                        <Smartphone className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-blue-900">
                                            Use Mobile Device
                                        </h3>
                                        <p className="text-sm text-blue-700">
                                            Better camera experience on mobile
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    onClick={() => setShowQRCode(!showQRCode)}
                                    variant="outline"
                                    size="sm"
                                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                                >
                                    <QrCode className="w-4 h-4 mr-2" />
                                    {showQRCode ? "Hide QR" : "Show QR"}
                                </Button>
                            </div>

                            <AnimatePresence>
                                {showQRCode && (
                                    <motion.div
                                        className="mt-4 pt-4 border-t border-blue-200"
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <div className="flex flex-col md:flex-row items-center gap-4">
                                            <div className="bg-white p-4 rounded-lg border border-blue-200">
                                                <QRCode
                                                    value={getCurrentUrl()}
                                                    size={128}
                                                    level="M"
                                                    className="w-full h-full"
                                                />
                                            </div>
                                            <div className="flex-1 text-center md:text-left">
                                                <h4 className="font-semibold text-blue-900 mb-2">
                                                    Scan with Mobile Camera
                                                </h4>
                                                <p className="text-sm text-blue-700 mb-3">
                                                    Open your mobile camera and
                                                    scan this QR code to capture
                                                    your document on your phone.
                                                </p>
                                                <div className="flex flex-col sm:flex-row gap-2">
                                                    <Button
                                                        onClick={
                                                            copyUrlToClipboard
                                                        }
                                                        variant="outline"
                                                        size="sm"
                                                        className="border-blue-300 text-blue-700 hover:bg-blue-100"
                                                    >
                                                        Copy Link
                                                    </Button>
                                                    <span className="text-xs text-blue-600 self-center">
                                                        Or share this page URL
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Progress for multi-step documents */}
                {config.requiredSides.length > 1 && (
                    <motion.div
                        className="mb-6"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">
                                Progress
                            </span>
                            <span className="text-sm text-gray-500">
                                {Object.keys(capturedImages).length} of{" "}
                                {totalSteps} completed
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <motion.div
                                className="bg-blue-600 h-2 rounded-full"
                                initial={{ width: 0 }}
                                animate={{
                                    width: `${
                                        (Object.keys(capturedImages).length /
                                            totalSteps) *
                                        100
                                    }%`,
                                }}
                                transition={{ duration: 0.5 }}
                            />
                        </div>
                    </motion.div>
                )}

                {/* Camera/Preview Area */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                >
                    <Card className="mb-6">
                        <CardContent className="p-6">
                            <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-[4/3]">
                                {currentImage ? (
                                    // Preview captured image
                                    <div className="relative w-full h-full">
                                        <img
                                            src={currentImage}
                                            alt={`${config.title} - ${currentCaptureStep}`}
                                            className="w-full h-full object-cover"
                                        />
                                        <div className="absolute top-4 right-4">
                                            <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center">
                                                <Check className="w-4 h-4 mr-1" />
                                                Captured
                                            </div>
                                        </div>
                                    </div>
                                ) : isWebcamActive ? (
                                    // Active webcam
                                    <div className="relative w-full h-full">
                                        <Webcam
                                            ref={webcamRef}
                                            audio={false}
                                            screenshotFormat="image/jpeg"
                                            videoConstraints={videoConstraints}
                                            className="w-full h-full object-cover"
                                        />

                                        {/* Document frame overlay */}
                                        <div className="absolute inset-0 pointer-events-none">
                                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                                <div className="w-72 h-44 border-2 border-white border-dashed rounded-lg opacity-70"></div>
                                            </div>

                                            {/* Instructions */}
                                            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                                                <div className="bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg text-sm text-center">
                                                    Position document within the
                                                    frame
                                                    <br />
                                                    Make sure all text is clear
                                                    and readable
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    // Placeholder when no camera is active
                                    <div className="flex items-center justify-center w-full h-full bg-gray-800">
                                        <div className="text-center text-gray-300">
                                            <Camera className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                            <p className="text-lg">
                                                Camera not active
                                            </p>
                                            <p className="text-sm">
                                                Click "Start Camera" to begin
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Control Buttons */}
                <motion.div
                    className="space-y-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.5 }}
                >
                    {!currentImage ? (
                        <div className="flex flex-col sm:flex-row gap-4">
                            {!isWebcamActive ? (
                                <>
                                    {/* Start Camera Button */}
                                    <Button
                                        onClick={() => setIsWebcamActive(true)}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3"
                                        size="lg"
                                    >
                                        <Camera className="w-5 h-5 mr-2" />
                                        Start Camera
                                    </Button>

                                    {/* Upload Image Button */}
                                    <Button
                                        onClick={() =>
                                            fileInputRef.current?.click()
                                        }
                                        variant="outline"
                                        className="flex-1 py-3"
                                        size="lg"
                                    >
                                        <Upload className="w-5 h-5 mr-2" />
                                        Upload Image
                                    </Button>

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                    />
                                </>
                            ) : (
                                <>
                                    {/* Capture Button */}
                                    <Button
                                        onClick={capture}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3"
                                        size="lg"
                                    >
                                        <Camera className="w-5 h-5 mr-2" />
                                        Capture{" "}
                                        {currentCaptureStep === "front"
                                            ? "Front"
                                            : currentCaptureStep === "back"
                                            ? "Back"
                                            : "Document"}
                                    </Button>

                                    {/* Switch Camera Button */}
                                    <Button
                                        onClick={switchCamera}
                                        variant="outline"
                                        className="py-3"
                                        size="lg"
                                    >
                                        <RotateCcw className="w-5 h-5 mr-2" />
                                        Switch Camera
                                    </Button>

                                    {/* Stop Camera Button */}
                                    <Button
                                        onClick={() => setIsWebcamActive(false)}
                                        variant="outline"
                                        className="py-3"
                                        size="lg"
                                    >
                                        <X className="w-5 h-5 mr-2" />
                                        Stop Camera
                                    </Button>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col sm:flex-row gap-4">
                            {/* Continue/Submit Button */}
                            {isAllImagesCaptures() ? (
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isProcessing}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3"
                                    size="lg"
                                >
                                    {isProcessing ? (
                                        <>
                                            <div className="w-5 h-5 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <Check className="w-5 h-5 mr-2" />
                                            Continue to Next Step
                                        </>
                                    )}
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => {
                                        const nextStepIndex =
                                            currentStepIndex + 1;
                                        if (nextStepIndex < totalSteps) {
                                            setCurrentCaptureStep(
                                                requiredImages[
                                                    nextStepIndex
                                                ] as CaptureStep
                                            );
                                        }
                                    }}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3"
                                    size="lg"
                                >
                                    <Check className="w-5 h-5 mr-2" />
                                    Next: Capture Back Side
                                </Button>
                            )}

                            {/* Retake Button */}
                            <Button
                                onClick={retakeCurrentPhoto}
                                variant="outline"
                                className="py-3"
                                size="lg"
                                disabled={isProcessing}
                            >
                                <RotateCcw className="w-5 h-5 mr-2" />
                                Retake
                            </Button>

                            {/* Previous Step Button (for multi-step) */}
                            {config.requiredSides.length > 1 &&
                                currentStepIndex > 0 && (
                                    <Button
                                        onClick={goToPreviousStep}
                                        variant="outline"
                                        className="py-3"
                                        size="lg"
                                        disabled={isProcessing}
                                    >
                                        <ArrowLeft className="w-5 h-5 mr-2" />
                                        Previous
                                    </Button>
                                )}
                        </div>
                    )}
                </motion.div>

                {/* Tips */}
                <motion.div
                    className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.7 }}
                >
                    <h3 className="font-semibold text-blue-900 mb-3">
                        Tips for document capture:
                    </h3>
                    <ul className="space-y-2 text-sm text-blue-800">
                        <li>• Ensure good lighting and avoid shadows</li>
                        <li>• Keep the document flat and within the frame</li>
                        <li>• Make sure all text is clear and readable</li>
                        <li>• Avoid glare or reflections on the document</li>
                        {config.requiredSides.length > 1 && (
                            <li>
                                • You'll need to capture both front and back
                                sides
                            </li>
                        )}
                    </ul>
                </motion.div>
            </div>
        </div>
    );
};

export default Document;
