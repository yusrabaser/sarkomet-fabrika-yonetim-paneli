import React, { useState, useMemo } from 'react';
import { SqlQueryResultRow } from '../utils/sqlEngine';
import { QueryTabKey, ManualStatusType } from '../types';
import { formatDateTR, generateCertificateCode, downloadFileFromBase64 } from '../utils/dateUtils';
import { CertificateData } from './CertificateModal';
import {
  Search,
  Download,
  Printer,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowUpDown,
  FileSpreadsheet,
  Layers,
  Sparkles,
  Calendar,
  Edit3,
  Trash2,
  ChevronDown,
  Eye,
  UserCheck,
  FileText,
  Upload,
  User,
  BookOpen,
  X,
} from 'lucide-react';

interface DataTableProps {
  data: SqlQueryResultRow[];
  activeTab: QueryTabKey;
  isAdmin?: boolean;
  onToggleStatus?: (participationId: number) => void;
  onSetStatus?: (
    id: number,
    status: ManualStatusType,
    targetType: 'PARTICIPATION' | 'TRAINING'
  ) => void;
  onEditTraining?: (egitimId: number) => void;
  onDeleteTraining?: (egitimId: number) => void;
  onDeleteParticipation?: (katilimId: number, infoStr?: string) => void;
  onDeleteEmployee?: (employeeId: number, infoStr?: string) => void;
  onEditEmployee?: (employeeId: number) => void;
  onSelectEmployee?: (employeeId: number) => void;
  onSelectTraining?: (egitimId: number) => void;
  onOpenCertificate?: (certData: CertificateData) => void;
  onUploadCertificateDocument?: (
    id: number,
    fileData: string,
    fileName: string,
    fileType: string,
    targetType: 'KATILIM' | 'EGITIM'
  ) => void;
  externalStatusFilter?: string;
  onStatusFilterChange?: (filter: string) => void;
}

