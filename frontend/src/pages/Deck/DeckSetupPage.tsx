import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Stepper from "@/components/ui/stepper";
import { Upload, FileText, ArrowRight, ArrowLeft, Settings, PenLine } from "lucide-react";
import { toast } from "sonner";
import { uploadDocument } from "@/api/decks";
import { markDeckHasDocuments } from "@/lib/deckDocuments";
import axios from "axios";
import useTitle from "@/hooks/useTitle";
import { getDeck } from "@/api/decks";

const STEPS = [
    { title: "Upload Documents", description: "Optional" },
    { title: "Configure Settings", description: "Personalize" },
    { title: "Create Cards", description: "Start learning" },
];

const DeckSetupPage = () => {
    const navigate = useNavigate();
    const { deckId } = useParams();
    const location = useLocation();
    const [deckName, setDeckName] = useState<null | string>(location.state?.deckName);

    // set tab title
    useTitle(deckName ? `Setting up ${deckName}` : "Setting up a new deck");

    const [currentStep, setCurrentStep] = useState(location.state?.fromSettingsPage ? 1 : 0);
    const [uploading, setUploading] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<string[]>(location.state?.uploadedFiles || []);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // fall back to using API to get deck name if not stored in location state
    // i.e. happens when user types URL directly instead of accessing page from dashboard
    useEffect(() => {
        let cancelled = false;

        if (!deckId) {
            navigate("/");
            return;
        }
        if (!deckName) {
            getDeck(deckId)
                .then((deck) => {
                    if (!cancelled) setDeckName(deck.name);
                })
                .catch(() => {
                    if (!cancelled) {
                        toast.error("The selected deck couldn't be found.");
                        navigate("/");
                    }
                });
        }
    }, []);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        
        if (file.type !== "application/pdf") {
            toast.error("Please select a PDF file.");
            event.target.value = "";
            return;
        }

        // Auto-upload the file
        if (!deckId) return;

        setUploading(true);
        try {
            const result = await uploadDocument(deckId, file);
            const fileName = result.filename || file.name;
            toast.success(`File "${fileName}" uploaded successfully!`);
            setUploadedFiles((prev) => [...prev, fileName]);
            // Mark this deck as having documents for accuracy mode
            markDeckHasDocuments(deckId);
        } catch (error) {
            console.error("Upload error:", error);
            if (axios.isAxiosError(error)) {
                if (error.response?.status === 400) {
                    const { error: errorType, reason } = error.response.data;
                    toast.error(`${errorType}: ${reason}`);
                } else if (error.response) {
                    toast.error(`Upload failed (${error.response.status}): ${JSON.stringify(error.response.data)}`);
                } else if (error.request) {
                    toast.error("Upload failed: No response from server.");
                } else {
                    toast.error(`Upload failed: ${error.message}`);
                }
            } else {
                toast.error("Failed to upload file. Please try again.");
            }
        } finally {
            setUploading(false);
            // Reset file input so the same file can be selected again if needed
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleNext = () => {
        if (currentStep < STEPS.length - 1) {
            setCurrentStep((prev) => prev + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 0) {
            setCurrentStep((prev) => prev - 1);
        }
    };

    const handleSkip = () => {
        handleNext();
    };

    const handleGoToSettings = () => {
        // Navigate to settings with state indicating we came from deck setup
        navigate("/settings", {
            state: { fromDeckSetup: true, deckId, deckName, uploadedFiles },
        });
    };

    const handleStartCreating = () => {
        navigate(`/deck/${deckId}/newcard`, {
            state: { deckId, deckName },
        });
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-3xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        Set up your new deck
                    </h1>
                    <p className="text-gray-600">
                        Get started with <span className="font-medium">{deckName ? deckName : "your new deck"}</span>
                    </p>
                </div>

                {/* Stepper */}
                <div className="mb-12">
                    <Stepper steps={STEPS} currentStep={currentStep} />
                </div>

                {/* Step Content */}
                <div className="bg-white rounded-xl shadow-sm border p-8 mb-6">
                    {/* Step 1: Upload Documents */}
                    {currentStep === 0 && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <Upload className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                                <h2 className="text-xl font-semibold mb-2">
                                    Upload Your Study Materials
                                </h2>
                                <p className="text-gray-600">
                                    Upload PDF documents to help the AI generate better flashcards.
                                    This step is optional.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />

                                {/* Uploaded files list */}
                                {uploadedFiles.length > 0 && (
                                    <div className="space-y-2">
                                        {uploadedFiles.map((file, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200"
                                            >
                                                <FileText className="w-5 h-5 text-green-600 flex-shrink-0" />
                                                <span className="text-sm text-green-800 flex-1 truncate">
                                                    {file}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Upload button - always shown to allow multiple uploads */}
                                <Button
                                    variant="outline"
                                    onClick={triggerFileInput}
                                    disabled={uploading}
                                    className="w-full h-24 border-dashed border-2 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                                >
                                    {uploading ? (
                                        <div className="flex flex-col items-center">
                                            <div className="h-8 w-8 mb-2 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                                            <span className="text-gray-600">Uploading...</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center">
                                            <Upload className="h-6 w-6 mb-2 text-gray-400" />
                                            <span className="text-gray-600">
                                                {uploadedFiles.length > 0
                                                    ? "Upload another PDF"
                                                    : "Click to select a PDF file"}
                                            </span>
                                        </div>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: Configure Settings */}
                    {currentStep === 1 && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <Settings className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                                <h2 className="text-xl font-semibold mb-2">
                                    Configure Your Learning Settings
                                </h2>
                                <p className="text-gray-600">
                                    Customize how the AI generates content for your flashcards.
                                    You can always change these later.
                                </p>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-6">
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                            <span className="text-blue-600 font-semibold text-sm">1</span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">Content Detail Level</p>
                                            <p className="text-sm text-gray-600">
                                                Choose between concise, balanced, or detailed explanations
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                            <span className="text-blue-600 font-semibold text-sm">2</span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">Learning Features</p>
                                            <p className="text-sm text-gray-600">
                                                Enable examples, analogies, step-by-step explanations, and more
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                            <span className="text-blue-600 font-semibold text-sm">3</span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">Difficulty & Language</p>
                                            <p className="text-sm text-gray-600">
                                                Set your preferred difficulty level and language
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Button
                                variant="outline"
                                onClick={handleGoToSettings}
                                className="w-full h-14"
                            >
                                <Settings className="w-5 h-5 mr-2" />
                                Open Settings Page
                            </Button>
                        </div>
                    )}

                    {/* Step 3: Create Cards */}
                    {currentStep === 2 && (
                        <div className="space-y-6">
                            <div className="text-center">
                                <PenLine className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                                <h2 className="text-xl font-semibold mb-2">
                                    You're All Set!
                                </h2>
                                <p className="text-gray-600">
                                    Your deck is ready. Start creating flashcards with AI assistance.
                                </p>
                            </div>

                            <div className="bg-blue-50 rounded-lg p-6 text-center">
                                <p className="text-blue-800 mb-4">
                                    {uploadedFiles.length > 0 ? (
                                        <>
                                            You've uploaded <strong>{uploadedFiles.length}</strong> document(s).
                                            The AI will use them to generate better answers!
                                        </>
                                    ) : (
                                        "No documents uploaded - that's okay! You can still create great flashcards."
                                    )}
                                </p>
                            </div>

                            <Button
                                onClick={handleStartCreating}
                                className="w-full h-14 text-lg"
                            >
                                <PenLine className="w-5 h-5 mr-2" />
                                Start Creating Cards
                            </Button>
                        </div>
                    )}
                </div>

                {/* Navigation Buttons */}
                <div className="flex justify-between">
                    <Button
                        variant="ghost"
                        onClick={handleBack}
                        disabled={currentStep === 0}
                        className={currentStep === 0 ? "invisible" : ""}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>

                    <div className="flex gap-3">
                        {currentStep < STEPS.length - 1 && (
                            <>
                                <Button variant="ghost" onClick={handleSkip}>
                                    Skip
                                </Button>
                                <Button onClick={handleNext}>
                                    Next
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeckSetupPage;
