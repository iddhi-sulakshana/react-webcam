import MobileQR from "@/components/MobileQR";
import ProgressStepper from "@/components/ProgressStepper";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import buildUrlSessionTokens from "@/lib/buildUrlSessionTokens";
import { getDeviceCapabilities } from "@/lib/cameraUitls";
import { runDetection } from "@/lib/faceDetetction";
import { base64ToFile } from "@/lib/imageUtil";
import { validateLivenessService } from "@/services/validate.service";
import { useVerificationStore } from "@/stores/verificationStore";
import { AnimatePresence, motion } from "framer-motion";
import {
    ArrowLeft,
    ArrowRight,
    ArrowUp,
    CheckCircle,
    RotateCcw,
    ScanFace,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import Webcam from "react-webcam";

type RotationDirection = "front" | "left" | "right" | "up";

interface RotationStatus {
    front: boolean;
    left: boolean;
    right: boolean;
    up: boolean;
}

const rotationInstructions = {
    front: {
        icon: ScanFace,
        text: "Look straight ahead",
        description: "Keep your face in the circle",
    },
    left: {
        icon: ArrowLeft,
        text: "Tilt your head Left",
        description: "Look left while keeping your face in the circle",
    },
    right: {
        icon: ArrowRight,
        text: "Tilt your head Right",
        description: "Look right while keeping your face in the circle",
    },
    up: {
        icon: ArrowUp,
        text: "Tilt your head UP",
        description: "Look up while keeping your face in the circle",
    },
};

const Liveness = () => {
    const webcamRef = useRef<Webcam>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [capturedFront, setCapturedFront] = useState<File | null>(null);
    const [capturedLeft, setCapturedLeft] = useState<File | null>(null);
    const [capturedRight, setCapturedRight] = useState<File | null>(null);
    const [capturedUp, setCapturedUp] = useState<File | null>(null);

    const [loaded, setLoaded] = useState(false);
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

    const capture = useCallback(
        (direction: RotationDirection) => {
            const imageSrc = webcamRef.current?.getScreenshot();
            if (imageSrc) {
                const file = base64ToFile(imageSrc, `${direction}.jpg`);
                if (direction === "front") {
                    setCapturedFront(file);
                } else if (direction === "left") {
                    setCapturedLeft(file);
                } else if (direction === "right") {
                    setCapturedRight(file);
                } else if (direction === "up") {
                    setCapturedUp(file);
                }
            } else {
                console.log("Failed to capture image");
            }
        },
        [webcamRef]
    );

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
        setIsCompleted(false);
        setRotationStatus({
            front: false,
            left: false,
            right: false,
            up: false,
        });
        setCurrentInstruction("front");

        // Reset consecutive detections when switching cameras
        consecutiveDetectionsRef.current = {
            front: 0,
            left: 0,
            right: 0,
            up: 0,
        };

        // Reset captured directions tracking
        capturedDirectionsRef.current = {
            front: false,
            left: false,
            right: false,
            up: false,
        };

        // Reset progress bar states
        setShowProgress(false);
        setCurrentProgress(0);

        // Reset validation status and initiated flag
        setValidationStatus("idle");
        setValidationError("");
        validationInitiatedRef.current = false;

        // Get capabilities for the new device
        await getDeviceCapabilities(nextDevice.deviceId);

        // Force webcam remount
        setWebcamKey((prev) => prev + 1);
    };

    const { getStepStatus } = useVerificationStore();
    const [rotationStatus, setRotationStatus] = useState<RotationStatus>({
        front: false,
        left: false,
        right: false,
        up: false,
    });
    const [currentInstruction, setCurrentInstruction] =
        useState<RotationDirection>("front");
    const [isCompleted, setIsCompleted] = useState(false);

    // Add consecutive detection counter for accuracy
    const consecutiveDetectionsRef = useRef<{
        [key in RotationDirection]: number;
    }>({
        front: 0,
        left: 0,
        right: 0,
        up: 0,
    });
    const REQUIRED_CONSECUTIVE_DETECTIONS = 10;
    const CAPTURE_AT_DETECTION = 5; // Capture image at 5th detection

    // Track which directions have been captured
    const capturedDirectionsRef = useRef<{
        [key in RotationDirection]: boolean;
    }>({
        front: false,
        left: false,
        right: false,
        up: false,
    });

    // State for animated progress bar
    const [currentProgress, setCurrentProgress] = useState(0);
    const [showProgress, setShowProgress] = useState(false);

    // State for validation status
    const [validationStatus, setValidationStatus] = useState<
        "idle" | "loading" | "success" | "error"
    >("idle");
    const [validationError, setValidationError] = useState<string>("");

    // Ref to track if validation has been initiated to prevent duplicate calls
    const validationInitiatedRef = useRef(false);

    const navigate = useNavigate();

    const urlParams = buildUrlSessionTokens();

    useEffect(() => {
        if (getStepStatus("document") !== "approved") {
            navigate(`/document/${urlParams}`);
        }
        if (getStepStatus("liveness") === "approved") {
            navigate(`/complete/${urlParams}`);
        }
    }, [getStepStatus("liveness"), getStepStatus("document")]);

    const getNextInstruction = (
        current: RotationDirection,
        updatedStatus?: RotationStatus
    ): RotationDirection => {
        const order: RotationDirection[] = ["front", "left", "right", "up"];
        const currentIndex = order.indexOf(current);
        const statusToUse = updatedStatus || rotationStatus;
        const remainingDirections = order.filter(
            (direction) => !statusToUse[direction]
        );

        if (remainingDirections.length === 0) return current;

        // Find next unCompleted direction
        for (let i = currentIndex + 1; i < order.length; i++) {
            if (!statusToUse[order[i]]) {
                return order[i];
            }
        }

        // If we've reached the end, find the first uncompleted
        for (let i = 0; i < currentIndex; i++) {
            if (!statusToUse[order[i]]) {
                return order[i];
            }
        }

        return remainingDirections[0];
    };

    const getCompletedCount = () => {
        return Object.values(rotationStatus).filter(Boolean).length;
    };

    // Reset consecutive detections for all directions except the current one
    const resetConsecutiveDetections = useCallback(
        (keepDirection?: RotationDirection) => {
            const directions: RotationDirection[] = [
                "front",
                "left",
                "right",
                "up",
            ];
            directions.forEach((direction) => {
                if (direction !== keepDirection) {
                    consecutiveDetectionsRef.current[direction] = 0;
                    capturedDirectionsRef.current[direction] = false;
                }
            });
        },
        []
    );

    // Use a ref to store the detection callback that always has latest state
    const detectionCallbackRef = useRef<
        | ((
              ctx: CanvasRenderingContext2D,
              angle: any,
              isFrontDirected: boolean,
              isCloserToScreen: boolean,
              faceDirection: any
          ) => void)
        | null
    >(null);
    //
    // Update the callback ref whenever state changes
    useEffect(() => {
        detectionCallbackRef.current = (
            _: CanvasRenderingContext2D,
            __: any,
            ___: boolean,
            ____: boolean,
            faceDirection: any
        ) => {
            // Update progress state for animated progress bar
            const currentDetectionCount =
                consecutiveDetectionsRef.current[currentInstruction] || 0;
            const progressPercentage =
                (currentDetectionCount / REQUIRED_CONSECUTIVE_DETECTIONS) * 100;

            if (
                currentDetectionCount > 0 &&
                faceDirection === currentInstruction
            ) {
                setShowProgress(true);
                setCurrentProgress(progressPercentage);
            } else if (currentDetectionCount === 0) {
                setShowProgress(false);
                setCurrentProgress(0);
            }

            // Handle consecutive detection counting
            if (
                faceDirection === currentInstruction &&
                !rotationStatus[currentInstruction]
            ) {
                // Increment consecutive detections for current direction
                consecutiveDetectionsRef.current[currentInstruction]++;

                // Reset other directions
                resetConsecutiveDetections(currentInstruction);

                // Capture image at 5th consecutive detection
                if (
                    consecutiveDetectionsRef.current[currentInstruction] ===
                        CAPTURE_AT_DETECTION &&
                    !capturedDirectionsRef.current[currentInstruction]
                ) {
                    // Capture the image for this direction
                    capture(currentInstruction);
                    capturedDirectionsRef.current[currentInstruction] = true;
                }

                // Complete direction at 10th consecutive detection
                if (
                    consecutiveDetectionsRef.current[currentInstruction] >=
                    REQUIRED_CONSECUTIVE_DETECTIONS
                ) {
                    // Reset the counter for this direction
                    consecutiveDetectionsRef.current[currentInstruction] = 0;

                    // Hide progress bar after completion
                    setShowProgress(false);
                    setCurrentProgress(0);

                    // Update rotation status
                    setRotationStatus((prev) => {
                        const newStatus = {
                            ...prev,
                            [currentInstruction]: true,
                        };
                        return newStatus;
                    });

                    // Check if all directions are completed
                    const newStatus = {
                        ...rotationStatus,
                        [currentInstruction]: true,
                    };

                    const allCompleted =
                        Object.values(newStatus).every(Boolean);
                    if (allCompleted) {
                        setIsCompleted(true);
                    } else {
                        // Move to next instruction
                        const nextInstruction = getNextInstruction(
                            currentInstruction,
                            newStatus
                        );
                        setCurrentInstruction(nextInstruction);
                    }
                }
            } else {
                // Reset all counters if face direction doesn't match or direction is completed
                resetConsecutiveDetections();
            }
        };
    }, [
        currentInstruction,
        rotationStatus,
        capture,
        getNextInstruction,
        resetConsecutiveDetections,
    ]);

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
            (...args) => {
                // Call the current callback from the ref
                detectionCallbackRef.current?.(...args);
            }
        );
        setDetectionCleanup(() => cleanup);
        setLoaded(true);
    };

    const handleValidateLiveness = validateLivenessService();

    // Call the api to upload the images (with guards to prevent duplicate calls)
    useEffect(() => {
        // Guard conditions to prevent duplicate calls
        if (!isCompleted) return;
        if (validationStatus !== "idle") return; // Don't call if already loading, success, or error
        if (validationInitiatedRef.current) return; // Don't call if already initiated

        if (!capturedFront || !capturedLeft || !capturedRight || !capturedUp) {
            toast.error("Please capture all images");
            setValidationStatus("error");
            setValidationError("Please capture all images");
            return;
        }

        // Mark validation as initiated and set loading state
        validationInitiatedRef.current = true;
        setValidationStatus("loading");

        console.log("Initiating liveness validation...");

        handleValidateLiveness.mutate(
            {
                front: capturedFront!,
                left: capturedLeft!,
                right: capturedRight!,
                up: capturedUp!,
            },
            {
                onSuccess: () => {
                    setValidationStatus("success");
                    toast.success("Liveness check successful");
                    // Redirect after showing success for a moment
                    setTimeout(() => {
                        navigate(`/complete/${urlParams}`);
                    }, 3000);
                },
                onError: (error: any) => {
                    console.error(error);
                    setValidationStatus("error");
                    setValidationError(
                        error?.message || "Liveness validation failed"
                    );
                    toast.error("Liveness check failed");
                },
            }
        );
    }, [
        isCompleted,
        validationStatus,
        capturedFront,
        capturedLeft,
        capturedRight,
        capturedUp,
    ]);

    return (
        <div className="container mx-auto px-4 py-8">
            <ProgressStepper currentStep={3} />

            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <motion.div
                    className="text-center mb-6"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                        Liveness Check
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Follow the instructions to prove you're a real person
                    </p>
                </motion.div>

                <MobileQR />

                {/* Progress Indicator */}
                <motion.div
                    className="mb-6"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                            Head Movement Progress
                        </span>
                        <span className="text-sm text-gray-500">
                            {getCompletedCount()} of{" "}
                            {Object.keys(rotationInstructions).length} completed
                        </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <motion.div
                            className="bg-green-600 h-2 rounded-full"
                            initial={{ width: 0 }}
                            animate={{
                                width: `${
                                    (getCompletedCount() /
                                        Object.keys(rotationInstructions)
                                            .length) *
                                    100
                                }%`,
                            }}
                            transition={{ duration: 0.5 }}
                        />
                    </div>
                </motion.div>

                {/* Camera/Preview Area */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                >
                    <Card className="mb-6">
                        <CardContent className="p-6">
                            <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                                <div className="relative w-full h-full">
                                    {!isCompleted ? (
                                        <>
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
                                            />
                                        </>
                                    ) : (
                                        <>
                                            {/* Loading State */}
                                            {validationStatus === "loading" && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600">
                                                    <div className="text-center text-white flex flex-col items-center">
                                                        <div className="mb-4">
                                                            <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                                                        </div>
                                                        <div className="text-2xl font-bold tracking-wide animate-pulse">
                                                            Validating Images...
                                                        </div>
                                                        <div className="text-sm mt-2 opacity-90">
                                                            Please wait while we
                                                            process your
                                                            liveness check
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Success State */}
                                            {validationStatus === "success" && (
                                                <motion.div
                                                    className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-green-400 via-green-500 to-green-600"
                                                    initial={{
                                                        scale: 0.8,
                                                        opacity: 0,
                                                    }}
                                                    animate={{
                                                        scale: 1,
                                                        opacity: 1,
                                                    }}
                                                    transition={{
                                                        duration: 0.5,
                                                        type: "spring",
                                                    }}
                                                >
                                                    <div className="text-center text-white flex flex-col items-center">
                                                        <motion.div
                                                            className="mb-4"
                                                            initial={{
                                                                scale: 0,
                                                            }}
                                                            animate={{
                                                                scale: 1,
                                                            }}
                                                            transition={{
                                                                delay: 0.2,
                                                                type: "spring",
                                                                stiffness: 200,
                                                            }}
                                                        >
                                                            <CheckCircle className="w-16 h-16 mx-auto text-white animate-bounce drop-shadow-lg" />
                                                        </motion.div>
                                                        <motion.div
                                                            className="text-2xl font-bold tracking-wide mb-2"
                                                            initial={{
                                                                y: 20,
                                                                opacity: 0,
                                                            }}
                                                            animate={{
                                                                y: 0,
                                                                opacity: 1,
                                                            }}
                                                            transition={{
                                                                delay: 0.4,
                                                            }}
                                                        >
                                                            Liveness Check
                                                            Successful!
                                                        </motion.div>
                                                        <motion.div
                                                            className="text-sm opacity-90"
                                                            initial={{
                                                                y: 20,
                                                                opacity: 0,
                                                            }}
                                                            animate={{
                                                                y: 0,
                                                                opacity: 1,
                                                            }}
                                                            transition={{
                                                                delay: 0.6,
                                                            }}
                                                        >
                                                            Redirecting to next
                                                            step...
                                                        </motion.div>
                                                    </div>
                                                </motion.div>
                                            )}

                                            {/* Error State */}
                                            {validationStatus === "error" && (
                                                <motion.div
                                                    className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-red-400 via-red-500 to-red-600"
                                                    initial={{
                                                        scale: 0.8,
                                                        opacity: 0,
                                                    }}
                                                    animate={{
                                                        scale: 1,
                                                        opacity: 1,
                                                    }}
                                                    transition={{
                                                        duration: 0.5,
                                                        type: "spring",
                                                    }}
                                                >
                                                    <div className="text-center text-white flex flex-col items-center px-6">
                                                        <motion.div
                                                            className="mb-4"
                                                            initial={{
                                                                scale: 0,
                                                            }}
                                                            animate={{
                                                                scale: 1,
                                                            }}
                                                            transition={{
                                                                delay: 0.2,
                                                                type: "spring",
                                                                stiffness: 200,
                                                            }}
                                                        >
                                                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                                                                <span className="text-red-500 text-3xl font-bold">
                                                                    ✕
                                                                </span>
                                                            </div>
                                                        </motion.div>
                                                        <motion.div
                                                            className="text-2xl font-bold tracking-wide mb-2"
                                                            initial={{
                                                                y: 20,
                                                                opacity: 0,
                                                            }}
                                                            animate={{
                                                                y: 0,
                                                                opacity: 1,
                                                            }}
                                                            transition={{
                                                                delay: 0.4,
                                                            }}
                                                        >
                                                            Validation Failed
                                                        </motion.div>
                                                        <motion.div
                                                            className="text-sm opacity-90 mb-4"
                                                            initial={{
                                                                y: 20,
                                                                opacity: 0,
                                                            }}
                                                            animate={{
                                                                y: 0,
                                                                opacity: 1,
                                                            }}
                                                            transition={{
                                                                delay: 0.6,
                                                            }}
                                                        >
                                                            {validationError}
                                                        </motion.div>
                                                        <motion.div
                                                            initial={{
                                                                y: 20,
                                                                opacity: 0,
                                                            }}
                                                            animate={{
                                                                y: 0,
                                                                opacity: 1,
                                                            }}
                                                            transition={{
                                                                delay: 0.8,
                                                            }}
                                                        >
                                                            <Button
                                                                onClick={() => {
                                                                    setValidationStatus(
                                                                        "idle"
                                                                    );
                                                                    setIsCompleted(
                                                                        false
                                                                    );
                                                                    setRotationStatus(
                                                                        {
                                                                            front: false,
                                                                            left: false,
                                                                            right: false,
                                                                            up: false,
                                                                        }
                                                                    );
                                                                    setCurrentInstruction(
                                                                        "front"
                                                                    );
                                                                    setValidationError(
                                                                        ""
                                                                    );
                                                                    setShowProgress(
                                                                        false
                                                                    );
                                                                    setCurrentProgress(
                                                                        0
                                                                    );

                                                                    // Reset validation initiated flag
                                                                    validationInitiatedRef.current =
                                                                        false;

                                                                    // Reset capture states
                                                                    setCapturedFront(
                                                                        null
                                                                    );
                                                                    setCapturedLeft(
                                                                        null
                                                                    );
                                                                    setCapturedRight(
                                                                        null
                                                                    );
                                                                    setCapturedUp(
                                                                        null
                                                                    );

                                                                    // Reset consecutive detection counters
                                                                    consecutiveDetectionsRef.current =
                                                                        {
                                                                            front: 0,
                                                                            left: 0,
                                                                            right: 0,
                                                                            up: 0,
                                                                        };

                                                                    // Reset captured directions tracking
                                                                    capturedDirectionsRef.current =
                                                                        {
                                                                            front: false,
                                                                            left: false,
                                                                            right: false,
                                                                            up: false,
                                                                        };
                                                                }}
                                                                className="bg-white text-red-600 hover:bg-gray-100 px-6 py-3 rounded-lg font-semibold shadow-lg"
                                                            >
                                                                Try Again
                                                            </Button>
                                                        </motion.div>
                                                    </div>
                                                </motion.div>
                                            )}

                                            {/* Initial Completion State (before validation starts) */}
                                            {validationStatus === "idle" && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-green-400 via-green-500 to-green-600">
                                                    <div className="text-center text-white flex flex-col items-center">
                                                        <div className="mb-4">
                                                            <CheckCircle className="w-16 h-16 mx-auto text-white animate-bounce drop-shadow-lg" />
                                                        </div>
                                                        <div className="text-2xl font-bold tracking-wide">
                                                            Liveness Check
                                                            Complete!
                                                        </div>
                                                        <div className="text-sm mt-2 opacity-90">
                                                            Starting
                                                            validation...
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* Face detection overlay */}
                                    {loaded || isCompleted ? (
                                        <div className="absolute inset-0 pointer-events-none z-20">
                                            {/* Animated Progress Bar Overlay */}
                                            <AnimatePresence>
                                                {showProgress &&
                                                    !isCompleted && (
                                                        <motion.div
                                                            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                                                            style={{
                                                                marginTop:
                                                                    "-120px",
                                                            }}
                                                            initial={{
                                                                opacity: 0,
                                                                scale: 0.8,
                                                            }}
                                                            animate={{
                                                                opacity: 1,
                                                                scale: 1,
                                                            }}
                                                            exit={{
                                                                opacity: 0,
                                                                scale: 0.8,
                                                            }}
                                                            transition={{
                                                                duration: 0.3,
                                                            }}
                                                        >
                                                            {/* Progress Bar Container */}
                                                            <div className="w-48 h-3 bg-white bg-opacity-30 rounded-full overflow-hidden shadow-lg backdrop-blur-sm">
                                                                <motion.div
                                                                    className="h-full bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                                                                    initial={{
                                                                        width: 0,
                                                                    }}
                                                                    animate={{
                                                                        width: `${currentProgress}%`,
                                                                    }}
                                                                    transition={{
                                                                        duration: 0.3,
                                                                        ease: "easeOut",
                                                                    }}
                                                                />
                                                                {/* Animated shine effect */}
                                                                <motion.div
                                                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white via-transparent opacity-30"
                                                                    animate={{
                                                                        x: [
                                                                            -100,
                                                                            200,
                                                                        ],
                                                                    }}
                                                                    transition={{
                                                                        repeat: Infinity,
                                                                        repeatType:
                                                                            "loop",
                                                                        duration: 2,
                                                                        ease: "linear",
                                                                    }}
                                                                    style={{
                                                                        width: "20%",
                                                                        height: "100%",
                                                                    }}
                                                                />
                                                            </div>

                                                            {/* Success animation when completing */}
                                                            {currentProgress >=
                                                                100 && (
                                                                <motion.div
                                                                    className="absolute inset-0 bg-green-500 rounded-full"
                                                                    initial={{
                                                                        scale: 1,
                                                                        opacity: 0.8,
                                                                    }}
                                                                    animate={{
                                                                        scale: 2,
                                                                        opacity: 0,
                                                                    }}
                                                                    transition={{
                                                                        duration: 0.6,
                                                                    }}
                                                                />
                                                            )}
                                                        </motion.div>
                                                    )}
                                            </AnimatePresence>

                                            {/* Current Instruction */}
                                            <AnimatePresence mode="wait">
                                                {!isCompleted && (
                                                    <motion.div
                                                        key={currentInstruction}
                                                        className="text-center absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 w-1/2"
                                                        initial={{
                                                            opacity: 0,
                                                            y: 20,
                                                        }}
                                                        animate={{
                                                            opacity: 1,
                                                            y: 0,
                                                        }}
                                                        exit={{
                                                            opacity: 0,
                                                            y: -20,
                                                        }}
                                                        transition={{
                                                            duration: 0.4,
                                                        }}
                                                    >
                                                        <Card className="bg-blue-50 p-1 border-blue-200">
                                                            <CardContent>
                                                                <div className="flex items-center justify-center">
                                                                    {(() => {
                                                                        const IconComponent =
                                                                            rotationInstructions[
                                                                                currentInstruction
                                                                            ]
                                                                                .icon;
                                                                        return (
                                                                            <div className="bg-blue-600 text-white p-1 rounded-full mr-3">
                                                                                <IconComponent className="w-4 h-4" />
                                                                            </div>
                                                                        );
                                                                    })()}
                                                                    <div>
                                                                        <h3 className="text-lg font-bold text-blue-900">
                                                                            {
                                                                                rotationInstructions[
                                                                                    currentInstruction
                                                                                ]
                                                                                    .text
                                                                            }
                                                                        </h3>
                                                                    </div>
                                                                </div>
                                                            </CardContent>
                                                        </Card>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-30">
                                            <div className="text-center text-white">
                                                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                                <div className="text-sm">
                                                    Loading camera...
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Control Buttons */}

                <Button
                    onClick={switchCamera}
                    variant="outline"
                    className="py-3"
                    size="lg"
                >
                    <RotateCcw className="w-5 h-5 mr-2" />
                    Switch Camera
                </Button>
                {/* Tips */}
                <motion.div
                    className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.9 }}
                >
                    <h3 className="font-semibold text-amber-900 mb-3">
                        Tips for liveness check:
                    </h3>
                    <ul className="space-y-2 text-sm text-amber-800 list-disc list-inside">
                        <li>Keep your face centered in the circle</li>
                        <li>Move your head slowly and deliberately</li>
                        <li>Ensure good lighting on your face</li>
                        <li>Complete all four directional movements</li>
                        <li>Stay within the camera frame at all times</li>
                    </ul>
                </motion.div>
            </div>
        </div>
    );
};

export default Liveness;
