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
    const [isFaceDetected, setIsFaceDetected] = useState(false);
    const [loadingDetection, setLoadingDetection] = useState(false);
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
        ? { deviceId: { exact: selectedDeviceId } }
        : undefined;

    const captureSelfie = async () => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (!imageSrc) return;
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
                    body: JSON.stringify({ image: imageSrc }),
                }
            );

            const data = await res.json();
            setIsFaceDetected(data?.message === "Verified");
            if (data.message && data.message === "Verified") {
                setSelfieImage(imageSrc);
                toast.success("Face detected successfully!");
            } else {
                if (data.detail) toast.error(data.detail);
                else toast.error("No face detected. Please try again.");
            }
        } catch (err) {
            console.error("Detection failed:", err);
            toast.error("Server error.");
        } finally {
            setLoadingDetection(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl p-6 relative">
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
                                    videoConstraints={videoConstraints}
                                    className="rounded-lg w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
                                    <div
                                        className={`border-4 border-dashed w-4/5 rounded-full`}
                                        style={{
                                            aspectRatio: "1 / 1",
                                            borderColor: isFaceDetected
                                                ? "limegreen"
                                                : "red",
                                        }}
                                    ></div>
                                </div>
                            </div>

                            <button
                                onClick={captureSelfie}
                                disabled={loadingDetection}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
                            >
                                {loadingDetection
                                    ? "Checking..."
                                    : "Capture Selfie"}
                            </button>
                        </>
                    ) : (
                        <>
                            <div>
                                <h2 className="text-xl font-bold mb-4">
                                    Your Selfie
                                </h2>
                                <img
                                    src={selfieImage}
                                    alt="Captured Selfie"
                                    className="rounded-lg shadow-md max-h-60"
                                />
                            </div>
                            <div className="flex items-center justify-center mt-4 gap-4">
                                <button
                                    onClick={() => {
                                        setSelfieImage(null);
                                        setIsFaceDetected(false);
                                    }}
                                    className="bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded shadow"
                                >
                                    Retry Selfie
                                </button>
                                <button
                                    onClick={() => {
                                        onSuccess(selfieImage);
                                    }}
                                    disabled={!selfieImage}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
                                >
                                    Continue
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
