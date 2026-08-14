import React, { useMemo } from 'react';
import { Departman, Calisan, Egitim, EgitimKatilim } from '../types';
import { Building2, Users, Coins, Wallet } from 'lucide-react';

interface DepartmentOverviewProps {
  departmanlar: Departman[];
  calisanlar: Calisan[];
  egitimler?: Egitim[];
  katilimlar: EgitimKatilim[];
  onSelectDepartmentFilter: (deptName: string) => void;
}

export const DepartmentOverview: React.FC<DepartmentOverviewProps> = ({
  departmanlar,
  calisanlar,
  egitimler = [],
  katilimlar,
  onSelectDepartmentFilter,
}) => {
  const egitimMap = useMemo(() => {
    const map = new Map<number, Egitim>();
    egitimler.forEach((e) => map.set(e.ID, e));
    return map;
  }, [egitimler]);

  // Overall total budget spent across all departments for percentage scaling
  const overallSpentTL = useMemo(() => {
    let sum = 0;
    katilimlar.forEach((k) => {
      const eg = egitimMap.get(k.EGITIM_ID);
      if (eg && !eg.UCRETSIZ && (!eg.PARA_BIRIMI || eg.PARA_BIRIMI === 'TL')) {
        const trCount = katilimlar.filter((x) => x.EGITIM_ID === k.EGITIM_ID).length;
        const kisiBasi = k.KISI_BASI_TUTAR ?? eg.KISI_BASI_TUTAR ?? (trCount > 0 ? (eg.TOPLAM_TUTAR || 0) / trCount : (eg.TOPLAM_TUTAR || 0));
        sum += kisiBasi || 0;
      }
    });
    return sum;
  }, [katilimlar, egitimMap]);

  return (
    <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 sm:p-5 shadow-xl mb-8">
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-700/80 mb-4 gap-2">
        <div className="flex items-center space-x-2">
          <Building2 className="w-5 h-5 text-amber-400" />
          <h2 className="text-base font-bold text-white tracking-wide">
            Departman Bazlı Bütçe Dağılımı ve Eğitim İstatistikleri
          </h2>
        </div>
        <span className="text-xs text-amber-300 font-mono bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20 flex items-center gap-1.5">
          <Coins className="w-3.5 h-3.5 text-amber-400" />
          Bütçe Analitiği
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {departmanlar.map((dept) => {
          const deptEmployees = calisanlar.filter((c) => c.DEPARTMAN_ID === dept.ID);
          const deptEmpIds = deptEmployees.map((c) => c.ID);
          const deptKatilimlar = katilimlar.filter((k) => deptEmpIds.includes(k.CALISAN_ID));
          const completedCount = deptKatilimlar.filter((k) => k.TAMAMLANDI === 1).length;
          const totalCount = deptKatilimlar.length;
          const rate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

          // Department budget calculation
          let deptSpentTL = 0;
          let deptSpentUSD = 0;
          let deptSpentEUR = 0;

          deptKatilimlar.forEach((k) => {
            const eg = egitimMap.get(k.EGITIM_ID);
            if (eg && !eg.UCRETSIZ) {
              const trCount = katilimlar.filter((x) => x.EGITIM_ID === k.EGITIM_ID).length;
              const kisiBasi = k.KISI_BASI_TUTAR ?? eg.KISI_BASI_TUTAR ?? (trCount > 0 ? (eg.TOPLAM_TUTAR || 0) / trCount : (eg.TOPLAM_TUTAR || 0));
              const curr = eg.PARA_BIRIMI || 'TL';
              if (curr === 'USD') deptSpentUSD += kisiBasi || 0;
              else if (curr === 'EUR') deptSpentEUR += kisiBasi || 0;
              else deptSpentTL += kisiBasi || 0;
            }
          });

          const budgetSharePercent = overallSpentTL > 0 ? Math.min(100, Math.round((deptSpentTL / overallSpentTL) * 100)) : 0;

          return (
            <div
              key={dept.ID}
              onClick={() => onSelectDepartmentFilter(dept.AD)}
              className="bg-slate-900/70 border border-slate-700/70 hover:border-amber-500/50 rounded-lg p-3.5 transition-all cursor-pointer group shadow-sm hover:shadow-md space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    #{dept.ID}
                  </span>
                  <h3 className="text-sm font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                    {dept.AD}
                  </h3>
                </div>
                <span className="text-xs text-slate-400 flex items-center font-mono">
                  <Users className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  {deptEmployees.length} Personel
                </span>
              </div>

              {/* Budget Spent Badge */}
              <div className="p-2 rounded bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1 font-medium">
                  <Wallet className="w-3.5 h-3.5 text-amber-400" />
                  Harcanan Bütçe:
                </span>
                <span className="font-bold text-amber-300 font-mono">
                  {deptSpentTL === 0 && deptSpentUSD === 0 && deptSpentEUR === 0
                    ? '0 ₺ (Ücretsiz)'
                    : `${deptSpentTL.toLocaleString('tr-TR')} ₺${deptSpentUSD > 0 ? ` + ${deptSpentUSD} $` : ''}`}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Eğitim Tamamlanma:</span>
                <span className="font-mono text-slate-200">
                  <strong className="text-emerald-400">{completedCount}</strong> / {totalCount} Modül (%{rate})
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${rate}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
