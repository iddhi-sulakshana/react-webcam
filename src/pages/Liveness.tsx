import MobileQR from "@/components/MobileQR";
import ProgressStepper from "@/components/ProgressStepper";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import buildUrlSessionTokens from "@/lib/buildUrlSessionTokens";
import { useVerificationStore } from "@/stores/verificationStore";
import { AnimatePresence, motion } from "framer-motion";
import {
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    ArrowUp,
    Camera,
    Check,
    CheckCircle,
    RotateCcw,
    ScanFace,
    X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Webcam from "react-webcam";

type RotationDirection = "front" | "left" | "right" | "up" | "down";

interface RotationStatus {
    front: boolean;
    left: boolean;
    right: boolean;
    up: boolean;
    down: boolean;
}

const Liveness = () => {
    const webcamRef = useRef<Webcam>(null);
    const [isWebcamActive, setIsWebcamActive] = useState(false);
    const [facingMode, setFacingMode] = useState<"user" | "environment">(
        "user"
    );
    const [rotationStatus, setRotationStatus] = useState<RotationStatus>({
        front: false,
        left: false,
        right: false,
        up: false,
        down: false,
    });
    const [currentInstruction, setCurrentInstruction] =
        useState<RotationDirection>("front");
    const [isCompleted, setIsCompleted] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [timer, setTimer] = useState(0);

    const { setStepStatus, getStepStatus } = useVerificationStore();
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

    const rotationInstructions = {
        front: {
            icon: ScanFace,
            text: "Look straight ahead",
            description: "Keep your face in the circle",
        },
        left: {
            icon: ArrowLeft,
            text: "Turn your head to the LEFT",
            description: "Look left while keeping your face in the circle",
        },
        right: {
            icon: ArrowRight,
            text: "Turn your head to the RIGHT",
            description: "Look right while keeping your face in the circle",
        },
        up: {
            icon: ArrowUp,
            text: "Tilt your head UP",
            description: "Look up while keeping your face in the circle",
        },
        down: {
            icon: ArrowDown,
            text: "Tilt your head DOWN",
            description: "Look down while keeping your face in the circle",
        },
    };

    const getNextInstruction = (
        current: RotationDirection
    ): RotationDirection => {
        const order: RotationDirection[] = [
            "front",
            "left",
            "right",
            "up",
            "down",
        ];
        const currentIndex = order.indexOf(current);
        const remainingDirections = order.filter(
            (direction) => !rotationStatus[direction]
        );

        if (remainingDirections.length === 0) return current;

        // Find next unCompleted direction
        for (let i = currentIndex + 1; i < order.length; i++) {
            if (!rotationStatus[order[i]]) {
                return order[i];
            }
        }

        // If we've reached the end, find the first uncompleted
        for (let i = 0; i < currentIndex; i++) {
            if (!rotationStatus[order[i]]) {
                return order[i];
            }
        }

        return remainingDirections[0];
    };

    const completeRotation = (direction: RotationDirection) => {
        setRotationStatus((prev) => {
            const newStatus = { ...prev, [direction]: true };

            // Check if all rotations are complete
            const allComplete = Object.values(newStatus).every(Boolean);
            if (allComplete) {
                setIsCompleted(true);
                return newStatus;
            }

            // Move to next instruction
            const nextInstruction = getNextInstruction(direction);
            setCurrentInstruction(nextInstruction);

            return newStatus;
        });
    };

    // Simulate head movement detection (in real app, this would use face detection)
    useEffect(() => {
        if (!isWebcamActive || isCompleted) return;

        const interval = setInterval(() => {
            setTimer((prev) => prev + 1);

            // Simulate automatic completion after 3 seconds on current instruction
            if (
                timer > 0 &&
                timer % 60 === 0 &&
                !rotationStatus[currentInstruction]
            ) {
                completeRotation(currentInstruction);
            }
        }, 50);

        return () => clearInterval(interval);
    }, [
        isWebcamActive,
        timer,
        currentInstruction,
        rotationStatus,
        isCompleted,
    ]);

    const switchCamera = () => {
        setFacingMode(facingMode === "user" ? "environment" : "user");
    };

    const resetLiveness = () => {
        setRotationStatus({
            front: false,
            left: false,
            right: false,
            up: false,
            down: false,
        });
        setCurrentInstruction("front");
        setIsCompleted(false);
        setTimer(0);
    };

    const handleSubmit = async () => {
        if (!isCompleted) return;

        setIsProcessing(true);

        // Simulate processing
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Update store status
        setStepStatus("liveness", "approved");

        setIsProcessing(false);

        // Navigate to next step
        navigate(`/complete/${urlParams}`);
    };

    const videoConstraints = {
        width: 1280,
        height: 720,
        facingMode: facingMode,
    };

    const getCompletedCount = () => {
        return Object.values(rotationStatus).filter(Boolean).length;
    };

    const getBoundingCircleSegments = () => {
        return [
            {
                direction: "front" as RotationDirection,
                rotation: 0,
                completed: rotationStatus.front,
            },
            {
                direction: "left" as RotationDirection,
                rotation: 180,
                completed: rotationStatus.left,
            },
            {
                direction: "up" as RotationDirection,
                rotation: 270,
                completed: rotationStatus.up,
            },
            {
                direction: "right" as RotationDirection,
                rotation: 0,
                completed: rotationStatus.right,
            },
            {
                direction: "down" as RotationDirection,
                rotation: 90,
                completed: rotationStatus.down,
            },
        ];
    };

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

                {/* Current Instruction */}
                <AnimatePresence mode="wait">
                    {!isCompleted && isWebcamActive && (
                        <motion.div
                            key={currentInstruction}
                            className="text-center mb-6"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.4 }}
                        >
                            <Card className="bg-blue-50 border-blue-200">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-center mb-3">
                                        {(() => {
                                            const IconComponent =
                                                rotationInstructions[
                                                    currentInstruction
                                                ].icon;
                                            return (
                                                <div className="bg-blue-600 text-white p-3 rounded-full mr-3">
                                                    <IconComponent className="w-6 h-6" />
                                                </div>
                                            );
                                        })()}
                                        <div>
                                            <h3 className="text-xl font-bold text-blue-900">
                                                {
                                                    rotationInstructions[
                                                        currentInstruction
                                                    ].text
                                                }
                                            </h3>
                                            <p className="text-blue-700">
                                                {
                                                    rotationInstructions[
                                                        currentInstruction
                                                    ].description
                                                }
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Camera/Preview Area */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                >
                    <Card className="mb-6">
                        <CardContent className="p-6">
                            <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
                                {isWebcamActive ? (
                                    // Active webcam with face detection overlay
                                    <div className="relative w-full h-full">
                                        <Webcam
                                            ref={webcamRef}
                                            audio={false}
                                            screenshotFormat="image/jpeg"
                                            videoConstraints={videoConstraints}
                                            className="w-full h-full object-cover"
                                        />

                                        {/* Face detection overlay */}
                                        <div className="absolute inset-0 pointer-events-none">
                                            {/* Center circle with segmented border */}
                                            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                                <div className="relative w-64 h-64">
                                                    {/* Background circle */}
                                                    <div className="absolute inset-0 border-4 border-gray-400 border-dashed rounded-full opacity-30"></div>

                                                    {/* Segmented progress circles */}
                                                    {getBoundingCircleSegments().map(
                                                        (segment, index) => (
                                                            <svg
                                                                key={
                                                                    segment.direction
                                                                }
                                                                className="absolute inset-0 w-full h-full"
                                                                style={{
                                                                    transform: `rotate(${segment.rotation}deg)`,
                                                                }}
                                                            >
                                                                <motion.circle
                                                                    cx="50%"
                                                                    cy="50%"
                                                                    r="126"
                                                                    fill="none"
                                                                    stroke={
                                                                        segment.completed
                                                                            ? "#22c55e"
                                                                            : segment.direction ===
                                                                              currentInstruction
                                                                            ? "#3b82f6"
                                                                            : "transparent"
                                                                    }
                                                                    strokeWidth="8"
                                                                    strokeDasharray="198 198"
                                                                    strokeDashoffset="99"
                                                                    initial={{
                                                                        strokeDashoffset: 297,
                                                                    }}
                                                                    animate={{
                                                                        strokeDashoffset:
                                                                            segment.completed
                                                                                ? 99
                                                                                : segment.direction ===
                                                                                  currentInstruction
                                                                                ? 99
                                                                                : 297,
                                                                    }}
                                                                    transition={{
                                                                        duration: 0.8,
                                                                        delay: segment.completed
                                                                            ? index *
                                                                              0.2
                                                                            : 0,
                                                                    }}
                                                                />
                                                            </svg>
                                                        )
                                                    )}

                                                    {/* Completion checkmark */}
                                                    <AnimatePresence>
                                                        {isCompleted && (
                                                            <motion.div
                                                                className="absolute inset-0 flex items-center justify-center"
                                                                initial={{
                                                                    scale: 0,
                                                                    opacity: 0,
                                                                }}
                                                                animate={{
                                                                    scale: 1,
                                                                    opacity: 1,
                                                                }}
                                                                transition={{
                                                                    duration: 0.6,
                                                                    type: "spring",
                                                                    delay: 0.5,
                                                                }}
                                                            >
                                                                <div className="bg-green-500 rounded-full p-4">
                                                                    <CheckCircle className="w-16 h-16 text-white" />
                                                                </div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>
                                                </div>
                                            </div>

                                            {/* Instructions overlay */}
                                            {!isCompleted && (
                                                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                                                    <div className="bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg text-sm text-center">
                                                        Position your face in
                                                        the circle
                                                        <br />
                                                        Follow the movement
                                                        instructions
                                                    </div>
                                                </div>
                                            )}

                                            {/* Completion message */}
                                            {isCompleted && (
                                                <motion.div
                                                    className="absolute bottom-4 left-1/2 transform -translate-x-1/2"
                                                    initial={{
                                                        opacity: 0,
                                                        y: 20,
                                                    }}
                                                    animate={{
                                                        opacity: 1,
                                                        y: 0,
                                                    }}
                                                    transition={{
                                                        duration: 0.6,
                                                        delay: 1,
                                                    }}
                                                >
                                                    <div className="bg-green-600 text-white px-6 py-3 rounded-lg text-lg font-semibold">
                                                        ✓ Liveness Check
                                                        Complete!
                                                    </div>
                                                </motion.div>
                                            )}
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
                                                Click "Start Liveness Check" to
                                                begin
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
                    {!isWebcamActive ? (
                        <div className="flex flex-col sm:flex-row gap-4">
                            {/* Start Liveness Check Button */}
                            <Button
                                onClick={() => setIsWebcamActive(true)}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3"
                                size="lg"
                            >
                                <Camera className="w-5 h-5 mr-2" />
                                Start Liveness Check
                            </Button>
                        </div>
                    ) : (
                        <div className="flex flex-col sm:flex-row gap-4">
                            {isCompleted ? (
                                <>
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
                                                Continue to Next Step
                                            </>
                                        )}
                                    </Button>

                                    {/* Restart Button */}
                                    <Button
                                        onClick={resetLiveness}
                                        variant="outline"
                                        className="py-3"
                                        size="lg"
                                        disabled={isProcessing}
                                    >
                                        <RotateCcw className="w-5 h-5 mr-2" />
                                        Restart Check
                                    </Button>
                                </>
                            ) : (
                                <>
                                    {/* Manual Complete Button (for demo) */}
                                    <Button
                                        onClick={() =>
                                            completeRotation(currentInstruction)
                                        }
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3"
                                        size="lg"
                                    >
                                        <Check className="w-5 h-5 mr-2" />
                                        Complete{" "}
                                        {currentInstruction.toUpperCase()}{" "}
                                        Movement
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
                    )}
                </motion.div>

                {/* Rotation Status Grid */}
                {isWebcamActive && (
                    <motion.div
                        className="mt-6"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.7 }}
                    >
                        <Card className="bg-gray-50">
                            <CardContent className="p-4">
                                <h3 className="font-semibold text-gray-900 mb-3 text-center">
                                    Movement Checklist
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {Object.entries(rotationInstructions).map(
                                        ([direction, instruction]) => {
                                            const IconComponent =
                                                instruction.icon;
                                            const isCompleted =
                                                rotationStatus[
                                                    direction as RotationDirection
                                                ];
                                            const isCurrent =
                                                currentInstruction ===
                                                direction;

                                            return (
                                                <div
                                                    key={direction}
                                                    className={`
                                                        flex items-center p-3 rounded-lg border transition-all duration-300
                                                        ${
                                                            isCompleted
                                                                ? "bg-green-50 border-green-200 text-green-800"
                                                                : isCurrent
                                                                ? "bg-blue-50 border-blue-200 text-blue-800"
                                                                : "bg-white border-gray-200 text-gray-500"
                                                        }
                                                    `}
                                                >
                                                    {isCompleted ? (
                                                        <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                                                    ) : (
                                                        <IconComponent
                                                            className={`w-5 h-5 mr-2 ${
                                                                isCurrent
                                                                    ? "text-blue-600"
                                                                    : "text-gray-400"
                                                            }`}
                                                        />
                                                    )}
                                                    <span className="text-sm font-medium">
                                                        {direction
                                                            .charAt(0)
                                                            .toUpperCase() +
                                                            direction.slice(1)}
                                                    </span>
                                                </div>
                                            );
                                        }
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

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
                    <ul className="space-y-2 text-sm text-amber-800">
                        <li>• Keep your face centered in the circle</li>
                        <li>• Move your head slowly and deliberately</li>
                        <li>• Ensure good lighting on your face</li>
                        <li>• Complete all four directional movements</li>
                        <li>• Stay within the camera frame at all times</li>
                    </ul>
                </motion.div>
            </div>
        </div>
    );
};

export default Liveness;
