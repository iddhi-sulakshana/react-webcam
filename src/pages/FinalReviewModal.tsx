export default function FinalReviewModal({
    isOpen,
    onClose,
    idImages,
    selfieImage,
    onSubmit,
}: {
    isOpen: boolean;
    onClose: () => void;
    idImages: { front: string; back: string } | { passport: string } | null;
    selfieImage: string | null;
    onSubmit: () => void;
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 relative">
                <button
                    onClick={onClose}
                    className="absolute top-2 right-4 text-xl font-bold"
                >
                    ✕
                </button>

                <h2 className="text-xl font-bold mb-4 text-center">
                    Review Your Documents
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {idImages && "passport" in idImages ? (
                        // Passport layout
                        <>
                            <div className="text-center">
                                <p className="mb-2 font-semibold">Passport</p>
                                <img
                                    src={idImages.passport}
                                    alt="Passport"
                                    className="rounded-lg shadow max-h-40 mx-auto"
                                />
                            </div>
                            <div className="text-center">
                                <p className="mb-2 font-semibold">Selfie</p>
                                <img
                                    src={selfieImage || ""}
                                    alt="Selfie"
                                    className="rounded-full shadow max-h-40 mx-auto object-cover"
                                />
                            </div>
                            <div></div> {/* Empty div for grid spacing */}
                        </>
                    ) : (
                        // ID layout
                        <>
                            <div className="text-center">
                                <p className="mb-2 font-semibold">ID Front</p>
                                <img
                                    src={
                                        idImages && "front" in idImages
                                            ? idImages.front
                                            : ""
                                    }
                                    alt="ID Front"
                                    className="rounded-lg shadow max-h-40 mx-auto"
                                />
                            </div>
                            <div className="text-center">
                                <p className="mb-2 font-semibold">ID Back</p>
                                <img
                                    src={
                                        idImages && "back" in idImages
                                            ? idImages.back
                                            : ""
                                    }
                                    alt="ID Back"
                                    className="rounded-lg shadow max-h-40 mx-auto"
                                />
                            </div>
                            <div className="text-center">
                                <p className="mb-2 font-semibold">Selfie</p>
                                <img
                                    src={selfieImage || ""}
                                    alt="Selfie"
                                    className="rounded-full shadow max-h-40 mx-auto object-cover"
                                />
                            </div>
                        </>
                    )}
                </div>

                <div className="mt-6 flex justify-end gap-4">
                    <button
                        onClick={onClose}
                        className="bg-gray-200 hover:bg-gray-300 text-black px-4 py-2 rounded"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onSubmit}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded shadow"
                    >
                        Submit for Verification
                    </button>
                </div>
            </div>
        </div>
    );
}
