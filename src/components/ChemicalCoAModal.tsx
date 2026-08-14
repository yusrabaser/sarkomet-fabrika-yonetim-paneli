import React, { useEffect } from 'react';
import { X, Printer, Download, CheckCircle2, AlertTriangle, ShieldCheck, Award, FileText, Building2, FlaskConical, LogOut } from 'lucide-react';

export interface ChemicalElementConfig {
  symbol: string;
  name: string;
  unit: '%' | 'ppm';
  min?: number;
  max: number;
  defaultVal: number;
  description: string;
}

export const CHEMICAL_ELEMENTS_CONFIG: Record<string, ChemicalElementConfig> = {
  Cu: { symbol: 'Cu', name: 'Bakır Saflığı (Copper Purity)', unit: '%', min: 99.90, max: 99.99, defaultVal: 99.95, description: 'Min %99.90 - Maks %99.99' },
  Ag: { symbol: 'Ag', name: 'Gümüş (Silver)', unit: 'ppm', max: 25, defaultVal: 12, description: 'Maks 25 ppm' },
  O:  { symbol: 'O',  name: 'Oksijen (Oxygen)', unit: 'ppm', min: 100, max: 450, defaultVal: 220, description: '100 - 450 ppm (Cu-ETP)' },
  P:  { symbol: 'P',  name: 'Fosfor (Phosphorus)', unit: 'ppm', max: 15, defaultVal: 4, description: 'Maks 15 ppm' },
  As: { symbol: 'As', name: 'Arsenik (Arsenic)', unit: 'ppm', max: 5, defaultVal: 1.2, description: 'Maks 5 ppm' },
  Sb: { symbol: 'Sb', name: 'Antimon (Antimony)', unit: 'ppm', max: 4, defaultVal: 1.1, description: 'Maks 4 ppm' },
  Bi: { symbol: 'Bi', name: 'Bizmuta (Bismuth)', unit: 'ppm', max: 2, defaultVal: 0.5, description: 'Maks 2 ppm' },
  Sn: { symbol: 'Sn', name: 'Kalay (Tin)', unit: 'ppm', max: 10, defaultVal: 1.5, description: 'Maks 10 ppm' },
  Se: { symbol: 'Se', name: 'Selenyum (Selenium)', unit: 'ppm', max: 3, defaultVal: 0.8, description: 'Maks 3 ppm' },
  Te: { symbol: 'Te', name: 'Tellür (Tellurium)', unit: 'ppm', max: 3, defaultVal: 0.6, description: 'Maks 3 ppm' },
  Cr: { symbol: 'Cr', name: 'Krom (Chromium)', unit: 'ppm', max: 5, defaultVal: 0.8, description: 'Maks 5 ppm' },
  Mn: { symbol: 'Mn', name: 'Mangan (Manganese)', unit: 'ppm', max: 5, defaultVal: 0.4, description: 'Maks 5 ppm' },
};

export const BUYER_COMPANIES = [
  'Siemens Energy A.Ş.',
  'Schneider Electric Turkey',
  'Prysmian Kablo A.Ş.',
  'Nexans Kablo Sanayi',
  'Eaton Elektrik A.Ş.',
  'Hes Kablo A.Ş.',
] as const;

export interface ChemicalCoARecord {
  id: number;
  buyerCompany: string;
  batchNo: string;
  productTypeLabel: string;
  testDate: string;
  testerName: string;
  elements: Record<string, number>;
  status: 'PASS' | 'FAIL';
  rejectionReason?: string;
}

interface ChemicalCoAModalProps {
  record: ChemicalCoARecord | null;
  onClose: () => void;
}

