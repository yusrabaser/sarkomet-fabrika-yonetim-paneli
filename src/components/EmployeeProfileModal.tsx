import React from 'react';
import { Departman, Calisan, Egitim, EgitimKatilim } from '../types';
import { calculateTrainingStatus, calculateCertificateInfo, formatDateTR, generateCertificateCode, downloadFileFromBase64 } from '../utils/dateUtils';
import { CertificateData } from './CertificateModal';
import {
  X,
  User,
  Building2,
  Calendar,
  Award,
  CheckCircle2,
  Clock,
  XCircle,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  BookOpen,
  FileText,
  Trash2,
  Download,
  Upload,
  Edit3,
} from 'lucide-react';

interface EmployeeProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  calisanId: number | null;
  calisanlar: Calisan[];
  departmanlar: Departman[];
  egitimler: Egitim[];
  katilimlar: EgitimKatilim[];
  onOpenCertificate?: (certData: CertificateData) => void;
  onDeleteParticipation?: (katilimId: number, infoStr?: string) => void;
  onEditEmployee?: (employee: Calisan) => void;
  onUploadCertificateDocument?: (
    id: number,
    fileData: string,
    fileName: string,
    fileType: string,
    targetType: 'KATILIM' | 'EGITIM'
  ) => void;
}

export const EmployeeProfileModal: React.FC<EmployeeProfileModalProps> = ({
  isOpen,
  onClose,
  calisanId,
  calisanlar,
  departmanlar,
  egitimler,
  katilimlar,
  onOpenCertificate,
  onDeleteParticipation,
  onEditEmployee,
  onUploadCertificateDocument,
}) => {
  if (!isOpen || calisanId === null) return null;

  const employee = calisanlar.find((c) => c.ID === calisanId);
  if (!employee) return null;

  const department = departmanlar.find((d) => d.ID === employee.DEPARTMAN_ID);
  const deptName = department ? department.AD : 'Bilinmeyen Departman';

  // Get employee's personal participations
  const empKatilimlar = katilimlar.filter((k) => k.CALISAN_ID === employee.ID);
  const egitimMap = new Map<number, Egitim>(egitimler.map((e) => [e.ID, e]));

  // Process training modules and certificate validity
  const trainingDetails = empKatilimlar.map((k) => {
    const egitim = egitimMap.get(k.EGITIM_ID);
    const baslangicTarihi = k.BASLANGIC_TARIHI || egitim?.BASLANGIC_TARIHI || '';
    const baslangicSaati = k.BASLANGIC_SAATI || egitim?.BASLANGIC_SAATI || '09:00';
    const bitisTarihi = egitim?.BITIS_TARIHI || '';
    const bitisSaati = egitim?.BITIS_SAATI || '17:00';

    const manualStatus = k.MANUAL_STATUS || egitim?.MANUAL_STATUS;
    const certExpiry = k.SERTIFIKA_BITIS_TARIHI || egitim?.SERTIFIKA_BITIS_TARIHI;
    const statusInfo = egitim
      ? calculateTrainingStatus(
          baslangicTarihi,
          bitisTarihi,
          k.TAMAMLANDI,
          manualStatus,
          baslangicSaati,
          bitisSaati,
          certExpiry
        )
      : { code: k.TAMAMLANDI === 1 ? 'TAMAMLANDI' : 'TAMAMLANMADI', label: k.TAMAMLANDI === 1 ? 'Geçerli' : 'Tamamlanmadı', badgeClass: '' };

    const isCompleted = statusInfo.code === 'TAMAMLANDI';
    const certInfo = calculateCertificateInfo(
      bitisTarihi || baslangicTarihi,
      isCompleted,
      egitim?.EGITIM_ADI || '',
      k.SERTIFIKA_BITIS_TARIHI || egitim?.SERTIFIKA_BITIS_TARIHI
    );

    return {
      katilimId: k.ID,
      egitimName: egitim ? egitim.EGITIM_ADI : 'Bilinmeyen Eğitim',
      baslangicTarihi,
      baslangicSaati,
      bitisTarihi,
      bitisSaati,
      sureSaat: k.SURE_SAAT ?? egitim?.SURE_SAAT ?? 0,
      statusInfo,
      certInfo,
      certFileData: k.SERTIFIKA_DOSYA_DATA || egitim?.SERTIFIKA_DOSYA_DATA,
      certFileName: k.SERTIFIKA_DOSYA_ADI || egitim?.SERTIFIKA_DOSYA_ADI,
    };
  });

  // KPI Calculations
  const totalParticipations = trainingDetails.length;
  const totalTrainingHours = trainingDetails.reduce((sum, t) => sum + (t.sureSaat || 0), 0);
  const completedCount = trainingDetails.filter((t) => t.statusInfo.code === 'TAMAMLANDI').length;
  const validCertCount = trainingDetails.filter((t) => t.certInfo.status === 'VALID').length;
  const warningCertCount = trainingDetails.filter(
    (t) => t.certInfo.status === 'SOON' || t.certInfo.status === 'EXPIRED'
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      {/* Backdrop overlay click handler */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]">
        {/* Header Ribbon */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <Award className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white tracking-wide">
              Çalışan Profil Detayı & Sertifika Takip Kartı
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
            title="Pencereyi Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* 1. ÜST PROFİL BİLGİLERİ KARTI */}
          <div className="bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900 border border-amber-500/30 rounded-xl p-5 shadow-inner">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
              {/* Profile Avatar & Info */}
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-amber-700 flex items-center justify-center text-2xl font-black text-white shadow-lg border border-amber-400/40 flex-shrink-0">
                  {`${employee.AD.charAt(0)}${employee.SOYAD.charAt(0)}`}
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-extrabold text-white tracking-tight">
                      {employee.AD} {employee.SOYAD}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Sicil ID: #{employee.ID}
                    </span>
                    {onEditEmployee && (
                      <button
                        onClick={() => onEditEmployee(employee)}
                        className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/20 hover:bg-amber-500/35 text-amber-300 border border-amber-500/50 shadow-sm transition-all cursor-pointer hover:scale-105"
                        title="Çalışan Adı, Soyadı ve Bilgilerini Düzenle"
                      >
                        <Edit3 className="w-3.5 h-3.5 mr-1 text-amber-400" />
                        ✏️ İsim / Bilgi Düzenle
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-300">
                    <span className="flex items-center font-semibold text-amber-400">
                      <Building2 className="w-3.5 h-3.5 mr-1 text-slate-400" />
                      Departman: <strong className="ml-1 text-slate-100">{deptName}</strong>
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="flex items-center font-mono text-slate-300">
                      <Calendar className="w-3.5 h-3.5 mr-1 text-amber-400" />
                      İşe Giriş Tarihi: <strong className="ml-1 text-slate-100">{formatDateTR(employee.ISE_GIRIS_TARIHI)}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Summary Badges */}
              <div className="flex items-center gap-2 self-stretch md:self-auto justify-between md:justify-end bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                <div className="text-center px-3">
                  <span className="block text-lg font-black text-amber-400 font-mono">
                    {totalParticipations}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Toplam Eğitim</span>
                </div>
                <div className="h-7 w-px bg-slate-800" />
                <div className="text-center px-3">
                  <span className="block text-lg font-black text-amber-300 font-mono">
                    {totalTrainingHours} <span className="text-xs font-normal">Saat</span>
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold font-mono">Toplam Süre</span>
                </div>
                <div className="h-7 w-px bg-slate-800" />
                <div className="text-center px-3">
                  <span className="block text-lg font-black text-emerald-400 font-mono">
                    {completedCount}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Tamamlanan</span>
                </div>
                <div className="h-7 w-px bg-slate-800" />
                <div className="text-center px-3">
                  <span className="block text-lg font-black text-emerald-300 font-mono">
                    {validCertCount}
                  </span>
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Geçerli Sertifika</span>
                </div>
              </div>
            </div>
          </div>

          {/* 2. EĞİTİMLER VE SERTİFİKA BİTİŞ TARİHLERİ TABLOSU */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-amber-400" />
                Aldığı Eğitimler ve Sertifika Geçerlilik Durumları
              </h4>
              <span className="text-xs text-slate-400 font-mono">
                {trainingDetails.length} Kayıt Bulundu
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/70">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/90 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                    <th className="py-3 px-4">Eğitim Adı</th>
                    <th className="py-3 px-4">Eğitim Tarihi ve Saati</th>
                    <th className="py-3 px-4">Eğitim Durumu</th>
                    <th className="py-3 px-4">Sertifika Bitiş / Yenileme</th>
                    <th className="py-3 px-4">Sertifika Durumu</th>
                    <th className="py-3 px-4 text-right">Eylem / Belge</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-xs sm:text-sm text-slate-200">
                  {trainingDetails.length > 0 ? (
                    trainingDetails.map((item) => {
                      const certCode = generateCertificateCode(
                        item.katilimId,
                        item.egitimName,
                        employee.ID
                      );
                      let status: CertificateData['status'] = 'VALID';
                      if (item.certInfo.status === 'EXPIRED' || item.statusInfo.code === 'SERTIFIKA_SURESI_DOLDU') {
                        status = 'EXPIRED';
                      } else if (item.statusInfo.code === 'DEVAM_EDIYOR') {
                        status = 'ONGOING';
                      } else if (item.statusInfo.code === 'TAMAMLANMADI' || item.statusInfo.code === 'BASLAMADI') {
                        status = 'NOT_COMPLETED';
                      }

                      return (
                      <tr key={item.katilimId} className="hover:bg-slate-900/60 transition-colors">
                        {/* Eğitim Adı */}
                        <td className="py-3.5 px-4 font-semibold text-white">
                          {item.egitimName}
                          <span className="block text-[11px] text-slate-400 font-mono font-normal">
                            Süre: {item.sureSaat} Saat
                          </span>
                        </td>

                        {/* Eğitim Tarihi ve Saati */}
                        <td className="py-3.5 px-4 font-mono text-slate-300">
                          <span className="inline-flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800 text-xs">
                            <Calendar className="w-3.5 h-3.5 text-amber-400" />
                            {item.baslangicTarihi
                              ? `${formatDateTR(item.baslangicTarihi)} ${item.baslangicSaati}`
                              : '-'}{' '}
                            - {item.bitisTarihi ? `${formatDateTR(item.bitisTarihi)} ${item.bitisSaati}` : ''}
                          </span>
                        </td>

                        {/* Eğitim Durumu */}
                        <td className="py-3.5 px-4">
                          {item.statusInfo.code === 'DEVAM_EDIYOR' && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                              <Clock className="w-3.5 h-3.5 mr-1 text-blue-400" />
                              Devam Ediyor
                            </span>
                          )}
                          {item.statusInfo.code === 'TAMAMLANDI' && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                              Geçerli
                            </span>
                          )}
                          {item.statusInfo.code === 'SERTIFIKA_SURESI_DOLDU' && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                              <XCircle className="w-3.5 h-3.5 mr-1 text-rose-400" />
                              Sertifika Süresi Doldu
                            </span>
                          )}
                          {item.statusInfo.code === 'TAMAMLANMADI' && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                              <XCircle className="w-3.5 h-3.5 mr-1 text-rose-400" />
                              Tamamlanmadı
                            </span>
                          )}
                          {(item.statusInfo.code === 'PLANLANDI' || item.statusInfo.code === 'BASLAMADI') && (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              <Clock className="w-3.5 h-3.5 mr-1 text-amber-400" />
                              {item.statusInfo.label}
                            </span>
                          )}
                        </td>

                        {/* Sertifika Bitiş / Yenileme Tarihi */}
                        <td className="py-3.5 px-4 font-mono font-semibold text-slate-200">
                          {item.certInfo.expiryDateStr !== '-' ? (
                            <span className="inline-flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-md border border-slate-800 text-xs">
                              <Calendar className="w-3.5 h-3.5 text-amber-400" />
                              {item.certInfo.expiryDateStr}
                            </span>
                          ) : (
                            <span className="text-slate-500 text-xs italic">-</span>
                          )}
                        </td>

                        {/* Sertifika Durumu (Rozet) */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${item.certInfo.badgeClass}`}
                          >
                            {item.certInfo.label}
                          </span>
                        </td>

                        {/* Belgeyi Gör & Sil Action Buttons */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {/* Real File Download & Upload Replace Buttons */}
                            {item.certFileData ? (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => {
                                    downloadFileFromBase64(
                                      item.certFileData!,
                                      item.certFileName || `${employee.AD}_${employee.SOYAD}_Sertifika.pdf`
                                    );
                                  }}
                                  className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/60 shadow-sm transition-all cursor-pointer hover:scale-105"
                                  title={`Yüklenen Gerçek Sertifika Belgesini İndir (${item.certFileName || 'Dosya'})`}
                                >
                                  <Download className="w-3.5 h-3.5 mr-1 text-emerald-300" />
                                  📥 Belgeyi İndir
                                </button>

                                {onUploadCertificateDocument && (
                                  <label
                                    className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 hover:bg-amber-500/35 text-amber-300 border border-amber-500/50 shadow-sm transition-all cursor-pointer hover:scale-105"
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
                                              item.katilimId,
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
                                className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 hover:bg-amber-500/35 text-amber-300 border border-amber-500/50 shadow-sm transition-all cursor-pointer hover:scale-105"
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
                                          item.katilimId,
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
                                  onOpenCertificate({
                                    certCode,
                                    employeeName: `${employee.AD} ${employee.SOYAD}`,
                                    employeeId: employee.ID,
                                    departmentName: deptName,
                                    trainingName: item.egitimName,
                                    trainingHours: item.sureSaat,
                                    startDate: item.baslangicTarihi,
                                    certExpiryDate: item.certInfo.expiryDateStr,
                                    status,
                                    statusLabel: item.certInfo.categoryLabel,
                                    fileData: item.certFileData,
                                    fileName: item.certFileName,
                                  });
                                }}
                                className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 hover:bg-amber-500/35 text-amber-300 border border-amber-500/50 shadow-sm transition-all cursor-pointer hover:scale-105"
                                title="Dijital Sertifika Belgesini Aç"
                              >
                                <FileText className="w-3.5 h-3.5 mr-1 text-amber-400" />
                                📄 Belgeyi Gör
                              </button>
                            )}

                            {onDeleteParticipation && (
                              <button
                                onClick={() => {
                                  onDeleteParticipation(
                                    item.katilimId,
                                    `${employee.AD} ${employee.SOYAD} - ${item.egitimName}`
                                  );
                                }}
                                className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-500/20 hover:bg-rose-500/35 text-rose-300 border border-rose-500/40 shadow-sm transition-all cursor-pointer hover:scale-105"
                                title="Bu Eğitim Kaydını Sil"
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-1 text-rose-400" />
                                Sil
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-sans">
                        Bu çalışana ait atanmış bir eğitim kaydı bulunmamaktadır.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Ribbon */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950 border-t border-slate-800 text-xs">
          <div className="flex items-center space-x-2 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Sarkuysan A.Ş. İnsan Kaynakları & Sertifikasyon Sistemi</span>
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
