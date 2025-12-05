import { Slider } from "@/components/settings/LearningSliders";
import { RagUpload } from "@/components/settings/RagUpload";
import { Textarea } from "@/components/ui/textarea";

// 1. Define the reusable "Stamp"
// "props" acts like the arguments of the function.
// We are saying: "I expect a variable named 'title' which is a string."
function SettingSlider({
    title,
    startLabel,
    endLabel,
}: {
    title: string;
    startLabel: string;
    endLabel: string;
}) {
    return (
        <div style={{ marginBottom: "30px" }}>
            <h3 style={{ marginBottom: "10px", fontWeight: "bold" }}>
                {title}
            </h3>
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "120px 1fr 120px",
                    alignItems: "center",
                    gap: "12px",
                }}
            >
                <span
                    style={{
                        fontSize: "14px",
                        color: "#666",
                        textAlign: "right",
                    }}
                >
                    {startLabel}
                </span>
                <Slider defaultValue={[50]} max={100} step={1} />
                <span
                    style={{
                        fontSize: "14px",
                        color: "#666",
                        textAlign: "left",
                    }}
                >
                    {endLabel}
                </span>
            </div>
        </div>
    );
}

// 2. Use the "Stamp" in your main page
function SettingsPage() {
    return (
        <div style={{ padding: "40px", maxWidth: "800px", margin: "0 auto" }}>
            <h1>Learning Style Settings</h1>

            {/* Now adding a new setting is just one line of code! */}
            <SettingSlider
                title="Text Length"
                startLabel="Short"
                endLabel="Long"
            />
            <SettingSlider title="Equations" startLabel="Few" endLabel="Many" />
            <SettingSlider title="Examples" startLabel="Few" endLabel="Many" />
            <SettingSlider
                title="Explanation"
                startLabel="Simply explained"
                endLabel="Formally explained"
            />
            <SettingSlider
                title="Documents"
                startLabel="Follow Documents"
                endLabel="General Knowledge"
            />
            <RagUpload />
            <h2>Custom instructions</h2>
            <Textarea />
        </div>
    );
}

export default SettingsPage;
