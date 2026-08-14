import React from 'react';
import {
  X,
  FileCheck,
  Upload,
  Download,
  Eye,
  Trash2,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  HardHat,
  Building2,
  User,
  CreditCard,
  Stethoscope,
  GraduationCap,
  Scale,
  FileText,
} from 'lucide-react';
import { TaseronPersonel, ContractorDocType } from '../types';
import { downloadFileFromBase64 } from '../utils/dateUtils';
import { CertificateData } from './CertificateModal';

interface ContractorDocModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractor: TaseronPersonel | null;
  onUploadDoc: (
    contractorId: number,
    docType: ContractorDocType,
    fileData: string,
    fileName: string,
    fileType: string
  ) => void;
  onRemoveDoc: (contractorId: number, docType: ContractorDocType) => void;
  onOpenCertificate: (certData: CertificateData) => void;
}

export const MANDATORY_DOCS_LIST: {
  type: ContractorDocType;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    type: 'KIMLIK',
    title: 'Kimlik Fotokopisi / T.C. Doğrulama',
    subtitle: 'Nüfus cüzdanı, T.C. Kimlik Kartı veya Pasaport fotokopisi/görseli',
    icon: CreditCard,
  },
  {
    type: 'SAGLIK',
    title: 'Periyodik Sağlık Raporu / Ek-2',
    subtitle: '6331 sayılı İSG Kanunu Ağır ve Tehlikeli İşler Sağlık Raporu',
    icon: Stethoscope,
  },
  {
    type: 'ISG',
    title: 'İSG / Oryantasyon Eğitim Belgesi',
    subtitle: 'Sarkomet veya yetkili kurum İSG Sertifikası / Geçerli İSG Eğitimi',
    icon: GraduationCap,
  },
  {
    type: 'SABIKA',
    title: 'Adli Sicil Kaydı (Sabıka Kaydı)',
    subtitle: 'E-Devlet portalından alınmış son 6 ay tarihli adli sicil belgesi',
    icon: Scale,
  },
];

