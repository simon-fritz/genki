import { Button } from "@/components/ui/button"
import { useState } from "react"

export function RagUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
    } else {
      alert("Please select a PDF file");
      event.target.value = "";
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      // TODO: Implement your upload logic here
      // Example:
      // const formData = new FormData();
      // formData.append('file', selectedFile);
      // await fetch('/api/upload', { method: 'POST', body: formData });
      
      console.log("Uploading file:", selectedFile.name);
      alert(`File "${selectedFile.name}" uploaded successfully!`);
      setSelectedFile(null);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ marginBottom: '30px' }}>
      <h3 style={{ marginBottom: '10px', fontWeight: 'bold' }}>
        Upload Documents
      </h3>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'center' }}>
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          style={{ display: 'none' }}
          id="pdf-upload"
        />
        <label htmlFor="pdf-upload">
          <Button variant="outline" asChild>
            <span style={{ cursor: 'pointer' }}>
              Choose PDF File
            </span>
          </Button>
        </label>
        
        {selectedFile && (
          <>
            <span style={{ fontSize: '14px', color: '#666' }}>
              {selectedFile.name}
            </span>
            <Button 
              onClick={handleUpload} 
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Upload'}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
