import React, { useState } from 'react';
import {
  AuditStandardType,
  Calisan,
  Departman,
  AuthUser,
  SkillMatrixRecord,
  TrashItem,
} from '../types';
import {
  Award,
  Car,
  Ruler,
  ShieldCheck,
  Leaf,
  Printer,
  Download,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Building2,
  Factory,
  FileText,
  Calendar,
  Filter,
  Eye,
  Trash2,
  RefreshCw,
  X,
  Check,
  HardHat,
  Info,
  Clock,
  Sparkles,
} from 'lucide-react';
import { formatDateTR, getTodayString, downloadFileFromBase64 } from '../utils/dateUtils';
import { CertificateData } from './CertificateModal';

interface IsoAuditViewProps {
  calisanlar: Calisan[];
  departmanlar: Departman[];
  skillMatrix: SkillMatrixRecord[];
  currentUser: AuthUser;
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
  onDeleteAuditRecord?: (recordId: number) => void;
}

export interface AuditRecord {
  id: number;
  calisanId?: number;
  personelAdi: string;
  sicilNo: string;
  departmanAdi: string;
  hatAdi: string;
  standardKey: AuditStandardType;
  sertifikaAdi: string;
  verilisTarihi: string;
  gecerlilikTarihi: string;
  hasCertificate: boolean;
  fileData?: string;
  fileName?: string;
  fileType?: string;
  notlar?: string;
}

export const AUDIT_STANDARDS_CONFIG: Record<
  AuditStandardType,
  {
    key: AuditStandardType;
    title: string;
    code: string;
    shortTitle: string;
    icon: React.ReactNode;
    colorClass: string;
    badgeBg: string;
    borderColor: string;
    description: string;
    mandatoryRequirement: string;
  }
> = {
  IATF_16949: {
    key: 'IATF_16949',
    title: '🚗 IATF 16949',
    code: 'IATF 16949:2016',
    shortTitle: 'Otomotiv Kalite Yönetim Sistemi',
    icon: <Car className="w-5 h-5 text-indigo-400" />,
    colorClass: 'text-indigo-400',
    badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    borderColor: 'border-indigo-500/40',
    description: 'Sarkomet otomotiv kablo ve bakır emaye tel tedarik zinciri kalite güvence standardı.',
    mandatoryRequirement: 'Çekirdek Araçlar (APQP, PPAP, FMEA, MSA, SPC) & Bakır Tel Otomotiv Şartnamesi Sertifikası',
  },
  ISO_9001: {
    key: 'ISO_9001',
    title: '📐 ISO 9001',
    code: 'ISO 9001:2015',
    shortTitle: 'Kalite Yönetim Sistemi',
    icon: <Ruler className="w-5 h-5 text-cyan-400" />,
    colorClass: 'text-cyan-400',
    badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    borderColor: 'border-cyan-500/40',
    description: 'Genel bakır mamul üretimi, süreç kontrolü, müşteri memnuniyeti ve iç denetçi uyum yetkinliği.',
    mandatoryRequirement: 'ISO 9001 Kalite Standardı Eğitimi, Kalibrasyon & Süreç Kontrol Sertifikası',
  },
  ISO_45001: {
    key: 'ISO_45001',
    title: '🦺 ISO 45001',
    code: 'ISO 45001:2018',
    shortTitle: 'İş Sağlığı ve Güvenliği Yönetimi',
    icon: <ShieldCheck className="w-5 h-5 text-amber-400" />,
    colorClass: 'text-amber-400',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    borderColor: 'border-amber-500/40',
    description: 'Aşırı sıcak metal fırınları, dökümhane, yüksek gerilim ve kaza önleme İSG yetki belgeleri.',
    mandatoryRequirement: 'ISO 45001 İSG Tehlikeli Saha Sertifikası, Yüksekte Çalışma & Fırın İSG Eğitimi',
  },
  ISO_14001: {
    key: 'ISO_14001',
    title: '🍃 ISO 14001',
    code: 'ISO 14001:2015',
    shortTitle: 'Çevre Yönetim Sistemi',
    icon: <Leaf className="w-5 h-5 text-emerald-400" />,
    colorClass: 'text-emerald-400',
    badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    borderColor: 'border-emerald-500/40',
    description: 'Fabrika emisyonu, kimyasal atık yönetimi, geri dönüşümlü bakır ergitme ve sıfır atık standartları.',
    mandatoryRequirement: 'ISO 14001 Çevre Yönetimi, Kimyasal Atık Güvenliği & Sıfır Atık Belgesi',
  },
};

