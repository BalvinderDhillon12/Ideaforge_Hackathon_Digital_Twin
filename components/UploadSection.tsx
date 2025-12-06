import React, { useState } from 'react';
import { Upload, File, Check, Loader2, AlertCircle } from 'lucide-react';
import { fetchRadiomics } from "../api";   // ⬅️ IMPORTANT: your backend client

interface UploadSectionProps {
  onUploadComplete: (data: {
    file: File;
    radiomics: any;
    featureVector: number[];
  }) => void;
}

const UploadSection: React.FC<UploadSectionProps> = ({ onUploadComplete }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processUpload(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processUpload(file);
    }
  };

  // 🔥 REAL UPLOAD → BACKEND → RADIOMICS → FEATURE VECTOR
  const processUpload = async (file: File) => {
    setCurrentFile(file);
    setIsUploading(true);

    try {
      // ⬅️ send file to your backend
      const result = await fetchRadiomics(file);

      // result = { radiomics: {...}, vector: [...] }
      setIsUploading(false);
      setUploadSuccess(true);

      setTimeout(() => {
        onUploadComplete({
          file,
          radiomics: result.radiomics,
          featureVector: result.vector
        });
      }, 800);

    } catch (error) {
      console.error("Upload failed:", error);
      setIsUploading(false);
      alert("Radiomics extraction failed. Check backend.");
    }
  };

  return (
    <div className="h-full flex items-center justify-center p-8">
      <div className="max-w-xl w-full">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-slate-100 mb-2">
            Import Imaging Data
          </h2>
          <p className="text-slate-400">
            Upload DICOM or NIfTI (.nii.gz) for automated PyRadiomics extraction.
          </p>
        </div>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-2xl p-12 transition-all duration-300 flex flex-col 
            items-center justify-center min-h-[300px]
            ${isDragging ? "border-cyan-500 bg-cyan-500/10 scale-[1.02]" : "border-slate-700 bg-slate-800/50 hover:border-slate-500"}
            ${uploadSuccess ? "border-green-500 bg-green-500/10" : ""}
          `}
        >
          {/* ---------------------- LOADING ---------------------- */}
          {isUploading ? (
            <div className="flex flex-col items-center animate-pulse">
              <Loader2 className="w-16 h-16 text-cyan-500 animate-spin mb-4" />
              <p className="text-lg font-medium text-cyan-400">
                Processing {currentFile?.name}...
              </p>
              <div className="flex flex-col items-center mt-2 space-y-1">
                <p className="text-xs text-slate-500">Parsing NIfTI volume…</p>
                <p className="text-xs text-slate-500">Running tumor segmentation…</p>
                <p className="text-xs text-slate-500">Extracting radiomics features…</p>
              </div>
            </div>

          /* ---------------------- SUCCESS ---------------------- */
          ) : uploadSuccess ? (
            <div className="flex flex-col items-center scale-up-center">
              <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center mb-4 shadow-lg shadow-green-500/30">
                <Check className="w-8 h-8 text-white" />
              </div>
              <p className="text-lg font-medium text-green-400">Analysis Complete</p>
              <p className="text-sm text-slate-400 mt-2">{currentFile?.name}</p>
            </div>

          /* ---------------------- IDLE STATE ---------------------- */
          ) : (
            <>
              <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center mb-6 relative">
                <Upload className="w-10 h-10 text-slate-400" />
                {isDragging && (
                  <div className="absolute inset-0 bg-cyan-500/20 rounded-full animate-ping" />
                )}
              </div>

              <p className="text-xl font-semibold text-slate-200 mb-2">
                Drag & Drop MRI Scan
              </p>

              <p className="text-sm text-slate-400 mb-8 max-w-xs text-center">
                Formats: .nii, .nii.gz, .dcm, .img
              </p>

              <label className="bg-cyan-600 hover:bg-cyan-500 text-white font-medium py-3 px-8 rounded-lg cursor-pointer transition-colors shadow-lg shadow-cyan-500/20 flex items-center gap-2">
                <File className="w-4 h-4" />
                Select File
                <input
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".dcm,.nii,.nii.gz,.gz,.img,.hdr,application/gzip,application/x-gzip,image/*"
                />
              </label>
            </>
          )}
        </div>

        <div className="mt-8 flex justify-center gap-8 text-slate-500 text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> Secure Enclave Processing
          </div>
          <div className="flex items-center gap-2">
            <File className="w-4 h-4" /> PyRadiomics Compatible
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadSection;
