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
        <div className="mb-8">
            <h3 className="text-center mb-2 font-bold">{title}</h3>
            <div className="grid grid-cols-[120px_1fr_120px] items-center gap-3">
                <span className="text-sm text-gray-600 text-right">{startLabel}</span>
                <Slider defaultValue={[50]} max={100} step={1} />
                <span className="text-sm text-gray-600 text-left">{endLabel}</span>
            </div>
        </div>
    );
}

// 2. Use the "Stamp" in your main page
function SettingsPage() {
    return (
        <div className="p-10 max-w-[800px] mx-auto">
            <h1 className="text-center">Learning Style Settings</h1>

            <SettingSlider title="Text Length" startLabel="Short" endLabel="Long" />
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
            <h2 className ="text-center"> Custom instructions</h2>
            <Textarea />
        </div>
    );
}

export default SettingsPage;
