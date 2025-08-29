import { useState, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { Camera, Upload, RotateCcw, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Webcam from "react-webcam";
import ProgressStepper from "@/components/ProgressStepper";
import { useVerificationStore } from "@/lib/store";
import { useNavigate } from "react-router-dom";

const Selfie = () => {
    const webcamRef = useRef<Webcam>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isWebcamActive, setIsWebcamActive] = useState(false);
    const [facingMode, setFacingMode] = useState<"user" | "environment">(
        "user"
    );
    const [isProcessing, setIsProcessing] = useState(false);

    const { setStepStatus } = useVerificationStore();
    const navigate = useNavigate();

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
            setCapturedImage(imageSrc);
            setIsWebcamActive(false);
        }
    }, [webcamRef]);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setCapturedImage(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const switchCamera = () => {
        setFacingMode(facingMode === "user" ? "environment" : "user");
    };

    const retakePhoto = () => {
        setCapturedImage(null);
        setIsWebcamActive(true);
    };

    const handleSubmit = async () => {
        if (!capturedImage) return;

        setIsProcessing(true);

        // Simulate processing
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Update store status
        setStepStatus("selfie", "completed");

        setIsProcessing(false);

        // Navigate to next step
        navigate("/document");
    };

    const videoConstraints = {
        width: 1280,
        height: 720,
        facingMode: facingMode,
    };

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Progress Stepper */}
            <ProgressStepper currentStep={1} />

            {/* Main Content */}
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <motion.div
                    className="text-center mb-8"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        Take a Selfie
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Position your face in the center and make sure the
                        lighting is good
                    </p>
                </motion.div>

                {/* Camera/Preview Area */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <Card className="mb-6">
                        <CardContent className="p-6">
                            <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                                {capturedImage ? (
                                    // Preview captured image
                                    <div className="relative w-full h-full">
                                        <img
                                            src={capturedImage}
                                            alt="Captured selfie"
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

                                        {/* Camera overlay */}
                                        <div className="absolute inset-0 pointer-events-none">
                                            {/* Face outline guide */}
                                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                                <div className="w-48 h-64 border-2 border-white border-dashed rounded-full opacity-50"></div>
                                            </div>

                                            {/* Instructions */}
                                            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                                                <div className="bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg text-sm">
                                                    Position your face within
                                                    the oval
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
                    transition={{ duration: 0.6, delay: 0.4 }}
                >
                    {!capturedImage ? (
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
                                        Capture Photo
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
                            {/* Submit Button */}
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
                                        Continue
                                    </>
                                )}
                            </Button>

                            {/* Retake Button */}
                            <Button
                                onClick={retakePhoto}
                                variant="outline"
                                className="py-3"
                                size="lg"
                                disabled={isProcessing}
                            >
                                <RotateCcw className="w-5 h-5 mr-2" />
                                Retake Photo
                            </Button>
                        </div>
                    )}
                </motion.div>

                {/* Tips */}
                <motion.div
                    className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                >
                    <h3 className="font-semibold text-blue-900 mb-3">
                        Tips for a good selfie:
                    </h3>
                    <ul className="space-y-2 text-sm text-blue-800">
                        <li>
                            • Make sure your face is well-lit and clearly
                            visible
                        </li>
                        <li>• Position your face in the center of the frame</li>
                        <li>
                            • Remove glasses, hats, or anything covering your
                            face
                        </li>
                        <li>
                            • Keep a neutral expression and look directly at the
                            camera
                        </li>
                        <li>
                            • Ensure the background is plain and not distracting
                        </li>
                    </ul>
                </motion.div>
            </div>
        </div>
    );
};

export default Selfie;
