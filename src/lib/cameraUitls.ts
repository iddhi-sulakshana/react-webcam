// Get device capabilities and set native resolution
const getDeviceCapabilities = async (
    deviceId: string
): Promise<{ width: number; height: number }> => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: deviceId } },
        });

        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities();
        const settings = track.getSettings();

        // Use current settings or fallback to capabilities max or reasonable defaults
        const width = settings.width || capabilities.width?.max || 1280;
        const height = settings.height || capabilities.height?.max || 720;

        console.log(`Device ${deviceId} resolution:`, width, "x", height);
        return { width, height };

        // Stop the stream
        stream.getTracks().forEach((track) => track.stop());
    } catch (error) {
        console.error("Error getting device capabilities:", error);
        // Fallback to default resolution
        return { width: 640, height: 480 };
    }
};

export { getDeviceCapabilities };
