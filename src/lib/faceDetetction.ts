import "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import "@mediapipe/face_mesh";
import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";

export const runDetection = async (
    video: HTMLVideoElement,
    _: (angle: number) => void
) => {
    console.log("loading detection");
    const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
    console.log("model loaded");
    const detector = await faceLandmarksDetection.createDetector(model, {
        runtime: "tfjs",
        refineLandmarks: true,
    });
    console.log("detector loaded");
    const detect = async (net: typeof detector) => {
        const faces = await net.estimateFaces(video, { flipHorizontal: true });
        console.log(faces);
        setTimeout(() => {
            // requestAnimationFrame(() => {
            //   // const angle = drawMesh(faces[0], ctx);
            //   // cb(angle);
            // });
            detect(detector);
        }, 100);
    };
    detect(detector);
};
