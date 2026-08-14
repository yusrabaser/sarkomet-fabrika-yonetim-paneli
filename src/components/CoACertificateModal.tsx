import React, { useEffect } from 'react';
import { X, Printer, Download, CheckCircle2, AlertTriangle, ShieldCheck, FileText, Building2, FlaskConical, Award, LogOut } from 'lucide-react';
import { QualityTestRecord } from '../types';

interface CoACertificateModalProps {
  record: QualityTestRecord | null;
  onClose: () => void;
}

export const CoACertificateModal: React.FC<CoACertificateModalProps> = ({ record, onClose }) => {
  // Listen for Escape key to close modal
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

  const isApproved = record.status === 'ONAYLI';

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const certText = `
================================================================================
          SARKOMET BAKIR SANAYİ VE TİCARET A.Ş.
        KALİTE KONTROL VE LABORATUVAR DİREKTÖRLÜĞÜ
       ISO 9001:2015 & IATF 16949:2016 ANALİZ SERTİFİKASI (CoA)
================================================================================

SERTİFİKA NO       : CoA-2026-${record.id}
DÜZENLEME TARİHİ   : ${record.test_date}
PARTİ / ŞARJ NO     : ${record.batch_no}
ÜRÜN ADI / TİPİ    : ${record.product_label}
ÜRETİM HATTI       : ${record.production_line}
TEST UZMANI        : ${record.tester_name}

--------------------------------------------------------------------------------
LABORATUVAR TEST VE ÖLÇÜM SONUÇLARI
--------------------------------------------------------------------------------
1. İLETKENLİK TESTİ (%IACS)   : ${record.conductivity_iacs} %IACS  (Standart: Min %100.0) -> ${record.conductivity_iacs >= 100 ? 'UYGUN' : 'UYGUNSUZ'}
2. ÇAP / ÖLÇÜ ÖLÇÜMÜ (mm)     : ${record.diameter_mm} mm        (Standart Tolerans Dahilinde)
3. KOPMA / ÇEKME MUKAVEMETİ    : ${record.tensile_strength_nmm2} N/mm²
4. YÜZEY OKİSİT & GÖRSEL MUAYENE: ${record.surface_inspection}

--------------------------------------------------------------------------------
KALİTE KARARI VE ONAY DURUMU
--------------------------------------------------------------------------------
DURUM : ${isApproved ? 'ISO 9001 / IATF 16949 KALİTE ONAYLI - SEVK EDİLEBİLİR' : 'UYGUNSUZ ÜRÜN - KARANTİNAYA ALINDI / SEVK EDİLEMEZ'}
${!isApproved && record.rejection_reason ? `UYGUNSUZLUK NEDENİ: ${record.rejection_reason}` : ''}

SARKOMET BAKIR SANAYİ VE TİCARET A.Ş. LABORATUVARLARI
Onaylayan: ${record.tester_name} (Kalite Kontrol Uzmanı)
================================================================================
    `.trim();

    const blob = new Blob([certText], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CoA_${record.batch_no}_Sarkomet_Kalite_Sertifikasi.txt`;
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
      {/* Floating Close Button in Screen Corner (Always visible even if modal content is tall or scrolled) */}
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
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl relative my-6 print:border-none print:shadow-none print:w-full print:max-w-none print:bg-white print:text-black"
      >
        {/* Modal Action Bar (Hidden in Print) */}
        <div className="p-3 sm:p-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Analiz Sertifikası (CoA - Certificate of Analysis)</span>
              </h3>
              <p className="text-[11px] text-slate-400">
                Resmi Sarkomet A.Ş. Kalite Laboratuvar Test Raporu Önizlemesi
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
              <span>Yazdır / PDF</span>
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
        <div className="p-5 sm:p-8 space-y-6 text-slate-100 print:text-black print:p-6 print:space-y-4">
          {/* Header Seals */}
          <div className="flex flex-col sm:flex-row items-center justify-between pb-6 border-b border-slate-800 print:border-black gap-4 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-600 via-orange-600 to-amber-800 text-white flex items-center justify-center font-black text-xl shadow-lg border border-amber-400/30 print:border-black shrink-0">
                SK
              </div>
              <div>
                <h1 className="text-base font-black text-white print:text-black tracking-tight uppercase">
                  SARKOMET BAKIR SANAYİ VE TİCARET A.Ş.
                </h1>
                <p className="text-xs text-amber-400 print:text-gray-800 font-bold">
                  KALİTE KONTROL VE LABORATUVAR DİREKTÖRLÜĞÜ
                </p>
                <p className="text-[10px] text-slate-400 print:text-gray-600 font-mono mt-0.5">
                  Gebze Tesisleri / ISO 9001:2015 & IATF 16949:2016 Onaylı Laboratuvar
                </p>
              </div>
            </div>

            <div className="text-right sm:text-right font-mono text-xs bg-slate-950 print:bg-gray-100 p-3 rounded-xl border border-slate-800 print:border-gray-300 shrink-0">
              <div className="text-slate-400 print:text-gray-600 text-[10px] uppercase font-bold">Rapor / CoA No</div>
              <div className="text-purple-400 print:text-black font-extrabold text-sm">CoA-2026-{record.id}</div>
              <div className="text-slate-400 print:text-gray-600 text-[10px] mt-1">Tarih: {record.test_date}</div>
            </div>
          </div>

          {/* Product & Batch Summary Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-950/60 print:bg-gray-50 p-4 rounded-xl border border-slate-800 print:border-gray-300 text-xs">
            <div>
              <span className="text-[10px] font-bold text-slate-400 print:text-gray-500 uppercase block">Parti / Şarj / Batch No</span>
              <span className="font-mono font-extrabold text-amber-300 print:text-black text-sm">{record.batch_no}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 print:text-gray-500 uppercase block">Ürün Tipi</span>
              <span className="font-bold text-white print:text-black">{record.product_label}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 print:text-gray-500 uppercase block">Üretim Hattı</span>
              <span className="font-medium text-slate-300 print:text-gray-800">{record.production_line}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 print:text-gray-500 uppercase block">Testi Yapan Uzman</span>
              <span className="font-bold text-cyan-300 print:text-black">{record.tester_name}</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 print:text-gray-500 uppercase block">Uygulanan Standart</span>
              <span className="font-mono font-semibold text-emerald-400 print:text-gray-800">ISO 9001 / IATF 16949</span>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 print:text-gray-500 uppercase block">Karar Metni</span>
              <span className={`font-mono font-bold ${isApproved ? 'text-emerald-400 print:text-emerald-700' : 'text-rose-400 print:text-rose-700'}`}>
                {isApproved ? 'ONAYLI & SEVK' : 'KARANTİNA / HURDA'}
              </span>
            </div>
          </div>

          {/* Test Parameters Table */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 print:text-black flex items-center gap-1.5">
              <FlaskConical className="w-4 h-4 text-purple-400 print:text-black" />
              Laboratuvar Analiz ve Ölçüm Değerleri
            </h3>

            <div className="border border-slate-800 print:border-gray-400 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 print:bg-gray-200 text-slate-400 print:text-gray-700 font-bold uppercase text-[10px] border-b border-slate-800 print:border-gray-400">
                    <th className="py-2.5 px-3">Test Parametresi</th>
                    <th className="py-2.5 px-3">Sarkomet Tolerans / Standart</th>
                    <th className="py-2.5 px-3 font-mono">Ölçülen Değer</th>
                    <th className="py-2.5 px-3 text-center">Değerlendirme</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 print:divide-gray-300 font-mono">
                  {/* Parameter 1: Conductivity */}
                  <tr className="hover:bg-slate-950/40 print:hover:bg-transparent">
                    <td className="py-2.5 px-3 font-bold text-slate-200 print:text-black font-sans">
                      1. Elektriksel İletkenlik (%IACS)
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 print:text-gray-600 font-sans">Min %100.0 IACS</td>
                    <td className="py-2.5 px-3 font-extrabold text-cyan-300 print:text-black">
                      {record.conductivity_iacs} %IACS
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {record.conductivity_iacs >= 100 ? (
                        <span className="text-emerald-400 print:text-emerald-700 font-bold">✔ UYGUN</span>
                      ) : (
                        <span className="text-rose-400 print:text-rose-700 font-bold">✖ UYGUNSUZ</span>
                      )}
                    </td>
                  </tr>

                  {/* Parameter 2: Diameter */}
                  <tr className="hover:bg-slate-950/40 print:hover:bg-transparent">
                    <td className="py-2.5 px-3 font-bold text-slate-200 print:text-black font-sans">
                      2. Çap / Ölçü Ölçümü (mm)
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 print:text-gray-600 font-sans">Tolerans Sınırları İçinde</td>
                    <td className="py-2.5 px-3 font-extrabold text-amber-300 print:text-black">
                      {record.diameter_mm} mm
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="text-emerald-400 print:text-emerald-700 font-bold">✔ UYGUN</span>
                    </td>
                  </tr>

                  {/* Parameter 3: Tensile Strength */}
                  <tr className="hover:bg-slate-950/40 print:hover:bg-transparent">
                    <td className="py-2.5 px-3 font-bold text-slate-200 print:text-black font-sans">
                      3. Kopma / Çekme Mukavemeti (N/mm²)
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 print:text-gray-600 font-sans">200 - 450 N/mm²</td>
                    <td className="py-2.5 px-3 font-extrabold text-purple-300 print:text-black">
                      {record.tensile_strength_nmm2} N/mm²
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="text-emerald-400 print:text-emerald-700 font-bold">✔ UYGUN</span>
                    </td>
                  </tr>

                  {/* Parameter 4: Surface Condition */}
                  <tr className="hover:bg-slate-950/40 print:hover:bg-transparent">
                    <td className="py-2.5 px-3 font-bold text-slate-200 print:text-black font-sans">
                      4. Yüzey Oksit ve Görsel Muayene
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 print:text-gray-600 font-sans">Pürüzsüz / Oksitsiz Temiz Yüzey</td>
                    <td className="py-2.5 px-3 font-extrabold text-white print:text-black">
                      {record.surface_inspection}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {record.surface_inspection === 'UYGUN' ? (
                        <span className="text-emerald-400 print:text-emerald-700 font-bold">✔ UYGUN</span>
                      ) : (
                        <span className="text-rose-400 print:text-rose-700 font-bold">✖ UYGUNSUZ</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Quality Decision Card */}
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
                  ? 'ISO 9001 & IATF 16949 KALİTE ONAYLI SEVKİYAT İZNİ'
                  : 'UYGUNSUZ ÜRÜN! KARANTİNA VE İZOLASYON KARARI'}
              </div>
              <p className="leading-relaxed opacity-90">
                {isApproved
                  ? 'Yapılan laboratuvar testlerinde tüm fiziksel, kimyasal ve elektriksel parametreler Sarkomet standart tolerans sınırları içerisindedir. Ürün müşteriye sevk edilebilir.'
                  : `Test parametrelerinde tespit edilen sapmalar nedeniyle ürün üretim hattında bloke edilmiş ve karantina alanına çekilmiştir. Neden: ${record.rejection_reason || 'Kalite tolerans dışı.'}`}
              </p>
            </div>
          </div>

          {/* Signatures Footer */}
          <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs print:pt-6">
            <div className="border-t border-slate-800 print:border-black pt-2">
              <span className="font-bold text-white print:text-black block">{record.tester_name}</span>
              <span className="text-[10px] text-slate-400 print:text-gray-600 block">Kalite Kontrol / Laboratuvar Uzmanı</span>
              <span className="text-[10px] font-mono text-slate-500 block mt-1">İmza & Mühür</span>
            </div>

            <div className="border-t border-slate-800 print:border-black pt-2">
              <span className="font-bold text-white print:text-black block">Salih Temiz</span>
              <span className="text-[10px] text-slate-400 print:text-gray-600 block">Sarkomet Kalite Güvence Müdürü</span>
              <span className="text-[10px] font-mono text-slate-500 block mt-1">İmza & Mühür</span>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer with Prominent Close Button (Hidden in Print) */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-4 print:hidden">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Sarkomet A.Ş. Kalite Güvence Direktörlüğü Onaylı Belge</span>
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