export const ChemicalCoAModal: React.FC<ChemicalCoAModalProps> = ({ record, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!record) return null;

  const isApproved = record.status === 'PASS';

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    let elementTableTxt = Object.entries(CHEMICAL_ELEMENTS_CONFIG)
      .map(([sym, cfg]) => {
        const val = record.elements[sym] ?? cfg.defaultVal;
        const pass = (cfg.min === undefined || val >= cfg.min) && val <= cfg.max;
        return `${sym.padEnd(4)} | ${cfg.name.padEnd(30)} | ${val} ${cfg.unit.padEnd(4)} | Limit: ${cfg.description.padEnd(22)} | ${pass ? 'PASS (UYGUN)' : 'FAIL (UYGUNSUZ)'}`;
      })
      .join('\n');

    const certText = `
================================================================================
          SARKOMET BAKIR SANAYİ VE TİCARET A.Ş.
        KALİTE KONTROL VE SPECTROMETER LABORATUVARI
      KİMYASAL ANALİZ SERTİFİKASI (Chemical Analysis CoA)
================================================================================

SERTİFİKA / RAOPR NO : CoA-CHEM-2026-${record.id}
ANALİZ TARİHİ       : ${record.testDate}
ALICI / MÜŞTERİ FİRMA: ${record.buyerCompany}
PARTİ / ŞARJ NO     : ${record.batchNo}
ÜRÜN TİPİ           : ${record.productTypeLabel}
TEST UZMANI         : ${record.testerName}

--------------------------------------------------------------------------------
12 ELEMENT OPTİK EMİSYON SPEKTROMETRE KİMYASAL ANALİZ SONUÇLARI
--------------------------------------------------------------------------------
${elementTableTxt}

--------------------------------------------------------------------------------
SARKOMET KİMYASAL KALİTE KARARI
--------------------------------------------------------------------------------
GENEL DURUM : ${isApproved ? '✅ UYGUN (PASS) - ISO 9001 / IATF 16949 KİMYASAL BİLEŞİM ONAYLI' : '🔴 UYGUNSUZ (FAIL) - KİMYASAL BİLEŞİM SEVKİYATA UYGUN DEĞİL'}
${!isApproved && record.rejectionReason ? `UYGUNSUZLUK AÇIKLAMASI: ${record.rejectionReason}` : ''}

SARKOMET BAKIR SANAYİ VE TİCARET A.Ş. LABORATUVAR DİREKTÖRLÜĞÜ
Onaylayan: ${record.testerName} (Sarkomet Başmühendis / Kalite Uzmanı)
================================================================================
    `.trim();

    const blob = new Blob([certText], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CoA_Kimyasal_Analiz_${record.batchNo}_${record.buyerCompany.replace(/\s+/g, '_')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static"
    >
      {/* Floating Close Button in Corner */}
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
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl relative my-6 print:border-none print:shadow-none print:w-full print:max-w-none print:bg-white print:text-black"
      >
        {/* Top Action Header */}
        <div className="p-3 sm:p-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Resmi Ürün Kimyasal Analiz Sertifikası (CoA)</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Sarkomet A.Ş. Spektrometre Laboratuvarı 12 Element Kimyasal Analiz Raporu
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>İndir</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>A4 Yazdır / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-600/90 hover:bg-rose-600 text-white border border-rose-500/50 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Kapat</span>
            </button>
          </div>
        </div>

        {/* Printable Certificate Content Body */}
        <div className="p-6 sm:p-8 space-y-6 text-slate-100 print:text-black print:p-6 print:space-y-4">
          {/* Header Seals */}
          <div className="flex flex-col sm:flex-row items-center justify-between pb-6 border-b border-slate-800 print:border-black gap-4 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-600 via-orange-600 to-amber-800 text-white flex items-center justify-center font-black text-2xl shadow-lg border border-amber-400/30 print:border-black shrink-0">
                SK
              </div>
              <div>
                <h1 className="text-lg font-black text-white print:text-black tracking-tight uppercase">
                  SARKOMET BAKIR SANAYİ VE TİCARET A.Ş.
                </h1>
                <p className="text-xs text-amber-400 print:text-gray-800 font-bold">
                  KİMYASAL ANALİZ VE SPEKTROMETRE LABORATUVARI
                </p>
                <p className="text-[10px] text-slate-400 print:text-gray-600 font-mono mt-0.5">
                  Gebze Tesisleri / ISO 9001:2015 & IATF 16949:2016 Onaylı Kalite Laboratuvarı
                </p>
              </div>
            </div>

            <div className="text-right sm:text-right font-mono text-xs bg-slate-950 print:bg-gray-100 p-3 rounded-xl border border-slate-800 print:border-gray-300 shrink-0">
              <div className="text-slate-400 print:text-gray-600 text-[10px] uppercase font-bold">Sertifika / CoA No</div>
              <div className="text-purple-400 print:text-black font-extrabold text-sm">CoA-CHEM-2026-{record.id}</div>
              <div className="text-slate-400 print:text-gray-600 text-[10px] mt-1">Tarih: {record.testDate}</div>
            </div>
          </div>

          {/* Product & Customer Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 print:bg-gray-50 p-4 rounded-xl border border-slate-800 print:border-gray-300 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 print:text-gray-500 uppercase block">Alıcı / Müşteri Firma</span>
              <span className="font-bold text-cyan-300 print:text-black flex items-center gap-1 text-sm">
                <Building2 className="w-3.5 h-3.5 text-cyan-400 print:hidden" />
                {record.buyerCompany}
              </span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 print:text-gray-500 uppercase block">Parti / Şarj No</span>
              <span className="font-mono font-extrabold text-amber-300 print:text-black text-sm">{record.batchNo}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 print:text-gray-500 uppercase block">Ürün Tip & Özelliği</span>
              <span className="font-bold text-white print:text-black">{record.productTypeLabel}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 print:text-gray-500 uppercase block">Kalite Kararı</span>
              <span className={`font-mono font-black text-xs ${isApproved ? 'text-emerald-400 print:text-emerald-700' : 'text-rose-400 print:text-rose-700'}`}>
                {isApproved ? '✅ PASS (UYGUN)' : '🔴 FAIL (UYGUNSUZ)'}
              </span>
            </div>
          </div>

          {/* 12 Elements Spectrometer Measurement Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 print:text-black flex items-center gap-1.5">
              <FlaskConical className="w-4 h-4 text-purple-400 print:text-black" />
              Elektrolitik Bakır (Cu-ETP) 12 Element Spektrometre Ölçüm Sonuçları
            </h3>

            <div className="border border-slate-800 print:border-gray-400 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 print:bg-gray-200 text-slate-400 print:text-gray-700 font-bold uppercase text-[10px] border-b border-slate-800 print:border-gray-400">
                    <th className="py-2 px-3">Simge</th>
                    <th className="py-2 px-3">Element / Bilesen Adı</th>
                    <th className="py-2 px-3 font-mono">Ölçülen Değer</th>
                    <th className="py-2 px-3">Sarkomet Standart Limit</th>
                    <th className="py-2 px-3 text-center">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 print:divide-gray-300 font-mono text-xs">
                  {Object.entries(CHEMICAL_ELEMENTS_CONFIG).map(([symbol, cfg]) => {
                    const value = record.elements[symbol] ?? cfg.defaultVal;
                    const isMinOk = cfg.min === undefined || value >= cfg.min;
                    const isMaxOk = value <= cfg.max;
                    const isElementPass = isMinOk && isMaxOk;

                    return (
                      <tr key={symbol} className="hover:bg-slate-950/40 print:hover:bg-transparent">
                        <td className="py-2 px-3 font-bold text-amber-400 print:text-black font-mono">
                          {symbol}
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-200 print:text-black font-sans">
                          {cfg.name}
                        </td>
                        <td className={`py-2 px-3 font-black ${isElementPass ? 'text-white print:text-black' : 'text-rose-400 print:text-rose-700'}`}>
                          {value} {cfg.unit}
                        </td>
                        <td className="py-2 px-3 text-slate-400 print:text-gray-600 font-sans text-[11px]">
                          {cfg.description}
                        </td>
                        <td className="py-2 px-3 text-center">
                          {isElementPass ? (
                            <span className="text-emerald-400 print:text-emerald-700 font-bold text-[11px]">
                              ✔ PASS
                            </span>
                          ) : (
                            <span className="text-rose-400 print:text-rose-700 font-extrabold text-[11px] bg-rose-500/10 px-1.5 py-0.5 rounded">
                              ✖ FAIL
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Decision Summary Banner */}
          <div className={`p-4 rounded-xl border font-sans text-xs flex items-start gap-3 ${
            isApproved
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200 print:bg-emerald-50 print:border-emerald-500 print:text-emerald-900'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-200 print:bg-rose-50 print:border-rose-500 print:text-rose-900'
          }`}>
            {isApproved ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 print:text-emerald-700 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 print:text-rose-700 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-extrabold text-sm mb-1 uppercase">
                {isApproved
                  ? 'ISO 9001 / IATF 16949 KİMYASAL SERTİFİKA ONAYLANDI (PASS)'
                  : 'UYGUNSUZ KİMYASAL BİLEŞİM! MÜŞTERİ SEVKİYAT ENGELİ (FAIL)'}
              </div>
              <p className="leading-relaxed opacity-90">
                {isApproved
                  ? `Sarkomet Spektrometre Laboratuvarında gerçekleştirilen optik emisyon analizinde, elektrolitik bakır ürünün 12 kimyasal elementi belirlenen tolerans aralıklarındadır. "${record.buyerCompany}" firmasına sevkiyatı onaylanmıştır.`
                  : `Kimyasal analiz sonuçlarında sınır değerleri aşan elementler tespit edilmiştir. Ürün karantinası başlatılmış ve ${record.buyerCompany} firmasına sevkiyat durdurulmuştur.`}
              </p>
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-6 grid grid-cols-2 gap-8 text-center text-xs print:pt-6">
            <div className="border-t border-slate-800 print:border-black pt-2">
              <span className="font-bold text-white print:text-black block">{record.testerName}</span>
              <span className="text-[10px] text-slate-400 print:text-gray-600 block">Sarkomet Spektrometre Analiz Uzmanı</span>
              <span className="text-[10px] font-mono text-slate-500 block mt-1">İmza & Mühür</span>
            </div>

            <div className="border-t border-slate-800 print:border-black pt-2">
              <span className="font-bold text-white print:text-black block">Salih Temiz</span>
              <span className="text-[10px] text-slate-400 print:text-gray-600 block">Sarkomet Kalite Kontrol & Laboratuvar Müdürü</span>
              <span className="text-[10px] font-mono text-slate-500 block mt-1">İmza & Mühür</span>
            </div>
          </div>
        </div>

        {/* Modal Bottom Close */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-4 print:hidden">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Sarkomet A.Ş. Resmi Kimyasal Analiz Raporu (Chemical CoA)</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl font-extrabold text-xs bg-rose-600 hover:bg-rose-500 text-white shadow-lg flex items-center gap-2 cursor-pointer transition-all hover:scale-105 shrink-0"
          >
            <LogOut className="w-4 h-4" />
            <span>KAPAT (Pencereden Çık)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
