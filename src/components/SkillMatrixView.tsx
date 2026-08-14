import React, { useState } from 'react';
import { SkillMatrixRecord, UretimHattiType, Calisan, Departman, AuthUser } from '../types';
import {
  Factory,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  Clock,
  Flame,
  Binary,
  FlaskConical,
  Zap,
  Trash2,
  FileText,
  Upload,
  Eye,
  Download,
  AlertCircle,
  HardHat,
  Info,
  UserCheck,
  UserX,
  X,
} from 'lucide-react';
import { getTodayString, downloadFileFromBase64 } from '../utils/dateUtils';
import { CertificateData } from './CertificateModal';

interface SkillMatrixViewProps {
  skillMatrix: SkillMatrixRecord[];
  calisanlar: Calisan[];
  departmanlar: Departman[];
  currentUser: AuthUser;
  onAddSkillRecord: (newRecord: Omit<SkillMatrixRecord, 'ID'>) => void;
  onUpdateSkillRecord: (updatedRecord: SkillMatrixRecord) => void;
  onDeleteSkillRecord: (recordId: number) => void;
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

export const PLANT_LINE_CONFIGS: Record<
  UretimHattiType,
  {
    key: UretimHattiType;
    title: string;
    shortName: string;
    icon: React.ReactNode;
    color: string;
    bgGradient: string;
    borderColor: string;
    badgeBg: string;
    badgeText: string;
    mandatoryCert: string;
    description: string;
  }
> = {
  DOKUMHANE: {
    key: 'DOKUMHANE',
    title: '🔥 Dökümhane Tesisleri',
    shortName: 'Dökümhane',
    icon: <Flame className="w-4 h-4 text-orange-400" />,
    color: 'text-orange-400',
    bgGradient: 'from-orange-950/40 via-slate-900 to-slate-900',
    borderColor: 'border-orange-500/30',
    badgeBg: 'bg-orange-500/20',
    badgeText: 'text-orange-300 border-orange-500/40',
    mandatoryCert: 'Aşırı Sıcak Metal İSG Eğitimi & Fırın Kullanım Belgesi',
    description: 'Yüksek sıcaklıkta erimiş bakır döküm ve sürekli döküm fırın hattı.',
  },
  FILMASIN: {
    key: 'FILMASIN',
    title: '🧵 Filmaşin Teli Çekme Hattı',
    shortName: 'Filmaşin Teli',
    icon: <Binary className="w-4 h-4 text-cyan-400" />,
    color: 'text-cyan-400',
    bgGradient: 'from-cyan-950/40 via-slate-900 to-slate-900',
    borderColor: 'border-cyan-500/30',
    badgeBg: 'bg-cyan-500/20',
    badgeText: 'text-cyan-300 border-cyan-500/40',
    mandatoryCert: 'Tel Çekme Makinesi Operatörlüğü & Tavan Vinci Eğitimi',
    description: 'Filmaşin bakır biyet ve kalın tel çekme makineleri operasyon hattı.',
  },
  BORU_TAVLAMA: {
    key: 'BORU_TAVLAMA',
    title: '🧪 Boru Fabrikası & Tavlama',
    shortName: 'Boru & Tavlama',
    icon: <FlaskConical className="w-4 h-4 text-emerald-400" />,
    color: 'text-emerald-400',
    bgGradient: 'from-emerald-950/40 via-slate-900 to-slate-900',
    borderColor: 'border-emerald-500/30',
    badgeBg: 'bg-emerald-500/20',
    badgeText: 'text-emerald-300 border-emerald-500/40',
    mandatoryCert: 'Basınçlı Ekipmanlar & Tavlama Fırını Güvenliği',
    description: 'Dikişsiz bakır boru çekme, tavlama ve basınçlı test ünitesi.',
  },
  INCE_TEL: {
    key: 'INCE_TEL',
    title: '⚡ Aşırı İnce Tel Tesisleri',
    shortName: 'Aşırı İnce Tel',
    icon: <Zap className="w-4 h-4 text-amber-400" />,
    color: 'text-amber-400',
    bgGradient: 'from-amber-950/40 via-slate-900 to-slate-900',
    borderColor: 'border-amber-500/30',
    badgeBg: 'bg-amber-500/20',
    badgeText: 'text-amber-300 border-amber-500/40',
    mandatoryCert: 'Hassas Tel İşleme & İnce Tel İSG Eğitimi',
    description: 'Mikron mertebesinde saç teli inceliğinde süper emaye tel tesisleri.',
  },
};

export const SkillMatrixView: React.FC<SkillMatrixViewProps> = ({
  skillMatrix,
  calisanlar,
  departmanlar,
  currentUser,
  onAddSkillRecord,
  onUpdateSkillRecord,
  onDeleteSkillRecord,
  onOpenCertificate,
  onRequestConfirm,
}) => {
  const [selectedPlantTab, setSelectedPlantTab] = useState<UretimHattiType | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [shiftFilter, setShiftFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ALLOWED' | 'DISALLOWED'>('ALL');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCertRecord, setEditingCertRecord] = useState<SkillMatrixRecord | null>(null);

  // New Record Form State
  const [newPersonName, setNewPersonName] = useState('');
  const [newDeptName, setNewDeptName] = useState('');
  const [newShift, setNewShift] = useState<'08:00 - 16:00' | '16:00 - 24:00' | '24:00 - 08:00'>('08:00 - 16:00');
  const [newPlantKey, setNewPlantKey] = useState<UretimHattiType>('DOKUMHANE');
  const [newHasCert, setNewHasCert] = useState(true);
  const [newCertExpiryDate, setNewCertExpiryDate] = useState('2027-12-31');
  const [newFileData, setNewFileData] = useState<string | undefined>(undefined);
  const [newFileName, setNewFileName] = useState<string | undefined>(undefined);

  // Cert Upload Modal Form State
  const [certFileData, setCertFileData] = useState<string | undefined>(undefined);
  const [certFileName, setCertFileName] = useState<string | undefined>(undefined);
  const [certExpiryInput, setCertExpiryInput] = useState<string>('2027-12-31');

  const todayStr = getTodayString();

  // Helper status determination
  const getRecordStatus = (rec: SkillMatrixRecord) => {
    if (!rec.HAS_CERTIFICATE) {
      return {
        key: 'DISALLOWED' as const,
        label: '🚫 ÇALIŞAMAZ',
        subText: 'Bu hatta yetkisiz / Zorunlu Eğitimi Eksik',
        badgeBg: 'bg-red-500/20 text-red-300 border-red-500/40',
        isAllowed: false,
      };
    }

    if (rec.CERTIFICATE_EXPIRY_DATE && rec.CERTIFICATE_EXPIRY_DATE < todayStr) {
      return {
        key: 'DISALLOWED' as const,
        label: '🚫 ÇALIŞAMAZ (SÜRESİ DOLMUŞ)',
        subText: `Sertifika Süresi Doldu (${rec.CERTIFICATE_EXPIRY_DATE}) - Yetkinlik Eğitimi Yenilenmeli`,
        badgeBg: 'bg-red-500/20 text-red-300 border-red-500/40',
        isAllowed: false,
      };
    }

    return {
      key: 'ALLOWED' as const,
      label: '✅ HATTA ÇALIŞABİLİR',
      subText: `Geçerli Sertifika (${rec.CERTIFICATE_EXPIRY_DATE || 'Süresiz'})`,
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      isAllowed: true,
    };
  };

  // Statistics
  let totalAllowed = 0;
  let totalDisallowed = 0;

  skillMatrix.forEach((rec) => {
    const st = getRecordStatus(rec);
    if (st.isAllowed) totalAllowed++;
    else totalDisallowed++;
  });

  // Filtered List
  const filteredMatrix = skillMatrix.filter((rec) => {
    // Plant Filter
    if (selectedPlantTab !== 'ALL' && rec.HAT_KEY !== selectedPlantTab) {
      return false;
    }

    // Shift Filter
    if (shiftFilter !== 'ALL' && rec.VARDIYA !== shiftFilter) {
      return false;
    }

    // Status Filter
    const st = getRecordStatus(rec);
    if (statusFilter === 'ALLOWED' && !st.isAllowed) return false;
    if (statusFilter === 'DISALLOWED' && st.isAllowed) return false;

    // Search Term
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      const nameMatch = rec.PERSONEL_ADI.toLowerCase().includes(term);
      const deptMatch = rec.DEPARTMAN_ADI.toLowerCase().includes(term);
      const hatMatch = rec.HAT_ADI.toLowerCase().includes(term);
      const certMatch = rec.SERTIFIKA_ADI.toLowerCase().includes(term);
      return nameMatch || deptMatch || hatMatch || certMatch;
    }

    return true;
  });

  // Handle Add Submit
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPersonName.trim()) return;