export const DataTable: React.FC<DataTableProps> = ({
  data,
  activeTab,
  isAdmin = false,
  onToggleStatus,
  onSetStatus,
  onEditTraining,
  onDeleteTraining,
  onDeleteParticipation,
  onDeleteEmployee,
  onEditEmployee,
  onSelectEmployee,
  onSelectTraining,
  onOpenCertificate,
  onUploadCertificateDocument,
  externalStatusFilter,
  onStatusFilterChange,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [localStatusFilter, setLocalStatusFilter] = useState<string>('ALL');

  const statusFilter = externalStatusFilter || localStatusFilter;
  const setStatusFilter = (filter: string) => {
    setLocalStatusFilter(filter);
    if (onStatusFilterChange) {
      onStatusFilterChange(filter);
    }
  };

  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedPersonDetailRow, setSelectedPersonDetailRow] = useState<SqlQueryResultRow | null>(null);

  const isParticipationTab =
    activeTab === 'EXPIRED_CERTIFICATES' ||
    activeTab === 'RECENT_PARTICIPATIONS';

  // Extract columns dynamically from the result set, hiding internal raw keys
  const HIDDEN_UI_COLUMNS = useMemo(() => {
    const base = [
      'EGITIM_ID',
      'CALISAN_ID',
      'AD',
      'SOYAD',
      'BASLANGIC_TARIHI',
      'BITIS_TARIHI',
      'SURE_SAAT_VAL',
      'TAMAMLANDI',
      'RAW_KISI_BASI',
      'RAW_TOPLAM_TUTAR',
      'UCRETSIZ',
      'ALDIGI_EGITIMLER',
      'TAMAMLADIGI_SAYI',
      'ISE_GIRIS_TARIHI',
      'SON_SERTIFIKA_BITIS',
      'SERTIFIKA_GECERLILIK_TARIHI',
      'SERTIFIKA_KALAN_GUN',
      'SERTIFIKA_UYARI_DURUMU',
      'SERTIFIKA_DURUMU',
      'BASLANGIC_TARIHI_SAATI',
      'BITIS_TARIHI_SAATI',
      'SURE_SAAT',
      'TOPLAM_KATILIMCI',
      'SERTIFIKA_DOSYA_DATA',
      'SERTIFIKA_DOSYA_ADI',
      'SERTIFIKA_DOSYA_TIPI',
      'DOSYA_DATA',
      'DOSYA_ADI',
      'DOSYA_TIPI',
      'EVRAK_DATA',
      'BASE64',
      'FILE_DATA',
    ];

    if (isParticipationTab) {
      return [
        ...base,
        'BASLANGIC_TARIHI',
        'BASLANGIC_SAATI',
        'BITIS_TARIHI',
        'BITIS_SAATI',
        'BASLANGIC_TARIHI_SAATI',
        'BITIS_TARIHI_SAATI',
        'SURE_SAAT',
        'SURE_SAAT_VAL',
        'SURE',
        'DURUM',
        'TARIH_ARALIGI',
        'KATILIM_DURUMU',
        'SERTIFIKA_GECERLILIK_TARIHI',
        'SERTIFIKA_KALAN_GUN',
        'SERTIFIKA_DURUMU',
        'SERTIFIKA_UYARI_DURUMU',
        'KISI_BASI_TUTAR',
        'TOPLAM_TUTAR',
        'PARA_BIRIMI',
        'KATILAN_CALISANLAR',
        'DEPARTMAN',
      ];
    }

    if (activeTab === 'ALL_TRAININGS' || activeTab === 'LONGEST_TRAINING') {
      return [
        ...base,
        'KATILAN_CALISANLAR',
        'TARIH_ARALIGI',
        'BASLANGIC_TARIHI',
        'BASLANGIC_SAATI',
        'BITIS_TARIHI',
        'BITIS_SAATI',
        'KISI_BASI_TUTAR',
        'TOPLAM_TUTAR',
        'PARA_BIRIMI',
        'KATILIM_DURUMU',
      ];
    }

    return base;
  }, [activeTab, isParticipationTab]);

  const columns = useMemo(() => {
    if (data.length === 0) return [];

    if (isParticipationTab) {
      return ['CALISAN_ADI', 'EGITIM_ADI', 'SERTIFIKA_DURUMU', 'BELGE_SERTIFIKA'];
    }

    return Object.keys(data[0]).filter((col) => !HIDDEN_UI_COLUMNS.includes(col));
  }, [data, HIDDEN_UI_COLUMNS, isParticipationTab]);

  // Filter data by search term & status filter
  const filteredData = useMemo(() => {
    let result = data;

    if (statusFilter === 'EXPIRED' || statusFilter === 'SERTIFIKA_DOLDU') {
      result = result.filter((row) => {
        const kalan = Number(row.SERTIFIKA_KALAN_GUN ?? -999);
        const sd = String(row.SERTIFIKA_DURUMU || '').toLowerCase();
        const d = String(row.DURUM || '').toLowerCase();
        return (kalan !== -999 && kalan <= 0) || sd.includes('doldu') || d.includes('doldu') || sd.includes('🔴');
      });
    } else if (statusFilter === 'CRITICAL_30') {
      result = result.filter((row) => {
        const kalan = Number(row.SERTIFIKA_KALAN_GUN ?? -999);
        const sd = String(row.SERTIFIKA_DURUMU || '').toLowerCase();
        return (kalan >= 1 && kalan <= 30) || sd.includes('acil') || sd.includes('🟠');
      });
    } else if (statusFilter === 'WARNING_90') {
      result = result.filter((row) => {
        const kalan = Number(row.SERTIFIKA_KALAN_GUN ?? -999);
        const sd = String(row.SERTIFIKA_DURUMU || '').toLowerCase();
        return (kalan >= 31 && kalan <= 90) || sd.includes('yaklaşıyor') || sd.includes('yaklasiyor') || sd.includes('🟡');
      });
    } else if (statusFilter === 'VALID' || statusFilter === 'GECERLI') {
      result = result.filter((row) => {
        const kalan = Number(row.SERTIFIKA_KALAN_GUN ?? -999);
        const sd = String(row.SERTIFIKA_DURUMU || '').toLowerCase();
        const d = String(row.DURUM || '').toLowerCase();
        return (kalan > 90) || sd.includes('geçerli') || sd.includes('gecerli') || d.includes('geçerli') || sd.includes('🟢');
      });
    } else if (statusFilter === 'DEVAM_EDIYOR') {
      result = result.filter((row) => {
        const d = String(row.DURUM || '').toLowerCase();
        return d.includes('devam');
      });
    } else if (statusFilter.startsWith('EMP:')) {
      const empTarget = statusFilter.substring(4).toLowerCase();
      result = result.filter((row) => {
        const calisanName = String(row.CALISAN_ADI || `${row.AD || ''} ${row.SOYAD || ''}`).toLowerCase();
        return calisanName.includes(empTarget);
      });
    }

    if (!searchTerm.trim()) return result;

    const term = searchTerm.toLowerCase();
    return result.filter((row) =>
      Object.values(row).some((val) =>
        String(val).toLowerCase().includes(term)
      )
    );
  }, [data, searchTerm, statusFilter]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortField) return filteredData;

    return [...filteredData].sort((a, b) => {
      const valA = a[sortField];
      const valB = b[sortField];

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      const strA = String(valA ?? '');
      const strB = String(valB ?? '');
      return sortDirection === 'asc'
        ? strA.localeCompare(strB, 'tr')
        : strB.localeCompare(strA, 'tr');
    });
  }, [filteredData, sortField, sortDirection]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const formatColumnHeader = (col: string) => {
    switch (col) {
      case 'ID':
        return 'ID';
      case 'AD':
        return 'Ad';
      case 'SOYAD':
        return 'Soyad';
      case 'DEPARTMAN':
        return 'Departman';
      case 'DEPARTMAN_ID':
        return 'Dept ID';
      case 'ISE_GIRIS_TARIHI':
        return 'İşe Giriş Tarihi';
      case 'CALISAN_ADI':
        return 'Çalışan Adı Soyadı';
      case 'EGITIM_ADI':
        return 'Eğitim Modülü Adı';
      case 'EGITIM_TARIHI':
        return 'Eğitim Tarihi';
      case 'BASLANGIC_TARIHI_SAATI':
        return 'Başlangıç Tarihi ve Saati';
      case 'BITIS_TARIHI_SAATI':
        return 'Bitiş Tarihi ve Saati';
      case 'TOPLAM_KATILIMCI':
        return 'Toplam Katılımcı Sayısı';
      case 'KATILAN_CALISANLAR':
        return 'Katılan Çalışanlar';
      case 'TARIH_ARALIGI':
        return 'Başlangıç - Bitiş Tarihi';
      case 'SURE_SAAT':
        return 'Süre (Saat)';
      case 'KISI_BASI_TUTAR':
        return 'Kişi Başı Tutar';
      case 'TOPLAM_TUTAR':
        return 'Toplam Eğitim Tutarı';
      case 'PARA_BIRIMI':
        return 'Para Birimi';
      case 'DURUM':
        return 'Durum (Badge)';
      case 'TAMAMLANDI':
        return 'Kayıt Kodu';
      case 'TAMAMLANAN_EGITIM_SAYISI':
        return 'Tamamlanan Eğitim';
      case 'TOPLAM_KATILIM_SAYISI':
        return 'Toplam Katılım';
      case 'SERTIFIKA_GECERLILIK_TARIHI':
        return 'Sertifika Geçerlilik Tarihi';
      case 'SERTIFIKA_DURUMU':
        return 'Sertifika Durumu';
      case 'KATILDIGI_EGITIM_SAYISI':
        return 'Katıldığı Eğitim';
      case 'TAMAMLADIGI_SAYI':
        return 'Tamamladığı';
      case 'CALISAN_SAYISI':
        return 'Çalışan Sayısı';
      default:
        return col.replace(/_/g, ' ');
    }
  };

  // Excel / CSV Export Handler with Native Excel Table XML structure (.xls)
  const exportToCsv = () => {
    if (sortedData.length === 0) return;

    let headers: string[] = [];
    let rows: string[][] = [];

    if (activeTab === 'ALL_PARTICIPATIONS' || activeTab === 'INCOMPLETE_TRAININGS') {
      headers = [
        'Katılım ID',
        'Çalışan ID',
        'Adı',
        'Soyadı',
        'Çalışan Adı Soyadı',
        'Departman',
        'Eğitim Adı',
        'Başlangıç Tarihi',
        'Başlangıç Saati',
        'Bitiş Tarihi',
        'Bitiş Saati',
        'Eğitim Süresi (Saat)',
        'Kişi Başı Tutar',
        'Toplam Tutar',
        'Para Birimi',
        'Eğitim Durumu',
        'Sertifika Bitiş Tarihi',
        'Kalan Gün Sayısı',
        'Sertifika Uyarı Durumu',
      ];

      rows = sortedData.map((row) => {
        const katilimId = String(row.ID ?? '');
        const calisanId = String(row.CALISAN_ID ?? '');

        let ad = String(row.AD ?? '');
        let soyad = String(row.SOYAD ?? '');
        let calisanAdi = String(row.CALISAN_ADI ?? '');
        if ((!ad || !soyad) && calisanAdi) {
          const nameParts = calisanAdi.trim().split(' ');
          soyad = nameParts.pop() || '';
          ad = nameParts.join(' ');
        }
        if (!calisanAdi && (ad || soyad)) {
          calisanAdi = `${ad} ${soyad}`.trim();
        }

        const dept = String(row.DEPARTMAN ?? '');
        const egitimAdi = String(row.EGITIM_ADI ?? '');

        let baslangic = String(row.BASLANGIC_TARIHI ?? '');
        let baslangicSaati = String(row.BASLANGIC_SAATI ?? '09:00');
        let bitis = String(row.BITIS_TARIHI ?? '');
        let bitisSaati = String(row.BITIS_SAATI ?? '17:00');
        if ((!baslangic || !bitis) && row.TARIH_ARALIGI) {
          const dateParts = String(row.TARIH_ARALIGI).split(' - ');
          baslangic = dateParts[0] || '';
          bitis = dateParts[1] || '';
        }

        const sureSaat = String(
          row.SURE_SAAT_VAL ?? String(row.SURE_SAAT ?? '').replace(' Saat', '')
        );

        const kisiBasiTutar = String(row.KISI_BASI_TUTAR ?? 'Ücretsiz / 0 TL');
        const toplamTutar = String(row.TOPLAM_TUTAR ?? '0 TL');
        const paraBirimi = String(row.PARA_BIRIMI ?? 'TL');
        const durum = String(row.DURUM ?? '');
        const sertifikaGecerlilikTarihi = String(row.SERTIFIKA_GECERLILIK_TARIHI ?? '-');
        const kalanGunVal =
          row.SERTIFIKA_KALAN_GUN !== undefined && Number(row.SERTIFIKA_KALAN_GUN) !== -999
            ? `${row.SERTIFIKA_KALAN_GUN} Gün`
            : '-';
        const sertifikaUyariDurumu = String(row.SERTIFIKA_UYARI_DURUMU ?? row.SERTIFIKA_DURUMU ?? '-');

        return [
          katilimId,
          calisanId,
          ad,
          soyad,
          calisanAdi,
          dept,
          egitimAdi,
          baslangic,
          baslangicSaati,
          bitis,
          bitisSaati,
          sureSaat,
          kisiBasiTutar,
          toplamTutar,
          paraBirimi,
          durum,
          sertifikaGecerlilikTarihi,
          kalanGunVal,
          sertifikaUyariDurumu,
        ];
      });
    } else if (activeTab === 'ALL_EMPLOYEES') {
      headers = [
        'Çalışan ID',
        'Adı',
        'Soyadı',
        'Çalışan Adı Soyadı',
        'Departman',
        'Katıldığı Eğitim Sayısı',
        'Tamamladığı Eğitim Sayısı',
        'İşe Giriş Tarihi',
        'Sertifika Bitiş Tarihi',
        'Kalan Gün Sayısı',
        'Sertifika Uyarı Durumu',
      ];

      rows = sortedData.map((row) => {
        const calisanId = String(row.ID ?? '');
        let ad = String(row.AD ?? '');
        let soyad = String(row.SOYAD ?? '');
        let calisanAdi = String(row.CALISAN_ADI ?? '');
        if ((!ad || !soyad) && calisanAdi) {
          const nameParts = calisanAdi.trim().split(' ');
          soyad = nameParts.pop() || '';
          ad = nameParts.join(' ');
        }
        if (!calisanAdi && (ad || soyad)) {
          calisanAdi = `${ad} ${soyad}`.trim();
        }

        const dept = String(row.DEPARTMAN ?? '');
        const katildigiSayi = String(row.KATILDIGI_EGITIM_SAYISI ?? '0');
        const tamamladigiSayi = String(row.TAMAMLADIGI_SAYI ?? '0');
        const iseGiris = String(row.ISE_GIRIS_TARIHI ?? '-');
        const sonSertifikaBitis = String(row.SON_SERTIFIKA_BITIS ?? row.SERTIFIKA_GECERLILIK_TARIHI ?? '-');
        const kalanGunVal =
          row.SERTIFIKA_KALAN_GUN !== undefined && Number(row.SERTIFIKA_KALAN_GUN) !== -999
            ? `${row.SERTIFIKA_KALAN_GUN} Gün`
            : '-';
        const sertifikaUyariDurumu = String(row.SERTIFIKA_UYARI_DURUMU ?? row.SERTIFIKA_DURUMU ?? '-');

        return [
          calisanId,
          ad,
          soyad,
          calisanAdi,
          dept,
          katildigiSayi,
          tamamladigiSayi,
          iseGiris,
          sonSertifikaBitis,
          kalanGunVal,
          sertifikaUyariDurumu,
        ];
      });
    } else if (activeTab === 'ALL_TRAININGS' || activeTab === 'LONGEST_TRAINING') {
      headers = [
        'Eğitim ID',
        'Eğitim Adı',
        'Katılan Çalışanlar',
        'Başlangıç Tarihi',
        'Başlangıç Saati',
        'Bitiş Tarihi',
        'Bitiş Saati',
        'Süre (Saat)',
        'Kişi Başı Tutar',
        'Toplam Tutar',
        'Para Birimi',
        'Sertifika Bitiş Tarihi',
        'Kalan Gün Sayısı',
        'Sertifika Uyarı Durumu',
        'Katılım Durumu',
        'Genel Durum',
      ];

      rows = sortedData.map((row) => {
        const egitimId = String(row.EGITIM_ID ?? row.ID ?? '');
        const egitimAdi = String(row.EGITIM_ADI ?? '');
        const katilanCalisanlar = String(row.KATILAN_CALISANLAR ?? 'Katılımcı Yok');
        const baslangicTarihi = String(row.BASLANGIC_TARIHI ?? '');
        const baslangicSaati = String(row.BASLANGIC_SAATI ?? '09:00');
        const bitisTarihi = String(row.BITIS_TARIHI ?? '');
        const bitisSaati = String(row.BITIS_SAATI ?? '17:00');
        const sureSaat = String(row.SURE_SAAT ?? '');
        const kisiBasiTutar = String(row.KISI_BASI_TUTAR ?? 'Ücretsiz / 0 TL');
        const toplamTutar = String(row.TOPLAM_TUTAR ?? '0 TL');
        const paraBirimi = String(row.PARA_BIRIMI ?? 'TL');
        const sertifikaBitis = String(row.SERTIFIKA_BITIS_TARIHI ?? row.SON_SERTIFIKA_BITIS ?? '-');
        const kalanGunVal =
          row.SERTIFIKA_KALAN_GUN !== undefined && Number(row.SERTIFIKA_KALAN_GUN) !== -999
            ? `${row.SERTIFIKA_KALAN_GUN} Gün`
            : '-';
        const sertifikaUyariDurumu = String(row.SERTIFIKA_UYARI_DURUMU ?? row.SERTIFIKA_DURUMU ?? '-');
        const katilimDurumu = String(row.KATILIM_DURUMU ?? '-');
        const durum = String(row.DURUM ?? '-');

        return [
          egitimId,
          egitimAdi,
          katilanCalisanlar,
          baslangicTarihi,
          baslangicSaati,
          bitisTarihi,
          bitisSaati,
          sureSaat,
          kisiBasiTutar,
          toplamTutar,
          paraBirimi,
          sertifikaBitis,
          kalanGunVal,
          sertifikaUyariDurumu,
          katilimDurumu,
          durum,
        ];
      });
    } else {
      // General Export for other query results (e.g. DEPT_COMPLETED_STATS)
      headers = columns.map((col) => formatColumnHeader(col));
      rows = sortedData.map((row) =>
        columns.map((col) => String(row[col] ?? ''))
      );
    }

    // Build HTML table content for native Excel cell mapping (.xls)
    const headerHtml = `<tr>${headers
      .map(
        (h) =>
          `<th style="background-color:#1E293B; color:#F8FAFC; font-weight:bold; border:1px solid #334155; padding:8px; text-align:left;">${h}</th>`
      )
      .join('')}</tr>`;

    const bodyHtml = rows
      .map(
        (r) =>
          `<tr>${r
            .map(
              (val) =>
                `<td style="border:1px solid #CBD5E1; padding:6px; font-family:sans-serif;">${val
                  .replace(/&/g, '&amp;')
                  .replace(/</g, '&lt;')
                  .replace(/>/g, '&gt;')}</td>`
            )
            .join('')}</tr>`
      )
      .join('');

    const excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="text/html; charset=UTF-8"/>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Sarkuysan Rapor</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; width: 100%; font-family: sans-serif; }
          th { font-size: 13px; }
          td { font-size: 12px; }
        </style>
      </head>
      <body>
        <table>
          <thead>${headerHtml}</thead>
          <tbody>${bodyHtml}</tbody>
        </table>
      </body>
      </html>
    `;

    // Prepend UTF-8 BOM (\ufeff) so Excel recognizes Turkish characters natively
    const blobContent = '\ufeff' + excelTemplate;

    const blob = new Blob([blobContent], {
      type: 'application/vnd.ms-excel;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `sarkuysan_egitim_katilimlari.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="data-table-container" className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 sm:p-5 shadow-xl mb-8">
      {/* Search and Action Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
        {/* Search Input & Quick Status Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1 max-w-3xl">
          <div className="relative min-w-[240px] flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Canlı Arama (Çalışan adı, departman, eğitim, vb.)..."
              className="w-full pl-9 pr-4 py-2 bg-slate-900/80 border border-slate-700/80 focus:border-amber-500 rounded-lg text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all font-sans"
            />
          </div>

          {/* Seçili Çalışan Temizleme Rozeti (Eğer Çalışan Filtresi Aktifse) */}
          {statusFilter.startsWith('EMP:') && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 border border-amber-300 shadow-md animate-pulse cursor-pointer"
                title="Seçili Çalışan Filtresini Kaldır"
              >
                👤 {statusFilter.substring(4)} ✕
              </button>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2.5 self-end md:self-auto">
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">
            Filtrelenen: <strong className="text-amber-400">{sortedData.length}</strong> / {data.length} Kayıt
          </span>

          {isAdmin && (
            <button
              onClick={exportToCsv}
              disabled={sortedData.length === 0}
              className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 border border-emerald-400/40 transition-all cursor-pointer disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
              title="Eğitim Katılımlarını Excel Olarak İndir (.xls - Ayrı Sütunlar)"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-100" />
              Excel Olarak İndir (.xls)
            </button>
          )}

          <button
            onClick={handlePrint}
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 transition-colors cursor-pointer"
            title="Tabloyu Yazdır / PDF Al"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            Yazdır
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-lg border border-slate-700/80 bg-slate-900/60 shadow-inner">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/90 border-b border-slate-700/80 text-xs font-bold uppercase tracking-wider text-slate-300">
              {columns.map((col) => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  className="py-3 px-4 cursor-pointer hover:text-amber-400 hover:bg-slate-800/50 transition-colors select-none max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap"
                >
                  <div className="flex items-center space-x-1.5">
                    <span>{formatColumnHeader(col)}</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500 opacity-70" />
                  </div>
                </th>
              ))}
              {(isAdmin ||
                onSelectEmployee ||
                onSelectTraining) && (
                <th className="py-3 px-4 text-right font-bold text-amber-400">Eylemler (Actions)</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-xs sm:text-sm text-slate-200">
            {sortedData.length > 0 ? (
              sortedData.map((row, idx) => {
                const isEmployeeTab = activeTab === 'ALL_EMPLOYEES';
                const canOpenProfile = isEmployeeTab && onSelectEmployee && row.ID;
                const isTrainingTab = activeTab === 'ALL_TRAININGS' || activeTab === 'LONGEST_TRAINING';
                const canOpenTrainingDetail = isTrainingTab && onSelectTraining && (row.EGITIM_ID || row.ID);

                return (
                  <tr
                    key={idx}
                    onClick={() => {
                      if (canOpenProfile) {
                        onSelectEmployee(Number(row.ID));
                      } else if (canOpenTrainingDetail) {
                        onSelectTraining(Number(row.EGITIM_ID || row.ID));
                      }
                    }}
                    className={`transition-colors group ${
                      canOpenProfile || canOpenTrainingDetail
                        ? 'cursor-pointer hover:bg-amber-500/10 border-l-2 border-l-transparent hover:border-l-amber-400'
                        : 'hover:bg-slate-800/60'
                    }`}
                  >
                  {columns.map((col) => {
                    const value = row[col];

                    // Render Personel Name as Clickable Link for Detail Modal
                    if (col === 'CALISAN_ADI' || col === 'PERSONEL_ADI' || col === 'AD_SOYAD') {
                      const personName = String(value || `${row.AD || ''} ${row.SOYAD || ''}`.trim() || 'Personel');
                      return (
                        <td key={col} className="py-3 px-4 font-bold max-w-[220px] overflow-hidden text-ellipsis whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPersonDetailRow(row);
                            }}
                            className="text-amber-400 hover:text-amber-300 hover:underline inline-flex items-center gap-1.5 cursor-pointer text-left font-bold"
                            title="Personel Eğitim Detay Kartını Göster"
                          >
                            <User className="w-4 h-4 text-amber-400 shrink-0" />
                            <span>{personName}</span>
                          </button>
                        </td>
                      );
                    }

                    // Render Eğitim Adı
                    if (col === 'EGITIM_ADI') {
                      return (
                        <td key={col} className="py-3 px-4 font-semibold text-slate-100 max-w-[240px] overflow-hidden text-ellipsis whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span>{String(value || 'Eğitim')}</span>
                          </div>
                        </td>
                      );
                    }

                    // Render Belge / Sertifika
                    if (col === 'BELGE_SERTIFIKA') {
                      const fileData = String(row.SERTIFIKA_DOSYA_DATA || row.DOSYA_DATA || row.EVRAK_DATA || row.BASE64 || '');
                      const hasData = Boolean(fileData && fileData.trim().length > 0);
                      const fileName = String(row.SERTIFIKA_DOSYA_ADI || row.DOSYA_ADI || `${row.CALISAN_ADI || 'Sertifika'}_Belgesi.pdf`);

                      return (
                        <td key={col} className="py-3 px-4 max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">
                          {hasData ? (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onOpenCertificate) {
                                    const katilimId = Number(row.KATILIM_ID || row.ID || 100);
                                    onOpenCertificate({
                                      certCode: `SRK-${katilimId}`,
                                      employeeName: String(row.CALISAN_ADI || `${row.AD || ''} ${row.SOYAD || ''}`.trim() || 'Sarkomet Personeli'),
                                      departmentName: String(row.DEPARTMAN || 'Genel'),
                                      trainingName: String(row.EGITIM_ADI || 'İSG Eğitimi'),
                                      trainingHours: Number(row.SURE_SAAT_VAL || 8),
                                      startDate: String(row.BASLANGIC_TARIHI || ''),
                                      certExpiryDate: String(row.SERTIFIKA_GECERLILIK_TARIHI || row.SON_SERTIFIKA_BITIS || ''),
                                      fileData,
                                      fileName,
                                      targetId: Number(row.ID),
                                      targetType: 'KATILIM',
                                    });
                                  } else {
                                    downloadFileFromBase64(fileData, fileName);
                                  }
                                }}
                                className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/20 hover:bg-amber-500/35 text-amber-300 border border-amber-500/50 shadow-sm transition-all cursor-pointer hover:scale-105"
                                title="Sertifika Belgesini Gör / Önizle"
                              >
                                <FileText className="w-3.5 h-3.5 mr-1 text-amber-400" />
                                📄 Gör
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  downloadFileFromBase64(fileData, fileName);
                                }}
                                className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/50 shadow-sm transition-all cursor-pointer hover:scale-105"
                                title="Sertifika Belgesini Doğrudan İndir"
                              >
                                <Download className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                                📥 İndir
                              </button>
                            </div>
                          ) : (
                            <label
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-amber-300 border border-slate-700 cursor-pointer transition-all"
                              title="Bu eğitim kaydına belge yükleyin"
                            >
                              <Upload className="w-3.5 h-3.5 mr-1 text-amber-400" />
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
                                        Number(row.ID),
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
                        </td>
                      );
                    }

                    // Render Status Badge for SERTIFIKA_DURUMU
                    if (col === 'SERTIFIKA_DURUMU') {
                      const kalan = Number(row.SERTIFIKA_KALAN_GUN);
                      const strVal = String(value || row.SERTIFIKA_DURUMU || row.DURUM || '');

                      if (!isNaN(kalan) && kalan !== -999) {
                        if (kalan <= 0) {
                          return (
                            <td key={col} className="py-3 px-4 font-sans whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm">
                                🚫 SÜRESİ DOLDU
                              </span>
                            </td>
                          );
                        } else if (kalan <= 30) {
                          return (
                            <td key={col} className="py-3 px-4 font-sans whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-sm">
                                ⚠️ 30 GÜN KALDI
                              </span>
                            </td>
                          );
                        } else if (kalan <= 90) {
                          return (
                            <td key={col} className="py-3 px-4 font-sans whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm">
                                🔔 90 GÜN KALDI
                              </span>
                            </td>
                          );
                        } else {
                          return (
                            <td key={col} className="py-3 px-4 font-sans whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm">
                                ✅ GEÇERLİ
                              </span>
                            </td>
                          );
                        }
                      }

                      const lower = strVal.toLowerCase();
                      if (lower.includes('doldu') || lower.includes('expired') || lower.includes('🔴')) {
                        return (
                          <td key={col} className="py-3 px-4 font-sans whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm">
                              🚫 SÜRESİ DOLDU
                            </span>
                          </td>
                        );
                      } else if (lower.includes('30') || lower.includes('acil') || lower.includes('🟠')) {
                        return (
                          <td key={col} className="py-3 px-4 font-sans whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-sm">
                              ⚠️ 30 GÜN KALDI
                            </span>
                          </td>
                        );
                      } else if (lower.includes('90') || lower.includes('yaklaş') || lower.includes('🟡')) {
                        return (
                          <td key={col} className="py-3 px-4 font-sans whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm">
                              🔔 90 GÜN KALDI
                            </span>
                          </td>
                        );
                      } else {
                        return (
                          <td key={col} className="py-3 px-4 font-sans whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm">
                              ✅ GEÇERLİ
                            </span>
                          </td>
                        );
                      }
                    }

                    // Render Status Badge for DURUM
                    if (col === 'DURUM') {
                      const strVal = String(value);

                      return (
                        <td key={col} className="py-3 px-4 font-sans whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {strVal === 'Devam Ediyor' && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                                <Clock className="w-3.5 h-3.5 mr-1 text-blue-400" />
                                Devam Ediyor
                              </span>
                            )}
                            {(strVal === 'Geçerli' || strVal === 'Tamamlandı' || strVal === 'Geçerli / Tamamlandı') && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                                {strVal}
                              </span>
                            )}
                            {strVal === 'Sertifika Süresi Doldu' && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                                <XCircle className="w-3.5 h-3.5 mr-1 text-rose-400" />
                                Sertifika Süresi Doldu
                              </span>
                            )}
                            {(strVal === 'Başlamadı' || strVal === 'Planlandı') && (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                <Clock className="w-3.5 h-3.5 mr-1 text-amber-400" />
                                {strVal}
                              </span>
                            )}
                            {strVal !== 'Devam Ediyor' &&
                              strVal !== 'Geçerli' &&
                              strVal !== 'Tamamlandı' &&
                              strVal !== 'Geçerli / Tamamlandı' &&
                              strVal !== 'Sertifika Süresi Doldu' &&
                              strVal !== 'Başlamadı' &&
                              strVal !== 'Planlandı' && (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                                  <XCircle className="w-3.5 h-3.5 mr-1 text-rose-400" />
                                  {strVal || 'Tamamlanmadı'}
                                </span>
                              )}
                          </div>
                        </td>
                      );
                    }

                    // Render Date Range
                    if (col === 'TARIH_ARALIGI') {
                      return (
                        <td key={col} className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 bg-slate-950/60 px-2.5 py-1 rounded-md border border-slate-700/60 text-xs">
                            <Calendar className="w-3.5 h-3.5 text-amber-400" />
                            {String(value)}
                          </span>
                        </td>
                      );
                    }

                    // Render TAMAMLANDI code flag
                    if (col === 'TAMAMLANDI') {
                      const isCompleted = Number(value) === 1;
                      return (
                        <td key={col} className="py-3 px-4 font-mono text-xs text-slate-400 whitespace-nowrap">
                          {isCompleted ? '1 (Tamamlandı)' : '0 (Tamamlanmadı)'}
                        </td>
                      );
                    }

                    // Render Department Badge
                    if (col === 'DEPARTMAN') {
                      return (
                        <td key={col} className="py-3 px-4 font-medium whitespace-nowrap">
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-amber-200 text-xs">
                            {String(value)}
                          </span>
                        </td>
                      );
                    }

                    // Render Certificate Status Badge
                    if (col === 'SERTIFIKA_DURUMU') {
                      const str = String(value || '');
                      let badgeStyle = 'bg-slate-800 text-slate-300 border-slate-700';
                      if (str.includes('Geçerli')) {
                        badgeStyle = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
                      } else if (str.includes('Doldu') || str.includes('Yenilenmeli')) {
                        badgeStyle = 'bg-rose-500/15 text-rose-300 border-rose-500/30';
                      } else if (str.includes('Az Kaldı')) {
                        badgeStyle = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
                      }
                      return (
                        <td key={col} className="py-3 px-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeStyle}`}>
                            {str}
                          </span>
                        </td>
                      );
                    }

                    // Render Certificate Expiry Date
                    if (col === 'SERTIFIKA_GECERLILIK_TARIHI' || col === 'SON_SERTIFIKA_BITIS') {
                      return (
                        <td key={col} className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">
                          {value && value !== '-' ? (
                            <span className="inline-flex items-center gap-1.5 bg-slate-950/60 px-2.5 py-1 rounded-md border border-slate-700/60 text-xs">
                              <Calendar className="w-3.5 h-3.5 text-amber-400" />
                              {formatDateTR(String(value))}
                            </span>
                          ) : (
                            <span className="text-slate-500 italic">-</span>
                          )}
                        </td>
                      );
                    }

                    // Highlight IDs or numbers
                    if (col === 'ID' || col === 'DEPARTMAN_ID') {
                      return (
                        <td key={col} className="py-3 px-4 font-mono font-semibold text-amber-400/90 whitespace-nowrap">
                          #{String(value)}
                        </td>
                      );
                    }

                    // Render Base64 / Document / Raw File Data strings safely
                    if (
                      col.includes('DOSYA_DATA') ||
                      col.includes('EVRAK_DATA') ||
                      col.includes('FILE_DATA') ||
                      col.includes('BASE64') ||
                      col.endsWith('_DATA') ||
                      (typeof value === 'string' &&
                        (value.startsWith('data:') ||
                          value.startsWith('JVBERi') ||
                          (value.length > 50 && !value.includes(' '))))
                    ) {
                      const hasData = Boolean(value && String(value).trim().length > 0);
                      const fileName = row.SERTIFIKA_DOSYA_ADI ? String(row.SERTIFIKA_DOSYA_ADI) : 'Belge.pdf';

                      return (
                        <td key={col} className="py-3 px-4 max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">
                          {hasData ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                downloadFileFromBase64(String(value), fileName);
                              }}
                              className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/50 shadow-sm transition-all cursor-pointer hover:scale-105"
                              title={`Yüklenmiş Orijinal Belgeyi İndir (${fileName})`}
                            >
                              <FileText className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                              📄 Belgeyi Gör / 📥 İndir
                            </button>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-900 text-slate-500 border border-slate-800">
                              ❌ Belge Yok
                            </span>
                          )}
                        </td>
                      );
                    }

                    // Render numeric values
                    if (typeof value === 'number') {
                      return (
                        <td key={col} className="py-3 px-4 font-mono font-bold text-slate-100 max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">
                          {value}
                        </td>
                      );
                    }

                    return (
                      <td key={col} className="py-3 px-4 max-w-[220px] overflow-hidden text-ellipsis whitespace-nowrap">
                        {String(value ?? '-')}
                      </td>
                    );
                  })}

                  {/* Actions column (SADECE TEK BİR Sil butonu veya tabloya özel tek aksiyon seti) */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end space-x-2">
                      {/* Training Participant List & Detail Modal Action */}
                      {canOpenTrainingDetail && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const targetId = Number(row.EGITIM_ID || row.ID);
                            if (targetId && onSelectTraining) onSelectTraining(targetId);
                          }}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 shadow-sm transition-all cursor-pointer hover:scale-105"
                          title="Eğitime Katılan Çalışanları ve Özet Bilgileri Göster"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                          Katılımcıları Göster / Detay
                        </button>
                      )}

                      {/* Employee Profile Detail Modal Action */}
                      {canOpenProfile && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectEmployee(Number(row.ID));
                          }}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 shadow-sm transition-all cursor-pointer hover:scale-105"
                          title="Çalışan Detay Profilini Aç"
                        >
                          <Eye className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                          İncele / Detay
                        </button>
                      )}

                      {/* Single Admin Employee Delete Action */}
                      {onDeleteEmployee && activeTab === 'ALL_EMPLOYEES' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const calisanId = Number(row.ID);
                            const name = `${row.AD || ''} ${row.SOYAD || ''}`.trim() || 'Çalışan';
                            onDeleteEmployee(calisanId, name);
                          }}
                          className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-500/20 hover:bg-rose-500/35 text-rose-300 border border-rose-500/40 shadow-sm transition-all cursor-pointer hover:scale-105"
                          title="Çalışan Kaydını Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1 text-rose-400" />
                          Sil
                        </button>
                      )}

                      {/* Single Participation Delete Action */}
                      {onDeleteParticipation &&
                        activeTab !== 'ALL_EMPLOYEES' &&
                        activeTab !== 'ALL_TRAININGS' &&
                        activeTab !== 'LONGEST_TRAINING' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const katilimId = Number(row.KATILIM_ID || row.ID);
                              const calisanName = String(
                                row.CALISAN_ADI ||
                                  `${row.AD || ''} ${row.SOYAD || ''}`.trim() ||
                                  'Çalışan'
                              );
                              const egitimName = String(row.EGITIM_ADI || 'Eğitim');
                              onDeleteParticipation(
                                katilimId,
                                `${calisanName} - ${egitimName}`
                              );
                            }}
                            className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-500/20 hover:bg-rose-500/35 text-rose-300 border border-rose-500/40 shadow-sm transition-all cursor-pointer hover:scale-105"
                            title="Katılım Kaydını Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1 text-rose-400" />
                            Sil
                          </button>
                        )}

                      {/* Single Admin Training Management Actions (Sil) */}
                      {isAdmin && (activeTab === 'ALL_TRAININGS' || activeTab === 'LONGEST_TRAINING') && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const targetId = Number(row.EGITIM_ID || row.ID);
                              if (targetId && onDeleteTraining) onDeleteTraining(targetId);
                            }}
                            className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-bold bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 shadow-sm transition-all cursor-pointer"
                            title="Eğitimi Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1 text-rose-400" />
                            Sil
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })
            ) : (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="py-12 text-center text-slate-400 font-sans"
                >
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Layers className="w-8 h-8 text-slate-600 mb-1" />
                    <p className="text-sm font-semibold text-slate-300">
                      Aramanıza uygun sonuç bulunamadı.
                    </p>
                    <p className="text-xs text-slate-500">
                      Farklı bir arama kelimesi yazabilir veya filtreleri güncelleyebilirsiniz.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Personel Eğitim Detay Kartı Modalı */}
      {selectedPersonDetailRow && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100">Personel Eğitim Detay Kartı</h3>
                  <p className="text-xs text-amber-400/90 font-medium">Sarkomet A.Ş. İK Kayıt Detayı</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPersonDetailRow(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
                title="Kapat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              {/* 1. Personel Name & ID */}
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">👤 Personel</span>
                <p className="font-bold text-slate-100">
                  {String(selectedPersonDetailRow.CALISAN_ADI || `${selectedPersonDetailRow.AD || ''} ${selectedPersonDetailRow.SOYAD || ''}`.trim() || 'Personel')}
                </p>
                <p className="text-[11px] text-amber-400 font-mono">
                  Sicil No / ID: #{String(selectedPersonDetailRow.CALISAN_ID || selectedPersonDetailRow.ID || '-')}
                </p>
              </div>

              {/* 2. Eğitim Adı */}
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">📚 Eğitim Adı</span>
                <p className="font-bold text-amber-300">
                  {String(selectedPersonDetailRow.EGITIM_ADI || 'İSG / Genel Eğitim')}
                </p>
              </div>

              {/* 3. Başlangıç Tarihi ve Saati */}
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">📅 Eğitim Başlangıç Tarihi ve Saati</span>
                <p className="font-semibold text-slate-200">
                  {String(selectedPersonDetailRow.BASLANGIC_TARIHI_SAATI || `${selectedPersonDetailRow.BASLANGIC_TARIHI || '10.05.2026'} ${selectedPersonDetailRow.BASLANGIC_SAATI ? selectedPersonDetailRow.BASLANGIC_SAATI : '10:00'}`)}
                </p>
              </div>

              {/* 4. Bitiş Tarihi ve Saati */}
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">🏁 Eğitim Bitiş Tarihi ve Saati</span>
                <p className="font-semibold text-slate-200">
                  {String(selectedPersonDetailRow.BITIS_TARIHI_SAATI || `${selectedPersonDetailRow.BITIS_TARIHI || '18.05.2026'} ${selectedPersonDetailRow.BITIS_SAATI ? selectedPersonDetailRow.BITIS_SAATI : '16:30'}`)}
                </p>
              </div>

              {/* 5. Eğitim Süresi */}
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">⏱️ Eğitim Süresi</span>
                <p className="font-bold text-emerald-400">
                  {String(selectedPersonDetailRow.SURE_SAAT || (selectedPersonDetailRow.SURE_SAAT_VAL ? `${selectedPersonDetailRow.SURE_SAAT_VAL} Saat` : '12 Saat'))}
                </p>
              </div>

              {/* 6. Sertifika Son Geçerlilik Tarihi */}
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">📜 Sertifika Son Geçerlilik Tarihi</span>
                <p className="font-bold text-amber-300 font-mono">
                  {String(selectedPersonDetailRow.SERTIFIKA_GECERLILIK_TARIHI || selectedPersonDetailRow.SERTIFIKA_BITIS_TARIHI || '18.05.2028')}
                </p>
              </div>

              {/* 7. Sertifika Durumu */}
              <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1 col-span-1 sm:col-span-2">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">📌 Sertifika Durumu</span>
                <div>
                  {(() => {
                    const kalan = Number(selectedPersonDetailRow.SERTIFIKA_KALAN_GUN);
                    if (!isNaN(kalan) && kalan !== -999) {
                      if (kalan <= 0) {
                        return (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            🚫 SÜRESİ DOLDU ({Math.abs(kalan)} Gün Geçti)
                          </span>
                        );
                      } else if (kalan <= 30) {
                        return (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-orange-500/20 text-orange-300 border border-orange-500/40">
                            ⚠️ 30 GÜN KALDI ({kalan} Gün)
                          </span>
                        );
                      } else if (kalan <= 90) {
                        return (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            🔔 90 GÜN KALDI ({kalan} Gün)
                          </span>
                        );
                      } else {
                        return (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            ✅ GEÇERLİ ({kalan} Gün)
                          </span>
                        );
                      }
                    }
                    return (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                        {String(selectedPersonDetailRow.SERTIFIKA_DURUMU || selectedPersonDetailRow.DURUM || 'Geçerli / Tamamlandı')}
                      </span>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  🖨️ Yazdır / Rapor Al
                </button>
                {(onDeleteParticipation || onDeleteEmployee) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Bu eğitim kaydını silmek istediğinize emin misiniz? Silinen tüm kayıtlar Geri Dönüşüm Kutusu\'na taşınır.')) {
                        const targetId = Number(selectedPersonDetailRow.ID || selectedPersonDetailRow.KATILIM_ID || 0);
                        const info = String(selectedPersonDetailRow.CALISAN_ADI || selectedPersonDetailRow.EGITIM_ADI || 'Eğitim Kaydı');
                        if (onDeleteParticipation) {
                          onDeleteParticipation(targetId, info);
                        } else if (onDeleteEmployee) {
                          onDeleteEmployee(targetId, info);
                        }
                        setSelectedPersonDetailRow(null);
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-500/40 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    🗑️ Sil
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedPersonDetailRow(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
              >
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
