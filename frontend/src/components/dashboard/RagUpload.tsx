import { useState, useRef } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileText } from "lucide-react";
import { toast } from "sonner";
import { uploadDocument } from "@/api/decks";
import axios from "axios";

interface RagUploadProps {
    deckId: string;
    deckName: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function RagUpload({
    deckId,
    deckName,
    open: controlledOpen,
    onOpenChange,
}: RagUploadProps) {
    const [internalOpen, setInternalOpen] = useState(false);

    const open = controlledOpen ?? internalOpen;
    const setOpen = onOpenChange ?? setInternalOpen;
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type === "application/pdf") {
            setSelectedFile(file);
        } else {
            toast.error("Please select a PDF file.");
            event.target.value = "";
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setUploading(true);
        try {
            const result = await uploadDocument(deckId, selectedFile);
            toast.success(
                `File "${result.filename}" successfully uploaded to deck "${deckName}!"`,
            );
            handleClose();
        } catch (error) {
            console.error("Upload error:", error);
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 400) {
                    const { error: errorType, reason } = error.response.data;
                    toast.error(`${errorType}: ${reason}`);
                } else if (error.response) {
                    toast.error(`Upload failed (${error.response.status}): ${JSON.stringify(error.response.data)}`);
                } else if (error.request) {
                    toast.error("Upload failed: No response from server. Check if backend is running.");
                } else {
                    toast.error(`Upload failed: ${error.message}`);
                }
            } else {
                toast.error("Failed to upload file. Please try again.");
            }
        } finally {
            setUploading(false);
        }
    };

    const handleClose = () => {
        setOpen(false);
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => {
                if (!isOpen) handleClose();
                else setOpen(true);
            }}
        >
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Upload PDF</DialogTitle>
                    <DialogDescription>
                        Upload a PDF document to use for AI-assisted card
                        generation.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="hidden"
                    />

                    {!selectedFile ? (
                        <Button
                            variant="outline"
                            onClick={triggerFileInput}
                            className="w-full h-24 border-dashed"
                        >
                            <Upload className="h-6 w-6 mr-2" />
                            Choose PDF File
                        </Button>
                    ) : (
                        <div className="flex items-center gap-3 p-4 border rounded-md bg-gray-50">
                            <FileText className="h-8 w-8 text-blue-600" />
                            <div className="flex-1 overflow-hidden">
                                <p className="font-medium text-gray-800 truncate">
                                    {selectedFile.name}
                                </p>
                                <p className="text-sm text-gray-500">
                                    {(selectedFile.size / 1024).toFixed(1)} KB
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setSelectedFile(null);
                                    if (fileInputRef.current) {
                                        fileInputRef.current.value = "";
                                    }
                                }}
                            >
                                Remove
                            </Button>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleUpload}
                        disabled={!selectedFile || uploading}
                    >
                        {uploading ? "Uploading..." : "Upload"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default RagUpload;