// Initial Mock Audit Records across all standards
const MOCK_SAMPLE_PDF =
  'data:application/pdf;base64,JVBERi0xLjQKJSDi483NCjEgMCBvYmoKPDwvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFI+PgplbmRvYmoKMiAwIG9iago8PC9UeXBlIC9QYWdlcyAvQ2F0YWxvZyAvS2lkcyBbMyAwIFJdPj4KZW5kb2JqCjMgMCBvYmoKPDwvVHlwZSAvUGFnZSAvUGFyZW50IDIgMCBSIC9NZWRpYUJveCBbMCAwIDYxMiA3OTJdPj4KZW5kb2JqCnhyZWYKMCA0CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAxNSAwMDAwMCBuIAowMDAwMDAwMDY4IDAwMDAwIG4gCjAwMDAwMDAxMjUgMDAwMDAgbiAKdHJhaWxlcgo8PC9TaXplIDQgL1Jvb3QgMSAwIFI+PgpzdGFydHhyZWYKMTkzCiUlRU9GCg==';

export const INITIAL_AUDIT_RECORDS: AuditRecord[] = [
  // IATF 16949
  {
    id: 901,
    calisanId: 8,
    personelAdi: 'Salih Temiz',
    sicilNo: 'SRK-1008',
    departmanAdi: 'Kalite Kontrol Uzmanlığı',
    hatAdi: 'Boru Fabrikası & Tavlama',
    standardKey: 'IATF_16949',
    sertifikaAdi: 'IATF 16949 Core Tools (APQP/PPAP/FMEA) Sertifikası',
    verilisTarihi: '2024-02-10',
    gecerlilikTarihi: '2027-02-10',
    hasCertificate: true,
    fileData: MOCK_SAMPLE_PDF,
    fileName: 'Salih_Temiz_IATF16949_Sertifikasi.pdf',
    fileType: 'application/pdf',
    notlar: 'Otomotiv denetimi için tüm APQP ve PPAP dosyaları onaylandı.',
  },
  {
    id: 902,
    calisanId: 9,
    personelAdi: 'Yunus Emre Demirhan',
    sicilNo: 'SRK-1009',
    departmanAdi: 'Kalite Kontrol / Mikron Analiz',
    hatAdi: 'Aşırı İnce Tel Tesisleri',
    standardKey: 'IATF_16949',
    sertifikaAdi: 'Otomotiv Bakır Emaye Tel Spesifikasyon Sertifikası',
    verilisTarihi: '2024-05-15',
    gecerlilikTarihi: '2027-05-15',
    hasCertificate: true,
    fileData: MOCK_SAMPLE_PDF,
    fileName: 'Yunus_Emre_OtomotivBakır_Sertifikasi.pdf',
    fileType: 'application/pdf',
  },
  {
    id: 903,
    calisanId: 10,
    personelAdi: 'Hazal Çınar',
    sicilNo: 'SRK-1010',
    departmanAdi: 'Kalite Kontrol / Laboratuvar',
    hatAdi: 'Aşırı İnce Tel Tesisleri',
    standardKey: 'IATF_16949',
    sertifikaAdi: 'IATF 16949 MSA & SPC İstatistiksel Süreç Kontrol',
    verilisTarihi: '2023-08-01',
    gecerlilikTarihi: '2026-08-15', // Expires in < 30 days relative to 2026-07-28
    hasCertificate: true,
    fileData: MOCK_SAMPLE_PDF,
    fileName: 'Hazal_Cinar_MSA_SPC_Sertifika.pdf',
    fileType: 'application/pdf',
  },
  {
    id: 904,
    calisanId: 1,
    personelAdi: 'Sabri Çelik',
    sicilNo: 'SRK-1001',
    departmanAdi: 'Bilgi İşlem / Otomasyon',
    hatAdi: 'Dökümhane SCADA Takip',
    standardKey: 'IATF_16949',
    sertifikaAdi: 'Otomotiv Seri İzlenebilirlik & ERP Yazılım Güvenliği',
    verilisTarihi: '2022-01-10',
    gecerlilikTarihi: '2025-01-10', // Expired!
    hasCertificate: true,
    fileData: MOCK_SAMPLE_PDF,
    fileName: 'Sabri_Celik_Izlenebilirlik_Egitimi.pdf',
    fileType: 'application/pdf',
  },
  {
    id: 905,
    calisanId: 3,
    personelAdi: 'Erhan Akbaba',
    sicilNo: 'SRK-1003',
    departmanAdi: 'İSG Uzmanlığı',
    hatAdi: 'Dökümhane Tesisleri',
    standardKey: 'IATF_16949',
    sertifikaAdi: 'IATF 16949 Saha Risk Değerlendirme Sertifikası',
    verilisTarihi: '2024-01-15',
    gecerlilikTarihi: '2027-01-15',
    hasCertificate: true,
    fileData: MOCK_SAMPLE_PDF,
    fileName: 'Erhan_Akbaba_IATF_Risk.pdf',
  },
  {
    id: 906,
    calisanId: 7,
    personelAdi: 'Mustafa Şahin',
    sicilNo: 'SRK-1007',
    departmanAdi: 'İnsan Kaynakları / Saha Sorumlusu',
    hatAdi: 'Filmaşin Teli Çekme',
    standardKey: 'IATF_16949',
    sertifikaAdi: 'Otomotiv Kalite Şartnamesi Yetkinlik Belgesi',
    verilisTarihi: '',
    gecerlilikTarihi: '',
    hasCertificate: false, // Certificate Missing
  },

  // ISO 9001
  {
    id: 907,
    calisanId: 8,
    personelAdi: 'Salih Temiz',
    sicilNo: 'SRK-1008',
    departmanAdi: 'Kalite Kontrol Uzmanlığı',
    hatAdi: 'Boru Fabrikası & Tavlama',
    standardKey: 'ISO_9001',
    sertifikaAdi: 'ISO 9001:2015 İç Denetçi Sertifikası',
    verilisTarihi: '2024-03-01',
    gecerlilikTarihi: '2027-03-01',
    hasCertificate: true,
    fileData: MOCK_SAMPLE_PDF,
    fileName: 'Salih_Temiz_ISO9001_IcDenetci.pdf',
  },
  {
    id: 908,
    calisanId: 5,
    personelAdi: 'Gülşah Yılmaz',
    sicilNo: 'SRK-1005',
    departmanAdi: 'İnsan Kaynakları',
    hatAdi: 'Tüm Fabrika Geneli',
    standardKey: 'ISO_9001',
    sertifikaAdi: 'ISO 9001 Kalite Yönetim Sistemi & Oryantasyon Eğitimi',
    verilisTarihi: '2024-04-10',
    gecerlilikTarihi: '2027-04-10',
    hasCertificate: true,
    fileData: MOCK_SAMPLE_PDF,
    fileName: 'Gulsah_Yilmaz_ISO9001.pdf',
  },
  {
    id: 909,
    calisanId: 6,
    personelAdi: 'Betül Sağın',
    sicilNo: 'SRK-1006',
    departmanAdi: 'İnsan Kaynakları / Eğitim',
    hatAdi: 'Tüm Fabrika Geneli',
    standardKey: 'ISO_9001',
    sertifikaAdi: 'ISO 9001 Dokümantasyon & Süreç Yönetimi',
    verilisTarihi: '2023-08-10',
    gecerlilikTarihi: '2026-08-10', // Expires in < 30 days
    hasCertificate: true,
    fileData: MOCK_SAMPLE_PDF,
    fileName: 'Betul_Sagin_ISO9001_Dokuman.pdf',
  },

  // ISO 45001
  {
    id: 910,
    calisanId: 3,
    personelAdi: 'Erhan Akbaba',
    sicilNo: 'SRK-1003',
    departmanAdi: 'İSG Uzmanlığı',
    hatAdi: 'Dökümhane Tesisleri',
    standardKey: 'ISO_45001',
    sertifikaAdi: 'ISO 45001 Baş Denetçi & Aşırı Sıcak Metal İSG Uzmanlığı',
    verilisTarihi: '2024-01-10',
    gecerlilikTarihi: '2028-01-10',
    hasCertificate: true,
    fileData: MOCK_SAMPLE_PDF,
    fileName: 'Erhan_Akbaba_ISO45001_BasDenetci.pdf',
  },
  {
    id: 911,
    calisanId: 4,
    personelAdi: 'Yılmaz Yiğit',
    sicilNo: 'SRK-1004',
    departmanAdi: 'İSG Denetçisi',
    hatAdi: 'Boru Fabrikası & Tavlama',
    standardKey: 'ISO_45001',
    sertifikaAdi: 'ISO 45001 Basınçlı Kaplar & Fırın Saha Güvenliği',
    verilisTarihi: '2023-11-01',
    gecerlilikTarihi: '2026-11-01',
    hasCertificate: true,
    fileData: MOCK_SAMPLE_PDF,
    fileName: 'Yilmaz_Yigit_ISO45001.pdf',
  },
  {
    id: 912,
    calisanId: 2,
    personelAdi: 'Uras Bozkurt',
    sicilNo: 'SRK-1002',
    departmanAdi: 'Bilgi İşlem / SCADA',
    hatAdi: 'Aşırı İnce Tel Tesisleri',
    standardKey: 'ISO_45001',
    sertifikaAdi: 'ISO 45001 Elektrik Riski & SCADA İSG Sertifikası',
    verilisTarihi: '2021-05-10',
    gecerlilikTarihi: '2024-05-10', // Expired!
    hasCertificate: true,
    fileData: MOCK_SAMPLE_PDF,
    fileName: 'Uras_Bozkurt_ISO45001_Eski.pdf',
  },

  // ISO 14001
  {
    id: 913,
    calisanId: 8,
    personelAdi: 'Salih Temiz',
    sicilNo: 'SRK-1008',
    departmanAdi: 'Kalite Kontrol Uzmanlığı',
    hatAdi: 'Boru Fabrikası & Tavlama',
    standardKey: 'ISO_14001',
    sertifikaAdi: 'ISO 14001 Kimyasal Atık Güvenliği & Emisyon Sertifikası',
    verilisTarihi: '2024-02-20',
    gecerlilikTarihi: '2027-02-20',
    hasCertificate: true,
    fileData: MOCK_SAMPLE_PDF,
    fileName: 'Salih_Temiz_ISO14001.pdf',
  },
  {
    id: 914,
    calisanId: 9,
    personelAdi: 'Yunus Emre Demirhan',
    sicilNo: 'SRK-1009',
    departmanAdi: 'Kalite Kontrol / Mikron Analiz',
    hatAdi: 'Aşırı İnce Tel Tesisleri',
    standardKey: 'ISO_14001',
    sertifikaAdi: 'ISO 14001 Sıfır Atık & Çevre Boyutları Sertifikası',
    verilisTarihi: '2024-03-15',
    gecerlilikTarihi: '2027-03-15',
    hasCertificate: true,
    fileData: MOCK_SAMPLE_PDF,
    fileName: 'YunusEmre_ISO14001.pdf',
  },
];

