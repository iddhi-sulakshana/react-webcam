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
    const [_, setIsFaceDetected] = useState(false);
    const [loadingDetection, setLoadingDetection] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(
        null
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
              frameRate: { ideal: 10, max: 10 },
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

        // Immediately capture and stop camera
        setSelfieImage(imageSrc);
        toast.success("Selfie captured! Please review and submit.");
    };

    const submitSelfie = async () => {
        if (!selfieImage) return;

        setIsSubmitting(true);
        setLoadingDetection(true);

        try {
            const res = await fetch(
                getApiUrl("/api/v1/validate/upload-selfie"),
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-Session-ID": sessionId,
                    },
                    body: JSON.stringify({ image: selfieImage }),
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
                setIsFaceDetected(false);
            }
        } catch (err) {
            console.error("Detection failed:", err);
            toast.error("Server error. Please try again.");
            // Reset to allow retry
            setSelfieImage(null);
            setIsFaceDetected(false);
        } finally {
            setLoadingDetection(false);
            setIsSubmitting(false);
        }
    };

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

                <div className="flex flex-col items-center">
                    <p className="mb-2">Step 2: Capture a Selfie</p>

                    {!selfieImage ? (
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

                {devices.length > 1 && (
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
