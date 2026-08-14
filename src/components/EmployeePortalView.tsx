import React from 'react';
import { AuthUser, Departman, Calisan, Egitim, EgitimKatilim } from '../types';
import { calculateTrainingStatus, formatDateRange, generateCertificateCode } from '../utils/dateUtils';
import { CertificateData } from './CertificateModal';
import {
  User,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  Award,
  BookOpen,
  FileText,
  ShieldCheck,
  Flame,
  Download,
  Sparkles,
  Eye,
} from 'lucide-react';

interface EmployeePortalViewProps {
  user: AuthUser;
  departmanlar: Departman[];
  calisanlar: Calisan[];
  egitimler: Egitim[];
  katilimlar: EgitimKatilim[];
  onToggleStatus: (participationId: number) => void;
  onOpenProfile?: (employeeId: number) => void;
  onOpenCertificate?: (certData: CertificateData) => void;
}

export const EmployeePortalView: React.FC<EmployeePortalViewProps> = ({
  user,
  departmanlar,
  calisanlar,
  egitimler,
  katilimlar,
  onToggleStatus,
  onOpenProfile,
  onOpenCertificate,
}) => {
  // Find employee data
  const employeeId = user.employeeId || 1;
  const currentEmp = calisanlar.find((c) => c.ID === employeeId) || calisanlar[0];
  const currentDept = departmanlar.find((d) => d.ID === currentEmp?.DEPARTMAN_ID);

  // Get employee's personal participations
  const personalParticipations = katilimlar.filter((k) => k.CALISAN_ID === employeeId);

  // Stats
  const totalEnrolled = personalParticipations.length;
  const completedList = personalParticipations.filter((k) => k.TAMAMLANDI === 1);
  const completedCount = completedList.length;
  const completionRate = totalEnrolled > 0 ? Math.round((completedCount / totalEnrolled) * 100) : 0;

  // Calculate total completed training hours
  const egitimMap = new Map<number, Egitim>(egitimler.map((e) => [e.ID, e]));
  const completedHours = completedList.reduce((acc, k) => {
    const e = egitimMap.get(k.EGITIM_ID);
    return acc + (e ? e.SURE_SAAT : 0);
  }, 0);

  const handleDownloadCertificate = (trainingName: string) => {
    alert(`"${trainingName}" Başarı Sertifikanız indiriliyor... (Sarkomet A.Ş. İSG & Kalite Onaylı)`);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-amber-900/40 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start space-x-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-600 to-amber-700 flex items-center justify-center text-2xl font-black text-white shadow-lg border border-amber-400/40 flex-shrink-0">
              {currentEmp ? `${currentEmp.AD.charAt(0)}${currentEmp.SOYAD.charAt(0)}` : <User className="w-8 h-8 text-amber-100" />}
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Hoş Geldin, <span className="text-amber-400">{user.fullName}</span>
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 hidden sm:inline-block">
                  Sicil No: #{currentEmp?.ID || user.employeeId}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-300 mt-1 flex items-center gap-2">
                <span className="font-semibold text-amber-400">{user.title || 'Sarkomet Bakır Fabrikası Personeli'}</span>
                <span className="text-slate-600">•</span>
                <span className="flex items-center text-slate-300">
                  <Building2 className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  {currentDept?.AD || user.departmentName || 'Üretim & Operasyon'}
                </span>
              </p>

              <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-400 font-mono">
                <span className="flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1 text-amber-400" />
                  İşe Giriş: {currentEmp?.ISE_GIRIS_TARIHI || '2020-01-01'}
                </span>
                <span className="flex items-center text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                  İSG Sertifikalı Personel
                </span>
                {onOpenProfile && currentEmp && (
                  <button
                    onClick={() => onOpenProfile(currentEmp.ID)}
                    className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 shadow-sm transition-all cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1 text-amber-400" />
                    Detaylı Profil & Sertifika Kartımı Aç
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats Pill */}
          <div className="bg-slate-950/80 border border-slate-700/80 rounded-xl p-4 flex items-center justify-around gap-4 md:min-w-[320px]">
            <div className="text-center">
              <span className="block text-2xl font-black text-white font-mono">{completedCount}/{totalEnrolled}</span>
              <span className="text-[11px] text-slate-400 font-medium">Tamamlanan</span>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div className="text-center">
              <span className="block text-2xl font-black text-amber-400 font-mono">{completedHours} Saat</span>
              <span className="text-[11px] text-slate-400 font-medium">Eğitim Süresi</span>
            </div>
            <div className="h-8 w-px bg-slate-800" />
            <div className="text-center">
              <span className="block text-2xl font-black text-emerald-400 font-mono">%{completionRate}</span>
              <span className="text-[11px] text-slate-400 font-medium">Başarı Oranı</span>
            </div>
          </div>
        </div>
      </div>

      {/* Factory Safety Banner */}
      <div className="bg-amber-950/40 border border-amber-800/50 rounded-xl p-4 text-xs text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 flex-shrink-0">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-amber-300 text-sm">Yüksek Sıcaklık & Bakır Döküm İSG Hatırlatması</h4>
            <p className="text-amber-200/80 mt-0.5">
              Fabrika sahasına girmeden önce yüksek sıcaklığa dayanıklı Isı Dayanımlı Koruyucu Kıyafetlerinizi eksiksiz giyiniz.
            </p>
          </div>
        </div>
      </div>

      {/* Personal Training List Section */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-700/80 mb-4">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white tracking-wide">
              Atanan ve Tamamlanan Eğitim Modüllerim
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Kayıtlı: {personalParticipations.length} Modül
          </span>
        </div>

        {/* Participations Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-700/80 bg-slate-900/80">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <th className="py-3 px-4">Kayıt No</th>
                <th className="py-3 px-4">Eğitim Modülü Adı</th>
                <th className="py-3 px-4">Başlangıç (Tarih - Saat)</th>
                <th className="py-3 px-4">Bitiş (Tarih - Saat)</th>
                <th className="py-3 px-4">Süre</th>
                <th className="py-3 px-4">Durum (Badge)</th>
                <th className="py-3 px-4 text-right">Eylem / Sertifika</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs sm:text-sm text-slate-200">
              {personalParticipations.length > 0 ? (
                personalParticipations.map((part) => {
                  const egitim = egitimMap.get(part.EGITIM_ID);
                  const isCompleted = part.TAMAMLANDI === 1;

                  const baslangicTarihi = part.BASLANGIC_TARIHI || egitim?.BASLANGIC_TARIHI || '';
                  const baslangicSaati = part.BASLANGIC_SAATI || egitim?.BASLANGIC_SAATI || '09:00';
                  const bitisTarihi = egitim?.BITIS_TARIHI || '';
                  const bitisSaati = egitim?.BITIS_SAATI || '17:00';

                  const manualStatus = part.MANUAL_STATUS || egitim?.MANUAL_STATUS;
                  const statusInfo = egitim
                    ? calculateTrainingStatus(
                        baslangicTarihi,
                        bitisTarihi,
                        part.TAMAMLANDI,
                        manualStatus,
                        baslangicSaati,
                        bitisSaati
                      )
                    : { code: isCompleted ? 'TAMAMLANDI' : 'TAMAMLANMADI', label: isCompleted ? 'Tamamlandı' : 'Tamamlanmadı', badgeClass: '' };

                  return (
                    <tr key={part.ID} className="hover:bg-slate-800/50 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-semibold text-amber-400">
                        #{part.ID}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-white">
                        {egitim ? egitim.EGITIM_ADI : 'Bilinmeyen Eğitim'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        <span className="inline-flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-md border border-slate-700/60 text-xs">
                          <Calendar className="w-3.5 h-3.5 text-amber-400" />
                          {baslangicTarihi ? `${baslangicTarihi} - ${baslangicSaati}` : '-'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        <span className="inline-flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1 rounded-md border border-slate-700/60 text-xs">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {bitisTarihi ? `${bitisTarihi} - ${bitisSaati}` : '-'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {egitim ? `${egitim.SURE_SAAT} Saat` : '-'}
                      </td>
                      <td className="py-3.5 px-4">
                        {statusInfo.code === 'DEVAM_EDIYOR' && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                            <Clock className="w-3.5 h-3.5 mr-1 text-blue-400" />
                            Devam Ediyor
                          </span>
                        )}
                        {statusInfo.code === 'TAMAMLANDI' && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                            Tamamlandı
                          </span>
                        )}
                        {statusInfo.code === 'TAMAMLANMADI' && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                            <XCircle className="w-3.5 h-3.5 mr-1 text-rose-400" />
                            Tamamlanmadı
                          </span>
                        )}
                        {(statusInfo.code === 'PLANLANDI' || statusInfo.code === 'BASLAMADI') && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            <Clock className="w-3.5 h-3.5 mr-1 text-amber-400" />
                            {statusInfo.label}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end space-x-2">
                          {onOpenCertificate && (
                            <button
                              onClick={() => {
                                const certCode = generateCertificateCode(
                                  part.ID,
                                  egitim?.EGITIM_ADI,
                                  currentEmp?.ID
                                );
                                onOpenCertificate({
                                  certCode,
                                  employeeName: `${currentEmp.AD} ${currentEmp.SOYAD}`,
                                  employeeId: currentEmp.ID,
                                  departmentName: currentDept ? currentDept.AD : 'Sarkomet',
                                  trainingName: egitim ? egitim.EGITIM_ADI : 'Eğitim Modülü',
                                  trainingHours: egitim ? egitim.SURE_SAAT : 8,
                                  startDate: egitim?.BASLANGIC_TARIHI,
                                  certExpiryDate: (egitim as any)?.SERTIFIKA_GECERLILIK_TARIHI || egitim?.SERTIFIKA_BITIS_TARIHI,
                                  status: isCompleted ? 'VALID' : 'NOT_COMPLETED',
                                  statusLabel: isCompleted ? 'Geçerli Belge' : 'Tamamlanmadı',
                                });
                              }}
                              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 hover:bg-amber-500/35 text-amber-300 border border-amber-500/50 shadow-sm transition-all cursor-pointer hover:scale-105"
                              title="Resmi Sertifika Belgesini Görüntüle"
                            >
                              <FileText className="w-3.5 h-3.5 mr-1 text-amber-400" />
                              📄 Belgeyi Gör
                            </button>
                          )}

                          {!isCompleted && (
                            <button
                              onClick={() => onToggleStatus(part.ID)}
                              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white transition-colors cursor-pointer shadow"
                            >
                              <Sparkles className="w-3.5 h-3.5 mr-1" />
                              Tamamlandı İşaretle
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Henüz kayıtlı bir eğitim katılımınız bulunmamaktadır.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
