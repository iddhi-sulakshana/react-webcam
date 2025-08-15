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

                const preferred = videoDevices.find(
                    (d) =>
                        d.label.toLowerCase().includes("iriun") ||
                        d.label.toLowerCase().includes("droidcam")
                );

                setSelectedDeviceId(
                    preferred?.deviceId || videoDevices[0]?.deviceId || null
                );
            } catch (err) {
                console.error("Device fetch error:", err);
            }
        };

        getDevices();
    }, [isOpen]);

    const videoConstraints = selectedDeviceId
        ? { deviceId: { exact: selectedDeviceId } }
        : { facingMode: "user" };

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
            if (webcamRef.current && ws && ws.readyState === WebSocket.OPEN) {
                const screenshot = webcamRef.current.getScreenshot();
                if (screenshot) {
                    ws.send(JSON.stringify({ frame: screenshot }));
                }
            }
        }, 300);

        return () => clearInterval(interval);
    }, [ws]);

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
                        {!showSuccess && (
                            <Webcam
                                audio={false}
                                ref={webcamRef}
                                screenshotFormat="image/jpeg"
                                videoConstraints={videoConstraints}
                                className="rounded-md shadow w-full"
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
                        {renderStatus("Face Detected", status.face_detected)}
                        {renderStatus("Smile", status.smile)}
                        {renderStatus("Turn Left", status.turn_left)}
                        {renderStatus("Turn Right", status.turn_right)}
                        {renderStatus("Turn Up", status.turn_up)}
                        {renderStatus("Turn Down", status.turn_down)}
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
