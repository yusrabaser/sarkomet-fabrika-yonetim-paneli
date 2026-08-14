import React, { useState } from 'react';
import {
  HardHat,
  Search,
  Plus,
  Building2,
  UserCheck,
  AlertTriangle,
  XCircle,
  Upload,
  Download,
  FileText,
  Trash2,
  ShieldCheck,
  Filter,
  CheckCircle2,
  FolderOpen,
  Eye,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { TaseronPersonel, AuthUser, ContractorDocType } from '../types';
import { formatDateTR, downloadFileFromBase64 } from '../utils/dateUtils';
import { CertificateData } from './CertificateModal';
import { ContractorDocModal, MANDATORY_DOCS_LIST } from './ContractorDocModal';

interface ContractorViewProps {
  taseronlar: TaseronPersonel[];
  onAddClick: () => void;
  onDeleteContractor: (id: number) => void;
  onUploadDoc: (
    id: number,
    docType: ContractorDocType,
    fileData: string,
    fileName: string,
    fileType: string
  ) => void;
  onRemoveDoc: (id: number, docType: ContractorDocType) => void;
  onOpenCertificate: (certData: CertificateData) => void;
  currentUser: AuthUser;
}

export type ContractorFilterType = 'ALL' | 'ALLOWED' | 'EXPIRING' | 'BLOCKED';

export function getContractorDocStats(item: TaseronPersonel) {
  const hasKimlik = Boolean(item.KIMLIK_DOSYA_DATA);
  const hasSaglik = Boolean(item.SAGLIK_DOSYA_DATA);
  const hasIsg = Boolean(item.ISG_DOSYA_DATA || item.DOSYA_DATA);
  const hasSabika = Boolean(item.SABIKA_DOSYA_DATA);

  const count = (hasKimlik ? 1 : 0) + (hasSaglik ? 1 : 0) + (hasIsg ? 1 : 0) + (hasSabika ? 1 : 0);
  const total = 4;
  const isComplete = count === total;
  const percentage = Math.round((count / total) * 100);

  return {
    hasKimlik,
    hasSaglik,
    hasIsg,
    hasSabika,
    count,
    total,
    isComplete,
    percentage,
  };
}

export function getContractorStatusInfo(item: TaseronPersonel) {
  const docStats = getContractorDocStats(item);

  // Requirement: "Eğer yukarıdaki 4 zorunlu belgeden en az 1 tanesi bile yüklenmemişse, sistem çalışanın saha durumunu otomatik olarak "🔴 GİRİŞ ONAYLANMADI (Eksik Evrak)" olarak göstersin ve kapı giriş izni vermesin."
  if (!docStats.isComplete) {
    return {
      key: 'BLOCKED',
      label: '🔴 GİRİŞ ONAYLANMADI (Eksik Evrak)',
      badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm shadow-rose-950/30',
      message: `Eksik Evrak (${docStats.count}/4 Yüklendi)`,
      docStats,
    };
  }

  // If 4/4 complete, check date expiry if available
  const todayStr = new Date().toISOString().slice(0, 10);
  const todayMs = new Date(todayStr).getTime();

  if (item.ISG_EGITIM_BITIS_TARIHI && item.GIRIS_IZNI_BITIS_TARIHI) {
    const isgExpiryMs = new Date(item.ISG_EGITIM_BITIS_TARIHI).getTime();
    const girisExpiryMs = new Date(item.GIRIS_IZNI_BITIS_TARIHI).getTime();
    const minExpiryMs = Math.min(isgExpiryMs, girisExpiryMs);
    const diffDays = Math.ceil((minExpiryMs - todayMs) / (1000 * 3600 * 24));

    if (diffDays < 0) {
      return {
        key: 'BLOCKED',
        label: '🔴 GİRİŞ ONAYLANMADI (Süresi Dolmuş)',
        badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-sm shadow-rose-950/30',
        message: 'İSG Eğitimi veya İzin Süresi Bitti',
        docStats,
      };
    }

    if (diffDays <= 7) {
      return {
        key: 'EXPIRING',
        label: `⚠️ 7 GÜN KALDI (${diffDays} Gün)`,
        badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-950/30',
        message: 'Süresi Yaklaşıyor',
        docStats,
      };
    }
  }

  // Requirement: "Taşeron eksik kalan belgeleri sisteme yüklediği AN, sistem belge doluluğunu kontrol etsin ve status kartını/rozetini dinamik olarak kırmızıdan yeşile çevirerek "✅ SAHAYA GİREBİLİR" yapsın."
  return {
    key: 'ALLOWED',
    label: '✅ SAHAYA GİREBİLİR',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm shadow-emerald-950/30',
    message: 'Tüm 4 Evrak Tam ve Onaylı',
    docStats,
  };
}

export const ContractorView: React.FC<ContractorViewProps> = ({
  taseronlar,
  onAddClick,
  onDeleteContractor,
  onUploadDoc,
  onRemoveDoc,
  onOpenCertificate,
  currentUser,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContractorFilterType>('ALL');
  const [selectedContractorForDocs, setSelectedContractorForDocs] = useState<TaseronPersonel | null>(null);

  // Scoped dataset for contractor role
  const scopedTaseronlar =
    currentUser.role === 'CONTRACTOR'
      ? taseronlar.filter(
          (item) =>
            (currentUser.contractorCompanyCode &&
              item.TASERON_CODE &&
              item.TASERON_CODE.toLowerCase() === currentUser.contractorCompanyCode.toLowerCase()) ||
            (currentUser.contractorCompany &&
              (item.FIRMA_ADI.toLowerCase().includes(currentUser.contractorCompany.toLowerCase()) ||
                currentUser.contractorCompany.toLowerCase().includes(item.FIRMA_ADI.toLowerCase())))
        )
      : taseronlar;

  // Compute stats
  let totalAllowed = 0;
  let totalExpiring = 0;
  let totalBlocked = 0;

  scopedTaseronlar.forEach((item) => {
    const info = getContractorStatusInfo(item);
    if (info.key === 'ALLOWED') totalAllowed++;
    if (info.key === 'EXPIRING') totalExpiring++;
    if (info.key === 'BLOCKED') totalBlocked++;
  });

  // Filter list
  const filteredList = scopedTaseronlar.filter((item) => {
    const info = getContractorStatusInfo(item);

    // Status filter
    if (statusFilter === 'ALLOWED' && info.key !== 'ALLOWED') return false;
    if (statusFilter === 'EXPIRING' && info.key !== 'EXPIRING') return false;
    if (statusFilter === 'BLOCKED' && info.key !== 'BLOCKED') return false;

    // Search filter
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      item.FIRMA_ADI.toLowerCase().includes(term) ||
      item.PERSONEL_ADI_SOYADI.toLowerCase().includes(term) ||
      item.TC_PASAPORT_NO.toLowerCase().includes(term) ||
      item.GOREV_IS.toLowerCase().includes(term)
    );
  });

  // Active contractor state update helper for doc modal
  const activeContractorInModal = selectedContractorForDocs
    ? taseronlar.find((t) => t.ID === selectedContractorForDocs.ID) || null
    : null;

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center space-x-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-amber-600/10 border border-amber-500/40 text-amber-400 shadow-lg shadow-amber-950/40">
              <HardHat className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                  {currentUser.role === 'CONTRACTOR'
                    ? `🚜 ${currentUser.contractorCompany || 'Taşeron Firma'} Bireysel Evrak Portalı`
                    : 'Taşeron Bireysel Evrak Yükleme ve Otomatik Onay Sistemi'}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {currentUser.role === 'CONTRACTOR'
                  ? `${currentUser.contractorCompany || 'Taşeron Firma'} Çalışanlarım & Saha İzinleri`
                  : 'Taşeron Bireysel Evrak Takibi & Saha Giriş Onayı'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Çalışanlarınızın 4 zorunlu evrağı (Kimlik, Sağlık Raporu, İSG Belgesi, Adli Sicil) tamamlandığında durum otomatik olarak Kırmızıdan Yeşile dönerek <strong className="text-emerald-400">"SAHAYA GİREBİLİR"</strong> izni verilir.
              </p>
            </div>
          </div>

          {/* Add New Contractor Button */}
          {currentUser.role === 'ADMIN' && (
            <button
              onClick={onAddClick}
              className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-xl shadow-orange-950/40 transition-all cursor-pointer hover:scale-105 shrink-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              ➕ Yeni Taşeron Personel Ekle
            </button>
          )}
        </div>

        {/* Status Counter Badges Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800">
          {/* Total */}
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-slate-800 border-amber-500/60 shadow-lg shadow-amber-950/20'
                : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Toplam Taşeron</span>
              <Building2 className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-xl font-black text-white">{taseronlar.length}</span>
            <span className="block text-[10px] text-slate-500 mt-0.5">Kayıtlı Personel</span>
          </button>

          {/* Allowed */}
          <button
            onClick={() => setStatusFilter('ALLOWED')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              statusFilter === 'ALLOWED'
                ? 'bg-emerald-950/40 border-emerald-500/60 shadow-lg shadow-emerald-950/30'
                : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center justify-between text-emerald-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Sahaya Girebilir</span>
              <UserCheck className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-xl font-black text-emerald-300">{totalAllowed}</span>
            <span className="block text-[10px] text-emerald-500/80 mt-0.5">4/4 Evrak Tam</span>
          </button>

          {/* Expiring */}
          <button
            onClick={() => setStatusFilter('EXPIRING')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              statusFilter === 'EXPIRING'
                ? 'bg-amber-950/40 border-amber-500/60 shadow-lg shadow-amber-950/30'
                : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center justify-between text-amber-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">7 Gün Kaldı</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-xl font-black text-amber-300">{totalExpiring}</span>
            <span className="block text-[10px] text-amber-500/80 mt-0.5">Süresi Yaklaşan</span>
          </button>

          {/* Blocked */}
          <button
            onClick={() => setStatusFilter('BLOCKED')}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              statusFilter === 'BLOCKED'
                ? 'bg-rose-950/40 border-rose-500/60 shadow-lg shadow-rose-950/30'
                : 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/60'
            }`}
          >
            <div className="flex items-center justify-between text-rose-400 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider">Giriş Onayı Yok</span>
              <XCircle className="w-4 h-4 text-rose-400" />
            </div>
            <span className="text-xl font-black text-rose-300">{totalBlocked}</span>
            <span className="block text-[10px] text-rose-500/80 mt-0.5">Eksik Evraklı</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Firma, çalışan adı veya T.C. ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5 text-amber-400" />
            Filtre:
          </span>

          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'ALL'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
            }`}
          >
            Tümü ({taseronlar.length})
          </button>

          <button
            onClick={() => setStatusFilter('ALLOWED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'ALLOWED'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-emerald-400 hover:bg-slate-750'
            }`}
          >
            Sahaya Girebilir ({totalAllowed})
          </button>

          <button
            onClick={() => setStatusFilter('BLOCKED')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'BLOCKED'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-800 text-rose-300 hover:bg-slate-750'
            }`}
          >
            Giriş Onayı Yok ({totalBlocked})
          </button>

          <button
            onClick={() => setStatusFilter('EXPIRING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'EXPIRING'
                ? 'bg-amber-600 text-white'
                : 'bg-slate-800 text-amber-300 hover:bg-slate-750'
            }`}
          >
            7 Gün Kaldı ({totalExpiring})
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs min-w-[950px]">
            {/* Table Header */}
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Taşeron ID / Kimlik</th>
                <th className="py-3.5 px-4">Taşeron Firma</th>
                <th className="py-3.5 px-4">Çalışan Personel</th>
                <th className="py-3.5 px-4">T.C. / Pasaport</th>
                <th className="py-3.5 px-4">Görev / İş</th>
                <th className="py-3.5 px-4">Zorunlu Evrak İlerlemesi</th>
                <th className="py-3.5 px-4">Giriş Onay Durumu</th>
                <th className="py-3.5 px-4 text-center">Bireysel Evrak Kontrol</th>
                {currentUser.role === 'ADMIN' && (
                  <th className="py-3.5 px-4 text-right">İşlemler</th>
                )}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-800/60">
              {filteredList.length > 0 ? (
                filteredList.map((item) => {
                  const statusInfo = getContractorStatusInfo(item);
                  const { count, total, isComplete, percentage } = statusInfo.docStats;
                  const taseronCode = item.TASERON_CODE || `TSR-${item.ID}`;
                  const taseronPassword = item.PASSWORD || '1234';

                  return (
                    <tr
                      key={item.ID}
                      className="hover:bg-slate-800/50 transition-colors group"
                    >
                      {/* Taşeron ID & Şifre */}
                      <td className="py-3.5 px-4 font-mono text-xs">
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded font-black bg-amber-500/15 text-amber-300 border border-amber-500/30 w-max">
                            🔑 {taseronCode}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            Şifre: <code className="text-emerald-400 font-bold">{taseronPassword}</code>
                          </span>
                        </div>
                      </td>

                      {/* Firma Adı */}
                      <td className="py-3.5 px-4 font-bold text-amber-300">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
                          <span>{item.FIRMA_ADI}</span>
                        </div>
                      </td>

                      {/* Çalışan Adı */}
                      <td className="py-3.5 px-4 font-bold text-white">
                        {item.PERSONEL_ADI_SOYADI}
                      </td>

                      {/* T.C. / Pasaport */}
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {item.TC_PASAPORT_NO}
                      </td>

                      {/* Görev / İş */}
                      <td className="py-3.5 px-4 text-slate-300 max-w-xs truncate">
                        {item.GOREV_IS}
                      </td>

                      {/* Görsel Evrak İlerleme Çubuğu (Progress Bar) */}
                      <td className="py-3.5 px-4">
                        <div className="w-36">
                          <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                            <span className={isComplete ? 'text-emerald-400' : 'text-amber-400'}>
                              {count}/4 Evrak Yüklendi
                            </span>
                            <span className="text-slate-500">%{percentage}</span>
                          </div>
                          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                            <div
                              className={`h-full transition-all duration-300 rounded-full ${
                                isComplete
                                  ? 'bg-emerald-500'
                                  : count > 0
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Giriş Onay Durumu Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-extrabold border ${statusInfo.badgeClass}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>

                      {/* Evrak Tamamla / Yükle Button */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => setSelectedContractorForDocs(item)}
                          className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-md hover:scale-105 ${
                            isComplete
                              ? 'bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                              : 'bg-amber-500/20 hover:bg-amber-500/35 text-amber-300 border border-amber-500/50'
                          }`}
                          title="4 Zorunlu Bireysel Evrağı Göre / Yükle / Düzenle"
                        >
                          <FolderOpen className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                          <span>📂 Belgeleri Tamamla ({count}/4)</span>
                        </button>
                      </td>

                      {/* Sil Action Button */}
                      {currentUser.role === 'ADMIN' && (
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={() => onDeleteContractor(item.ID)}
                            className="inline-flex items-center px-2.5 py-1.5 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 transition-all cursor-pointer"
                            title="Taşeron Kaydını ve Tüm Belgelerini Geri Dönüşüm Kutusu'na Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            Sil
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={currentUser.role === 'ADMIN' ? 9 : 8}
                    className="py-12 text-center text-slate-500 text-xs"
                  >
                    <HardHat className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                    Kriterlere uygun taşeron personel kaydı bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>
            Toplam {filteredList.length} taşeron personel kaydı gösteriliyor.
          </span>
          <span className="flex items-center gap-1 text-amber-400 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            Sarkuysan A.Ş. İSG & Güvenlik Giriş Otomasyonu
          </span>
        </div>
      </div>

      {/* Individual Document Checklist & Upload Modal */}
      <ContractorDocModal
        isOpen={Boolean(activeContractorInModal)}
        onClose={() => setSelectedContractorForDocs(null)}
        contractor={activeContractorInModal}
        onUploadDoc={onUploadDoc}
        onRemoveDoc={onRemoveDoc}
        onOpenCertificate={onOpenCertificate}
      />
    </div>
  );
};
