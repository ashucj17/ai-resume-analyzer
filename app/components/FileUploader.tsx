import React, { useCallback, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { formatSize } from "~/lib/utils";

interface Props {
  onFileSelect?: (file: File | null) => void;
  maxSizeMB?: number;
}

const FileUploader: React.FC<Props> = ({ onFileSelect, maxSizeMB = 20 }) => {
  const maxSize = maxSizeMB * 1024 * 1024;

  const onDrop = useCallback((accepted: File[]) => {
    const f = accepted[0] ?? null;
    onFileSelect?.(f);
  }, [onFileSelect]);

  const { getRootProps, getInputProps, acceptedFiles, isDragActive, fileRejections } = useDropzone({
    onDrop,
    multiple: false,
    accept: { "application/pdf": [".pdf"] },
    maxSize,
  });

  const file = acceptedFiles[0] ?? null;

  const rejectionMessage = useMemo(() => {
    if (!fileRejections || fileRejections.length === 0) return null;
    const r = fileRejections[0];
    const reason = r.errors?.[0]?.message ?? "File rejected";
    return reason;
  }, [fileRejections]);

  return (
    <div className="w-full gradient-border">
      <div {...getRootProps()} className="p-4 cursor-pointer">
        <input {...getInputProps()} />

        {file ? (
          <div className="uploader-selected-file flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src="/images/pdf.png" alt="pdf" className="w-10 h-10" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <p className="text-xs text-gray-500">{formatSize(file.size)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button type="button" onClick={(e) => { e.stopPropagation(); onFileSelect?.(null); }} className="p-2">
                <img src="/icons/cross.svg" alt="remove" className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="mx-auto w-16 h-16 flex items-center justify-center mb-2">
              <img src="/icons/info.svg" alt="upload" className="w-10 h-10" />
            </div>
            <p className="text-sm">
              <strong>Click to upload</strong> or drag and drop
            </p>
            <p className="text-xs text-gray-500">PDF (max {formatSize(maxSize)})</p>
            {isDragActive && <p className="text-xs">Drop file to upload</p>}
            {rejectionMessage && <p className="text-xs text-red-500">{rejectionMessage}</p>}
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploader;
