import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import Webcam from "react-webcam";

const cropBase64Image = (base64: string): Promise<string> => {
    const img = new Image();
    img.src = base64;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Calculate after image loads
    // This is important due to async nature of image loading
    return new Promise<string>((resolve) => {
        img.onload = () => {
            const imgWidth = img.width;
            const imgHeight = img.height;

            const cropWidth = imgWidth * 0.8; // 80%
            const cropHeight = cropWidth / 1.586; // Maintain aspect ratio

            const cropX = (imgWidth - cropWidth) / 2;
            const cropY = (imgHeight - cropHeight) / 2;

            canvas.width = cropWidth;
            canvas.height = cropHeight;

            if (ctx) {
                ctx.drawImage(
                    img,
                    cropX,
                    cropY,
                    cropWidth,
                    cropHeight,
                    0,
                    0,
                    cropWidth,
                    cropHeight
                );
                const croppedBase64 = canvas.toDataURL("image/jpeg", 0.95);
                resolve(croppedBase64);
            } else {
                resolve(base64); // fallback
            }
        };
    });
};

const UploadIdModal = ({
    isOpen,
    onClose,
    onSuccess,
    sessionId,
}: {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (idImages: { front: string; back: string }) => void;
    sessionId: string | null;
}) => {
    const webcamRef = useRef<Webcam>(null);
    const [frontImage, setFrontImage] = useState<string | null>(null);
    const [backImage, setBackImage] = useState<string | null>(null);
    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(
        null
    );
    const [step, setStep] = useState<"front" | "back">("front");
    const [loadingSubmit, setLoadingSubmit] = useState(false);

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
    }, [isOpen]);

    const videoConstraints = selectedDeviceId
        ? { deviceId: { exact: selectedDeviceId } }
        : undefined;

    const captureIdPhoto = async () => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (!imageSrc) return;

        const cropped = await cropBase64Image(imageSrc);

        if (step === "front") {
            setFrontImage(cropped);
            setStep("back");
        } else {
            setBackImage(cropped);
        }
    };

    const submitIdImages = async () => {
        if (!frontImage || !backImage) {
            toast.error("Both sides must be captured.");
            return;
        }

        if (!sessionId) {
            toast.error("Session ID is not available.");
            onClose();
            return;
        }

        setLoadingSubmit(true);

        try {
            const res = await fetch(
                "https://api.kycverification.live/api/v1/validate/upload-id",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-Session-ID": sessionId,
                    },
                    body: JSON.stringify({
                        front_image: frontImage,
                        back_image: backImage,
                    }),
                }
            );

            const data = await res.json();

            if (res.ok && data.message && data.message === "Verified") {
                toast.success("ID document submitted successfully!");
                onSuccess({ front: frontImage, back: backImage });
            } else {
                toast.error(
                    data.detail || "ID document not detected. Please try again."
                );
            }
        } catch (err) {
            console.error("Upload failed:", err);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setLoadingSubmit(false);
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
                    KYC Document Capture
                </h2>

                <div className="flex flex-col items-center">
                    <p className="mb-2 text-lg">
                        Step {step === "front" ? "1" : "2"}: Capture{" "}
                        {step === "front" ? "Front" : "Back"} of ID
                    </p>

                    {!frontImage || (step === "back" && !backImage) ? (
                        <>
                            <div className="relative w-full max-w-md aspect-video mb-4">
                                <Webcam
                                    ref={webcamRef}
                                    audio={false}
                                    screenshotFormat="image/jpeg"
                                    screenshotQuality={0.95}
                                    videoConstraints={videoConstraints}
                                    className="rounded-lg w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 flex justify-center items-center pointer-events-none">
                                    <div
                                        className="border-4 border-dashed w-4/5"
                                        style={{
                                            aspectRatio: "1.586",
                                            borderColor: "yellow",
                                        }}
                                    ></div>
                                </div>
                            </div>

                            <button
                                onClick={captureIdPhoto}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
                            >
                                {`Capture ${
                                    step === "front" ? "Front" : "Back"
                                }`}
                            </button>
                        </>
                    ) : (
                        <>
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
                                        className="mt-2 w-full bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded shadow"
                                    >
                                        Retry Front
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
                                                className="mt-2 w-full bg-gray-300 hover:bg-gray-400 text-black px-4 py-2 rounded shadow"
                                            >
                                                Retry Back
                                            </button>
                                        </>
                                    ) : (
                                        <p className="text-center text-gray-500 mt-4">
                                            Not captured yet
                                        </p>
                                    )}
                                </div>
                            </div>

                            {frontImage && backImage && (
                                <div className="flex items-center justify-center mt-6">
                                    <button
                                        onClick={submitIdImages}
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

                {devices.length > 1 && (
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
