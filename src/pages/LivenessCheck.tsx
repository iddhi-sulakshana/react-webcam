import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import Webcam from "react-webcam";
import { getWsUrl } from "../utils/apiConfig";

const LivenessCheck = ({
    isOpen,
    onClose,
    onSuccess,
    session_id,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    session_id: string | null;
}) => {
    const webcamRef = useRef<Webcam>(null);
    const [status, setStatus] = useState<any>({});
    const [ws, setWs] = useState<WebSocket | null>(null);
    const [showSuccess, setShowSuccess] = useState(false);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(
        null
    );
    const [cameraLoading, setCameraLoading] = useState(true);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [retryCount, setRetryCount] = useState(0);

    useEffect(() => {
        if (!isOpen) {
            setCameraLoading(true);
            setCameraError(null);
            setRetryCount(0);
            return;
        }

        const requestCameraPermission = async () => {
            try {
                // Request camera permission explicitly
                await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "user" },
                    audio: false,
                });

                const getDevices = async () => {
                    try {
                        const allDevices =
                            await navigator.mediaDevices.enumerateDevices();
                        const videoDevices = allDevices.filter(
                            (device) => device.kind === "videoinput"
                        );
                        setDevices(videoDevices);

                        const preferred = videoDevices.find(
                            (d) =>
                                d.label.toLowerCase().includes("iriun") ||
                                d.label.toLowerCase().includes("droidcam")
                        );

                        setSelectedDeviceId(
                            preferred?.deviceId ||
                                videoDevices[0]?.deviceId ||
                                null
                        );
                        setCameraLoading(false);
                        setCameraError(null);
                    } catch (err) {
                        console.error("Device fetch error:", err);
                        setCameraError(
                            "Failed to access camera devices. Please try again."
                        );
                        setCameraLoading(false);
                    }
                };

                await getDevices();
            } catch (err: any) {
                console.error("Camera permission error:", err);
                let errorMessage = "Camera access denied. ";

                if (err.name === "NotAllowedError") {
                    errorMessage += "Please allow camera access and try again.";
                } else if (err.name === "NotFoundError") {
                    errorMessage += "No camera found on this device.";
                } else if (err.name === "NotSupportedError") {
                    errorMessage += "Camera not supported on this browser.";
                } else {
                    errorMessage +=
                        "Please check your camera permissions and try again.";
                }

                setCameraError(errorMessage);
                setCameraLoading(false);
            }
        };

        requestCameraPermission();
    }, [isOpen, retryCount]);

    const videoConstraints = selectedDeviceId
        ? {
              deviceId: { exact: selectedDeviceId },
              width: { ideal: 640 },
              height: { ideal: 480 },
              frameRate: { ideal: 30, max: 30 },
          }
        : {
              facingMode: "user",
              width: { ideal: 640 },
              height: { ideal: 480 },
              frameRate: { ideal: 30, max: 30 },
          };

    useEffect(() => {
        if (!isOpen || !session_id) return;

        const socket = new WebSocket(
            getWsUrl("/api/v1/websocket/liveness-check")
        );
        setWs(socket);

        socket.onopen = () => {
            socket.send(JSON.stringify({ session_id }));
        };

        socket.onmessage = (event) => {
            const { checks, error } = JSON.parse(event.data);

            if (error) {
                toast.error(error || "Something went wrong");
                onClose();
                return;
            }

            setStatus(checks);

            const allPassed = Object.values(checks).every((v) => v === true);

            if (allPassed) {
                socket.close();
                setShowSuccess(true);
                setTimeout(() => {
                    setShowSuccess(false);
                    onSuccess();
                }, 2000);
            }
        };

        socket.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        return () => {
            socket.close();
        };
    }, [isOpen, session_id]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (
                webcamRef.current &&
                ws &&
                ws.readyState === WebSocket.OPEN &&
                !cameraLoading &&
                !cameraError
            ) {
                try {
                    const screenshot = webcamRef.current.getScreenshot();
                    if (screenshot) {
                        ws.send(JSON.stringify({ frame: screenshot }));
                    }
                } catch (error) {
                    console.error("Error capturing screenshot:", error);
                }
            }
        }, 300);

        return () => clearInterval(interval);
    }, [ws, cameraLoading, cameraError]);

    if (!isOpen) return null;

    const renderStatus = (label: string, value: boolean) => (
        <div className="flex items-center space-x-2">
            <span className={value ? "text-green-600" : "text-gray-600"}>
                {value ? "✅" : "⬜️"}
            </span>
            <span>{label}</span>
        </div>
    );

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
                    Liveness Check
                </h2>

                <div className="flex flex-col md:flex-row space-y-4 md:space-x-6 relative">
                    <div
                        className={`relative w-full max-w-sm border-3 rounded-lg overflow-hidden ${
                            status.face_detected
                                ? "border-green-500"
                                : "border-red-500"
                        }`}
                    >
                        {cameraLoading && (
                            <div className="w-full h-80 bg-gray-100 flex items-center justify-center rounded-md">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                    <p className="text-gray-600">
                                        Loading camera...
                                    </p>
                                    <p className="text-sm text-gray-500 mt-2">
                                        Please allow camera access when prompted
                                    </p>
                                </div>
                            </div>
                        )}

                        {cameraError && (
                            <div className="w-full h-80 bg-red-50 flex items-center justify-center rounded-md p-4">
                                <div className="text-center">
                                    <div className="text-red-500 text-4xl mb-4">
                                        📷
                                    </div>
                                    <p className="text-red-600 mb-4">
                                        {cameraError}
                                    </p>
                                    <button
                                        onClick={() => {
                                            setRetryCount((prev) => prev + 1);
                                            setCameraError(null);
                                            setCameraLoading(true);
                                        }}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                                    >
                                        Try Again
                                    </button>
                                    <div className="mt-4 text-sm text-gray-600">
                                        <p>Troubleshooting tips:</p>
                                        <ul className="text-xs mt-2 space-y-1">
                                            <li>
                                                • Check camera permissions in
                                                browser settings
                                            </li>
                                            <li>
                                                • Ensure no other app is using
                                                the camera
                                            </li>
                                            <li>• Try refreshing the page</li>
                                            <li>
                                                • Use HTTPS (required for camera
                                                access)
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!cameraLoading && !cameraError && !showSuccess && (
                            <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                videoConstraints={videoConstraints}
                                className="rounded-md shadow w-full"
                                onUserMedia={() => {
                                    console.log("Camera loaded successfully");
                                    setCameraError(null);
                                }}
                                onUserMediaError={(error) => {
                                    console.error("Webcam error:", error);
                                    setCameraError(
                                        "Failed to start camera. Please check permissions and try again."
                                    );
                                }}
                            />
                        )}

                        {showSuccess && (
                            <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center rounded-md">
                                <div className="text-green-600 text-[6rem] animate-scale-pop">
                                    ✅
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2 text-sm">
                        <div className="mb-4">
                            <h3 className="font-semibold mb-2">
                                Instructions:
                            </h3>
                            <p className="text-gray-600 text-sm">
                                Follow the prompts below. Complete all actions
                                when prompted:
                            </p>
                        </div>
                        {renderStatus("Face Detected", status.face_detected)}
                        {renderStatus("Smile", status.smile)}
                        {renderStatus("Turn Left", status.turn_left)}
                        {renderStatus("Turn Right", status.turn_right)}
                        {renderStatus("Turn Up", status.turn_up)}
                        {renderStatus("Turn Down", status.turn_down)}

                        {cameraLoading && (
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                                <p className="text-blue-700 text-sm">
                                    Setting up camera for liveness check...
                                </p>
                            </div>
                        )}

                        {!cameraLoading && !cameraError && (
                            <div className="mt-4 p-3 bg-green-50 rounded-lg">
                                <p className="text-green-700 text-sm">
                                    Camera ready! Position your face in the
                                    frame and follow the prompts.
                                </p>
                            </div>
                        )}
                    </div>
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
                            {devices.map((device) => (
                                <option
                                    key={device.deviceId}
                                    value={device.deviceId}
                                >
                                    {device.label || "Unnamed Camera"}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LivenessCheck;
