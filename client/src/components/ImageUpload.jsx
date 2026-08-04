import { useState, useRef } from 'react';

export default function ImageUpload({ onTextExtracted }) {
  const [ocrState, setOcrState] = useState('idle'); // idle | loading | done | error
  const [ocrProgress, setOcrProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);

  const runOcr = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setOcrState('error');
      setTimeout(() => setOcrState('idle'), 3000);
      return;
    }

    setOcrState('loading');
    setOcrProgress(0);

    try {
      // Dynamically import Tesseract to avoid bloating the initial bundle
      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            setOcrProgress(Math.round(m.progress * 100));
          }
        }
      });

      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();

      const cleaned = text.trim();
      if (!cleaned || cleaned.length < 10) {
        setOcrState('error');
        setTimeout(() => setOcrState('idle'), 3000);
        return;
      }

      onTextExtracted(cleaned);
      setOcrState('done');
      setTimeout(() => setOcrState('idle'), 2500);
    } catch (err) {
      console.error('[OCR]', err);
      setOcrState('error');
      setTimeout(() => setOcrState('idle'), 3000);
    }
  };

  const handleFile = (file) => {
    if (file) runOcr(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {ocrState === 'loading' ? (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-tc-accent/10 border border-tc-accent/30">
          <svg className="w-4 h-4 text-tc-accent animate-spin shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-tc-accent text-xs font-medium">Extracting text from image...</span>
              <span className="text-tc-accent text-xs font-mono">{ocrProgress}%</span>
            </div>
            <div className="h-1 bg-tc-border rounded-full overflow-hidden">
              <div
                className="h-full bg-tc-accent rounded-full transition-all duration-300"
                style={{ width: `${ocrProgress}%` }}
              />
            </div>
          </div>
        </div>
      ) : ocrState === 'done' ? (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-tc-true/10 border border-tc-true/30">
          <svg className="w-4 h-4 text-tc-true" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-tc-true text-xs font-medium">Text extracted — review it below and click Check</span>
        </div>
      ) : ocrState === 'error' ? (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-tc-false/10 border border-tc-false/30">
          <svg className="w-4 h-4 text-tc-false" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span className="text-tc-false text-xs font-medium">Could not extract text. Try a clearer image or paste the text manually.</span>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed transition-all duration-200 text-sm font-medium ${
            dragOver
              ? 'border-tc-accent bg-tc-accent/10 text-tc-accent'
              : 'border-tc-border text-gray-500 hover:border-gray-500 hover:text-gray-300 hover:bg-tc-border/20'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Upload screenshot to extract text (OCR)
        </button>
      )}
    </div>
  );
}
