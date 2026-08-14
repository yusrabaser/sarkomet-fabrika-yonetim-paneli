import React, { useState, useEffect } from 'react';
import { X, Download, Upload, FileText, Printer, ShieldCheck, Calendar, Clock, AlertCircle } from 'lucide-react';
import { formatDateTR, downloadFileFromBase64 } from '../utils/dateUtils';
import { PdfCanvasViewer } from './PdfCanvasViewer';

export interface CertificateData {
  certCode?: string;
  employeeName: string;
  employeeId?: number;
  departmentName?: string;
  trainingName: string;
  trainingHours?: number;
  startDate?: string;
  endDate?: string;
  certExpiryDate?: string;
  status?: 'VALID' | 'EXPIRED' | 'ONGOING' | 'NOT_COMPLETED';
  statusLabel?: string;
  daysRemaining?: number;
  fileData?: string;
  fileName?: string;
  fileType?: string;
  targetId?: number;
  targetType?: 'KATILIM' | 'EGITIM' | 'QUALITY_TEST' | 'CONTRACTOR';
  docType?: any;
}

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: CertificateData | null;
  onUploadCertificateDocument?: (
    id: number,
    fileData: string,
    fileName: string,
    fileType: string,
    targetType: 'KATILIM' | 'EGITIM' | 'QUALITY_TEST' | 'CONTRACTOR',
    docType?: any
  ) => void;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  onClose,
  data,
  onUploadCertificateDocument,
}) => {
  const [fileData, setFileData] = useState<string | undefined>(data?.fileData);
  const [fileName, setFileName] = useState<string | undefined>(data?.fileName);
  const [fileType, setFileType] = useState<string | undefined>(data?.fileType);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string>('');
  const [activeViewTab, setActiveViewTab] = useState<'ORIGINAL' | 'DIGITAL'>('ORIGINAL');

  useEffect(() => {
    setFileData(data?.fileData);
    setFileName(data?.fileName);
    setFileType(data?.fileType);
    setActiveViewTab(data?.fileData ? 'ORIGINAL' : 'DIGITAL');
  }, [data]);

  // Convert Base64 / Data URL to Object Blob URL to bypass browser iframe PDF restrictions
  useEffect(() => {
    if (!fileData) {
      setPdfBlobUrl('');
      return;
    }

    let isBlobCreated = false;
    let url = '';

    try {
      if (fileData.startsWith('blob:') || fileData.startsWith('http://') || fileData.startsWith('https://')) {
        url = fileData;
      } else {
        let base64Part = fileData;
        let mimeType = fileType || 'application/pdf';

        if (fileData.startsWith('data:')) {
          const parts = fileData.split(';base64,');
          mimeType = parts[0].replace('data:', '') || mimeType;
          base64Part = parts[1] || '';
        }

        const cleanBase64 = base64Part.replace(/[\r\n\s]/g, '');
        const binaryString = atob(cleanBase64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: mimeType });
        url = URL.createObjectURL(blob);
        isBlobCreated = true;
      }
      setPdfBlobUrl(url);
    } catch (e) {
      console.error('Error creating PDF Blob URL:', e);
      setPdfBlobUrl(fileData);
    }

    return () => {
      if (isBlobCreated && url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    };
  }, [fileData, fileType]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const formattedFileData = React.useMemo(() => {
    if (!fileData) return '';
    if (fileData.startsWith('data:') || fileData.startsWith('http://') || fileData.startsWith('https://') || fileData.startsWith('blob:')) {
      return fileData;
    }
    const type = fileType || 'application/pdf';
    return `data:${type};base64,${fileData}`;
  }, [fileData, fileType]);

  const isImage = React.useMemo(() => {
    if (!formattedFileData) return false;
    return (
      formattedFileData.startsWith('data:image/') ||
      (fileType && fileType.includes('image')) ||
      (fileName && /\.(png|jpg|jpeg|gif|webp|bmp|svg)$/i.test(fileName))
    );
  }, [formattedFileData, fileType, fileName]);

  if (!isOpen || !data) return null;

  const handleDownload = () => {
    if (formattedFileData) {
      downloadFileFromBase64(
        formattedFileData,
        fileName || `${data?.employeeName || 'Personel'}_${data?.trainingName || 'Egitim'}_Sertifika.pdf`
      );
    }
  };

  const handleOpenInNewTab = () => {
    const urlToOpen = pdfBlobUrl || formattedFileData;
    if (urlToOpen) {
      window.open(urlToOpen, '_blank');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64Str = reader.result as string;
      setFileData(base64Str);
      setFileName(file.name);
      setFileType(file.type);

      if (data?.targetId && onUploadCertificateDocument) {
        onUploadCertificateDocument(
          data.targetId,
          base64Str,
          file.name,
          file.type,
          data.targetType || 'KATILIM',
          data.docType
        );
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-6 overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0"
    >
      {/* Floating Close Button in Screen Corner */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="fixed top-3 right-3 sm:top-5 sm:right-5 z-[60] bg-rose-600 hover:bg-rose-500 text-white font-black text-xs sm:text-sm px-4 py-2.5 rounded-full shadow-2xl border-2 border-white/20 flex items-center gap-2 cursor-pointer transition-all hover:scale-105 print:hidden"
        title="Pencereden Çık (ESC)"
      >
        <X className="w-5 h-5" />
        <span>KAPAT / ÇIKIŞ</span>
      </button>

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative bg-slate-900 border border-slate-700/80 rounded-2xl max-w-4xl w-full shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh] text-slate-100 print:border-none print:shadow-none print:rounded-none print:max-w-none print:w-full print:bg-white print:text-slate-900"
      >
        
        {/* Top Control Header */}
        <div className="flex flex-wrap items-center justify-between p-4 bg-slate-950 border-b border-slate-800 gap-3 print:hidden">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Resmi Sertifika Belgesi</span>
                {data.certCode && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {data.certCode}
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                {data.employeeName} — {data.trainingName}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {fileData && (
              <>
                {!isImage && (
                  <button
                    onClick={handleOpenInNewTab}
                    className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow transition-all cursor-pointer"
                    title="PDF Belgesini Tam Ekran / Yeni Sekmede Aç"
                  >
                    👁️ Yeni Sekmede Aç
                  </button>
                )}

                <button
                  onClick={handleDownload}
                  className="inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition-all cursor-pointer hover:scale-105"
                  title="Gerçek Belgeyi Bilgisayara İndir"
                >
                  <Download className="w-4 h-4 mr-1.5" />
                  📥 Bilgisayara İndir
                </button>

                <button
                  onClick={handlePrint}
                  className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow transition-all cursor-pointer"
                  title="Yazdır"
                >
                  <Printer className="w-4 h-4 mr-1.5" />
                  🖨️ Yazdır
                </button>
              </>
            )}

            <label className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all cursor-pointer">
              <Upload className="w-4 h-4 mr-1.5 text-amber-400" />
              {fileData ? '🔄 Belgeyi Değiştir' : '📂 Belge Yükle'}
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
              title="Kapat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* View Mode Tabs (If file exists or for Digital Cert) */}
        <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-slate-800 text-xs font-bold print:hidden">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveViewTab('ORIGINAL')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeViewTab === 'ORIGINAL'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>📁 Orijinal Yüklenen Belge (PDF/Görsel)</span>
            </button>

            <button
              onClick={() => setActiveViewTab('DIGITAL')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                activeViewTab === 'DIGITAL'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>📜 Resmi Dijital Sertifika Kartı</span>
            </button>
          </div>

          <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
            Sarkomet Kalite & İSG Evrak Modülü
          </span>
        </div>

        {/* Certificate File Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-950 flex flex-col items-center justify-center min-h-[480px]">
          {activeViewTab === 'DIGITAL' ? (
            /* OFFICIAL DIGITAL CERTIFICATE CARD VIEW */
            <div className="w-full max-w-3xl bg-slate-900 border-2 border-amber-500/40 rounded-2xl p-6 sm:p-10 shadow-2xl relative text-slate-100 my-auto print:border-none print:p-0 print:bg-white print:text-slate-900">
              {/* Certificate Border Accents */}
              <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-amber-500/60 print:hidden" />
              <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-amber-500/60 print:hidden" />
              <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-amber-500/60 print:hidden" />
              <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-amber-500/60 print:hidden" />

              {/* Certificate Header */}
              <div className="text-center space-y-2 pb-6 border-b border-amber-500/20">
                <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-1">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-amber-400">
                  SARKOMET A.Ş.
                </h2>
                <p className="text-xs font-bold tracking-widest text-slate-300 uppercase">
                  Resmi Eğitim & Yeterlilik Sertifikası
                </p>
                {data.certCode && (
                  <p className="text-[11px] font-mono font-bold text-amber-300/90">
                    Sertifika Kodu: {data.certCode}
                  </p>
                )}
              </div>

              {/* Recipient Section */}
              <div className="text-center py-6 space-y-3">
                <p className="text-xs text-slate-400 uppercase tracking-widest">
                  İşbu Belge Aşağıda Adı Geçen Çalışana Düzenlenmiştir
                </p>
                <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight underline decoration-amber-500/50 underline-offset-8">
                  {data.employeeName}
                </h3>
                {data.departmentName && (
                  <p className="text-xs font-semibold text-amber-300/80">
                    Departman: {data.departmentName}
                  </p>
                )}
              </div>

              {/* Course Detail Section */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-center my-4 space-y-2">
                <p className="text-xs text-slate-400">
                  Aşağıda Belirtilen Eğitimi Başarıyla Tamamlamıştır:
                </p>
                <h4 className="text-base sm:text-lg font-black text-amber-300">
                  {data.trainingName}
                </h4>
                <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-300 pt-2 font-mono">
                  {data.trainingHours && (
                    <span className="bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
                      ⏱️ Süre: <strong className="text-amber-400">{data.trainingHours} Saat</strong>
                    </span>
                  )}
                  {data.startDate && (
                    <span className="bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
                      📅 Eğitim Tarihi: <strong className="text-amber-400">{formatDateTR(data.startDate)}</strong>
                    </span>
                  )}
                  {data.certExpiryDate && (
                    <span className="bg-slate-900 px-3 py-1 rounded-lg border border-slate-800">
                      ⏳ Geçerlilik Tarihi: <strong className="text-amber-400">{formatDateTR(data.certExpiryDate)}</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* Seals and Stamp Footer */}
              <div className="pt-6 grid grid-cols-2 sm:grid-cols-3 gap-4 items-center text-center text-xs">
                <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800">
                  <p className="text-[10px] text-slate-400 uppercase">Düzenleme Onayı</p>
                  <p className="font-bold text-white mt-1">İSG & Kalite Mdr.</p>
                  <p className="text-[10px] text-emerald-400 font-mono mt-0.5">✔ Onaylandı</p>
                </div>

                <div className="p-3 bg-slate-950/50 rounded-xl border border-amber-500/30 text-amber-400">
                  <p className="text-[10px] text-amber-300/80 uppercase">Standart Kalite</p>
                  <p className="font-extrabold mt-1">ISO 9001:2015</p>
                  <p className="text-[10px] text-amber-300/80 font-mono mt-0.5">IATF 16949</p>
                </div>

                <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 col-span-2 sm:col-span-1">
                  <p className="text-[10px] text-slate-400 uppercase">Doğrulama Kodu</p>
                  <p className="font-mono font-bold text-white mt-1 text-[11px]">
                    {data.certCode || 'SRK-VERIFIED'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Sarkomet Dijital Kayıt</p>
                </div>
              </div>
            </div>
          ) : fileData ? (
            /* ORIGINAL UPLOADED FILE VIEW (PDF / IMAGE) */
            <div className="w-full h-full flex flex-col items-center justify-center">
              {/* Info Bar */}
              <div className="w-full max-w-3xl mb-3 p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold text-white">{fileName || 'Sertifika_Belgesi'}</span>
                </div>
                <div className="flex items-center gap-4 text-slate-400 font-mono">
                  {data.startDate && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      {formatDateTR(data.startDate)}
                    </span>
                  )}
                  {data.trainingHours && (
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      {data.trainingHours} Saat
                    </span>
                  )}
                </div>
              </div>

              {/* Render Image or PDF */}
              {isImage ? (
                <div className="bg-slate-900 p-2 rounded-xl border border-slate-800 max-w-3xl w-full flex justify-center shadow-2xl">
                  <img
                    src={formattedFileData}
                    alt={fileName || 'Sertifika Belgesi'}
                    className="max-h-[600px] w-auto object-contain rounded-lg shadow-lg"
                  />
                </div>
              ) : (
                <PdfCanvasViewer
                  fileData={formattedFileData}
                  fileName={fileName}
                  onDownload={handleDownload}
                  onOpenInNewTab={handleOpenInNewTab}
                />
              )}
            </div>
          ) : (
            /* NO FILE UPLOADED PROMPT */
            <div className="max-w-md w-full bg-slate-900/90 border border-amber-500/30 rounded-2xl p-8 text-center shadow-2xl space-y-4 my-auto">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-white">
                  Henüz Orijinal PDF / Görsel Belge Yüklenmemiş
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  İsterseniz yukarıdaki <strong>"📜 Resmi Dijital Sertifika Kartı"</strong> sekmesine geçerek dijital sertifikayı görüntüleyebilir veya aşağıdaki butondan orijinal taralı PDF/görsel belgesini yükleyebilirsiniz.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => setActiveViewTab('DIGITAL')}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 cursor-pointer"
                >
                  📜 Dijital Sertifikayı Gör
                </button>

                <label className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-950/40 transition-all cursor-pointer hover:scale-105">
                  <Upload className="w-4 h-4 mr-2" />
                  📂 PDF / Belge Seç & Yükle
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer info bar */}
        <div className="flex items-center justify-between p-3.5 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 print:hidden">
          <span>
            Sarkomet A.Ş. Yüklenen Gerçek Resmi Sertifika Dosyaları
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>

      </div>
    </div>
  );
};
