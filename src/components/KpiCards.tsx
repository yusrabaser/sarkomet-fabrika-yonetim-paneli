import React from 'react';
import {
  Users,
  Building2,
  BookOpen,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  PieChart,
  Coins,
  ShieldAlert,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Award,
  UserCheck,
  ChevronRight,
} from 'lucide-react';
import { Calisan, Departman, Egitim, EgitimKatilim } from '../types';
import { calculateCertificateInfo } from '../utils/dateUtils';

interface KpiCardsProps {
  totalEmployees: number;
  totalDepartments: number;
  totalTrainings: number;
  completionRate: number;
  completedParticipations: number;
  totalParticipations: number;
  egitimler?: Egitim[];
  katilimlar?: EgitimKatilim[];
  calisanlar?: Calisan[];
  departmanlar?: Departman[];
  onSelectCertFilter?: (filter: string) => void;
  activeCertFilter?: string;
}

export const KpiCards: React.FC<KpiCardsProps> = ({
  totalEmployees,
  totalDepartments,
  totalTrainings,
  completionRate,
  completedParticipations,
  totalParticipations,
  egitimler = [],
  katilimlar = [],
  calisanlar = [],
  departmanlar = [],
  onSelectCertFilter,
  activeCertFilter,
}) => {
  // Financial KPI calculations
  const freeTrainingsCount = egitimler.filter((e) => e.UCRETSIZ).length;
  const paidTrainingsCount = egitimler.length - freeTrainingsCount;
  const paidRatio = totalTrainings > 0 ? Math.round((paidTrainingsCount / totalTrainings) * 100) : 0;
  const freeRatio = 100 - paidRatio;

  let totalTL = 0;
  let totalUSD = 0;
  let totalEUR = 0;

  egitimler.forEach((e) => {
    if (!e.UCRETSIZ) {
      const amount = e.TOPLAM_TUTAR || 0;
      const curr = e.PARA_BIRIMI || 'TL';
      if (curr === 'USD') totalUSD += amount;
      else if (curr === 'EUR') totalEUR += amount;
      else totalTL += amount;
    }
  });

  const avgCostTL = totalParticipations > 0 ? Math.round(totalTL / totalParticipations) : 0;

  // Certificate Risk Breakdown Counts
  let expiredCertCount = 0;
  let critical30Count = 0;
  let warning90Count = 0;
  let validCertCount = 0;

  const egitimMap = new Map<number, Egitim>();
  egitimler.forEach((e) => egitimMap.set(e.ID, e));

  katilimlar.forEach((k) => {
    const eg = egitimMap.get(k.EGITIM_ID);
    const endDate = eg?.BITIS_TARIHI || k.BASLANGIC_TARIHI || eg?.BASLANGIC_TARIHI || '';
    const isCompleted = k.TAMAMLANDI === 1;
    const customExpiry = k.SERTIFIKA_BITIS_TARIHI || eg?.SERTIFIKA_BITIS_TARIHI;

    const certInfo = calculateCertificateInfo(endDate, isCompleted, 2, customExpiry);
    if (certInfo.status === 'EXPIRED') expiredCertCount++;
    else if (certInfo.status === 'CRITICAL_30') critical30Count++;
    else if (certInfo.status === 'WARNING_90') warning90Count++;
    else if (certInfo.status === 'VALID') validCertCount++;
  });

  // Calculate Top Employee by Training Hours
  const calisanMap = new Map<number, Calisan>();
  calisanlar.forEach((c) => calisanMap.set(c.ID, c));

  const deptMap = new Map<number, string>();
  departmanlar.forEach((d) => deptMap.set(d.ID, d.AD));

  const empStats = new Map<number, { totalHours: number; maxTrainingName: string; maxTrainingHours: number }>();

  katilimlar.forEach((k) => {
    const eg = egitimMap.get(k.EGITIM_ID);
    const hours = k.SURE_SAAT ?? eg?.SURE_SAAT ?? 0;
    const trName = eg?.EGITIM_ADI || 'Eğitim';

    const current = empStats.get(k.CALISAN_ID) || { totalHours: 0, maxTrainingName: '', maxTrainingHours: 0 };
    current.totalHours += hours;
    if (hours > current.maxTrainingHours) {
      current.maxTrainingHours = hours;
      current.maxTrainingName = trName;
    }
    empStats.set(k.CALISAN_ID, current);
  });

  let topEmp: {
    empId: number;
    empName: string;
    deptName: string;
    topTrainingName: string;
    topTrainingHours: number;
    totalEmpHours: number;
  } | null = null;

  let maxSingleHours = -1;
  let maxTotalHours = -1;

  empStats.forEach((stats, empId) => {
    if (stats.maxTrainingHours > maxSingleHours || (stats.maxTrainingHours === maxSingleHours && stats.totalHours > maxTotalHours)) {
      maxSingleHours = stats.maxTrainingHours;
      maxTotalHours = stats.totalHours;
      const emp = calisanMap.get(empId);
      if (emp) {
        topEmp = {
          empId: emp.ID,
          empName: `${emp.AD} ${emp.SOYAD}`,
          deptName: deptMap.get(emp.DEPARTMAN_ID) || 'Üretim',
          topTrainingName: stats.maxTrainingName,
          topTrainingHours: stats.maxTrainingHours,
          totalEmpHours: stats.totalHours,
        };
      }
    }
  });

  return (
    <div className="space-y-5 mb-6">
      {/* SERTİFİKA BİTİŞ UYARI MODÜLÜ & RİSK DASHBOARDU SAYAÇ KARTLARI */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-bold text-white tracking-wide uppercase">
              Sertifika Geçerlilik Risk Dashboard'u
            </h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
              Anlık Dinamik Takip
            </span>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Tarih Esaslı Otomatik Gün Sayımı
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* 1. Süresi Dolan Sertifikalar (Kırmızı Rozet) */}
          <button
            type="button"
            onClick={() => onSelectCertFilter && onSelectCertFilter('EXPIRED')}
            className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer relative group overflow-hidden ${
              activeCertFilter === 'EXPIRED'
                ? 'bg-rose-950/80 border-rose-500 ring-2 ring-rose-500/50 shadow-lg shadow-rose-950/50'
                : 'bg-rose-950/30 border-rose-500/30 hover:border-rose-500/70 hover:bg-rose-950/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                🚨 Süresi Dolan Sertifikalar
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                🔴 Kalan Gün ≤ 0
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-rose-200 font-mono">
                {expiredCertCount} <span className="text-xs font-normal text-rose-400">Sertifika</span>
              </span>
              <span className="text-[11px] font-bold text-rose-400 underline group-hover:text-rose-200 transition-colors">
                Listele &rarr;
              </span>
            </div>
            <p className="text-[11px] text-rose-300/70 mt-1.5 font-sans">
              Geçerliliğini yitirmiş, acil yenilenmesi gereken kayıtlar.
            </p>
          </button>

          {/* 2. 30 Gün İçinde Dolacaklar (Turuncu Rozet) */}
          <button
            type="button"
            onClick={() => onSelectCertFilter && onSelectCertFilter('CRITICAL_30')}
            className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer relative group overflow-hidden ${
              activeCertFilter === 'CRITICAL_30'
                ? 'bg-orange-950/80 border-orange-500 ring-2 ring-orange-500/50 shadow-lg shadow-orange-950/50'
                : 'bg-orange-950/30 border-orange-500/30 hover:border-orange-500/70 hover:bg-orange-950/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-orange-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-orange-400" />
                ⚠️ 30 Gün İçinde Dolacaklar
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-orange-500/20 text-orange-300 border border-orange-500/40">
                🟠 1 - 30 Gün
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-orange-200 font-mono">
                {critical30Count} <span className="text-xs font-normal text-orange-400">Sertifika</span>
              </span>
              <span className="text-[11px] font-bold text-orange-400 underline group-hover:text-orange-200 transition-colors">
                Listele &rarr;
              </span>
            </div>
            <p className="text-[11px] text-orange-300/70 mt-1.5 font-sans">
              Kritik süre kısıtı olan, acil planlama yapılması gerekenler.
            </p>
          </button>

          {/* 3. 90 Gün İçinde Dolacaklar (Sarı Rozet) */}
          <button
            type="button"
            onClick={() => onSelectCertFilter && onSelectCertFilter('WARNING_90')}
            className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer relative group overflow-hidden ${
              activeCertFilter === 'WARNING_90'
                ? 'bg-amber-950/80 border-amber-500 ring-2 ring-amber-500/50 shadow-lg shadow-amber-950/50'
                : 'bg-amber-950/30 border-amber-500/30 hover:border-amber-500/70 hover:bg-amber-950/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" />
                🔔 90 Gün İçinde Dolacaklar
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                🟡 31 - 90 Gün
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-amber-200 font-mono">
                {warning90Count} <span className="text-xs font-normal text-amber-400">Sertifika</span>
              </span>
              <span className="text-[11px] font-bold text-amber-400 underline group-hover:text-amber-200 transition-colors">
                Listele &rarr;
              </span>
            </div>
            <p className="text-[11px] text-amber-300/70 mt-1.5 font-sans">
              Eğitim takvimine alınması önerilen yaklaşan sertifikalar.
            </p>
          </button>

          {/* 4. Geçerli Sertifikalar (Yeşil Rozet) */}
          <button
            type="button"
            onClick={() => onSelectCertFilter && onSelectCertFilter('VALID')}
            className={`text-left p-3.5 rounded-xl border transition-all cursor-pointer relative group overflow-hidden ${
              activeCertFilter === 'VALID'
                ? 'bg-emerald-950/80 border-emerald-500 ring-2 ring-emerald-500/50 shadow-lg shadow-emerald-950/50'
                : 'bg-emerald-950/30 border-emerald-500/30 hover:border-emerald-500/70 hover:bg-emerald-950/50'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Geçerli Sertifikalar
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                🟢 &gt; 90 Gün
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black text-emerald-200 font-mono">
                {validCertCount} <span className="text-xs font-normal text-emerald-400">Sertifika</span>
              </span>
              <span className="text-[11px] font-bold text-emerald-400 underline group-hover:text-emerald-200 transition-colors">
                Listele &rarr;
              </span>
            </div>
            <p className="text-[11px] text-emerald-300/70 mt-1.5 font-sans">
              Geçerliliği devam eden, tam mevzuata uygun aktif belgeler.
            </p>
          </button>
        </div>
      </div>

      {/* Primary Operational KPIs & En Uzun Süreli Eğitimi Alan Çalışan Kartı */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Toplam Çalışan */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-bl-full pointer-events-none group-hover:bg-amber-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Toplam Çalışan
            </span>
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white tracking-tight font-mono">
              {totalEmployees}
            </span>
            <span className="inline-flex items-center text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              <TrendingUp className="w-3 h-3 mr-1" />
              Aktif Personel
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Sarkuysan Bakır Fabrikası Kadrosu</p>
        </div>

        {/* 2. Toplam Departman */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-bl-full pointer-events-none group-hover:bg-orange-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Toplam Departman
            </span>
            <div className="w-9 h-9 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white tracking-tight font-mono">
              {totalDepartments}
            </span>
            <span className="text-xs text-slate-400 font-mono">101 - 106 ID Range</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Üretim, İSG, Kalite, Lab, vb.</p>
        </div>

        {/* 3. Toplam Eğitim */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-600/5 rounded-bl-full pointer-events-none group-hover:bg-amber-600/10 transition-colors" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Toplam Eğitim Modülü
            </span>
            <div className="w-9 h-9 rounded-lg bg-amber-600/10 border border-amber-600/20 flex items-center justify-center text-amber-300">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white tracking-tight font-mono">
              {totalTrainings}
            </span>
            <span className="text-xs font-semibold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              {totalParticipations} Katılım
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Müfredat Süresi: Dinamik Saatler</p>
        </div>

        {/* 4. Tamamlanan Eğitim Oranı (%) */}
        <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Tamamlanan Eğitim Oranı
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-3xl font-extrabold text-white tracking-tight font-mono">
              %{completionRate}
            </span>
            <span className="text-xs text-slate-400">
              <strong className="text-emerald-400 font-mono">{completedParticipations}</strong> / {totalParticipations}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-700/80 h-2 rounded-full overflow-hidden border border-slate-600/50">
            <div
              className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {/* 5. EN UZUN SÜRELİ EĞİTİMİ ALAN ÇALIŞAN KARTI */}
        <button
          type="button"
          onClick={() => topEmp && onSelectCertFilter && onSelectCertFilter(`EMP:${topEmp.empName}`)}
          className={`text-left p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden group flex flex-col justify-between ${
            topEmp && activeCertFilter === `EMP:${topEmp.empName}`
              ? 'bg-amber-950/90 border-amber-500 ring-2 ring-amber-500/50 shadow-xl shadow-amber-950/50'
              : 'bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border-amber-500/30 hover:border-amber-500/70 hover:bg-amber-950/50 shadow-lg'
          }`}
          title="Tıkla ve bu çalışanın tüm katılım kayıtlarını süz"
        >
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-bl-full pointer-events-none group-hover:bg-amber-500/20 transition-colors" />

          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              En Uzun Eğitimi Alan Çalışan
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
              🏆 En Yüksek Saat
            </span>
          </div>

          {topEmp ? (
            <div className="space-y-1 my-1">
              <div className="text-base font-black text-white group-hover:text-amber-300 transition-colors flex items-center justify-between">
                <span>{(topEmp as { empName: string }).empName}</span>
                <span className="text-[11px] font-bold text-amber-400 underline group-hover:translate-x-0.5 transition-transform flex items-center">
                  Süz <ChevronRight className="w-3 h-3 ml-0.5" />
                </span>
              </div>
              <div className="text-xs text-amber-200/90 font-medium flex items-center gap-1">
                <span className="text-slate-400">Departman:</span>
                <strong className="text-slate-200 font-semibold">{(topEmp as { deptName: string }).deptName}</strong>
              </div>
              <div className="text-xs text-amber-300 font-mono pt-1">
                {(topEmp as { topTrainingName: string }).topTrainingName} — <strong className="text-white font-extrabold font-mono text-sm">{(topEmp as { topTrainingHours: number }).topTrainingHours} Saat</strong>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">
                Toplam Kayıtlı Eğitim: {(topEmp as { totalEmpHours: number }).totalEmpHours} Saat
              </p>
            </div>
          ) : (
            <div className="py-2 text-xs text-slate-400">Kayıtlı veri bulunamadı.</div>
          )}

          <div className="text-[10px] text-amber-400/80 font-medium border-t border-amber-500/20 pt-1.5 mt-1 flex items-center justify-between">
            <span>Özel Kişiselleştirilmiş Saatler</span>
            <span className="font-bold underline">Listeyi Filtrele &rarr;</span>
          </div>
        </button>
      </div>

      {/* Financial Bütçe & Maliyet Dashboard KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Financial KPI 1: Toplam Eğitim Harcaması */}
        <div className="bg-slate-900/90 border border-amber-500/30 rounded-xl p-4 shadow-lg relative overflow-hidden group hover:border-amber-500/60 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-amber-400" />
              Toplam Eğitim Harcaması (Bütçe)
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
              Maliyet Özeti
            </span>
          </div>

          <div className="mt-1 space-y-1">
            <div className="text-2xl font-black text-white font-mono tracking-tight">
              {totalTL.toLocaleString('tr-TR')} ₺
            </div>
            {(totalUSD > 0 || totalEUR > 0) && (
              <div className="flex items-center space-x-2 text-xs font-mono text-amber-200">
                {totalUSD > 0 && <span>+ {totalUSD.toLocaleString('tr-TR')} $</span>}
                {totalEUR > 0 && <span>+ {totalEUR.toLocaleString('tr-TR')} €</span>}
              </div>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mt-2.5">
            Aktif eğitimlerin para birimi bazlı toplam yatırım bütçesi.
          </p>
        </div>

        {/* Financial KPI 2: Ortalama Kişi Başı Eğitim Maliyeti */}
        <div className="bg-slate-900/90 border border-emerald-500/30 rounded-xl p-4 shadow-lg relative overflow-hidden group hover:border-emerald-500/60 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              Ortalama Kişi Başı Eğitim Maliyeti
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
              Kişi Başı
            </span>
          </div>

          <div className="mt-1">
            <div className="text-2xl font-black text-white font-mono tracking-tight">
              {avgCostTL.toLocaleString('tr-TR')} ₺ <span className="text-xs font-normal text-slate-400">/ katılım</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-2.5">
            Toplam harcamanın ({totalParticipations} kayıtlı) çalışan katılımlarına bölümü.
          </p>
        </div>

        {/* Financial KPI 3: Ücretsiz vs Ücretli Eğitim Oranı */}
        <div className="bg-slate-900/90 border border-blue-500/30 rounded-xl p-4 shadow-lg relative overflow-hidden group hover:border-blue-500/60 transition-all">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <PieChart className="w-4 h-4 text-blue-400" />
              Ücretsiz / Ücretli Eğitim Dağılımı
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-300 border border-blue-500/30">
              Oran
            </span>
          </div>

          <div className="flex items-baseline justify-between mt-1 mb-1.5">
            <div className="text-xl font-extrabold text-white font-mono">
              %{paidRatio} <span className="text-xs text-amber-400 font-semibold">Ücretli</span>
            </div>
            <div className="text-xs font-mono text-emerald-400">
              %{freeRatio} Ücretsiz ({freeTrainingsCount} Eğitim)
            </div>
          </div>

          {/* Dual bar graph */}
          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden flex border border-slate-700/80">
            <div
              className="bg-amber-500 h-full transition-all duration-500"
              style={{ width: `${paidRatio}%` }}
              title={`Ücretli: %${paidRatio}`}
            />
            <div
              className="bg-emerald-400 h-full transition-all duration-500"
              style={{ width: `${freeRatio}%` }}
              title={`Ücretsiz: %${freeRatio}`}
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            İç eğitmen / kurum dışı bütçeli eğitimlerin dağılım yüzdesi.
          </p>
        </div>
      </div>
    </div>
  );
};