    const plantConfig = PLANT_LINE_CONFIGS[newPlantKey];

    onAddSkillRecord({
      PERSONEL_ADI: newPersonName.trim(),
      DEPARTMAN_ADI: newDeptName.trim() || 'Üretim Fabrikası',
      VARDIYA: newShift,
      HAT_KEY: newPlantKey,
      HAT_ADI: plantConfig.shortName + ' Tesisleri',
      SERTIFIKA_ADI: plantConfig.mandatoryCert,
      HAS_CERTIFICATE: newHasCert,
      CERTIFICATE_EXPIRY_DATE: newHasCert ? newCertExpiryDate : undefined,
      SERTIFIKA_DOSYA_DATA: newHasCert ? newFileData : undefined,
      SERTIFIKA_DOSYA_ADI: newHasCert ? newFileName : undefined,
      SERTIFIKA_DOSYA_TIPI: newHasCert ? 'application/pdf' : undefined,
    });

    setIsAddModalOpen(false);
    // Reset form
    setNewPersonName('');
    setNewDeptName('');
    setNewFileData(undefined);
    setNewFileName(undefined);
  };

  // Handle Upload Cert Submit
  const handleUploadCertSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCertRecord) return;

    const updated: SkillMatrixRecord = {
      ...editingCertRecord,
      HAS_CERTIFICATE: true,
      CERTIFICATE_EXPIRY_DATE: certExpiryInput || '2027-12-31',
      SERTIFIKA_DOSYA_DATA: certFileData || editingCertRecord.SERTIFIKA_DOSYA_DATA,
      SERTIFIKA_DOSYA_ADI: certFileName || editingCertRecord.SERTIFIKA_DOSYA_ADI || `${editingCertRecord.PERSONEL_ADI.replace(/\s+/g, '_')}_Sertifika.pdf`,
      SERTIFIKA_DOSYA_TIPI: 'application/pdf',
    };

    onUpdateSkillRecord(updated);
    setEditingCertRecord(null);
    setCertFileData(undefined);
    setCertFileName(undefined);
  };

  // Handle Delete with Confirmation Modal
  const handleDeleteClick = (rec: SkillMatrixRecord) => {
    onRequestConfirm({
      title: 'Yetkinlik Kaydı Silinsin mi?',
      message: `"${rec.PERSONEL_ADI}" personelinin "${rec.HAT_ADI}" hattındaki yetkinlik ve sertifika kaydı silinip Çöp Kutusuna taşınacaktır. İstediğiniz zaman Geri Dönüşüm Kutusundan geri yükleyebilirsiniz.`,
      confirmText: 'Evet, Sil ve Çöp Kutusuna Taşı',
      cancelText: 'Vazgeç',
      variant: 'danger',
      iconType: 'delete',
      onConfirm: () => onDeleteSkillRecord(rec.ID),
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, isNewModal: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (isNewModal) {
        setNewFileData(result);
        setNewFileName(file.name);
      } else {
        setCertFileData(result);
        setCertFileName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 p-6 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-orange-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="flex items-start space-x-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-600 via-orange-600 to-amber-800 text-white shadow-xl shadow-amber-950/40 border border-amber-400/30 shrink-0">
              <Factory className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
                  Sarkuysan Tesisleri Saha Güvenliği
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                  Vardiya Bazlı Yetki Denetimi
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Üretim Hattı Yetkinlik Matrisi (Skill Matrix)
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
                Dökümhane, Filmaşin, Boru Fabrikası ve Aşırı İnce Tel tesislerindeki makinelerde çalışacak personelin zorunlu eğitim ve sertifika uygunluğu denetlenir. Sertifikası eksik veya süresi dolan çalışanlar hatta <strong className="text-rose-400">"🚫 ÇALIŞAMAZ"</strong> olarak kısıtlanır.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-extrabold text-xs bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg shadow-orange-950/40 border border-amber-400/30 transition-all hover:scale-[1.02] cursor-pointer shrink-0 self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Yeni Vardiya / Yetkinlik Kaydı Ekle</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
            <Factory className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Toplam Takip Edilen
            </p>
            <h3 className="text-xl font-black text-white mt-0.5">{skillMatrix.length} Personel</h3>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Hatta Çalışabilir
            </p>
            <h3 className="text-xl font-black text-emerald-400 mt-0.5">{totalAllowed} Onaylı</h3>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
            <UserX className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Çalışamaz / Kısıtlı
            </p>
            <h3 className="text-xl font-black text-rose-400 mt-0.5">{totalDisallowed} Engelli</h3>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-orange-500/10 text-orange-400 border border-orange-500/20 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Üretim Hattı Sayısı
            </p>
            <h3 className="text-xl font-black text-amber-300 mt-0.5">4 Ana Tesis</h3>
          </div>
        </div>
      </div>

      {/* Production Line Plant Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
        <button
          type="button"
          onClick={() => setSelectedPlantTab('ALL')}
          className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
            selectedPlantTab === 'ALL'
              ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white border-amber-400/50 shadow-lg shadow-orange-950/30'
              : 'bg-slate-900 hover:bg-slate-800/80 text-slate-300 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <Factory className="w-5 h-5" />
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-950/40 text-slate-200">
              {skillMatrix.length}
            </span>
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider">Tüm Üretim Hatları</h4>
            <p className="text-[10px] text-slate-300/80 mt-0.5">4 Tesis Dahil</p>
          </div>
        </button>

        {(Object.keys(PLANT_LINE_CONFIGS) as UretimHattiType[]).map((key) => {
          const cfg = PLANT_LINE_CONFIGS[key];
          const isSelected = selectedPlantTab === key;
          const count = skillMatrix.filter((m) => m.HAT_KEY === key).length;

          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedPlantTab(key)}
              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? `bg-slate-900 ${cfg.borderColor} ring-2 ring-amber-500/50 shadow-lg`
                  : 'bg-slate-900 hover:bg-slate-800/80 text-slate-300 border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-1.5 rounded-lg ${cfg.badgeBg}`}>{cfg.icon}</div>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-950 text-slate-300">
                  {count}
                </span>
              </div>
              <div>
                <h4 className={`text-xs font-black uppercase tracking-wider ${isSelected ? 'text-amber-300' : 'text-slate-200'}`}>
                  {cfg.shortName}
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">{cfg.mandatoryCert}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Plant Requirements Info Banner */}
      {selectedPlantTab !== 'ALL' && (
        <div
          className={`p-4 rounded-2xl bg-gradient-to-r ${PLANT_LINE_CONFIGS[selectedPlantTab].bgGradient} border ${PLANT_LINE_CONFIGS[selectedPlantTab].borderColor} flex items-start gap-3 shadow-lg`}
        >
          <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 shrink-0 mt-0.5">
            {PLANT_LINE_CONFIGS[selectedPlantTab].icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold text-white">
                {PLANT_LINE_CONFIGS[selectedPlantTab].title} - Zorunlu Sertifika Standartları
              </h3>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              <strong>Zorunlu Sertifika / Eğitim:</strong>{' '}
              <span className="text-amber-300 font-bold">
                {PLANT_LINE_CONFIGS[selectedPlantTab].mandatoryCert}
              </span>
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
              {PLANT_LINE_CONFIGS[selectedPlantTab].description} Bu eğitimi almamış veya belge süresi dolmuş çalışanlar ilgili hatta otomatik olarak kısıtlanır.
            </p>
          </div>
        </div>
      )}

      {/* Filters & Search Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-xl">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Personel adı, departman veya sertifika ara..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          {/* Shift Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={shiftFilter}
              onChange={(e) => setShiftFilter(e.target.value)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none font-semibold cursor-pointer"
            >
              <option value="ALL">Tüm Vardiyalar</option>
              <option value="08:00 - 16:00">08:00 - 16:00 (Gündüz)</option>
              <option value="16:00 - 24:00">16:00 - 24:00 (Akşam)</option>
              <option value="24:00 - 08:00">24:00 - 08:00 (Gece)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent text-slate-200 text-xs focus:outline-none font-semibold cursor-pointer"
            >
              <option value="ALL">Tüm Çalışma İzinleri</option>
              <option value="ALLOWED">✅ Hatta Çalışabilir</option>
              <option value="DISALLOWED">🚫 Çalışamaz / Kısıtlı</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Skill Matrix Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800 uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Personel Adı</th>
                <th className="py-3.5 px-4">Departman / Görev</th>
                <th className="py-3.5 px-4">Vardiya</th>
                <th className="py-3.5 px-4">Bağlı Olduğu Hat</th>
                <th className="py-3.5 px-4">Zorunlu Sertifika Durumu</th>
                <th className="py-3.5 px-4 text-center">Hatta Çalışma Yetkisi</th>
                <th className="py-3.5 px-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredMatrix.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Factory className="w-10 h-10 mx-auto mb-2 text-slate-600 opacity-60" />
                    <p className="text-sm font-semibold text-slate-400">
                      Filtrelere uygun yetkinlik kaydı bulunamadı.
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Yeni bir yetkinlik veya vardiya kaydı ekleyebilir veya filtrelerinizi değiştirebilirsiniz.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredMatrix.map((rec) => {
                  const status = getRecordStatus(rec);
                  const plantCfg = PLANT_LINE_CONFIGS[rec.HAT_KEY];

                  return (
                    <tr
                      key={rec.ID}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Personel Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-100 text-sm">
                          {rec.PERSONEL_ADI}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          ID: #{rec.ID}
                        </div>
                      </td>

                      {/* Departman */}
                      <td className="py-3.5 px-4">
                        <span className="text-slate-300 font-medium">{rec.DEPARTMAN_ADI}</span>
                      </td>

                      {/* Vardiya */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-950 text-amber-300 border border-slate-800">
                          <Clock className="w-3 h-3 text-amber-400" />
                          {rec.VARDIYA}
                        </span>
                      </td>

                      {/* Hat */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-extrabold border ${plantCfg.badgeBg} ${plantCfg.badgeText}`}>
                          {plantCfg.icon}
                          {rec.HAT_ADI}
                        </span>
                      </td>

                      {/* Certificate info */}
                      <td className="py-3.5 px-4">
                        <div>
                          <div className="font-bold text-slate-200 text-xs">
                            {rec.SERTIFIKA_ADI}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {rec.HAS_CERTIFICATE ? (
                              <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Geçerli ({rec.CERTIFICATE_EXPIRY_DATE || 'Süresiz'})
                              </span>
                            ) : (
                              <span className="text-[10px] text-rose-400 font-medium flex items-center gap-1">
                                <XCircle className="w-3 h-3" />
                                Sertifika Eksik / Yüklenmedi
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Work Authorization Status Badge */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider border shadow-md ${status.badgeBg}`}
                          >
                            {status.isAllowed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <XCircle className="w-4 h-4 text-rose-400" />
                            )}
                            {status.label}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium mt-1 max-w-[200px] text-center">
                            {status.subText}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Upload / Edit Cert */}
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCertRecord(rec);
                              setCertExpiryInput(rec.CERTIFICATE_EXPIRY_DATE || '2027-12-31');
                            }}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-slate-700 hover:border-amber-500/50 transition-all cursor-pointer"
                            title="Sertifika Belgesi Yükle / Güncelle"
                          >
                            <Upload className="w-3.5 h-3.5" />
                          </button>

                          {/* View Cert if exists */}
                          {rec.HAS_CERTIFICATE && rec.SERTIFIKA_DOSYA_DATA && (
                            <button
                              type="button"
                              onClick={() => {
                                if (onOpenCertificate) {
                                  onOpenCertificate({
                                    certCode: `SKILL-${rec.ID}`,
                                    employeeName: rec.PERSONEL_ADI,
                                    departmentName: rec.DEPARTMAN_ADI,
                                    trainingName: rec.SERTIFIKA_ADI,
                                    fileName: rec.SERTIFIKA_DOSYA_ADI || 'Sertifika.pdf',
                                    fileData: rec.SERTIFIKA_DOSYA_DATA,
                                    fileType: rec.SERTIFIKA_DOSYA_TIPI || 'application/pdf',
                                  });
                                } else {
                                  downloadFileFromBase64(
                                    rec.SERTIFIKA_DOSYA_DATA!,
                                    rec.SERTIFIKA_DOSYA_ADI || 'Sertifika.pdf'
                                  );
                                }
                              }}
                              className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer"
                              title="Sertifika Belgesini Görüntüle"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Safe Delete button */}
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

      {/* Add Skill Record Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <Factory className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Yeni Vardiya & Yetkinlik Kaydı Ekle</h3>
                  <p className="text-xs text-slate-400">Üretim hattına çalışan tanımlaması ve sertifika kaydı</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Personel Adı Soyadı *
                </label>
                <input
                  type="text"
                  required
                  value={newPersonName}
                  onChange={(e) => setNewPersonName(e.target.value)}
                  placeholder="Örn: Mehmet Caner (Döküm Sorumlusu)"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Departman / Görev Unvanı
                </label>
                <input
                  type="text"
                  value={newDeptName}
                  onChange={(e) => setNewDeptName(e.target.value)}
                  placeholder="Örn: Dökümhane Üretim Takımı"
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Atanacağı Vardiya *
                  </label>
                  <select
                    value={newShift}
                    onChange={(e) => setNewShift(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500 cursor-pointer font-semibold"
                  >
                    <option value="08:00 - 16:00">08:00 - 16:00 (Gündüz)</option>
                    <option value="16:00 - 24:00">16:00 - 24:00 (Akşam)</option>
                    <option value="24:00 - 08:00">24:00 - 08:00 (Gece)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                    Üretim Hattı / Tesis *
                  </label>
                  <select
                    value={newPlantKey}
                    onChange={(e) => setNewPlantKey(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500 cursor-pointer font-semibold"
                  >
                    <option value="DOKUMHANE">🔥 Dökümhane Tesisleri</option>
                    <option value="FILMASIN">🧵 Filmaşin Teli Çekme</option>
                    <option value="BORU_TAVLAMA">🧪 Boru & Tavlama</option>
                    <option value="INCE_TEL">⚡ Aşırı İnce Tel</option>
                  </select>
                </div>
              </div>

              {/* Certificate Status Section */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300">Zorunlu Sertifika Durumu</span>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-300">
                    <input
                      type="checkbox"
                      checked={newHasCert}
                      onChange={(e) => setNewHasCert(e.target.checked)}
                      className="rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-amber-500"
                    />
                    Sertifikası Tam / Geçerli
                  </label>
                </div>

                <p className="text-[11px] text-slate-400">
                  Gereken Zorunlu Sertifika:{' '}
                  <strong className="text-slate-200">{PLANT_LINE_CONFIGS[newPlantKey].mandatoryCert}</strong>
                </p>

                {newHasCert && (
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Sertifika Geçerlilik Bitiş Tarihi
                      </label>
                      <input
                        type="date"
                        value={newCertExpiryDate}
                        onChange={(e) => setNewCertExpiryDate(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Sertifika Dosyası (PDF / Görsel)
                      </label>
                      <input
                        type="file"
                        accept=".pdf,image/*"
                        onChange={(e) => handleFileUpload(e, true)}
                        className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-600 file:text-white hover:file:bg-amber-500 cursor-pointer"
                      />
                      {newFileName && (
                        <p className="text-[10px] text-emerald-400 mt-1 font-mono">
                          ✓ Seçilen: {newFileName}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-950/30 transition-all cursor-pointer"
                >
                  Kaydet & Matrise Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit / Upload Cert Modal */}
      {editingCertRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold text-white">Sertifika Yükle & Onayla</h3>
              </div>
              <button
                onClick={() => setEditingCertRecord(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadCertSubmit} className="space-y-4">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
                <p className="font-bold text-amber-300">{editingCertRecord.PERSONEL_ADI}</p>
                <p className="text-slate-400">Hat: {editingCertRecord.HAT_ADI}</p>
                <p className="text-slate-400">Gereken: {editingCertRecord.SERTIFIKA_ADI}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Yeni Sertifika Bitiş Tarihi
                </label>
                <input
                  type="date"
                  required
                  value={certExpiryInput}
                  onChange={(e) => setCertExpiryInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
                  Sertifika Dosyası (PDF veya Görsel)
                </label>
                <input
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(e) => handleFileUpload(e, false)}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-600 file:text-white hover:file:bg-amber-500 cursor-pointer"
                />
                {certFileName && (
                  <p className="text-[10px] text-emerald-400 mt-1 font-mono">
                    ✓ Yüklenen: {certFileName}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingCertRecord(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                >
                  Vazgeç
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/30 transition-all cursor-pointer"
                >
                  Onayla & Yetkiyi Aç (Kırmızı → Yeşil)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
