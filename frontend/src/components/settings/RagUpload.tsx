import { useState, useRef } from "react"

interface RagUploadProps {
  isMenuItem?: boolean;
}

export function RagUpload({ isMenuItem = false }: RagUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      handleUpload(file);
    } else {
      alert("Please select a PDF file");
      event.target.value = "";
    }
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      // TODO: Implement your upload logic here
      // Example:
      // const formData = new FormData();
      // formData.append('file', file);
      // await fetch('/api/upload', { method: 'POST', body: formData });
      
      console.log("Uploading file:", file.name);
      alert(`File "${file.name}" uploaded successfully!`);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  if (isMenuItem) {
    return (
      <>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <span onClick={triggerFileInput} style={{ cursor: 'pointer' }}>
          {uploading ? 'Uploading...' : 'Upload PDF'}
        </span>
      </>
    );
  }

  return (
    <div style={{ marginBottom: '30px' }}>
      <h3 style={{ marginBottom: '10px', fontWeight: 'bold' }}>
        Upload Documents
      </h3>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'center' }}>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <button 
          onClick={triggerFileInput}
          style={{ 
            padding: '8px 16px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Choose PDF File
        </button>
      </div>
    </div>
  );
}
