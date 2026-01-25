import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import ContentDetailSelector from "@/components/settings/ContentDetailSelector";
import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
    getPreferences,
    updatePreferences,
    type Preferences,
    type Weights,
    type Verbosity,
    type Structure,
    type Difficulty,
    type Language,
    type AnalogyDomain,
} from "@/api/preferences";
import useTitle from "@/hooks/useTitle";

// Checkbox field component
function CheckboxField({
    label,
    description,
    checked,
    onChange,
}: {
    label: string;
    description: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}) {
    return (
        <div className="flex items-start space-x-3">
            <Checkbox
                checked={checked}
                onCheckedChange={(c) => onChange(c === true)}
                className="mt-1"
            />
            <div className="space-y-1">
                <Label className="text-sm font-medium cursor-pointer">
                    {label}
                </Label>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
        </div>
    );
}

// Slider field for weights (0-1)
function WeightSlider({
    label,
    description,
    value,
    onChange,
}: {
    label: string;
    description: string;
    value: number;
    onChange: (value: number) => void;
}) {
    return (
        <div className="space-y-3">
            <div className="flex justify-between items-center">
                <Label className="text-sm font-medium">{label}</Label>
                <span className="text-sm text-muted-foreground">
                    {Math.round(value * 100)}%
                </span>
            </div>
            <p className="text-sm text-muted-foreground">{description}</p>
            <Slider
                value={[value * 100]}
                onValueChange={(val) => onChange(val[0] / 100)}
                max={100}
                step={5}
                className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
                <span>Off</span>
                <span>Low</span>
                <span>Medium</span>
                <span>High</span>
                <span>Max</span>
            </div>
        </div>
    );
}

// Combined toggle + slider for learning features
function FeatureToggleWithSlider({
    label,
    description,
    enabled,
    onEnabledChange,
    weight,
    onWeightChange,
}: {
    label: string;
    description: string;
    enabled: boolean;
    onEnabledChange: (enabled: boolean) => void;
    weight: number;
    onWeightChange: (value: number) => void;
}) {
    return (
        <div className="space-y-3 p-4 border rounded-lg">
            <div className="flex items-start space-x-3">
                <Checkbox
                    checked={enabled}
                    onCheckedChange={(checked) =>
                        onEnabledChange(checked === true)
                    }
                    className="mt-1"
                />
                <div className="flex-1 space-y-1">
                    <Label className="text-sm font-medium cursor-pointer">
                        {label}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                        {description}
                    </p>
                </div>
            </div>
            {enabled && (
                <div className="ml-6 pt-3 space-y-2">
                    <div className="flex justify-between items-center">
                        <Label className="text-xs text-muted-foreground">
                            Intensity
                        </Label>
                        <span className="text-sm text-muted-foreground">
                            {Math.round(weight * 100)}%
                        </span>
                    </div>
                    <Slider
                        value={[weight * 100]}
                        onValueChange={(val) => onWeightChange(val[0] / 100)}
                        max={100}
                        step={5}
                        className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Low</span>
                        <span>Medium</span>
                        <span>High</span>
                    </div>
                </div>
            )}
        </div>
    );
}

const VERBOSITY_OPTIONS: {
    value: Verbosity;
    label: string;
    description: string;
}[] = [
    {
        value: "concise",
        label: "Concise",
        description: "Brief and to the point",
    },
    { value: "balanced", label: "Balanced", description: "Good mix of detail" },
    {
        value: "detailed",
        label: "Detailed",
        description: "Thorough explanations",
    },
];

const STRUCTURE_OPTIONS: {
    value: Structure;
    label: string;
    description: string;
}[] = [
    {
        value: "sections",
        label: "Sections",
        description: "Organized with headers",
    },
    {
        value: "bullets",
        label: "Bullet Points",
        description: "Quick scannable lists",
    },
    {
        value: "paragraph",
        label: "Paragraph",
        description: "Flowing prose style",
    },
];

const ANALOGY_DOMAIN_OPTIONS: {
    value: AnalogyDomain;
    label: string;
    description: string;
}[] = [
    { value: "coding", label: "Coding", description: "Programming examples" },
    {
        value: "everyday",
        label: "Everyday",
        description: "Real-life situations",
    },
    { value: "math", label: "Math", description: "Mathematical concepts" },
];

