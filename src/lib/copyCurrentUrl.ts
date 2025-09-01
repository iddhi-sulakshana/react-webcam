export default function copyCurrentUrl() {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl);
    return currentUrl;
}
