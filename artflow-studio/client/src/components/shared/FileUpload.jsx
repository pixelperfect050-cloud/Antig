import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, X, FileText } from 'lucide-react';

export default function FileUpload({ files, setFiles }) {
  const onDrop = useCallback((accepted) => setFiles((prev) => [...prev, ...accepted].slice(0, 10)), [setFiles]);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, maxSize: 50 * 1024 * 1024 });
  const remove = (i) => setFiles((prev) => prev.filter((_, idx) => idx !== i));

  return (
    <div>
      <div {...getRootProps()} className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100'}`}>
        <input {...getInputProps()} />
        <UploadCloud className={`w-8 h-8 mx-auto mb-3 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`} />
        <p className="text-sm text-gray-600 font-medium">{isDragActive ? 'Drop files here' : 'Drag & drop files, or click to browse'}</p>
        <p className="text-xs text-gray-400 mt-1">Images, PDFs, AI, ZIP — max 10 files, 50 MB each</p>
      </div>
      {files.length > 0 && (
        <div className="mt-3 space-y-2">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-4 py-3">
              <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <span className="text-sm text-gray-700 truncate flex-1">{f.name}</span>
              <span className="text-xs text-gray-400 flex-shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
              <button onClick={() => remove(i)} className="text-gray-400 hover:text-red-500 transition-colors"><X className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
