import { useRef, useState } from "react";
import Webcam from "react-webcam";
import "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import "@mediapipe/face_mesh";
import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
const inputResolution = {
    width: 730,
    height: 640,
};
const videoConstraints = {
    width: inputResolution.width,
    height: inputResolution.height,
    facingMode: "user",
};
const Selfie = () => {
    const [loaded, setLoaded] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const handleVideoLoad = async (
        videoNode: React.ChangeEvent<HTMLVideoElement>
    ) => {
        console.log("handleVideoLoad");
        const video = videoNode.target;
        if (video.readyState !== 4) return;
        if (loaded) return;
        console.log("video loaded");

        const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
        console.log("model loaded");
        const detector = await faceLandmarksDetection.createDetector(model, {
            runtime: "tfjs",
            refineLandmarks: true,
        });
        console.log("detector loaded");
        const detect = async (net: typeof detector) => {
            const estimationConfig = { flipHorizontal: true };
            const faces = await net.estimateFaces(video, estimationConfig);
            console.log(faces);
            const ctx = canvasRef.current?.getContext("2d");
            if (!ctx) return;
            setTimeout(() => {
                requestAnimationFrame(() => {
                    // const angle = drawMesh(faces[0], ctx);
                    // cb(angle);
                });
                detect(detector);
            }, 300);
        };
        detect(detector);

        setLoaded(true);
    };

    return (
        <div>
            {loaded ? <></> : <div>Loading...</div>}
            <Webcam
                width={inputResolution.width}
                height={inputResolution.height}
                videoConstraints={videoConstraints}
                onLoadedData={handleVideoLoad}
            />
            <canvas
                ref={canvasRef}
                width={inputResolution.width}
                height={inputResolution.height}
                style={{
                    position: "absolute",
                    left: 20,
                    border: "1px solid red",
                }}
            />
        </div>
    );
};

export default Selfie;
