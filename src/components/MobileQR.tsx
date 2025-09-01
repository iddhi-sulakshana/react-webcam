import { motion } from "framer-motion";
import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { QrCode, Smartphone } from "lucide-react";
import { Button } from "./ui/button";
import { AnimatePresence } from "framer-motion";
import QRCode from "react-qr-code";
import copyCurrentUrl from "@/lib/copyCurrentUrl";
import { Check } from "lucide-react";
import { CopyIcon } from "lucide-react";

const MobileQR = () => {
    const [showQRCode, setShowQRCode] = useState(false);
    const [copied, setCopied] = useState(false);
    return (
        <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
        >
            <Card className="bg-blue-50 border-blue-200">
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="bg-blue-500 text-white p-2 rounded-lg mr-3">
                                <Smartphone className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-blue-900">
                                    Use Mobile Device
                                </h3>
                                <p className="text-sm text-blue-700">
                                    Better camera experience on mobile
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={() => setShowQRCode(!showQRCode)}
                            variant="outline"
                            size="sm"
                            className="border-blue-300 text-blue-700 hover:bg-blue-100"
                        >
                            <QrCode className="w-4 h-4 mr-2" />
                            {showQRCode ? "Hide QR" : "Show QR"}
                        </Button>
                    </div>

                    <AnimatePresence>
                        {showQRCode && (
                            <motion.div
                                className="mt-4 pt-4 border-t border-blue-200"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="flex flex-col md:flex-row items-center gap-4">
                                    <div className="bg-white p-4 rounded-lg border border-blue-200">
                                        <QRCode
                                            value={copyCurrentUrl()}
                                            size={128}
                                            level="M"
                                            className="w-full h-full"
                                        />
                                    </div>
                                    <div className="flex-1 text-center md:text-left">
                                        <h4 className="font-semibold text-blue-900 mb-2">
                                            Scan with Mobile Camera
                                        </h4>
                                        <p className="text-sm text-blue-700 mb-3">
                                            Open your mobile camera and scan
                                            this QR code to take your selfie on
                                            your phone.
                                        </p>
                                        <div className="flex flex-col sm:flex-row gap-2">
                                            <Button
                                                onClick={() => {
                                                    copyCurrentUrl();
                                                    setCopied(true);
                                                    setTimeout(() => {
                                                        setCopied(false);
                                                    }, 1000);
                                                }}
                                                variant="outline"
                                                size="sm"
                                                className="border-blue-300 text-blue-700 hover:bg-blue-100"
                                            >
                                                {/* Show a checkmark if the URL is copied */}
                                                {copied ? (
                                                    <Check className="w-4 h-4 mr-2" />
                                                ) : (
                                                    <CopyIcon className="w-4 h-4 mr-2" />
                                                )}
                                                Copy Link
                                            </Button>
                                            <span className="text-xs text-blue-600 self-center">
                                                Or share this page URL
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </CardContent>
            </Card>
        </motion.div>
    );
};

export default MobileQR;
