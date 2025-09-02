import "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import "@mediapipe/face_mesh";
import * as faceLandmarksDetection from "@tensorflow-models/face-landmarks-detection";
import { drawMesh } from "./drawMesh";

type FaceDirection = "front" | "left" | "right" | "up" | null;

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
        isCloserToScreen: boolean,
        faceDirection: FaceDirection
    ) => void
) => {
    const model = faceLandmarksDetection.SupportedModels.MediaPipeFaceMesh;
    const detector = await faceLandmarksDetection.createDetector(model, {
        runtime: "tfjs",
        refineLandmarks: true,
        maxFaces: 1,
    });

    let isRunning = true;

    const detect = async (net: typeof detector) => {
        if (!isRunning) return;

        // Check if video has valid dimensions
        if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
            setTimeout(() => detect(net), 100);
            return;
        }

        try {
            const faces = await net.estimateFaces(video, {
                flipHorizontal: false,
            });
            const ctx = canvas.getContext("2d");

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

                    // Then draw the mesh overlay
                    const angle = drawMesh(faces[0], ctx);
                    if (angle) {
                        const faceDirection = getFaceDirection(angle);
                        const isCloserToScreen = isFaceCloserToScreen(angle);
                        if (isCloserToScreen) {
                            const isFrontDirected = isFaceFrontDirected(angle);
                            cb(
                                ctx,
                                angle,
                                isFrontDirected,
                                isCloserToScreen,
                                faceDirection
                            );
                        } else {
                            cb(ctx, angle, false, false, faceDirection);
                        }
                    } else {
                        cb(
                            ctx,
                            { yaw: 0, turn: 0, zDistance: 0, xDistance: 0 },
                            false,
                            false,
                            null
                        );
                    }
                });
                detect(detector);
            }, 100);
        } catch (error) {
            console.error("Face detection error:", error);
            setTimeout(() => detect(net), 100);
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

// Helper function to determine if face is left directed
const isFaceLeftDirected = (angle: {
    yaw: number;
    turn: number;
    zDistance: number;
    xDistance: number;
}) => {
    // Based on your actual values:
    // Left: yaw ~105°, turn ~152°
    // Right: yaw ~134°, turn ~40°
    // Lower yaw = left, higher yaw = right

    // Set threshold between your left (~105°) and right (~134°) values
    const yawThreshold = 120; // Midpoint between 105 and 134
    const isYawLeft = angle.yaw < yawThreshold;

    // For turn, your left value is ~152°, right is ~40°
    // We can use turn as additional validation or ignore it for now
    const turnThreshold = 100; // Midpoint between 152 and 40
    const isTurnLeft = angle.turn > turnThreshold;

    // You can use both yaw and turn for more accuracy
    return isYawLeft && isTurnLeft;
};
// Helper function to determine if face is right directed
const isFaceRightDirected = (angle: {
    yaw: number;
    turn: number;
    zDistance: number;
    xDistance: number;
}) => {
    // Based on your actual values:
    // Left: yaw ~105°, turn ~152°
    // Right: yaw ~134°, turn ~40°
    // Higher yaw = right, lower yaw = left

    // Set threshold between your left (~105°) and right (~134°) values
    const yawThreshold = 100; // Midpoint between 105 and 134
    const isYawRight = angle.yaw > yawThreshold;

    // For turn, your right value is ~40°, left is ~152°
    const turnThreshold = 40; // Midpoint between 152 and 40
    const isTurnRight = angle.turn < turnThreshold;

    // You can use both yaw and turn for more accuracy
    return isYawRight && isTurnRight;
};
// Helper function to determine if face is up directed
const isFaceUpDirected = (angle: {
    yaw: number;
    turn: number;
    zDistance: number;
    xDistance: number;
}) => {
    // Based on your actual values:
    // Up: yaw ~5-10°
    // Your left/right range: yaw ~105-134°
    // Down: yaw ~165-170°

    const yawThreshold = 65; // Well below your left/right range
    const isYawUp = angle.yaw < yawThreshold;

    return isYawUp;
};

const getFaceDirection = (angle: {
    yaw: number;
    turn: number;
    zDistance: number;
    xDistance: number;
}): FaceDirection => {
    if (isFaceLeftDirected(angle)) {
        return "left";
    }
    if (isFaceRightDirected(angle)) {
        return "right";
    }
    if (isFaceUpDirected(angle)) {
        return "up";
    }
    if (isFaceFrontDirected(angle)) {
        return "front";
    }
    return null;
};
