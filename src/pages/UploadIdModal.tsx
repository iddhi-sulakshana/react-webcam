import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import Webcam from "react-webcam";
import { Camera, Upload, FileImage } from "lucide-react";
import { getApiUrl } from "../utils/apiConfig";
// cv as global variable
declare global {
    interface Window {
        cv: any;
    }
}

// Enhanced contour detection with more robust filtering
const detectIdCardAdvanced = (
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement
) => {
    if (!window.cv || !video || !canvas)
        return { detected: false, confidence: 0, boundingBox: null };

    const cv = window.cv;

    try {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        if (canvas.width === 0 || canvas.height === 0)
            return { detected: false, confidence: 0, boundingBox: null };

        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }

        const src = cv.imread(canvas);
        const gray = new cv.Mat();
        const blurred = new cv.Mat();
        const edges = new cv.Mat();
        const hierarchy = new cv.Mat();
        const contours = new cv.MatVector();

        // Convert to grayscale
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

        // Apply bilateral filter to reduce noise while keeping edges sharp
        cv.bilateralFilter(gray, blurred, 11, 17, 17);

        // Adaptive threshold for better edge detection
        const thresh = new cv.Mat();
        cv.adaptiveThreshold(
            blurred,
            thresh,
            255,
            cv.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv.THRESH_BINARY,
            11,
            2
        );

        // Edge detection using Canny
        cv.Canny(thresh, edges, 30, 200, 3, false);

        // Morphological operations
        const kernel = cv.getStructuringElement(
            cv.MORPH_RECT,
            new cv.Size(3, 3)
        );
        cv.morphologyEx(edges, edges, cv.MORPH_CLOSE, kernel);
        cv.dilate(edges, edges, kernel, new cv.Point(-1, -1), 1);

        // Find contours
        cv.findContours(
            edges,
            contours,
            hierarchy,
            cv.RETR_EXTERNAL,
            cv.CHAIN_APPROX_SIMPLE
        );

        let bestCandidate = null;
        let maxConfidence = 0;

        const imageArea = canvas.width * canvas.height;

        for (let i = 0; i < contours.size(); i++) {
            const contour = contours.get(i);
            const area = cv.contourArea(contour);
            const areaRatio = area / imageArea;

            // Filter by area (10% to 80% of image)
            if (areaRatio < 0.5 || areaRatio > 0.9) {
                contour.delete();
                continue;
            }

            // Approximate contour to polygon
            const approx = new cv.Mat();
            const epsilon = 0.02 * cv.arcLength(contour, true);
            cv.approxPolyDP(contour, approx, epsilon, true);

            // Get bounding rectangle
            const rect = cv.boundingRect(contour);
            const aspectRatio = rect.width / rect.height;

            // Calculate confidence score
            let confidence = 0;

            // Aspect ratio score (ID cards: 1.4-1.8, tolerance: 1.2-2.0)
            if (aspectRatio >= 1.2 && aspectRatio <= 2.0) {
                const idealRatio = 1.586; // Standard ID card ratio
                const ratioScore =
                    1 - Math.abs(aspectRatio - idealRatio) / idealRatio;
                confidence += ratioScore * 40; // 40% weight
            }

            // Area score (prefer moderate sizes)
            if (areaRatio >= 0.15 && areaRatio <= 0.6) {
                const areaScore = 1 - Math.abs(areaRatio - 0.3) / 0.3;
                confidence += areaScore * 30; // 30% weight
            }

            // Corner count score (rectangles should have ~4 corners)
            const cornerScore = Math.max(0, 1 - Math.abs(approx.rows - 4) / 4);
            confidence += cornerScore * 20; // 20% weight

            // Solidity score (how filled the contour is)
            const hull = new cv.Mat();
            cv.convexHull(contour, hull);
            const hullArea = cv.contourArea(hull);
            const solidity = area / hullArea;
            if (solidity > 0.8) {
                confidence += solidity * 10; // 10% weight
            }
            hull.delete();

            if (confidence > maxConfidence && confidence > 60) {
                // Minimum confidence threshold
                maxConfidence = confidence;
                bestCandidate = {
                    x: rect.x,
                    y: rect.y,
                    width: rect.width,
                    height: rect.height,
                    area: area,
                    aspectRatio: aspectRatio,
                };
            }

            approx.delete();
            contour.delete();
        }

        // Clean up
        src.delete();
        gray.delete();
        blurred.delete();
        thresh.delete();
        edges.delete();
        hierarchy.delete();
        contours.delete();
        kernel.delete();

        return {
            detected: maxConfidence > 60,
            confidence: maxConfidence,
            boundingBox: bestCandidate,
        };
    } catch (error) {
        console.error("Advanced OpenCV detection error:", error);
        return { detected: false, confidence: 0, boundingBox: null };
    }
};

