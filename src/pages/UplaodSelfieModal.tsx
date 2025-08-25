import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import Webcam from "react-webcam";
import { getApiUrl } from "../utils/apiConfig";

const UploadSelfieModal = ({
    isOpen,
    onClose,
    onSuccess,
    sessionId,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (selfieImage: any) => void;
    sessionId: string;
}) => {
    const webcamRef = useRef<Webcam>(null);
    const [selfieImage, setSelfieImage] = useState<string | null>(null);
    const [selfieFile, setSelfieFile] = useState<File | null>(null);
    const [_, setIsFaceDetected] = useState(false);
    const [loadingDetection, setLoadingDetection] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(
        null
    );
    const [uploadMode, setUploadMode] = useState<"capture" | "upload">(
        "capture"
    );

    useEffect(() => {
        if (!isOpen) return;

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
                        d.label.toLowerCase().includes("droidcam") ||
                        d.label.toLowerCase().includes("iriun")
                );
                setSelectedDeviceId(
                    droidCam?.deviceId || videoDevices[0]?.deviceId || null
                );
            } catch (err) {
                console.error("Device fetch error:", err);
            }
        };

        getDevices();
    }, [isOpen]);

    const videoConstraints = selectedDeviceId
        ? {
              deviceId: { exact: selectedDeviceId },
              frameRate: { ideal: 15, max: 30 },
          }
        : undefined;

    const captureSelfie = () => {
        if (!webcamRef?.current?.video) return;
        // Get webcamref width and height
        const width = webcamRef.current?.video?.videoWidth;
        const height = webcamRef.current?.video?.videoHeight;

        const imageSrc = webcamRef.current?.getScreenshot({
            height: height,
            width: width,
        });
        if (!imageSrc) {
            toast.error("Failed to capture image. Please try again.");
            return;
        }

        // Convert base64 to File object
        const base64Data = imageSrc.split(",")[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const file = new File([byteArray], "selfie.jpg", {
            type: "image/jpeg",
        });

        // Immediately capture and stop camera
        setSelfieImage(imageSrc);
        setSelfieFile(file);
        toast.success("Selfie captured! Please review and submit.");
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
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
        reader.onload = () => {
            const base64 = reader.result as string;
            setSelfieImage(base64);
            setSelfieFile(file);
        };
        reader.readAsDataURL(file);

        // Reset the input
        event.target.value = "";
    };

    const submitSelfie = async () => {
        if (!selfieFile) return;

        setIsSubmitting(true);
        setLoadingDetection(true);

        try {
            const formData = new FormData();
            formData.append("image", selfieFile);

            const res = await fetch(
                getApiUrl("/api/v1/validate/upload-selfie"),
                {
                    method: "POST",
                    headers: {
                        "X-Session-ID": sessionId,
                    },
                    body: formData,
                }
            );

            const data = await res.json();
            setIsFaceDetected(data?.message === "Verified");
            if (data.message && data.message === "Verified") {
                toast.success("Face detected successfully!");
                onSuccess(selfieImage);
            } else {
                if (data.detail) toast.error(data.detail);
                else toast.error("No face detected. Please try again.");
                // Reset to allow retry
                setSelfieImage(null);
                setSelfieFile(null);
                setIsFaceDetected(false);
            }
        } catch (err) {
            console.error("Detection failed:", err);
            toast.error("Server error. Please try again.");
            // Reset to allow retry
            setSelfieImage(null);
            setSelfieFile(null);
            setIsFaceDetected(false);
        } finally {
            setLoadingDetection(false);
            setIsSubmitting(false);
        }
    };

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setSelfieImage(null);
            setSelfieFile(null);
            setUploadMode("capture");
            setIsFaceDetected(false);
            setLoadingDetection(false);
            setIsSubmitting(false);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4 max-h-screen overflow-hidden">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl p-6 relative overflow-y-auto max-h-[90vh]">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-4 text-xl font-bold"
                >
                    ✕
                </button>

                <h2 className="text-2xl font-bold mb-4 text-center">
                    KYC Selfie Capture
                </h2>

                {/* Mode Toggle */}
                <div className="flex justify-center mb-6">
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => setUploadMode("capture")}
                            className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                                uploadMode === "capture"
                                    ? "bg-blue-600 text-white"
                                    : "text-gray-600 hover:text-gray-800"
                            }`}
                        >
                            📸 Camera
                        </button>
                        <button
                            onClick={() => setUploadMode("upload")}
                            className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                                uploadMode === "upload"
                                    ? "bg-blue-600 text-white"
                                    : "text-gray-600 hover:text-gray-800"
                            }`}
                        >
                            📁 Upload
                        </button>
                    </div>
                </div>

                <div className="flex flex-col items-center">
                    <p className="mb-2">
                        Step 2:{" "}
                        {uploadMode === "capture" ? "Capture" : "Upload"} a
                        Selfie
                    </p>

                    {!selfieImage ? (
                        <>
                            {uploadMode === "capture" ? (
                                <>
                                    <div className="relative w-full max-w-md aspect-video mb-4">
                                        <Webcam
                                            ref={webcamRef}
                                            audio={false}
                                            screenshotFormat="image/jpeg"
                                            videoConstraints={{
                                                ...videoConstraints,
                                                width: { ideal: 1920 },
                                                height: { ideal: 1080 },
                                            }}
                                            className="rounded-lg w-full h-full object-cover"
                                        />
                                        <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
                                            <div
                                                className={`border-4 border-dashed w-4/5 rounded-full`}
                                                style={{
                                                    aspectRatio: "1 / 1",
                                                    borderColor: "blue",
                                                }}
                                            ></div>
                                        </div>
                                    </div>

                                    <button
                                        onClick={captureSelfie}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow-lg text-lg font-semibold"
                                    >
                                        📸 Capture Selfie
                                    </button>
                                </>
                            ) : (
                                <div className="w-full max-w-md">
                                    <div
                                        onClick={() =>
                                            document
                                                .getElementById(
                                                    "selfie-file-input"
                                                )
                                                ?.click()
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
                                                handleFileUpload(mockEvent);
                                            }
                                        }}
                                    >
                                        <div className="flex flex-col items-center">
                                            <div className="text-4xl mb-4">
                                                📁
                                            </div>
                                            <p className="text-lg font-semibold text-gray-700 mb-2">
                                                Upload Selfie Image
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
                                            document
                                                .getElementById(
                                                    "selfie-file-input"
                                                )
                                                ?.click()
                                        }
                                        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow flex items-center justify-center"
                                    >
                                        📁 Choose Selfie Image
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            <div>
                                <h2 className="text-xl font-bold mb-4 text-center">
                                    Review Your Selfie
                                </h2>
                                <img
                                    src={selfieImage}
                                    alt="Captured Selfie"
                                    className="rounded-lg shadow-md max-h-60 mx-auto"
                                />
                                <p className="text-center text-gray-600 mt-2">
                                    Please review your selfie. If you're
                                    satisfied, click Submit to continue.
                                </p>
                            </div>
                            <div className="flex items-center justify-center mt-6 gap-4">
                                <button
                                    onClick={() => {
                                        setSelfieImage(null);
                                        setSelfieFile(null);
                                        setIsFaceDetected(false);
                                    }}
                                    className="bg-gray-300 hover:bg-gray-400 text-black px-6 py-3 rounded-lg shadow-lg font-semibold"
                                >
                                    🔄 Retake Selfie
                                </button>
                                <button
                                    onClick={submitSelfie}
                                    disabled={isSubmitting || loadingDetection}
                                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg shadow-lg font-semibold disabled:opacity-50"
                                >
                                    {isSubmitting || loadingDetection ? (
                                        <span className="flex items-center gap-2">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                            {loadingDetection
                                                ? "Processing..."
                                                : "Submitting..."}
                                        </span>
                                    ) : (
                                        "✅ Submit Selfie"
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* Hidden file input */}
                <input
                    id="selfie-file-input"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                />

                {devices.length > 1 && uploadMode === "capture" && (
                    <div className="mt-4">
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

export default UploadSelfieModal;
