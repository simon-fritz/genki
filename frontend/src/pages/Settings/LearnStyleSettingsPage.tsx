import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { useState } from "react";

function SettingSlider({
    title,
    desc,
    labels,
    value,
    onChange,
}: {
    title: string;
    desc: string;
    labels: string[];
    value: number;
    onChange: (value: number) => void;
}) {
    return (
        <div className="mb-10 max-w-2xl mx-auto">
            <h3 className="text-sm font-medium mb-1 text-center">{title}</h3>
            <p className="text-sm text-gray-500 text-center mb-3">{desc}</p>
            <Slider
                value={[value]}
                onValueChange={(val) => onChange(val[0])}
                max={4}
                step={1}
                className="mb-2"
            />
            <div className="flex text-muted-foreground text-xs -mx-[10%]">
                <span className="w-[20%] text-left pl-[10%] whitespace-nowrap">
                    {labels[0]}
                </span>
                <span className="w-[20%] text-center">{labels[1]}</span>
                <span className="w-[20%] text-center">{labels[2]}</span>
                <span className="w-[20%] text-center">{labels[3]}</span>
                <span className="w-[20%] text-right pr-[10%]">{labels[4]}</span>
            </div>
        </div>
    );
}

function SettingsPage() {
    const [textLength, setTextLength] = useState(2);
    const [equations, setEquations] = useState(2);
    const [examples, setExamples] = useState(2);
    const [explanations, setExplanations] = useState(2);
    const [customInstructions, setCustomInstructions] = useState("");
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        // TODO implement api calls here
        setSaving(false);
    };

    return (
        <div className="py-8">
            <div className="mb-8">
                <h1 className="text-2xl font-bold mb-2">
                    Learning Style Settings
                </h1>
                <p className="text-muted-foreground">
                    Customize how AI generates content for your study sessions
                </p>
            </div>

            <div>
                <SettingSlider
                    title="Complexity"
                    desc="The level of detail used in explanations in the completions"
                    labels={[
                        "Primer",
                        "Shallow",
                        "Default",
                        "Detailed",
                        "In-depth",
                    ]}
                    value={textLength}
                    onChange={setTextLength}
                />
                <SettingSlider
                    title="Tone"
                    desc="The extent to which specialized terms and academic writing style are used"
                    labels={[
                        "Layman's speak",
                        "Simple",
                        "Default",
                        "Formal",
                        "Full-on jargon",
                    ]}
                    value={equations}
                    onChange={setEquations}
                />
                <SettingSlider
                    title="Examples"
                    desc="The extent to which examples, analogies, and metaphors are used"
                    labels={[
                        "No examples",
                        "Few",
                        "Default",
                        "More",
                        "Demonstrative",
                    ]}
                    value={examples}
                    onChange={setExamples}
                />
                <SettingSlider
                    title="Length"
                    desc="The length of generated content (not necessarily its depth)"
                    labels={["Pithy", "Short", "Default", "Long", "Verbose"]}
                    value={explanations}
                    onChange={setExplanations}
                />
            </div>

            <div className="mt-8">
                <h2 className="text-sm font-medium mb-2">
                    Custom Instructions
                </h2>
                <p className="text-sm text-muted-foreground mb-3">
                    Add any specific preferences or requirements for your
                    learning content
                </p>
                <Textarea
                    placeholder="E.g., Focus on practical examples, include code snippets, explain difficult concepts with analogies..."
                    className="min-h-[120px] resize-none"
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                />
            </div>

            <Button
                onClick={handleSave}
                disabled={saving}
                className="mt-8 w-full"
                size="lg"
            >
                {saving ? "Saving..." : "Save Settings"}
            </Button>
        </div>
    );
}

export default SettingsPage;
