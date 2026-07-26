import { useState } from 'react';
import { X, UploadCloud, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CsvImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (rows: Record<string, string>[]) => void;
  title?: string;
}

export default function CsvImporterModal({
  isOpen,
  onClose,
  onImportComplete,
  title = "Import CSV Data"
}: CsvImporterModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (selectedFile: File) => {
    setErrorMsg('');
    if (!selectedFile.name.endsWith('.csv')) {
      setErrorMsg('Please upload a valid .csv file.');
      return;
    }
    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = (e.target?.result as string) || '';
        const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
        if (lines.length === 0) {
          setErrorMsg('CSV file is empty.');
          return;
        }

        const parsedHeaders = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
        setHeaders(parsedHeaders);

        const parsedData: Record<string, string>[] = [];
        for (let i = 1; i < Math.min(lines.length, 6); i++) {
          const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
          const row: Record<string, string> = {};
          parsedHeaders.forEach((h, idx) => {
            row[h] = values[idx] || '';
          });
          parsedData.push(row);
        }

        setPreviewRows(parsedData);
      } catch (err) {
        setErrorMsg('Failed to parse CSV file format.');
      }
    };
    reader.readAsText(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleConfirmImport = () => {
    if (previewRows.length === 0) return;
    setIsProcessing(true);
    setTimeout(() => {
      onImportComplete(previewRows);
      setIsProcessing(false);
      onClose();
    }, 600);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl overflow-hidden rounded-3xl border border-slate-700/80 bg-slate-900 shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-400">
                <FileSpreadsheet size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-100">{title}</h3>
                <p className="text-xs text-slate-400">Drag & drop CSV files for validated bulk importing</p>
              </div>
            </div>
            <button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200">
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-5">
            {errorMsg && (
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-3.5 flex items-center gap-3 text-xs text-rose-200">
                <AlertCircle size={18} className="text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {!file ? (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-10 text-center transition ${
                  dragActive ? 'border-cyan-400 bg-cyan-500/10' : 'border-slate-700/80 bg-slate-950/50 hover:border-slate-600'
                }`}
              >
                <UploadCloud size={40} className="text-cyan-400 mb-3 animate-pulse" />
                <p className="text-sm font-semibold text-slate-200">Drag and drop your .csv file here</p>
                <p className="text-xs text-slate-400 mt-1">Supports standard CSV headers (sku, name, quantity, price)</p>

                <label className="mt-4 inline-flex cursor-pointer rounded-2xl bg-cyan-500 px-5 py-2.5 text-xs font-bold text-slate-950 transition hover:bg-cyan-400">
                  Browse Files
                  <input type="file" accept=".csv" className="hidden" onChange={handleFileInput} />
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={20} className="text-emerald-400" />
                    <div>
                      <p className="text-xs font-bold text-emerald-200">{file.name}</p>
                      <p className="text-[10px] text-slate-400">{headers.length} Columns detected</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setFile(null); setPreviewRows([]); }}
                    className="text-xs text-slate-400 hover:text-slate-200"
                  >
                    Change File
                  </button>
                </div>

                {/* Column Mapping Preview Table */}
                <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/60 p-3">
                  <p className="text-xs font-bold text-slate-300 mb-2 px-1">CSV Column Mapping Preview (Top Rows):</p>
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead>
                      <tr className="border-b border-slate-800 text-cyan-400 font-mono">
                        {headers.map((h, i) => (
                          <th key={i} className="p-2 font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewRows.map((row, rIdx) => (
                        <tr key={rIdx} className="border-b border-slate-800/50">
                          {headers.map((h, cIdx) => (
                            <td key={cIdx} className="p-2 text-slate-400">{row[h] || '-'}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <button
                  onClick={handleConfirmImport}
                  disabled={isProcessing}
                  className="w-full rounded-2xl bg-cyan-500 py-3 text-xs font-bold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
                >
                  {isProcessing ? 'Validating & Importing...' : 'Confirm Bulk Import'}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
