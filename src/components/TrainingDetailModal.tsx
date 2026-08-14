import React, { useState, useMemo } from 'react';
import { Departman, Calisan, Egitim, EgitimKatilim } from '../types';
import { calculateTrainingStatus, calculateCertificateInfo, formatDateTR, generateCertificateCode, downloadFileFromBase64 } from '../utils/dateUtils';
import { CertificateData } from './CertificateModal';
import {
  X,
  BookOpen,
  Calendar,
  Clock,
  DollarSign,
  Users,
  CheckCircle2,
  XCircle,
  Award,
  Search,
  Building2,
  Tag,
  ShieldCheck,
  AlertTriangle,
  Download,
  FileText,
  Trash2,
  Upload,
  Edit3,
} from 'lucide-react';

interface TrainingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  egitimId: number | null;
  egitimler: Egitim[];
  calisanlar: Calisan[];
  departmanlar: Departman[];
  katilimlar: EgitimKatilim[];
  onToggleStatus?: (katilimId: number) => void;
  onSelectEmployee?: (employeeId: number) => void;
  onOpenCertificate?: (certData: CertificateData) => void;
  onDeleteParticipation?: (katilimId: number, infoStr?: string) => void;
  onEditTraining?: (egitimId: number) => void;
  onUploadCertificateDocument?: (
    id: number,
    fileData: string,
    fileName: string,
    fileType: string,
    targetType: 'KATILIM' | 'EGITIM'
  ) => void;
}