export const IsoAuditView: React.FC<IsoAuditViewProps> = ({
  calisanlar,
  departmanlar,
  skillMatrix,
  currentUser,
  onOpenCertificate,
  onRequestConfirm,
  onDeleteAuditRecord,
}) => {
  const [selectedStandard, setSelectedStandard] = useState<AuditStandardType>('IATF_16949');
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>(INITIAL_AUDIT_RECORDS);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'COMPLIANT' | 'RISKY' | 'NON_COMPLIANT'>('ALL');
  const [deptFilter, setDeptFilter] = useState<string>('ALL');

  // Print Preview Modal State
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const todayStr = getTodayString();

  // Helper to determine record audit compliance status
  const getAuditStatus = (rec: AuditRecord) => {
    if (!rec.hasCertificate || !rec.gecerlilikTarihi) {
      return {
        key: 'NON_COMPLIANT' as const,
        label: '🚫 UYGUNSUZLUK / UYUMSUZ',
        subLabel: 'Zorunlu Sertifika Eksik veya Yüklenmedi',
        badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      };
    }

    if (rec.gecerlilikTarihi < todayStr) {
      return {
        key: 'NON_COMPLIANT' as const,
        label: '🚫 UYGUNSUZLUK (SÜRESİ DOLMUŞ)',
        subLabel: `Sertifika Süresi Doldu (${formatDateTR(rec.gecerlilikTarihi)})`,
        badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
        badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      };
    }

    // Check if expiry date is within 30 days
    const todayDate = new Date();
    const expiryDate = new Date(rec.gecerlilikTarihi);
    const diffTime = expiryDate.getTime() - todayDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 30) {
      return {
        key: 'RISKY' as const,
        label: '⚠️ RİSKLİ / YENİLEME BEKLİYOR',
        subLabel: `Sertifika Bitişine ${diffDays} Gün Kaldı (${formatDateTR(rec.gecerlilikTarihi)})`,
        badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      };
    }

    return {
      key: 'COMPLIANT' as const,
      label: '✅ DENETİME UYGUN',
      subLabel: `Geçerli Sertifika (${formatDateTR(rec.gecerlilikTarihi)})`,
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    };
  };

  // Filter records for current standard & search / filters
  const standardRecords = auditRecords.filter((r) => r.standardKey === selectedStandard);

  const filteredRecords = standardRecords.filter((rec) => {
    // Dept Filter
    if (deptFilter !== 'ALL' && rec.departmanAdi !== deptFilter) {
      return false;
    }

    // Status Filter
    const st = getAuditStatus(rec);
    if (statusFilter === 'COMPLIANT' && st.key !== 'COMPLIANT') return false;
    if (statusFilter === 'RISKY' && st.key !== 'RISKY') return false;
    if (statusFilter === 'NON_COMPLIANT' && st.key !== 'NON_COMPLIANT') return false;

    // Search Term
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      const nameMatch = rec.personelAdi.toLowerCase().includes(term);
      const sicilMatch = rec.sicilNo.toLowerCase().includes(term);
      const deptMatch = rec.departmanAdi.toLowerCase().includes(term);
      const hatMatch = rec.hatAdi.toLowerCase().includes(term);
      const certMatch = rec.sertifikaAdi.toLowerCase().includes(term);
      return nameMatch || sicilMatch || deptMatch || hatMatch || certMatch;
    }

    return true;
  });

  // Calculate statistics for current standard
  let countCompliant = 0;
  let countRisky = 0;
  let countNonCompliant = 0;

  standardRecords.forEach((r) => {
    const st = getAuditStatus(r);
    if (st.key === 'COMPLIANT') countCompliant++;
    else if (st.key === 'RISKY') countRisky++;
    else countNonCompliant++;
  });

  const totalHeadcount = standardRecords.length;
  const compliancePercentage =
    totalHeadcount > 0 ? Math.round((countCompliant / totalHeadcount) * 100) : 0;

  // Handle Export to CSV / Excel
  const handleExportExcel = () => {
    const stdConfig = AUDIT_STANDARDS_CONFIG[selectedStandard];

    // CSV Header with BOM for Turkish characters
    let csvContent = '\uFEFF';
    csvContent += 'Çalışan Adı;Sicil No;Departman;Görev Yapılan Üretim Hattı;İlgili Sertifika Adı;Sertifika Veriliş Tarihi;Son Geçerlilik Tarihi;Denetim Uyum Durumu\n';

    filteredRecords.forEach((rec) => {
      const st = getAuditStatus(rec);
      const row = [
        `"${rec.personelAdi}"`,
        `"${rec.sicilNo}"`,
        `"${rec.departmanAdi}"`,
        `"${rec.hatAdi}"`,
        `"${rec.sertifikaAdi}"`,
        `"${rec.verilisTarihi ? formatDateTR(rec.verilisTarihi) : '-'}"`,
        `"${rec.gecerlilikTarihi ? formatDateTR(rec.gecerlilikTarihi) : '-'}"`,
        `"${st.label.replace(/[^a-zA-Z0-9-çĞıİöŞüÇğIÖŞÜ /()]/g, '')}"`,
      ].join(';');
      csvContent += row + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Sarkomet_${stdConfig.code.replace(/[\s:]+/g, '_')}_Denetim_Uyum_Raporu.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Safe delete handler with confirm modal
  const handleDeleteClick = (rec: AuditRecord) => {
    onRequestConfirm({
      title: 'Denetim Kaydı Silinsin mi?',
      message: `"${rec.personelAdi}" çalışanının "${AUDIT_STANDARDS_CONFIG[rec.standardKey].code}" denetim uyum kaydı silinecektir. İstediğiniz zaman Geri Dönüşüm Kutusundan geri yükleyebilirsiniz.`,
      confirmText: 'Evet, Sil ve Çöp Kutusuna Taşı',
      cancelText: 'Vazgeç',
      variant: 'danger',
      iconType: 'delete',
      onConfirm: () => {
        setAuditRecords((prev) => prev.filter((r) => r.id !== rec.id));
        if (onDeleteAuditRecord) {
          onDeleteAuditRecord(rec.id);
        }
      },
    });
  };

  const currentConfig = AUDIT_STANDARDS_CONFIG[selectedStandard];

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="flex items-start space-x-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-600 via-cyan-600 to-slate-800 text-white shadow-xl shadow-indigo-950/40 border border-indigo-400/30 shrink-0">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                  Sarkomet A.Ş. Kalite Güvence Yönetimi
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                  Dış Denetim Uyum Hazırlığı
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                ISO / IATF 16949 Kalite Standartları Denetim Modülü
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
                Gelen dış denetçilere (IATF 16949, ISO 9001, ISO 45001, ISO 14001) tek tıkla her çalışanın eğitim, sertifika, geçerlilik tarihi ve üretim hattı bazlı kalite uyum matrisini sunar.
              </p>
            </div>
          </div>

          {/* Action Export Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white shadow-lg shadow-indigo-950/40 border border-indigo-400/30 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>🖨️ Denetim Raporu Al (PDF/Yazdır)</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40 border border-emerald-400/30 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>📊 Excel Olarak İndir</span>
            </button>
          </div>
        </div>
      </div>

      {/* Audit Standard Selector Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(Object.keys(AUDIT_STANDARDS_CONFIG) as AuditStandardType[]).map((key) => {
          const cfg = AUDIT_STANDARDS_CONFIG[key];
          const isSelected = selectedStandard === key;
          const count = auditRecords.filter((r) => r.standardKey === key).length;

          return (
            <button
              key={key}
              onClick={() => setSelectedStandard(key)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                isSelected
                  ? `bg-slate-900 ${cfg.borderColor} ring-2 ring-indigo-500/50 shadow-xl`
                  : 'bg-slate-900/90 hover:bg-slate-800/80 border-slate-800 text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">{cfg.icon}</div>
                <span className="text-xs font-black px-2.5 py-1 rounded-full bg-slate-950 text-slate-200 border border-slate-800">
                  {count} Personel
                </span>
              </div>
              <div>
                <h3 className={`text-sm font-black tracking-tight ${isSelected ? cfg.colorClass : 'text-slate-100'}`}>
                  {cfg.title}
                </h3>
                <p className="text-[11px] font-bold text-slate-400 mt-0.5">{cfg.shortTitle}</p>
                <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{cfg.description}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Audit Standard Requirements & Summary KPI Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Compliance Rate Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {currentConfig.code} Uyum Oranı
            </p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <h2 className="text-2xl font-black text-emerald-400">%{compliancePercentage}</h2>
              <span className="text-xs text-slate-400 font-semibold">({countCompliant} / {totalHeadcount} Onaylı)</span>
            </div>
          </div>
        </div>

        {/* Risky Personnel Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Yenileme Bekleyen (Riskli)
            </p>
            <h2 className="text-2xl font-black text-amber-300 mt-0.5">{countRisky} Çalışan</h2>
            <p className="text-[10px] text-amber-400/80 font-medium mt-0.5">&lt; 30 gün kalan sertifikalar</p>
          </div>
        </div>

        {/* Non-Compliant Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
            <XCircle className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Uygunsuzluk (Uyumsuz)
            </p>
            <h2 className="text-2xl font-black text-rose-400 mt-0.5">{countNonCompliant} Kayıt</h2>
            <p className="text-[10px] text-rose-400/80 font-medium mt-0.5">Eksik / Süresi Dolan Belge</p>
          </div>
        </div>

        {/* Scope Detail Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Denetçi Şartname Kriteri</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
            <strong className={currentConfig.colorClass}>{currentConfig.code}:</strong> {currentConfig.mandatoryRequirement}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-xl">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Çalışan adı, sicil no, departman veya sertifika ara..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {/* Dept Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Building2 className="w-3.5 h-3.5 text-indigo-400" />
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none font-semibold cursor-pointer"
            >
              <option value="ALL">Tüm Departmanlar</option>
              {departmanlar.map((d) => (
                <option key={d.ID} value={d.AD}>
                  {d.AD}
                </option>
              ))}
            </select>
          </div>

          {/* Compliance Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none font-semibold cursor-pointer"
            >
              <option value="ALL">Tüm Uyum Durumları</option>
              <option value="COMPLIANT">✅ DENETİME UYGUN</option>
              <option value="RISKY">⚠️ RİSKLİ / YENİLEME BEKLİYOR</option>
              <option value="NON_COMPLIANT">🚫 UYGUNSUZLUK / UYUMSUZ</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Auditor Compliance Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className={`w-5 h-5 ${currentConfig.colorClass}`} />
            <h3 className="text-sm font-black text-white uppercase tracking-wider">
              {currentConfig.code} DENETÇİ UYUM TABLOSU ({filteredRecords.length} KAYIT)
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Resmi Denetim Kaydı — Son Güncelleme: {getTodayString()}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Çalışan Adı / Sicil No</th>
                <th className="py-3.5 px-4">Departman</th>
                <th className="py-3.5 px-4">Görev Yaptığı Üretim Hattı</th>
                <th className="py-3.5 px-4">İlgili Sertifika Adı</th>
                <th className="py-3.5 px-4">Veriliş Tarihi</th>
                <th className="py-3.5 px-4">Son Geçerlilik Tarihi</th>
                <th className="py-3.5 px-4 text-center">Denetim Uyum Durumu (Audit Status)</th>
                <th className="py-3.5 px-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <Award className="w-10 h-10 mx-auto mb-2 text-slate-600 opacity-60" />
                    <p className="text-sm font-semibold text-slate-400">
                      Seçilen kriterlere uygun denetim uyum kaydı bulunamadı.
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Filtrelerinizi değiştirebilir veya başka bir denetim standardı seçebilirsiniz.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => {
                  const status = getAuditStatus(rec);

                  return (
                    <tr key={rec.id} className="hover:bg-slate-800/40 transition-colors group">
                      {/* Çalışan Adı & Sicil No */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-100 text-sm">{rec.personelAdi}</div>
                        <div className="text-[11px] text-indigo-400 font-mono font-bold mt-0.5">
                          {rec.sicilNo}
                        </div>
                      </td>

                      {/* Departman */}
                      <td className="py-3.5 px-4">
                        <span className="text-slate-300 font-semibold">{rec.departmanAdi}</span>
                      </td>

                      {/* Üretim Hattı */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold bg-slate-950 text-amber-300 border border-slate-800">
                          <Factory className="w-3.5 h-3.5 text-amber-400" />
                          {rec.hatAdi}
                        </span>
                      </td>

                      {/* Sertifika Adı */}
                      <td className="py-3.5 px-4 max-w-[220px]">
                        <div className="font-bold text-slate-200 text-xs truncate" title={rec.sertifikaAdi}>
                          {rec.sertifikaAdi}
                        </div>
                        {rec.notlar && (
                          <div className="text-[10px] text-slate-500 truncate mt-0.5">{rec.notlar}</div>
                        )}
                      </td>

                      {/* Veriliş Tarihi */}
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {rec.verilisTarihi ? formatDateTR(rec.verilisTarihi) : '-'}
                      </td>

                      {/* Son Geçerlilik Tarihi */}
                      <td className="py-3.5 px-4 font-mono font-semibold">
                        {rec.gecerlilikTarihi ? (
                          <span
                            className={
                              rec.gecerlilikTarihi < todayStr
                                ? 'text-rose-400 font-bold'
                                : status.key === 'RISKY'
                                ? 'text-amber-300 font-bold'
                                : 'text-emerald-400 font-bold'
                            }
                          >
                            {formatDateTR(rec.gecerlilikTarihi)}
                          </span>
                        ) : (
                          <span className="text-rose-400 font-bold">Eksik / Yok</span>
                        )}
                      </td>

                      {/* Audit Status Badge */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border shadow-md ${status.badgeBg}`}
                          >
                            {status.key === 'COMPLIANT' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                            {status.key === 'RISKY' && <AlertTriangle className="w-4 h-4 text-amber-400" />}
                            {status.key === 'NON_COMPLIANT' && <XCircle className="w-4 h-4 text-rose-400" />}
                            {status.label}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium mt-1 max-w-[190px] text-center">
                            {status.subLabel}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Certificate */}
                          {rec.hasCertificate && rec.fileData && (
                            <button
                              type="button"
                              onClick={() => {
                                if (onOpenCertificate) {
                                  onOpenCertificate({
                                    certCode: `ISO-${rec.id}`,
                                    employeeName: rec.personelAdi,
                                    trainingName: rec.sertifikaAdi,
                                    fileName: rec.fileName || `${rec.personelAdi}_Sertifika.pdf`,
                                    fileData: rec.fileData!,
                                    fileType: rec.fileType || 'application/pdf',
                                  });
                                } else {
                                  downloadFileFromBase64(
                                    rec.fileData!,
                                    rec.fileName || `${rec.personelAdi}_Sertifika.pdf`
                                  );
                                }
                              }}
                              className="p-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 transition-all cursor-pointer"
                              title="Sertifika Belgesini Görüntüle"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Safe Delete with Confirm Modal */}
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(rec)}
                            className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 hover:border-rose-500 transition-all cursor-pointer"
                            title="Kaydı Güvenli Sil (Çöp Kutusuna Taşı)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Official Audit Report Print Preview Modal */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            {/* Modal Header Bar */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-600 text-white font-black text-xs">
                  SARKOMET A.Ş.
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    Resmi Denetçi Uyum Raporu Onizleme
                  </h3>
                  <p className="text-xs text-slate-400">
                    {currentConfig.code} — {currentConfig.shortTitle}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg transition-all cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Yazdır / PDF Olarak Kaydet</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Sheet Container */}
            <div className="p-6 overflow-y-auto bg-slate-950/40 text-slate-100 font-sans space-y-6">
              {/* Letterhead Header */}
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border-b-4 border-b-indigo-500">
                <div className="text-center sm:text-left">
                  <span className="text-[10px] font-black tracking-widest text-indigo-400 uppercase">
                    SARKOMET BAKIR SANAYİ VE TİCARET A.Ş.
                  </span>
                  <h2 className="text-xl font-black text-white mt-1">
                    KALİTE GÜVENCE VE DIŞ DENETİM UYUM RAPORU
                  </h2>
                  <p className="text-xs text-slate-300 mt-1">
                    Denetim Standardı: <strong className="text-amber-300">{currentConfig.code}</strong> ({currentConfig.shortTitle})
                  </p>
                </div>

                <div className="text-right text-xs text-slate-400 space-y-1 bg-slate-950 p-3 rounded-xl border border-slate-800 shrink-0">
                  <p><strong>Rapor Tarihi:</strong> {formatDateTR(getTodayString())}</p>
                  <p><strong>Rapor No:</strong> SRK-AUD-{selectedStandard}-{Date.now().toString().slice(-4)}</p>
                  <p><strong>Onaylayan:</strong> Kalite Güvence Müdürü</p>
                </div>
              </div>

              {/* KPI Summary Strip */}
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Toplam Personel</span>
                  <h4 className="text-lg font-black text-white mt-0.5">{totalHeadcount}</h4>
                </div>
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl">
                  <span className="text-[10px] text-emerald-400 font-bold uppercase">Denetime Uygun</span>
                  <h4 className="text-lg font-black text-emerald-300 mt-0.5">{countCompliant}</h4>
                </div>
                <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl">
                  <span className="text-[10px] text-amber-400 font-bold uppercase">Yenileme Bekleyen</span>
                  <h4 className="text-lg font-black text-amber-300 mt-0.5">{countRisky}</h4>
                </div>
                <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-xl">
                  <span className="text-[10px] text-rose-400 font-bold uppercase">Uyumsuz / Eksik</span>
                  <h4 className="text-lg font-black text-rose-300 mt-0.5">{countNonCompliant}</h4>
                </div>
              </div>

              {/* Table Sheet */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-[11px]">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 uppercase">
                      <th className="p-2.5">Sicil No</th>
                      <th className="p-2.5">Çalışan Adı</th>
                      <th className="p-2.5">Departman</th>
                      <th className="p-2.5">Üretim Hattı</th>
                      <th className="p-2.5">Sertifika Adı</th>
                      <th className="p-2.5">Son Geçerlilik</th>
                      <th className="p-2.5 text-center">Uyum Durumu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredRecords.map((rec) => {
                      const st = getAuditStatus(rec);
                      return (
                        <tr key={rec.id}>
                          <td className="p-2.5 font-mono text-indigo-400 font-bold">{rec.sicilNo}</td>
                          <td className="p-2.5 font-bold text-white">{rec.personelAdi}</td>
                          <td className="p-2.5 text-slate-300">{rec.departmanAdi}</td>
                          <td className="p-2.5 text-amber-300 font-semibold">{rec.hatAdi}</td>
                          <td className="p-2.5 text-slate-200">{rec.sertifikaAdi}</td>
                          <td className="p-2.5 font-mono">
                            {rec.gecerlilikTarihi ? formatDateTR(rec.gecerlilikTarihi) : 'Eksik'}
                          </td>
                          <td className="p-2.5 text-center font-bold">
                            <span className={`px-2 py-0.5 rounded text-[10px] ${st.badgeClass}`}>
                              {st.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Signature Approval Block */}
              <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs text-slate-400">
                <div className="border-t border-slate-800 pt-3">
                  <p className="font-bold text-slate-200">Sarkomet A.Ş. Kalite Güvence Müdürü</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">İmza & Kaşe</p>
                </div>
                <div className="border-t border-slate-800 pt-3">
                  <p className="font-bold text-slate-200">Dış Denetim / Baş Denetçi Onayı</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">İmza & Tarih</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