const DIFFICULTY_OPTIONS: {
    value: Difficulty;
    label: string;
    description: string;
}[] = [
    { value: "auto", label: "Auto-detect", description: "Adapts to content" },
    {
        value: "beginner",
        label: "Beginner",
        description: "Simple explanations",
    },
    {
        value: "intermediate",
        label: "Intermediate",
        description: "Some prior knowledge",
    },
    { value: "advanced", label: "Advanced", description: "Expert level depth" },
];

const LANGUAGE_OPTIONS: {
    value: Language;
    label: string;
    description: string;
}[] = [
    { value: "en", label: "English", description: "Content in English" },
    { value: "de", label: "German", description: "Inhalt auf Deutsch" },
];

function SettingsPage() {
    // set tab title
    useTitle("Learning Preferences");
    
    const location = useLocation();
    const navigate = useNavigate();
    const fromDeckSetup = location.state?.fromDeckSetup === true;
    const fromCreateCardPage = location.state?.fromCreateCardPage === true;
    const deckId = location.state?.deckId;
    const deckName = location.state?.deckName;
    const uploadedFiles = location.state?.uploadedFiles;

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [preferences, setPreferences] = useState<Preferences>({
        verbosity: "balanced",
        structure: "sections",
        include_examples: true,
        examples_per_answer: 1,
        include_analogies: false,
        analogy_domain: "coding",
        step_by_step: true,
        socratic_mode: false,
        include_mnemonic: false,
        quiz_at_end: false,
        language: "en",
        difficulty: "auto",
        auto_tune: true,
    });
    const [weights, setWeights] = useState<Weights>({
        examples: 0.6,
        analogies: 0.3,
        step_by_step: 0.55,
        mnemonic: 0.2,
        quiz: 0.2,
        visual: 0.35,
        concise: 0.4,
    });

    // Load preferences on mount
    useEffect(() => {
        const loadPreferences = async () => {
            try {
                const data = await getPreferences();
                setPreferences(data.preferences);
                setWeights(data.weights);
            } catch (error) {
                console.error("Failed to load preferences:", error);
                toast.error("Failed to load preferences");
            } finally {
                setLoading(false);
            }
        };
        loadPreferences();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updatePreferences({ preferences, weights });
            toast.success("Settings saved successfully");
            // If opened from deck setup, navigate back to deck setup page
            if (fromDeckSetup && deckId) {
                navigate(`/deck/${deckId}/setup`, {
                    state: { fromSettingsPage: true, deckName, uploadedFiles },
                    replace: true,
                });
            } else if (fromCreateCardPage) {
                navigate(-1);
            }
        } catch (error) {
            console.error("Failed to save preferences:", error);
            toast.error("Failed to save settings");
        } finally {
            setSaving(false);
        }
    };

    const updatePref = <K extends keyof Preferences>(
        key: K,
        value: Preferences[K],
    ) => {
        setPreferences((prev) => ({ ...prev, [key]: value }));
    };

    const updateWeight = <K extends keyof Weights>(key: K, value: number) => {
        setWeights((prev) => ({ ...prev, [key]: value }));
    };

    if (loading) {
        return (
            <div className="py-8 flex items-center justify-center">
                <div className="text-muted-foreground">Loading settings...</div>
            </div>
        );
    }

    return (
        <div className="py-8 max-w-2xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold mb-2">
                    Learning Style Settings
                </h1>
                <p className="text-muted-foreground">
                    Customize how AI generates content for your study sessions
                </p>
            </div>

            {/* Content Style Section */}
            <section className="space-y-6">
                <h2 className="text-lg font-semibold">Content Style</h2>

                <ContentDetailSelector
                    label="Content Detail Level"
                    value={preferences.verbosity}
                    options={VERBOSITY_OPTIONS}
                    onChange={(v) => updatePref("verbosity", v as Verbosity)}
                />

                <ContentDetailSelector
                    label="Structure"
                    value={preferences.structure}
                    options={STRUCTURE_OPTIONS}
                    onChange={(v) => updatePref("structure", v as Structure)}
                />

                <ContentDetailSelector
                    label="Analogy Domain"
                    value={preferences.analogy_domain}
                    options={ANALOGY_DOMAIN_OPTIONS}
                    onChange={(v) =>
                        updatePref("analogy_domain", v as AnalogyDomain)
                    }
                />

                <ContentDetailSelector
                    label="Difficulty"
                    value={preferences.difficulty}
                    options={DIFFICULTY_OPTIONS}
                    onChange={(v) => updatePref("difficulty", v as Difficulty)}
                />

                <ContentDetailSelector
                    label="Language"
                    value={preferences.language}
                    options={LANGUAGE_OPTIONS}
                    onChange={(v) => updatePref("language", v as Language)}
                />
            </section>

            <Separator className="my-8" />

            {/* Learning Features Section - Using Toggle + Weight Sliders */}
            <section className="space-y-6">
                <h2 className="text-lg font-semibold">Learning Features</h2>
                <p className="text-sm text-muted-foreground">
                    Enable features and adjust how strongly each is applied in
                    generated content
                </p>

                <FeatureToggleWithSlider
                    label="Examples"
                    description="Add practical examples to explanations"
                    enabled={preferences.include_examples}
                    onEnabledChange={(c) => {
                        updatePref("include_examples", c);
                        if (!c) updateWeight("examples", 0);
                    }}
                    weight={weights.examples}
                    onWeightChange={(v) => updateWeight("examples", v)}
                />

                <FeatureToggleWithSlider
                    label="Analogies"
                    description="Use analogies and metaphors to explain concepts"
                    enabled={preferences.include_analogies}
                    onEnabledChange={(c) => {
                        updatePref("include_analogies", c);
                        if (!c) updateWeight("analogies", 0);
                    }}
                    weight={weights.analogies}
                    onWeightChange={(v) => updateWeight("analogies", v)}
                />

                <FeatureToggleWithSlider
                    label="Step-by-Step"
                    description="Break down complex topics into sequential steps"
                    enabled={preferences.step_by_step}
                    onEnabledChange={(c) => {
                        updatePref("step_by_step", c);
                        if (!c) updateWeight("step_by_step", 0);
                    }}
                    weight={weights.step_by_step}
                    onWeightChange={(v) => updateWeight("step_by_step", v)}
                />

                <FeatureToggleWithSlider
                    label="Mnemonics"
                    description="Add memory aids to help retention"
                    enabled={preferences.include_mnemonic}
                    onEnabledChange={(c) => {
                        updatePref("include_mnemonic", c);
                        if (!c) updateWeight("mnemonic", 0);
                    }}
                    weight={weights.mnemonic}
                    onWeightChange={(v) => updateWeight("mnemonic", v)}
                />

                <FeatureToggleWithSlider
                    label="Quiz at End"
                    description="Include a brief quiz after explanations"
                    enabled={preferences.quiz_at_end}
                    onEnabledChange={(c) => {
                        updatePref("quiz_at_end", c);
                        if (!c) updateWeight("quiz", 0);
                    }}
                    weight={weights.quiz}
                    onWeightChange={(v) => updateWeight("quiz", v)}
                />

                <WeightSlider
                    label="Visual Elements"
                    description="Include diagrams, charts, or visual descriptions"
                    value={weights.visual}
                    onChange={(v) => updateWeight("visual", v)}
                />

                <WeightSlider
                    label="Conciseness"
                    description="Prefer shorter, more direct explanations"
                    value={weights.concise}
                    onChange={(v) => updateWeight("concise", v)}
                />
            </section>

            <Separator className="my-8" />

            {/* Interactive Features Section */}
            <section className="space-y-6">
                <h2 className="text-lg font-semibold">Interactive Features</h2>

                <CheckboxField
                    label="Socratic Mode"
                    description="Use guiding questions to help you discover answers"
                    checked={preferences.socratic_mode}
                    onChange={(c) => updatePref("socratic_mode", c)}
                />
            </section>

            <Separator className="my-8" />

            {/* Auto-Tuning Section */}
            <section className="space-y-6">
                <h2 className="text-lg font-semibold">Personalization</h2>

                <CheckboxField
                    label="Auto-Tune Preferences"
                    description="Allow the system to learn from your reviews and adjust content style automatically"
                    checked={preferences.auto_tune}
                    onChange={(c) => updatePref("auto_tune", c)}
                />
            </section>

            <Button
                onClick={handleSave}
                disabled={saving}
                className="mt-8 w-full"
                size="lg"
            >
                {saving
                    ? "Saving..."
                    : fromDeckSetup
                      ? "Save settings and return to deck setup"
                      : fromCreateCardPage
                        ? "Save settings and return to creating card"
                        : "Save settings"}
            </Button>
        </div>
    );
}

export default SettingsPage;