export const ContractorDocModal: React.FC<ContractorDocModalProps> = ({
  isOpen,
  onClose,
  contractor,
  onUploadDoc,
  onRemoveDoc,
  onOpenCertificate,
}) => {
  if (!isOpen || !contractor) return null;

  // Calculate uploaded docs
  const getDocData = (type: ContractorDocType) => {
    switch (type) {
      case 'KIMLIK':
        return {
          data: contractor.KIMLIK_DOSYA_DATA,
          name: contractor.KIMLIK_DOSYA_ADI || `${contractor.PERSONEL_ADI_SOYADI}_Kimlik.pdf`,
          type: contractor.KIMLIK_DOSYA_TIPI || 'application/pdf',
        };
      case 'SAGLIK':
        return {
          data: contractor.SAGLIK_DOSYA_DATA,
          name: contractor.SAGLIK_DOSYA_ADI || `${contractor.PERSONEL_ADI_SOYADI}_SaglikRaporu.pdf`,
          type: contractor.SAGLIK_DOSYA_TIPI || 'application/pdf',
        };
      case 'ISG':
        return {
          data: contractor.ISG_DOSYA_DATA || contractor.DOSYA_DATA,
          name: contractor.ISG_DOSYA_ADI || contractor.DOSYA_ADI || `${contractor.PERSONEL_ADI_SOYADI}_ISG_Belgesi.pdf`,
          type: contractor.ISG_DOSYA_TIPI || contractor.DOSYA_TIPI || 'application/pdf',
        };
      case 'SABIKA':
        return {
          data: contractor.SABIKA_DOSYA_DATA,
          name: contractor.SABIKA_DOSYA_ADI || `${contractor.PERSONEL_ADI_SOYADI}_AdliSicil.pdf`,
          type: contractor.SABIKA_DOSYA_TIPI || 'application/pdf',
        };
    }
  };

  let uploadedCount = 0;
  MANDATORY_DOCS_LIST.forEach((doc) => {
    const docInfo = getDocData(doc.type);
    if (docInfo.data) uploadedCount++;
  });

  const totalDocs = MANDATORY_DOCS_LIST.length;
  const isComplete = uploadedCount === totalDocs;
  const percentage = Math.round((uploadedCount / totalDocs) * 100);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    docType: ContractorDocType
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      onUploadDoc(
        contractor.ID,
        docType,
        reader.result as string,
        file.name,
        file.type
      );
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <HardHat className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white tracking-tight">
                  Taşeron Bireysel Evrak Kontrol Listesi
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  4 Zorunlu Belge
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Fabrika saha kapı onay yetkisi için zorunlu 4 evrağın eksiksiz yüklenmesi gereklidir.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contractor Personnel Info Bar */}
        <div className="bg-slate-900/90 border-b border-slate-800 p-4 px-6 grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Çalışan Personel</span>
            <span className="font-extrabold text-white text-sm block mt-0.5 truncate">
              {contractor.PERSONEL_ADI_SOYADI}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Taşeron Firma</span>
            <span className="font-bold text-amber-300 block mt-0.5 truncate">
              {contractor.FIRMA_ADI}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase block">T.C. / Pasaport</span>
            <span className="font-mono text-slate-300 block mt-0.5">
              {contractor.TC_PASAPORT_NO}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase block">Yapılacak Görev/İş</span>
            <span className="text-slate-300 block mt-0.5 truncate">
              {contractor.GOREV_IS}
            </span>
          </div>
        </div>

        {/* Dynamic Status Card Banner (Red to Green) */}
        <div className="p-4 px-6 bg-slate-950/60 border-b border-slate-800 shrink-0">
          <div
            className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
              isComplete
                ? 'bg-emerald-950/40 border-emerald-500/50 shadow-lg shadow-emerald-950/30'
                : 'bg-rose-950/40 border-rose-500/50 shadow-lg shadow-rose-950/30'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div
                className={`p-3 rounded-xl ${
                  isComplete ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                }`}
              >
                {isComplete ? (
                  <CheckCircle2 className="w-6 h-6 animate-pulse" />
                ) : (
                  <AlertCircle className="w-6 h-6" />
                )}
              </div>
              <div>
                <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400 block">
                  Otomatik Saha Giriş Onay Durumu
                </span>
                <span
                  className={`text-base font-black tracking-tight block ${
                    isComplete ? 'text-emerald-300' : 'text-rose-300'
                  }`}
                >
                  {isComplete
                    ? '✅ SAHAYA GİREBİLİR'
                    : '🔴 GİRİŞ ONAYLANMADI (Eksik Evrak)'}
                </span>
                <p className="text-xs text-slate-300 mt-0.5">
                  {isComplete
                    ? 'Tüm 4 zorunlu evrak sisteme yüklenmiştir. Personel fabrika kapısından giriş yapabilir.'
                    : `Saha girişi için ${4 - uploadedCount} adet zorunlu evrak daha yüklenmelidir.`}
                </p>
              </div>
            </div>

            {/* Completion Percentage Progress Bar */}
            <div className="w-full sm:w-48 bg-slate-900 border border-slate-800 p-2.5 rounded-xl shrink-0">
              <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                <span className="text-slate-400">Tamamlanma</span>
                <span className={isComplete ? 'text-emerald-400' : 'text-amber-400'}>
                  {uploadedCount}/4 ({percentage}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    isComplete
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      : uploadedCount > 0
                      ? 'bg-gradient-to-r from-amber-500 to-orange-400'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Checklist Items */}
        <div className="p-5 sm:p-6 space-y-3 overflow-y-auto custom-scrollbar flex-1">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>4 Zorunlu Saha Evrak Listesi</span>
            <span className="text-[11px] text-slate-500 font-normal">
              Desteklenen formatlar: PDF, PNG, JPG (Maks. 10MB)
            </span>
          </h4>

          {MANDATORY_DOCS_LIST.map((docItem, index) => {
            const IconComp = docItem.icon;
            const docInfo = getDocData(docItem.type);
            const isUploaded = Boolean(docInfo.data);

            return (
              <div
                key={docItem.type}
                className={`p-4 rounded-2xl border transition-all ${
                  isUploaded
                    ? 'bg-slate-950/80 border-slate-800 hover:border-emerald-500/40'
                    : 'bg-slate-950/40 border-slate-800/80 hover:border-amber-500/30'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start space-x-3.5">
                    <div className="text-slate-500 font-bold text-xs pt-1">
                      #{index + 1}
                    </div>
                    <div
                      className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                        isUploaded
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="text-xs font-extrabold text-white">
                          {docItem.title}
                        </h5>
                        {isUploaded ? (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            Yüklendi
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3 text-rose-400" />
                            Eksik Evrak
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {docItem.subtitle}
                      </p>

                      {isUploaded && docInfo.name && (
                        <span className="inline-block mt-1.5 text-[10px] font-mono text-emerald-400/90 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          📄 {docInfo.name}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80 w-full sm:w-auto justify-end">
                    {isUploaded ? (
                      <>
                        {/* Gör / Preview */}
                        <button
                          onClick={() => {
                            if (docInfo.data) {
                              onOpenCertificate({
                                certCode: `TSR-${contractor.ID}-${docItem.type}`,
                                employeeName: contractor.PERSONEL_ADI_SOYADI,
                                departmentName: contractor.FIRMA_ADI,
                                trainingName: docItem.title,
                                startDate: contractor.ISG_EGITIM_TARIHI,
                                certExpiryDate: contractor.ISG_EGITIM_BITIS_TARIHI,
                                fileData: docInfo.data,
                                fileName: docInfo.name,
                                fileType: docInfo.type,
                                targetId: contractor.ID,
                              });
                            }
                          }}
                          className="inline-flex items-center px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/35 text-amber-300 border border-amber-500/40 transition-all cursor-pointer shadow-sm"
                          title="Belgeyi Önizle"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1 text-amber-400" />
                          Gör
                        </button>

                        {/* İndir */}
                        <button
                          onClick={() => {
                            if (docInfo.data) {
                              downloadFileFromBase64(docInfo.data, docInfo.name);
                            }
                          }}
                          className="inline-flex items-center px-2.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600/25 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 transition-all cursor-pointer shadow-sm"
                          title="Bilgisayara İndir"
                        >
                          <Download className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                          İndir
                        </button>

                        {/* Yeniden Yükle */}
                        <label
                          className="inline-flex items-center px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
                          title="Yeni Dosya Yükle"
                        >
                          <Upload className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          Değiştir
                          <input
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg"
                            className="hidden"
                            onChange={(e) => handleFileChange(e, docItem.type)}
                          />
                        </label>

                        {/* Sil */}
                        <button
                          onClick={() => onRemoveDoc(contractor.ID, docItem.type)}
                          className="p-1.5 rounded-xl text-rose-400 hover:text-white hover:bg-rose-600/30 border border-rose-500/20 transition-all cursor-pointer"
                          title="Bu Belgeyi Kaldır"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <label
                        className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg shadow-orange-950/30 transition-all cursor-pointer hover:scale-105"
                      >
                        <Upload className="w-3.5 h-3.5 mr-1.5" />
                        📂 Evrak Yükle
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg"
                          className="hidden"
                          onChange={(e) => handleFileChange(e, docItem.type)}
                        />
                      </label>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0 text-xs">
          <div className="flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Sarkomet A.Ş. İSG & Güvenlik Giriş Otomasyonu</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold transition-all cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