const UploadIdModal = ({
    isOpen,
    onClose,
    onSuccess,
    sessionId,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (
        idImages: { front: string; back: string } | { passport: string }
    ) => void;
    sessionId: string | null;
}) => {
    const webcamRef = useRef<Webcam>(null);
    const [frontImage, setFrontImage] = useState<string | null>(null);
    const [backImage, setBackImage] = useState<string | null>(null);
    const [passportImage, setPassportImage] = useState<string | null>(null);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(
        null
    );
    const [step, setStep] = useState<"front" | "back" | "passport">("front");
    const [loadingSubmit, setLoadingSubmit] = useState(false);
    const [uploadMode, setUploadMode] = useState<"capture" | "upload">(
        "capture"
    );
    const [documentType, setDocumentType] = useState<"id" | "passport">("id");
    const [idDetected, setIdDetected] = useState<boolean>(false);

    // Reset state when switching modes
    const switchUploadMode = (mode: "capture" | "upload") => {
        setUploadMode(mode);
        setFrontImage(null);
        setBackImage(null);
        setPassportImage(null);
        setStep(documentType === "passport" ? "passport" : "front");
    };

    // Reset state when switching document types
    const switchDocumentType = (type: "id" | "passport") => {
        setDocumentType(type);
        setFrontImage(null);
        setBackImage(null);
        setPassportImage(null);
        setStep(type === "passport" ? "passport" : "front");
    };

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setFrontImage(null);
            setBackImage(null);
            setPassportImage(null);
            setStep("front");
            setUploadMode("capture");
            setDocumentType("id");
            setLoadingSubmit(false);
        }
    }, [isOpen]);
    const frontFileInputRef = useRef<HTMLInputElement>(null);
    const backFileInputRef = useRef<HTMLInputElement>(null);
    const passportFileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isOpen || uploadMode !== "capture") return;

        const getDevices = async () => {
            try {
                const allDevices =
                    await navigator.mediaDevices.enumerateDevices();
                const videoDevices = allDevices.filter(
                    (device) => device.kind === "videoinput"
                );
                setDevices(videoDevices);

                const droidCam = videoDevices.find(
                    (d) =>
                        d.label.toLowerCase().includes("iriun") ||
                        d.label.toLowerCase().includes("droidcam")
                );
                setSelectedDeviceId(
                    droidCam?.deviceId || videoDevices[0]?.deviceId || null
                );
            } catch (err) {
                console.error("Device fetch error:", err);
            }
        };

        getDevices();
    }, [isOpen, uploadMode]);

    const videoConstraints = selectedDeviceId
        ? {
              deviceId: { exact: selectedDeviceId },
              frameRate: { ideal: 15, max: 30 },
          }
        : undefined;

    const capturePhoto = async () => {
        if (!webcamRef.current?.video) return;
        const width = webcamRef.current?.video.videoWidth;
        const height = webcamRef.current?.video.videoHeight;
        const imageSrc = webcamRef.current?.getScreenshot({
            height: height,
            width: width,
        });
        if (!imageSrc) return;

        if (documentType === "passport") {
            setPassportImage(imageSrc);
        } else if (step === "front") {
            setFrontImage(imageSrc);
            setStep("back");
        } else {
            setBackImage(imageSrc);
        }
    };

    const handleFileUpload = (
        event: React.ChangeEvent<HTMLInputElement>,
        side: "front" | "back" | "passport"
    ) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            toast.error("Please select a valid image file.");
            return;
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            toast.error("File size must be less than 10MB.");
            return;
        }

        const reader = new FileReader();
        reader.onload = async () => {
            const base64 = reader.result as string;
            // Use original image without cropping for file uploads

            if (side === "passport") {
                setPassportImage(base64);
            } else if (side === "front") {
                setFrontImage(base64);
                setStep("back");
            } else {
                setBackImage(base64);
            }
        };
        reader.readAsDataURL(file);

        // Reset the input
        event.target.value = "";
    };

    const triggerFileUpload = (side: "front" | "back" | "passport") => {
        if (side === "front") {
            frontFileInputRef.current?.click();
        } else if (side === "back") {
            backFileInputRef.current?.click();
        } else {
            passportFileInputRef.current?.click();
        }
    };

    const submitDocuments = async () => {
        if (documentType === "id" && (!frontImage || !backImage)) {
            toast.error("Both sides of ID must be captured.");
            return;
        }

        if (documentType === "passport" && !passportImage) {
            toast.error("Passport image must be captured.");
            return;
        }

        if (!sessionId) {
            toast.error("Session ID is not available.");
            onClose();
            return;
        }

        setLoadingSubmit(true);

        try {
            let res;
            let successData;

            if (documentType === "passport") {
                res = await fetch(
                    getApiUrl("/api/v1/validate/upload-passport"),
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "X-Session-ID": sessionId,
                        },
                        body: JSON.stringify({
                            image: passportImage,
                        }),
                    }
                );
                successData = { passport: passportImage! };
            } else {
                res = await fetch(getApiUrl("/api/v1/validate/upload-id"), {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-Session-ID": sessionId,
                    },
                    body: JSON.stringify({
                        front_image: frontImage,
                        back_image: backImage,
                    }),
                });
                successData = { front: frontImage!, back: backImage! };
            }

            const data = await res.json();

            if (res.ok && data.message && data.message === "Verified") {
                toast.success(
                    `${
                        documentType === "passport" ? "Passport" : "ID"
                    } document submitted successfully!`
                );
                onSuccess(successData);
            } else {
                toast.error(
                    data.detail ||
                        `${
                            documentType === "passport" ? "Passport" : "ID"
                        } document not detected. Please try again.`
                );
            }
        } catch (err) {
            console.error("Upload failed:", err);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setLoadingSubmit(false);
        }
    };

    const detectionCanvasRef = useRef(null);
    console.log("idDetected", idDetected);
    // ID Detection function using OpenCV
    const detectIdCard = () => {
        if (!webcamRef.current?.video || !detectionCanvasRef.current) {
            return { detected: false, confidence: 0, boundingBox: null };
        }

        const video = webcamRef.current.video;
        const canvas = detectionCanvasRef.current;

        // Use basic detection if advanced fails
        const result = detectIdCardAdvanced(video, canvas);
        return result;
    };
    // Start detection interval
    useEffect(() => {
        console.log("isOpen", isOpen);
        console.log("uploadMode", uploadMode);
        if (!isOpen || uploadMode !== "capture") return;

        const interval = setInterval(() => {
            const result = detectIdCard();
            setIdDetected(result.detected);
        }, 100);

        return () => clearInterval(interval);
    }, [isOpen, uploadMode]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4 max-h-screen overflow-hidden">
            {/* Hidden canvas for OpenCV processing */}
            <canvas ref={detectionCanvasRef} className="hidden" />
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl p-6 relative overflow-y-auto max-h-[90vh]">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-4 text-xl font-bold"
                >
                    ✕
                </button>

                <h2 className="text-2xl font-bold mb-4 text-center">
                    KYC Document Upload
                </h2>

                {/* Document Type Toggle */}
                <div className="flex justify-center mb-4">
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => switchDocumentType("id")}
                            className={`px-4 py-2 rounded-md transition-colors ${
                                documentType === "id"
                                    ? "bg-blue-600 text-white"
                                    : "text-gray-600 hover:text-gray-800"
                            }`}
                        >
                            ID Card
                        </button>
                        <button
                            onClick={() => switchDocumentType("passport")}
                            className={`px-4 py-2 rounded-md transition-colors ${
                                documentType === "passport"
                                    ? "bg-blue-600 text-white"
                                    : "text-gray-600 hover:text-gray-800"
                            }`}
                        >
                            Passport
                        </button>
                    </div>
                </div>

                {/* Mode Toggle */}
                <div className="flex justify-center mb-6">
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => switchUploadMode("capture")}
                            className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                                uploadMode === "capture"
                                    ? "bg-blue-600 text-white"
                                    : "text-gray-600 hover:text-gray-800"
                            }`}
                        >
                            <Camera className="w-4 h-4 mr-2" />
                            Camera
                        </button>
                        <button
                            onClick={() => switchUploadMode("upload")}
                            className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                                uploadMode === "upload"
                                    ? "bg-blue-600 text-white"
                                    : "text-gray-600 hover:text-gray-800"
                            }`}
                        >
                            <Upload className="w-4 h-4 mr-2" />
                            Upload
                        </button>
                    </div>
                </div>

                {/* Hidden file inputs */}
                <input
                    ref={frontFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, "front")}
                    className="hidden"
                />
                <input
                    ref={backFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, "back")}
                    className="hidden"
                />
                <input
                    ref={passportFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, "passport")}
                    className="hidden"
                />

                <div className="flex flex-col items-center">
                    <p className="mb-2 text-lg">
                        {documentType === "passport"
                            ? `${
                                  uploadMode === "capture"
                                      ? "Capture"
                                      : "Upload"
                              } Passport`
                            : `Step ${step === "front" ? "1" : "2"}: ${
                                  uploadMode === "capture"
                                      ? "Capture"
                                      : "Upload"
                              } ${step === "front" ? "Front" : "Back"} of ID`}
                    </p>

                    {(documentType === "passport" && !passportImage) ||
                    (documentType === "id" &&
                        (!frontImage || (step === "back" && !backImage))) ? (
                        <>
                            {uploadMode === "capture" ? (
                                // Camera Capture Mode
                                <>
                                    <div className="relative w-full max-w-md aspect-video mb-4">
                                        <Webcam
                                            ref={webcamRef}
                                            audio={false}
                                            screenshotFormat="image/jpeg"
                                            screenshotQuality={1}
                                            videoConstraints={{
                                                ...videoConstraints,
                                                width: { ideal: 1920 },
                                                height: { ideal: 1080 },
                                            }}
                                            className="rounded-lg w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
                                            <div
                                                className="border-4 border-dashed w-4/5"
                                                style={{
                                                    aspectRatio: "1.586",
                                                    borderColor: idDetected
                                                        ? "green"
                                                        : "red",
                                                }}
                                            ></div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={capturePhoto}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
                                    >
                                        {documentType === "passport"
                                            ? "Capture Passport"
                                            : `Capture ${
                                                  step === "front"
                                                      ? "Front"
                                                      : "Back"
                                              }`}
                                    </button>
                                </>
                            ) : (
                                // File Upload Mode
                                <div className="w-full max-w-md">
                                    <div
                                        onClick={() =>
                                            triggerFileUpload(
                                                documentType === "passport"
                                                    ? "passport"
                                                    : step
                                            )
                                        }
                                        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors mb-4"
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            e.currentTarget.classList.add(
                                                "border-blue-500",
                                                "bg-blue-50"
                                            );
                                        }}
                                        onDragLeave={(e) => {
                                            e.preventDefault();
                                            e.currentTarget.classList.remove(
                                                "border-blue-500",
                                                "bg-blue-50"
                                            );
                                        }}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            e.currentTarget.classList.remove(
                                                "border-blue-500",
                                                "bg-blue-50"
                                            );
                                            const files = e.dataTransfer.files;
                                            if (files.length > 0) {
                                                const mockEvent = {
                                                    target: {
                                                        files,
                                                        value: "",
                                                    },
                                                } as React.ChangeEvent<HTMLInputElement>;
                                                handleFileUpload(
                                                    mockEvent,
                                                    documentType === "passport"
                                                        ? "passport"
                                                        : step
                                                );
                                            }
                                        }}
                                    >
                                        <div className="flex flex-col items-center">
                                            <FileImage className="w-12 h-12 text-gray-400 mb-4" />
                                            <p className="text-lg font-semibold text-gray-700 mb-2">
                                                Upload{" "}
                                                {documentType === "passport"
                                                    ? "Passport"
                                                    : `${
                                                          step === "front"
                                                              ? "Front"
                                                              : "Back"
                                                      } ID`}{" "}
                                                Image
                                            </p>
                                            <p className="text-sm text-gray-500 mb-4">
                                                Click to browse or drag and drop
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                JPG, PNG up to 10MB
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() =>
                                            triggerFileUpload(
                                                documentType === "passport"
                                                    ? "passport"
                                                    : step
                                            )
                                        }
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow flex items-center justify-center"
                                    >
                                        <Upload className="w-4 h-4 mr-2" />
                                        Choose{" "}
                                        {documentType === "passport"
                                            ? "Passport"
                                            : `${
                                                  step === "front"
                                                      ? "Front"
                                                      : "Back"
                                              }`}{" "}
                                        Image
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            {documentType === "passport" ? (
                                // Passport Preview
                                <div className="w-full max-w-md">
                                    <h2 className="text-center font-semibold mb-4">
                                        Passport
                                    </h2>
                                    <img
                                        src={passportImage!}
                                        alt="Passport"
                                        className="rounded-lg shadow-md max-h-60 mx-auto w-full object-contain"
                                    />
                                    <button
                                        onClick={() => {
                                            setPassportImage(null);
                                            setStep("passport");
                                        }}
                                        className="mt-2 w-full bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded shadow flex items-center justify-center"
                                    >
                                        {uploadMode === "capture" ? (
                                            <>
                                                <Camera className="w-4 h-4 mr-2" />
                                                Retake Passport
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="w-4 h-4 mr-2" />
                                                Reupload Passport
                                            </>
                                        )}
                                    </button>
                                </div>
                            ) : (
                                // ID Preview
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                                    <div>
                                        <h2 className="text-center font-semibold">
                                            Front
                                        </h2>
                                        <img
                                            src={frontImage!}
                                            alt="Front ID"
                                            className="rounded-lg shadow-md max-h-60 mx-auto"
                                        />
                                        <button
                                            onClick={() => {
                                                setFrontImage(null);
                                                setStep("front");
                                            }}
                                            className="mt-2 w-full bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded shadow flex items-center justify-center"
                                        >
                                            {uploadMode === "capture" ? (
                                                <>
                                                    <Camera className="w-4 h-4 mr-2" />
                                                    Retake Front
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="w-4 h-4 mr-2" />
                                                    Reupload Front
                                                </>
                                            )}
                                        </button>
                                    </div>

                                    <div>
                                        <h2 className="text-center font-semibold">
                                            Back
                                        </h2>
                                        {backImage ? (
                                            <>
                                                <img
                                                    src={backImage!}
                                                    alt="Back ID"
                                                    className="rounded-lg shadow-md max-h-60 mx-auto"
                                                />
                                                <button
                                                    onClick={() => {
                                                        setBackImage(null);
                                                        setStep("back");
                                                    }}
                                                    className="mt-2 w-full bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded shadow flex items-center justify-center"
                                                >
                                                    {uploadMode ===
                                                    "capture" ? (
                                                        <>
                                                            <Camera className="w-4 h-4 mr-2" />
                                                            Retake Back
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Upload className="w-4 h-4 mr-2" />
                                                            Reupload Back
                                                        </>
                                                    )}
                                                </button>
                                            </>
                                        ) : (
                                            <p className="text-center text-gray-500 mt-4">
                                                Not{" "}
                                                {uploadMode === "capture"
                                                    ? "captured"
                                                    : "uploaded"}{" "}
                                                yet
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {((documentType === "passport" && passportImage) ||
                                (documentType === "id" &&
                                    frontImage &&
                                    backImage)) && (
                                <div className="flex items-center justify-center mt-6">
                                    <button
                                        onClick={submitDocuments}
                                        disabled={loadingSubmit}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded shadow"
                                    >
                                        {loadingSubmit
                                            ? "Submitting..."
                                            : "Continue"}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {uploadMode === "capture" && devices.length > 1 && (
                    <div className="mt-6 text-center">
                        <label className="mr-2 font-semibold">
                            Select Camera:
                        </label>
                        <select
                            value={selectedDeviceId || ""}
                            onChange={(e) =>
                                setSelectedDeviceId(e.target.value)
                            }
                            className="border rounded px-2 py-1"
                        >
                            {devices.map((d) => (
                                <option key={d.deviceId} value={d.deviceId}>
                                    {d.label || "Unnamed"}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UploadIdModal;
