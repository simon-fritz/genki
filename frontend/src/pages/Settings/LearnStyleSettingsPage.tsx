import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

function SettingSlider({title, leftmost, leftmiddle, middle, rightmiddle, rightmost, value, onChange}: {title: string; leftmost: string; leftmiddle: string; middle: string; rightmiddle: string; rightmost: string; value: number; onChange: (value: number) => void}) {
  const ramExpansions = [leftmost, leftmiddle, middle, rightmiddle, rightmost];
  return (
    <Card className="p-6 mb-6 bg-white border border-gray-200 hover:border-blue-300 transition-colors">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">{title}</h3>
      <Slider value={[value]} onValueChange={(val) => onChange(val[0])} max={4} step={1} className="mb-4" />
      <div className="mt-4 -mx-1.5 flex items-center justify-between text-muted-foreground text-xs font-medium">
        {ramExpansions.map((expansion) => (
          <span key={expansion} className="px-1.5">{expansion}</span>
        ))}
      </div>
    </Card>
  );
}


function SettingsPage() {
    const [textLength, setTextLength] = useState(2);
    const [equations, setEquations] = useState(2);
    const [examples, setExamples] = useState(2);
    const [explanations, setExplanations] = useState(2);
    const [documents, setDocuments] = useState(2);
    const [customInstructions, setCustomInstructions] = useState("");
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            const data = {
                textLength,
                equations,
                examples,
                explanations,
                documents,
                customInstructions,
            };
            
            // Send to backend
            const response = await fetch('/api/settings/learning-style', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (response.ok) {
                alert('Settings saved successfully!');
            } else {
                alert('Failed to save settings');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Error saving settings');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen py-12 px-4">
            <div className="max-w-full mx-auto">
                <div className="mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">Learning Style Settings</h1>
                    <p className="text-gray-600">Customize how AI generates content for your study sessions</p>
                </div>

                <div className="space-y-6">
                    <SettingSlider title="Text Length" leftmost="Very short" leftmiddle="Short" middle="Normal" rightmiddle="Long" rightmost="Very long" value={textLength} onChange={setTextLength}/>
                    <SettingSlider title="Equations" leftmost="No" leftmiddle="Few" middle="Normal" rightmiddle="More" rightmost="A lot" value={equations} onChange={setEquations}/>
                    <SettingSlider title="Examples" leftmost="No" leftmiddle="Few" middle="Normal" rightmiddle="More" rightmost="A lot" value={examples} onChange={setExamples}/>
                    <SettingSlider title="Explanations" leftmost="Very simple" leftmiddle="Simple" middle="Normal" rightmiddle="Formal" rightmost="Very formal" value={explanations} onChange={setExplanations}/>
                    <SettingSlider title="Documents" leftmost="Follow Document" leftmiddle="Simple" middle="Normal" rightmiddle="Formal" rightmost="General knowledge" value={documents} onChange={setDocuments}/>
                </div>

                <Card className="p-6 mt-8 bg-white border border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800 mb-3">Custom Instructions</h2>
                    <p className="text-sm text-gray-600 mb-3">Add any specific preferences or requirements for your learning content</p>
                    <Textarea 
                        placeholder="E.g., Focus on practical examples, include code snippets, explain difficult concepts with analogies..."
                        className="min-h-[120px] resize-none"
                        value={customInstructions}
                        onChange={(e) => setCustomInstructions(e.target.value)}
                    />
                </Card>

                <Button 
                    onClick={handleSave} 
                    disabled={saving}
                    className="mt-8 w-full"
                    size="lg"
                >
                    {saving ? 'Saving...' : 'Save Settings'}
                </Button>
            </div>
        </div>
    );
}

export default SettingsPage;