export const TrainingDetailModal: React.FC<TrainingDetailModalProps> = ({
  isOpen,
  onClose,
  egitimId,
  egitimler,
  calisanlar,
  departmanlar,
  katilimlar,
  onToggleStatus,
  onSelectEmployee,
  onOpenCertificate,
  onDeleteParticipation,
  onEditTraining,
  onUploadCertificateDocument,
}) => {
  const [participantSearch, setParticipantSearch] = useState('');

  if (!isOpen || egitimId === null) return null;

  const egitim = egitimler.find((e) => e.ID === egitimId);
  if (!egitim) return null;

  // Find participants for this specific training
  const egitimKatilimlar = katilimlar.filter((k) => k.EGITIM_ID === egitim.ID);

  const calisanMap = new Map<number, Calisan>(calisanlar.map((c) => [c.ID, c]));
  const deptMap = new Map<number, string>(departmanlar.map((d) => [d.ID, d.AD]));

  const baslangicSaati = egitim.BASLANGIC_SAATI || '09:00';
  const bitisSaati = egitim.BITIS_SAATI || '17:00';
  const currency = egitim.PARA_BIRIMI || 'TL';
  const isFree = Boolean(egitim.UCRETSIZ);

  const totalParticipantsCount = egitimKatilimlar.length;
  const totalAmount = isFree ? 0 : egitim.TOPLAM_TUTAR || 0;
  const perPersonAmount = isFree
    ? 0
    : egitim.KISI_BASI_TUTAR || (totalParticipantsCount > 0 ? Math.round(totalAmount / totalParticipantsCount) : totalAmount);

  // Overall Training Status
  const mainStatusInfo = calculateTrainingStatus(
    egitim.BASLANGIC_TARIHI,
    egitim.BITIS_TARIHI,
    0,
    egitim.MANUAL_STATUS,
    baslangicSaati,
    bitisSaati,
    egitim.SERTIFIKA_BITIS_TARIHI
  );

  // Process participants details
  const participantDetails = egitimKatilimlar.map((k) => {
    const calisan = calisanMap.get(k.CALISAN_ID);
    const deptName = calisan ? deptMap.get(calisan.DEPARTMAN_ID) || 'Bilinmiyor' : 'Bilinmiyor';

    const kBaslangicTarihi = k.BASLANGIC_TARIHI || egitim.BASLANGIC_TARIHI;
    const kBaslangicSaati = k.BASLANGIC_SAATI || baslangicSaati;
    const kBitisTarihi = egitim.BITIS_TARIHI;

    const manualStatus = k.MANUAL_STATUS || egitim.MANUAL_STATUS;
    const certExpiry = k.SERTIFIKA_BITIS_TARIHI || egitim.SERTIFIKA_BITIS_TARIHI;
    const statusInfo = calculateTrainingStatus(
      kBaslangicTarihi,
      kBitisTarihi,
      k.TAMAMLANDI,
      manualStatus,
      kBaslangicSaati,
      bitisSaati,
      certExpiry
    );

    const isCompleted = statusInfo.code === 'TAMAMLANDI';
    const certInfo = calculateCertificateInfo(
      kBitisTarihi || kBaslangicTarihi,
      isCompleted,
      egitim.EGITIM_ADI || '',
      k.SERTIFIKA_BITIS_TARIHI || egitim.SERTIFIKA_BITIS_TARIHI
    );

    const kIsFree = k.UCRETSIZ ?? isFree;
    const kCost = kIsFree ? 0 : k.KISI_BASI_TUTAR ?? perPersonAmount;

    return {
      katilimId: k.ID,
      calisanId: k.CALISAN_ID,
      adSoyad: calisan ? `${calisan.AD} ${calisan.SOYAD}` : 'Bilinmeyen Çalışan',
      ad: calisan ? calisan.AD : '',
      soyad: calisan ? calisan.SOYAD : '',
      departman: deptName,
      cost: kCost,
      isFree: kIsFree,
      statusInfo,
      certInfo,
      tamamlandi: k.TAMAMLANDI,
      certFileData: k.SERTIFIKA_DOSYA_DATA || egitim.SERTIFIKA_DOSYA_DATA,
      certFileName: k.SERTIFIKA_DOSYA_ADI || egitim.SERTIFIKA_DOSYA_ADI,
    };
  });

  // Filtered Participants
  const filteredParticipants = participantDetails.filter((p) => {
    if (!participantSearch.trim()) return true;
    const q = participantSearch.toLowerCase();
    return (
      p.adSoyad.toLowerCase().includes(q) ||
      p.departman.toLowerCase().includes(q) ||
      String(p.calisanId).includes(q)
    );
  });

  const completedCount = participantDetails.filter((p) => p.statusInfo.code === 'TAMAMLANDI').length;
  const inProgressCount = participantDetails.filter((p) => p.statusInfo.code === 'DEVAM_EDIYOR').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      {/* Backdrop overlay click handler */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Dialog Box */}
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[92vh]">
        {/* Header Ribbon */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  Eğitim Detayı ve Katılımcı Listesi
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-slate-800 text-amber-300 border border-slate-700">
                  ID: #{egitim.ID}
                </span>
              </div>
              <p className="text-xs text-slate-400">Sarkuysan A.Ş. Eğitim Yönetimi & Katılımcı Takibi</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            title="Pencereyi Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* 1. ÜST EĞİTİM ÖZET KARTI */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 border border-amber-500/30 rounded-2xl p-5 shadow-xl relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
              {/* Training Title and Status */}
              <div className="space-y-2 max-w-xl">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${mainStatusInfo.badgeClass}`}
                  >
                    {mainStatusInfo.label}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                    <Clock className="w-3 h-3 inline mr-1 text-amber-400" />
                    {egitim.SURE_SAAT} Saat
                  </span>
                  {onEditTraining && (
                    <button
                      onClick={() => onEditTraining(egitim.ID)}
                      className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-extrabold bg-amber-500/20 hover:bg-amber-500/35 text-amber-300 border border-amber-500/50 shadow-sm transition-all cursor-pointer hover:scale-105"
                      title="Eğitim Bilgilerini ve Tarihlerini Düzenle"
                    >
                      <Edit3 className="w-3.5 h-3.5 mr-1 text-amber-400" />
                      ✏️ Eğitimi Düzenle
                    </button>
                  )}
                </div>

                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {egitim.EGITIM_ADI}
                </h3>

                {/* Dates & Times */}
                <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-300 pt-1">
                  <div className="flex items-center space-x-1.5 bg-slate-950/70 px-3 py-1.5 rounded-lg border border-slate-800">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      Başlangıç: <strong className="text-white">{formatDateTR(egitim.BASLANGIC_TARIHI)}</strong> ({baslangicSaati})
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5 bg-slate-950/70 px-3 py-1.5 rounded-lg border border-slate-800">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      Bitiş: <strong className="text-white">{formatDateTR(egitim.BITIS_TARIHI)}</strong> ({bitisSaati})
                    </span>
                  </div>
                </div>
              </div>

              {/* Fee & Participation Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full lg:w-auto self-stretch lg:self-auto">
                {/* Total Fee Box */}
                <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-center flex flex-col justify-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Toplam Tutar
                  </span>
                  <span className="text-base font-extrabold text-amber-400 font-mono mt-0.5">
                    {isFree ? 'Ücretsiz / 0 TL' : `${totalAmount.toLocaleString('tr-TR')} ${currency}`}
                  </span>
                </div>

                {/* Per Person Fee Box */}
                <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-center flex flex-col justify-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Kişi Başı
                  </span>
                  <span className="text-base font-extrabold text-slate-200 font-mono mt-0.5">
                    {isFree ? '0 TL' : `${perPersonAmount.toLocaleString('tr-TR')} ${currency}`}
                  </span>
                </div>

                {/* Total Participants Count Box */}
                <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-center flex flex-col justify-center col-span-2 sm:col-span-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Katılımcı Sayısı
                  </span>
                  <span className="text-base font-extrabold text-emerald-400 font-mono mt-0.5 flex items-center justify-center gap-1">
                    <Users className="w-4 h-4 text-emerald-400" />
                    {totalParticipantsCount} Çalışan
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. O EĞİTİME KATILAN ÇALIŞANLAR TABLOSU */}
          <div className="space-y-3">
            {/* Header Toolbar & Search */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-bold text-slate-200">
                  Eğitime Kayıtlı Çalışanlar ({filteredParticipants.length} / {totalParticipantsCount})
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  {completedCount} Tamamlayan
                </span>
              </div>

              {/* Participant Search */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={participantSearch}
                  onChange={(e) => setParticipantSearch(e.target.value)}
                  placeholder="Çalışan veya departman ara..."
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs rounded-xl pl-8 pr-3 py-1.5 focus:outline-none focus:border-amber-500/60 transition-colors"
                />
              </div>
            </div>

            {/* Participants Table Container */}
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/70">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/90 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <th className="py-3 px-4">Çalışan ID</th>
                    <th className="py-3 px-4">Adı Soyadı</th>
                    <th className="py-3 px-4">Departman</th>
                    <th className="py-3 px-4">Kişi Başı Maliyet</th>
                    <th className="py-3 px-4">Eğitim Durumu</th>
                    <th className="py-3 px-4">Sertifika Bitiş Tarihi</th>
                    <th className="py-3 px-4">Sertifika Durumu</th>
                    <th className="py-3 px-4 text-right">İşlem / Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-xs sm:text-sm text-slate-200">
                  {filteredParticipants.length > 0 ? (
                    filteredParticipants.map((p) => (
                      <tr
                        key={p.katilimId}
                        className="hover:bg-slate-900/60 transition-colors group"
                      >
                        {/* Çalışan ID */}
                        <td className="py-3 px-4 font-mono text-amber-400 font-bold">
                          #{p.calisanId}
                        </td>

                        {/* Adı Soyadı */}
                        <td className="py-3 px-4 font-semibold text-white">
                          <button
                            onClick={() => onSelectEmployee && onSelectEmployee(p.calisanId)}
                            className="text-left hover:text-amber-400 hover:underline transition-colors flex items-center gap-2 cursor-pointer"
                            title="Çalışan profilini aç"
                          >
                            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-center border border-amber-500/30">
                              {p.ad.charAt(0)}{p.soyad.charAt(0)}
                            </div>
                            <span>{p.adSoyad}</span>
                          </button>
                        </td>

                        {/* Departman */}
                        <td className="py-3 px-4 font-normal text-slate-300">
                          <span className="inline-flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-xs">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            {p.departman}
                          </span>
                        </td>

                        {/* Kişi Başı Maliyet */}
                        <td className="py-3 px-4 font-mono font-semibold text-slate-300">
                          {p.isFree
                            ? '0 TL (Ücretsiz)'
                            : `${p.cost.toLocaleString('tr-TR')} ${currency}`}
                        </td>

                        {/* Çalışan Bazlı Eğitim Durumu */}
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${p.statusInfo.badgeClass}`}
                          >
                            {p.statusInfo.code === 'TAMAMLANDI' && (
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                            )}
                            {p.statusInfo.code === 'DEVAM_EDIYOR' && (
                              <Clock className="w-3.5 h-3.5 mr-1 text-blue-400" />
                            )}
                            {p.statusInfo.code === 'TAMAMLANMADI' && (
                              <XCircle className="w-3.5 h-3.5 mr-1 text-rose-400" />
                            )}
                            {p.statusInfo.label}
                          </span>
                        </td>

                        {/* Sertifika Bitiş / Yenileme Tarihi */}
                        <td className="py-3 px-4 font-mono text-xs">
                          {p.certInfo.expiryDateStr !== '-' ? (
                            <span className="inline-flex items-center gap-1.5 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                              <Calendar className="w-3 h-3 text-amber-400" />
                              <strong className="text-slate-200">{p.certInfo.expiryDateStr}</strong>
                            </span>
                          ) : (
                            <span className="text-slate-500 italic">-</span>
                          )}
                        </td>

                        {/* Sertifika Durumu */}
                        <td className="py-3 px-4 text-xs font-semibold">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs ${p.certInfo.badgeClass}`}>
                            {p.certInfo.label}
                          </span>
                        </td>

                        {/* Quick Toggle Status Button or Profile Trigger */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Real File Download & Upload Replace Buttons */}
                            {p.certFileData ? (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => {
                                    downloadFileFromBase64(
                                      p.certFileData!,
                                      p.certFileName || `${p.name}_Sertifika.pdf`
                                    );
                                  }}
                                  className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/60 shadow-sm transition-all cursor-pointer hover:scale-105"
                                  title={`Yüklenen Gerçek Sertifika Belgesini İndir (${p.certFileName || 'Dosya'})`}
                                >
                                  <Download className="w-3.5 h-3.5 mr-1 text-emerald-300" />
                                  📥 Belgeyi İndir
                                </button>

                                {onUploadCertificateDocument && (
                                  <label
                                    className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold bg-amber-500/20 hover:bg-amber-500/35 text-amber-300 border border-amber-500/50 shadow-sm transition-all cursor-pointer hover:scale-105"
                                    title="Bu belgenin yerine yeni dosya yükle ve değiştir"
                                  >
                                    <Upload className="w-3.5 h-3.5 mr-1 text-amber-300" />
                                    🔄 Değiştir
                                    <input
                                      type="file"
                                      accept=".pdf,.png,.jpg,.jpeg"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file && onUploadCertificateDocument) {
                                          const reader = new FileReader();
                                          reader.onload = () => {
                                            onUploadCertificateDocument(
                                              p.katilimId,
                                              reader.result as string,
                                              file.name,
                                              file.type,
                                              'KATILIM'
                                            );
                                          };
                                          reader.readAsDataURL(file);
                                        }
                                        e.target.value = '';
                                      }}
                                    />
                                  </label>
                                )}
                              </div>
                            ) : (
                              <label
                                className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-bold bg-amber-500/20 hover:bg-amber-500/35 text-amber-300 border border-amber-500/50 shadow-sm transition-all cursor-pointer hover:scale-105"
                                title="Bu eğitim kaydına gerçek PDF/PNG/JPG sertifika belgesi yükle"
                              >
                                <Upload className="w-3.5 h-3.5 mr-1 text-amber-300" />
                                📂 Belge Yükle
                                <input
                                  type="file"
                                  accept=".pdf,.png,.jpg,.jpeg"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file && onUploadCertificateDocument) {
                                      const reader = new FileReader();
                                      reader.onload = () => {
                                        onUploadCertificateDocument(
                                          p.katilimId,
                                          reader.result as string,
                                          file.name,
                                          file.type,
                                          'KATILIM'
                                        );
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                    e.target.value = '';
                                  }}
                                />
                              </label>
                            )}

                            {onOpenCertificate && (
                              <button
                                onClick={() => {
                                  const certCode = generateCertificateCode(
                                    p.katilimId,
                                    egitim.EGITIM_ADI,
                                    p.employeeId
                                  );
                                  let status: CertificateData['status'] = 'VALID';
                                  if (p.certInfo.status === 'EXPIRED') {
                                    status = 'EXPIRED';
                                  } else if (p.statusInfo.code === 'DEVAM_EDIYOR') {
                                    status = 'ONGOING';
                                  } else if (p.statusInfo.code === 'TAMAMLANMADI') {
                                    status = 'NOT_COMPLETED';
                                  }

                                  onOpenCertificate({
                                    certCode,
                                    employeeName: p.name,
                                    employeeId: p.employeeId,
                                    departmentName: p.departman,
                                    trainingName: egitim.EGITIM_ADI,
                                    trainingHours: egitim.SURE_SAAT,
                                    startDate: egitim.BASLANGIC_TARIHI,
                                    certExpiryDate: p.certInfo.expiryDateStr,
                                    status,
                                    statusLabel: p.certInfo.label,
                                    fileData: p.certFileData,
                                    fileName: p.certFileName,
                                  });
                                }}
                                className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/20 hover:bg-amber-500/35 text-amber-300 border border-amber-500/40 shadow-sm transition-all cursor-pointer hover:scale-105"
                                title="Katılımcı Sertifika Belgesini Görüntüle"
                              >
                                <FileText className="w-3.5 h-3.5 mr-1 text-amber-400" />
                                📄 Belgeyi Gör
                              </button>
                            )}

                            {onToggleStatus && (
                              <button
                                onClick={() => onToggleStatus(p.katilimId)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                  p.tamamlandi === 1
                                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                                    : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
                                }`}
                                title="Katılım Tamamlandı durumunu değiştir"
                              >
                                {p.tamamlandi === 1 ? 'Geri Al' : 'Tamamla'}
                              </button>
                            )}

                            {onDeleteParticipation && (
                              <button
                                onClick={() => {
                                  onDeleteParticipation(
                                    p.katilimId,
                                    `${p.name} - ${egitim.EGITIM_ADI}`
                                  );
                                }}
                                className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-500/20 hover:bg-rose-500/35 text-rose-300 border border-rose-500/40 shadow-sm transition-all cursor-pointer hover:scale-105"
                                title="Bu Katılım Kaydını Sil"
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-1 text-rose-400" />
                                Sil
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 font-sans">
                        Arama kriterlerine uygun katılımcı bulunamadı.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer Ribbon */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-t border-slate-800 text-xs">
          <div className="flex items-center space-x-2 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Sarkuysan A.Ş. İSG & İK Eğitim Veritabanı Modülü</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
