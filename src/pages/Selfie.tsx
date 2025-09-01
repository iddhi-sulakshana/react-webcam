import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Camera,
    Upload,
    RotateCcw,
    Check,
    X,
    Smartphone,
    QrCode,
    CopyIcon,
} from "lucide-react";
import QRCode from "react-qr-code";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Webcam from "react-webcam";
import ProgressStepper from "@/components/ProgressStepper";
import { useVerificationStore } from "@/lib/store";
import { useNavigate } from "react-router-dom";
import { runDetection } from "@/lib/faceDetetction";
import copyCurrentUrl from "@/lib/copyCurrentUrl";
import { getDeviceCapabilities } from "@/lib/cameraUitls";

const Selfie = () => {
    const { setStepStatus } = useVerificationStore();
    const navigate = useNavigate();

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const webcamRef = useRef<Webcam>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isWebcamActive, setIsWebcamActive] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [showQRCode, setShowQRCode] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [validFace, setValidFace] = useState(false);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDevice, setSelectedDevice] =
        useState<MediaDeviceInfo | null>(null);
    const [detectionCleanup, setDetectionCleanup] = useState<
        (() => void) | null
    >(null);
    const [deviceResolution, setDeviceResolution] = useState<{
        width: number;
        height: number;
    }>({ width: 640, height: 480 });
    const [webcamKey, setWebcamKey] = useState<number>(0);
    const [copied, setCopied] = useState(false);
    // Cleanup detection when component unmounts or camera stops
    useEffect(() => {
        return () => {
            if (detectionCleanup) {
                detectionCleanup();
            }
        };
    }, [detectionCleanup]);
    useEffect(() => {
        navigator.mediaDevices.enumerateDevices().then((devices) => {
            const newDevices = devices.filter(
                (device) => device.kind === "videoinput"
            );
            setDevices(newDevices);
            if (newDevices.length > 0) {
                setSelectedDevice(newDevices[0]);
                getDeviceCapabilities(newDevices[0].deviceId).then(
                    (resolution) => {
                        setDeviceResolution(resolution);
                    }
                );
            }
        });
    }, []);
    // Switch to next available camera
    const switchCamera = async () => {
        if (devices.length <= 1) return;

        const currentIndex = devices.findIndex(
            (d) => d.deviceId === selectedDevice?.deviceId
        );
        const nextIndex = (currentIndex + 1) % devices.length;
        const nextDevice = devices[nextIndex];

        // Cleanup current detection
        if (detectionCleanup) {
            detectionCleanup();
            setDetectionCleanup(null);
        }

        setSelectedDevice(nextDevice);
        setLoaded(false);
        setValidFace(false);

        // Get capabilities for the new device
        await getDeviceCapabilities(nextDevice.deviceId);

        // Force webcam remount
        setWebcamKey((prev) => prev + 1);
    };

    // Stop camera and cleanup
    const stopCamera = () => {
        if (detectionCleanup) {
            detectionCleanup();
            setDetectionCleanup(null);
        }
        setIsWebcamActive(false);
        setLoaded(false);
        setValidFace(false);
    };

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

    const retakePhoto = () => {
        // Cleanup current detection
        if (detectionCleanup) {
            detectionCleanup();
            setDetectionCleanup(null);
        }
        setLoaded(false);
        setValidFace(false);
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

    const handleVideoLoad = async (
        videoNode: React.ChangeEvent<HTMLVideoElement>
    ) => {
        const video = videoNode.target;
        if (video.readyState !== 4) return;
        if (loaded) return;
        if (!canvasRef.current) return;

        // Cleanup previous detection if exists
        if (detectionCleanup) {
            detectionCleanup();
        }

        const cleanup = await runDetection(
            video,
            canvasRef.current,
            (ctx, _, isFrontDirected, isCloserToScreen) => {
                if (!isCloserToScreen) {
                    // Show a warning message in the canvas
                    ctx.fillStyle = "red";
                    ctx.font = "16px Arial";
                    ctx.fillText("Please move closer to the screen", 10, 30);
                    return;
                }
                if (!isFrontDirected) {
                    ctx.fillStyle = "red";
                    ctx.font = "16px Arial";
                    ctx.fillText("Please face the camera", 10, 30);
                    return;
                }
                setValidFace(true);
            }
        );

        setDetectionCleanup(() => cleanup);
        setLoaded(true);
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
                                        useVerifica
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
                                                    value={copyCurrentUrl()}
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
                                                    scan this QR code to take
                                                    your selfie on your phone.
                                                </p>
                                                <div className="flex flex-col sm:flex-row gap-2">
                                                    <Button
                                                        onClick={() => {
                                                            copyCurrentUrl();
                                                            setCopied(true);
                                                            setTimeout(() => {
                                                                setCopied(
                                                                    false
                                                                );
                                                            }, 1000);
                                                        }}
                                                        variant="outline"
                                                        size="sm"
                                                        className="border-blue-300 text-blue-700 hover:bg-blue-100"
                                                    >
                                                        {/* Show a checkmark if the URL is copied */}
                                                        {copied ? (
                                                            <Check className="w-4 h-4 mr-2" />
                                                        ) : (
                                                            <CopyIcon className="w-4 h-4 mr-2" />
                                                        )}
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

                {/* Camera/Preview Area */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                >
                    <Card className="mb-6">
                        <CardContent>
                            {loaded ? (
                                <></>
                            ) : (
                                <div className="text-center text-gray-300">
                                    Loading the face detection model...
                                </div>
                            )}
                            <div
                                className="relative bg-gray-900 rounded-lg overflow-hidden"
                                style={{
                                    aspectRatio: `${deviceResolution.width}/${deviceResolution.height}`,
                                }}
                            >
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
                                            key={webcamKey}
                                            ref={webcamRef}
                                            audio={false}
                                            screenshotFormat="image/jpeg"
                                            className="w-full h-full object-cover opacity-0 z-0"
                                            onLoadedData={handleVideoLoad}
                                            width={deviceResolution.width}
                                            height={deviceResolution.height}
                                            videoConstraints={{
                                                deviceId:
                                                    selectedDevice?.deviceId,
                                                facingMode: "user",
                                            }}
                                        />
                                        <canvas
                                            width={deviceResolution.width}
                                            height={deviceResolution.height}
                                            ref={canvasRef}
                                            className="w-full h-full object-cover absolute top-0 left-0 z-10"
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                            }}
                                        />
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
                    {!capturedImage ? (
                        <div className="flex flex-col sm:flex-row gap-4">
                            {!isWebcamActive ? (
                                <>
                                    {/* Start Camera Button */}
                                    <Button
                                        onClick={() => {
                                            setIsWebcamActive(true);
                                            setValidFace(false);
                                        }}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3"
                                        size="lg"
                                    >
                                        <Camera className="w-5 h-5 mr-2" />
                                        Start Camera
                                    </Button>

                                    {/* Upload Image Button */}
                                    <Button
                                        onClick={() => {
                                            setValidFace(false);
                                            fileInputRef.current?.click();
                                        }}
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
                                        className={`flex-1 ${
                                            validFace
                                                ? "bg-green-600 hover:bg-green-700 text-white"
                                                : "bg-red-400 text-red-600"
                                        } py-3`}
                                        size="lg"
                                        disabled={!validFace}
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
                                        disabled={devices.length <= 1}
                                    >
                                        <RotateCcw className="w-5 h-5 mr-2" />
                                        Switch Camera
                                    </Button>

                                    {/* Stop Camera Button */}
                                    <Button
                                        onClick={stopCamera}
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
                    transition={{ duration: 0.6, delay: 0.7 }}
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
