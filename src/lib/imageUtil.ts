// Helper function to convert base64 to File
export const base64ToFile = (base64String: string, filename: string): File => {
    // Remove data URL prefix if present
    const base64Data = base64String.replace(/^data:image\/[a-z]+;base64,/, "");

    // Convert base64 to binary
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);

    // Create blob and file
    const blob = new Blob([byteArray], { type: "image/jpeg" });
    return new File([blob], filename, { type: "image/jpeg" });
};
