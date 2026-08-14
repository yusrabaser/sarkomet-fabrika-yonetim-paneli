import React, { useState } from 'react';
import { TrashItem, TrashItemType } from '../types';
import {
  Trash2,
  RotateCcw,
  XCircle,
  Search,
  FileText,
  Download,
  AlertOctagon,
  GraduationCap,
  HardHat,
  BookOpen,
  Users,
  Eye,
  Info,
  Layers,
  Factory,
  Cpu,
  FlaskConical,
} from 'lucide-react';
import { downloadFileFromBase64 } from '../utils/dateUtils';
import { CertificateData } from './CertificateModal';

interface RecycleBinViewProps {
  trashItems: TrashItem[];
  onRestoreItem: (item: TrashItem) => void;
  onPermanentDeleteItem: (itemId: string) => void;
  onClearAllTrash: () => void;
  onOpenCertificate?: (certData: CertificateData) => void;
  onRequestConfirm: (config: {
    title: string;
    message: string;
    confirmText: string;
    cancelText?: string;
    variant: 'danger' | 'warning' | 'info';
    iconType: 'delete' | 'restore' | 'warning';
    onConfirm: () => void;
  }) => void;
}

export const RecycleBinView: React.FC<RecycleBinViewProps> = ({
  trashItems,
  onRestoreItem,
  onPermanentDeleteItem,
  onClearAllTrash,
  onOpenCertificate,
  onRequestConfirm,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('ALL');

  // Filter trash items
  const filteredItems = trashItems.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.documentName && item.documentName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = selectedType === 'ALL' || item.type === selectedType;

    return matchesSearch && matchesType;
  });

  const getTypeBadge = (type: TrashItemType) => {
    switch (type) {
      case 'KATILIM':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
            <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
            Eğitim Katılımı
          </span>
        );
      case 'TASERON':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
            <HardHat className="w-3.5 h-3.5 text-cyan-400" />
            Taşeron Personel
          </span>
        );
      case 'EGITIM':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            Eğitim Programı
          </span>
        );
      case 'CALISAN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30">
            <Users className="w-3.5 h-3.5 text-purple-400" />
            Çalışan Kaydı
          </span>
        );
      case 'YETKINLIK':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
            <Factory className="w-3.5 h-3.5 text-amber-400" />
            Üretim Yetkinlik Matrisi
          </span>
        );
      case 'MACHINE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            Makine / Üretim Hattı
          </span>
        );
      case 'QUALITY_TEST':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30">
            <FlaskConical className="w-3.5 h-3.5 text-purple-400" />
            Ürün Kalite Testi
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-slate-800 text-slate-300">
            Kayıt
          </span>
        );
    }
  };

  const handleDownloadDocument = (item: TrashItem) => {
    let fileData = item.payload.katilim?.SERTIFIKA_DOSYA_DATA || item.payload.taseron?.DOSYA_DATA || item.payload.egitim?.SERTIFIKA_DOSYA_DATA || item.payload.yetkinlik?.SERTIFIKA_DOSYA_DATA;
    let fileName = item.payload.katilim?.SERTIFIKA_DOSYA_ADI || item.payload.taseron?.DOSYA_ADI || item.payload.egitim?.SERTIFIKA_DOSYA_ADI || item.payload.yetkinlik?.SERTIFIKA_DOSYA_ADI || 'belge.pdf';

    if (fileData) {
      downloadFileFromBase64(fileData, fileName);
    }
  };

  const handleRestoreClick = (item: TrashItem) => {
    onRequestConfirm({
      title: 'Kayıt Geri Yüklensin mi?',
      message: `"${item.title}" kaydı ve varsa sisteme yüklenmiş olan O GERÇEK SERTİFİKA / İSG BELGESİ tekrar aktif tablolara ve Dashboard istatistiklerine geri yüklenecektir. Devam etmek istiyor musunuz?`,
      confirmText: 'Evet, Geri Yükle',
      cancelText: 'Vazgeç',
      variant: 'info',
      iconType: 'restore',
      onConfirm: () => onRestoreItem(item),
    });
  };

  const handlePermanentDeleteClick = (item: TrashItem) => {
    onRequestConfirm({
      title: 'Kalıcı Olarak Silinsin mi?',
      message: `"${item.title}" kaydı ve bağlı tüm belgeler hafızadan kalıcı olarak silinecektir. Bu işlem geri alınamaz!`,
      confirmText: 'Evet, Kalıcı Olarak Sil',
      cancelText: 'İptal',
      variant: 'danger',
      iconType: 'delete',
      onConfirm: () => onPermanentDeleteItem(item.id),
    });
  };

  const handleClearAllClick = () => {
    onRequestConfirm({
      title: 'Tüm Çöp Kutusu Temizlensin mi?',
      message: `Geri dönüşüm kutusundaki toplam ${trashItems.length} silinmiş kayıt ve yüklenmiş tüm sertifikalar hafızadan KALICI olarak temizlenecektir. Devam etmek istediğinize emin misiniz?`,
      confirmText: 'Tümünü Kalıcı Sil',
      cancelText: 'İptal',
      variant: 'danger',
      iconType: 'delete',
      onConfirm: () => onClearAllTrash(),
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-6 shadow-xl">
        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-start space-x-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-rose-600 to-red-800 text-white shadow-lg shadow-rose-950/40 border border-rose-400/30 shrink-0">
              <Trash2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-white tracking-tight">
                  Geri Dönüşüm Kutusu (Silinen Kayıtlar)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {trashItems.length} Kayıt
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Silinen eğitim katılım kayıtları, taşeron personelleri ve sertifikalar burada güvenle saklanır. İstenildiğinde bağlı sertifika belgeleriyle birlikte tekrar aktif sistem tablolarına geri yüklenebilir.
              </p>
            </div>
          </div>

          {trashItems.length > 0 && (
            <button
              onClick={handleClearAllClick}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 hover:border-rose-500 transition-all cursor-pointer shrink-0 self-start md:self-auto shadow-md"
            >
              <AlertOctagon className="w-4 h-4" />
              Tümünü Kalıcı Olarak Sil
            </button>
          )}
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Silinen kayıtlarda isim, eğitim veya dosya ara..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        {/* Type Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
          <button
            onClick={() => setSelectedType('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedType === 'ALL'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            Tümü ({trashItems.length})
          </button>
          <button
            onClick={() => setSelectedType('KATILIM')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedType === 'KATILIM'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            Eğitim Katılımları ({trashItems.filter((i) => i.type === 'KATILIM').length})
          </button>
          <button
            onClick={() => setSelectedType('TASERON')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedType === 'TASERON'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            Taşeron Kayıtları ({trashItems.filter((i) => i.type === 'TASERON').length})
          </button>
          <button
            onClick={() => setSelectedType('EGITIM')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedType === 'EGITIM'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
            }`}
          >
            Eğitim Programları ({trashItems.filter((i) => i.type === 'EGITIM').length})
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-500">
              <Trash2 className="w-8 h-8 text-slate-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-200">
                {trashItems.length === 0
                  ? 'Geri Dönüşüm Kutusu Boş'
                  : 'Arama Kriterine Uygun Kayıt Bulunamadı'}
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {trashItems.length === 0
                  ? 'Sistemde silinen herhangi bir kayıt bulunmuyor. Silinen eğitim veya taşeron verileri burada listelenir.'
                  : 'Filtreleri veya arama metnini güncelleyerek tekrar deneyebilirsiniz.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-12 text-center">#</th>
                  <th className="py-3.5 px-4">Kayıt Türü</th>
                  <th className="py-3.5 px-4">Kayıt Başlığı / Detay</th>
                  <th className="py-3.5 px-4">Departman / Firma</th>
                  <th className="py-3.5 px-4">Sertifika / Belge</th>
                  <th className="py-3.5 px-4">Silinme Tarihi</th>
                  <th className="py-3.5 px-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {filteredItems.map((item, index) => {
                  const fileData =
                    item.payload.katilim?.SERTIFIKA_DOSYA_DATA ||
                    item.payload.taseron?.DOSYA_DATA ||
                    item.payload.egitim?.SERTIFIKA_DOSYA_DATA;

                  const fileName =
                    item.payload.katilim?.SERTIFIKA_DOSYA_ADI ||
                    item.payload.taseron?.DOSYA_ADI ||
                    item.payload.egitim?.SERTIFIKA_DOSYA_ADI;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-800/50 transition-colors group"
                    >
                      <td className="py-3.5 px-4 text-center font-bold text-slate-500">
                        {index + 1}
                      </td>

                      <td className="py-3.5 px-4">
                        {getTypeBadge(item.type)}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="font-bold text-white block">
                          {item.title}
                        </span>
                        {item.type === 'KATILIM' && item.payload.katilim && (
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            Süre: {item.payload.katilim.SURE_SAAT || 8} Saat
                          </span>
                        )}
                        {item.type === 'TASERON' && item.payload.taseron && (
                          <span className="text-[11px] text-slate-400 block mt-0.5">
                            TC/Pasaport: {item.payload.taseron.TC_PASAPORT_NO} — Görev: {item.payload.taseron.GOREV_IS}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-300 font-medium">
                        {item.subtitle}
                      </td>

                      <td className="py-3.5 px-4">
                        {fileData ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDownloadDocument(item)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-colors cursor-pointer"
                              title={`${fileName || 'Belge'} dosyasını bilgisayara indir`}
                            >
                              <Download className="w-3.5 h-3.5 text-amber-400" />
                              <span className="truncate max-w-[120px]">
                                {fileName || 'Belgeyi İndir'}
                              </span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-[11px] italic">
                            Belge Yüklenmemiş
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                        {item.deletedAt}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleRestoreClick(item)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 hover:border-emerald-500 transition-all cursor-pointer shadow"
                            title="Tüm verileri ve belgeleriyle ana tabloya geri yükle"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Geri Al</span>
                          </button>

                          <button
                            onClick={() => handlePermanentDeleteClick(item)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 hover:border-rose-500 transition-all cursor-pointer"
                            title="Sistemden tamamen sil"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Kalıcı Sil</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
