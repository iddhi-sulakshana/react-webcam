import "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import "@mediapipe/face_mesh";
import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
import { drawMesh } from "./drawMesh";

export const runDetection = async (
    video: HTMLVideoElement,
    canvas: HTMLCanvasElement,
    cb: (
        ctx: CanvasRenderingContext2D,
        angle: {
            yaw: number;
            turn: number;
            zDistance: number;
            xDistance: number;
        },
        isFrontDirected: boolean,
        isCloserToScreen: boolean
    ) => void
) => {
    const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
    const detector = await faceLandmarksDetection.createDetector(model, {
        runtime: "tfjs",
        refineLandmarks: true,
        maxFaces: 1,
    });

    let isRunning = true;
    let lastValidationTime = 0;
    let lastValidationResult = {
        isFrontDirected: false,
        isCloserToScreen: false,
    };

    const detect = async (net: typeof detector) => {
        if (!isRunning) return;

        // Check if video has valid dimensions
        if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
            setTimeout(() => detect(net), 100);
            return;
        }

        const ctx = canvas.getContext("2d");
        const currentTime = Date.now();

        // Always draw video every 100ms
        setTimeout(() => {
            if (!isRunning) return;

            requestAnimationFrame(() => {
                if (
                    !isRunning ||
                    !ctx ||
                    video.videoWidth === 0 ||
                    video.videoHeight === 0
                )
                    return;

                // Draw the video on canvas first
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

                // Use cached validation result for drawing
                cb(
                    ctx,
                    { yaw: 0, turn: 0, zDistance: 0, xDistance: 0 },
                    lastValidationResult.isFrontDirected,
                    lastValidationResult.isCloserToScreen
                );
            });
            detect(net);
        }, 100);

        // Run face validation every 500ms
        if (currentTime - lastValidationTime >= 500 && ctx) {
            try {
                const faces = await net.estimateFaces(video, {
                    flipHorizontal: false,
                });

                if (faces && faces.length > 0) {
                    const angle = drawMesh(faces[0], ctx);
                    if (angle) {
                        const isCloserToScreen = isFaceCloserToScreen(angle);
                        if (isCloserToScreen) {
                            const isFrontDirected = isFaceFrontDirected(angle);
                            lastValidationResult = {
                                isFrontDirected,
                                isCloserToScreen,
                            };
                        } else {
                            lastValidationResult = {
                                isFrontDirected: false,
                                isCloserToScreen: false,
                            };
                        }
                    } else {
                        lastValidationResult = {
                            isFrontDirected: false,
                            isCloserToScreen: false,
                        };
                    }
                } else {
                    lastValidationResult = {
                        isFrontDirected: false,
                        isCloserToScreen: false,
                    };
                }

                lastValidationTime = currentTime;
            } catch (error) {
                console.error("Face detection error:", error);
                lastValidationResult = {
                    isFrontDirected: false,
                    isCloserToScreen: false,
                };
                lastValidationTime = currentTime;
            }
        }
    };

    detect(detector);

    // Return cleanup function
    return () => {
        isRunning = false;
    };
};

// Helper function to determine if face is front-directed
const isFaceFrontDirected = (angle: {
    yaw: number;
    turn: number;
    zDistance: number;
    xDistance: number;
}) => {
    // Yaw: measures left-right head rotation (0° = front, 90° = left, 270° = right)
    // Turn: measures head tilt (0° = straight, 90° = tilted)

    // Consider face front-directed if:
    // - Yaw is within ±30 degrees of center (facing forward)
    // - Turn is within ±20 degrees (not tilted too much)
    const yawThreshold = 30;
    const turnThreshold = 20;

    const isYawCentered =
        angle.yaw >= 180 - yawThreshold && angle.yaw <= 180 + yawThreshold;
    const isTurnCentered =
        angle.turn >= 90 - turnThreshold && angle.turn <= 90 + turnThreshold;

    return isYawCentered && isTurnCentered;
};

// Helper function to determine if face is closer to screen
const isFaceCloserToScreen = (angle: {
    yaw: number;
    turn: number;
    zDistance: number;
    xDistance: number;
}) => {
    // zDistance: distance from nose tip to midpoint (smaller = closer)
    // xDistance: distance between left and right nose points (smaller = closer)

    // Thresholds for "close enough" - you may need to adjust these based on your setup
    const zDistanceThreshold = 10; // Smaller values = farther
    const xDistanceThreshold = 50; // Smaller values = farther
    const isZClose = angle.zDistance >= zDistanceThreshold;
    const isXClose = angle.xDistance >= xDistanceThreshold;

    return isZClose && isXClose;
};
