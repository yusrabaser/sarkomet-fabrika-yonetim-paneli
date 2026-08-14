import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { ZoomIn, ZoomOut, ExternalLink, RefreshCw, Download, FileText } from 'lucide-react';

// Set worker source to CDN matching installed pdfjs-dist version
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface PdfCanvasViewerProps {
  fileData: string; // Base64 data URL or Blob URL
  fileName?: string;
  onDownload?: () => void;
  onOpenInNewTab?: () => void;
}

export const PdfCanvasViewer: React.FC<PdfCanvasViewerProps> = ({
  fileData,
  fileName,
  onDownload,
  onOpenInNewTab,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.2);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);

  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);
    setPdfDoc(null);

    async function loadPdf() {
      try {
        let pdfData: Uint8Array | string = fileData;

        if (fileData.startsWith('data:')) {
          const parts = fileData.split(';base64,');
          if (parts.length === 2) {
            const cleanBase64 = parts[1].replace(/[\r\n\s]/g, '');
            const binaryString = atob(cleanBase64);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            pdfData = bytes;
          }
        }

        const loadingTask = pdfjsLib.getDocument(
          typeof pdfData === 'string' ? { url: pdfData } : { data: pdfData }
        );

        const doc = await loadingTask.promise;
        if (!isMounted) return;

        setPdfDoc(doc);
        setNumPages(doc.numPages);
        setLoading(false);
      } catch (err: any) {
        console.error('PDF parsing error:', err);
        if (isMounted) {
          setError(err.message || 'PDF dosyası okunurken hata oluştu.');
          setLoading(false);
        }
      }
    }

    if (fileData) {
      loadPdf();
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [fileData]);

  // Render all pages onto canvases
  useEffect(() => {
    if (!pdfDoc || numPages === 0) return;

    let isCancelled = false;

    async function renderPages() {
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        if (isCancelled) break;
        try {
          const page = await pdfDoc.getPage(pageNum);
          const canvas = canvasRefs.current[pageNum - 1];
          if (!canvas) continue;

          const viewport = page.getViewport({ scale });
          const context = canvas.getContext('2d');
          if (!context) continue;

          canvas.height = viewport.height;
          canvas.width = viewport.width;

          const renderContext = {
            canvasContext: context,
            viewport: viewport,
          };

          await page.render(renderContext).promise;
        } catch (err) {
          console.error(`Error rendering page ${pageNum}:`, err);
        }
      }
    }

    renderPages();

    return () => {
      isCancelled = true;
    };
  }, [pdfDoc, numPages, scale]);

  if (loading) {
    return (
      <div className="w-full h-[450px] bg-slate-900 rounded-xl border border-slate-800 flex flex-col items-center justify-center text-slate-300 gap-3">
        <RefreshCw className="w-8 h-8 text-amber-400 animate-spin" />
        <p className="text-sm font-bold text-amber-300">PDF Belgesi Önizleme İçin İşleniyor...</p>
      </div>
    );
  }

  if (error || !pdfDoc) {
    return (
      <div className="w-full max-w-2xl bg-slate-900 border border-amber-500/30 rounded-2xl p-6 sm:p-8 text-center shadow-2xl space-y-4 my-auto">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
          <FileText className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h4 className="text-base font-bold text-white">
            PDF Belgesi Hazır
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Sertifika PDF dosyası sisteme kayıtlıdır. Belgeyi tarayıcınızın dahili okuyucusunda tam ekran açmak veya indirmek için aşağıdaki seçenekleri kullanabilirsiniz.
          </p>
        </div>

        <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
          {onOpenInNewTab && (
            <button
              onClick={onOpenInNewTab}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg transition-all cursor-pointer flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              <span>👁️ Tam Ekran / Yeni Sekmede Aç</span>
            </button>
          )}

          {onDownload && (
            <button
              onClick={onDownload}
              className="px-4 py-2.5 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg transition-all cursor-pointer flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>📥 Bilgisayara İndir</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      {/* PDF Controls */}
      <div className="w-full max-w-4xl mb-3 p-2.5 bg-slate-900/95 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between text-xs text-slate-300 gap-2 sticky top-0 z-10 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-2 font-semibold">
          <FileText className="w-4 h-4 text-amber-400" />
          <span className="text-white font-bold">{fileName || 'Sertifika_Belgesi.pdf'}</span>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[11px] font-mono">
            {numPages} Sayfa
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setScale((s) => Math.max(0.6, Number((s - 0.2).toFixed(1))))}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
            title="Küçült"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <span className="text-xs font-mono font-bold text-amber-300 min-w-[50px] text-center">
            %{Math.round(scale * 100)}
          </span>

          <button
            onClick={() => setScale((s) => Math.min(2.5, Number((s + 0.2).toFixed(1))))}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
            title="Büyüt"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={() => setScale(1.2)}
            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 transition-colors cursor-pointer"
            title="Sıfırla"
          >
            Sıfırla
          </button>

          {onOpenInNewTab && (
            <button
              onClick={onOpenInNewTab}
              className="ml-2 px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="Yeni Sekmede Tam Ekran Aç"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Yeni Sekme</span>
            </button>
          )}
        </div>
      </div>

      {/* Pages Container */}
      <div
        ref={containerRef}
        className="w-full max-w-4xl max-h-[640px] overflow-auto bg-slate-950 p-4 rounded-xl border border-slate-800 shadow-2xl flex flex-col items-center gap-6"
      >
        {Array.from({ length: numPages }, (_, index) => (
          <div
            key={`page_${index + 1}`}
            className="relative bg-white rounded-lg shadow-2xl overflow-hidden border border-slate-700 p-1 flex flex-col items-center"
          >
            <canvas
              ref={(el) => {
                canvasRefs.current[index] = el;
              }}
              className="max-w-full h-auto rounded"
            />
            <div className="w-full text-center py-1 text-[10px] text-slate-500 font-mono bg-slate-100 border-t border-slate-200">
              Sayfa {index + 1} / {numPages}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
