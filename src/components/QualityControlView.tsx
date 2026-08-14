import React, { useState } from 'react';
import {
  FlaskConical,
  PlusCircle,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Printer,
  Download,
  Trash2,
  ShieldCheck,
  Award,
  Layers,
  Sparkles,
  X,
  Filter,
  Activity,
  Zap,
  Info,
  Check,
  Pencil,
  Building2,
  Atom,
  FileCheck,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { QualityTestRecord, SarkometProductType, SarkuysanProductType, SurfaceCondition, QualityApprovalStatus, AuthUser } from '../types';
import { CoACertificateModal } from './CoACertificateModal';
import { ChemicalCoAModal, ChemicalCoARecord, CHEMICAL_ELEMENTS_CONFIG, BUYER_COMPANIES } from './ChemicalCoAModal';

interface QualityControlViewProps {
  records: QualityTestRecord[];
  currentUser: AuthUser;
  onAddRecord: (record: Omit<QualityTestRecord, 'id'>) => void;
  onUpdateRecord?: (record: QualityTestRecord) => void;
  onDeleteRecord: (id: number) => void;
  onRequestConfirm?: (config: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    iconType?: 'delete' | 'restore' | 'warning';
    onConfirm: () => void;
  }) => void;
}

// Sarkomet Real Copper Production Standards & Tolerance Limits
export const SARKOMET_TOLERANCES = {
  DIAMETER: {
    min: 0.05,
    max: 8.00,
    unit: 'mm',
    label: 'Çap / Ölçü Ölçümü',
    helperText: '* Kabul Edilebilir Aralık: Min 0.05 mm - Maks 8.00 mm (İnce Telden Filmaşine)',
  },
  TENSILE_STRENGTH: {
    min: 200,
    max: 280,
    unit: 'N/mm²',
    label: 'Kopma / Çekme Mukavemeti',
    helperText: '* Kabul Edilebilir Aralık: Min 200 N/mm² - Maks 280 N/mm²',
  },
  CONDUCTIVITY: {
    min: 100.0,
    max: 102.5,
    unit: '%IACS',
    label: 'İletkenlik Testi',
    helperText: '* Kabul Edilebilir Aralık: Min %100.0 - Maks %102.5 IACS',
  },
};

export const SARKUYSAN_TOLERANCES = SARKOMET_TOLERANCES;

export const PRODUCT_TYPE_OPTIONS: { type: SarkometProductType; label: string; icon: string }[] = [
  { type: 'FILMASIN_8MM', label: 'Elektrolitik Bakır Filmaşin (8.0 mm)', icon: '🧶' },
  { type: 'INCE_BAKIR_TEL', label: 'İnce / Çok İnce Bakır Tel (0.05 - 0.50 mm)', icon: '🧵' },
  { type: 'BUKULU_ILETKEN', label: 'Bükülü Bakır İletken / Demet Tel', icon: '🪢' },
  { type: 'YASSI_TEL_LAMA', label: 'Yassı Bakır Tel & Lama', icon: '📏' },
  { type: 'DIKISSIS_BORU', label: 'Dikişsiz Bakır Boru', icon: '🧪' },
];

export const QUALITY_INSPECTORS = ['Salih Temiz', 'Yunus Emre Demirhan', 'Hazal Çınar'];

// Initial Mock Chemical CoA Records
const INITIAL_CHEMICAL_COA_RECORDS: ChemicalCoARecord[] = [
  {
    id: 1001,
    buyerCompany: 'Siemens Energy A.Ş.',
    batchNo: 'PRT-2026-CH01',
    productTypeLabel: 'Elektrolitik Bakır Filmaşin (8.0 mm) / Cu-ETP',
    testDate: '2026-08-01',
    testerName: 'Salih Temiz',
    elements: {
      Cu: 99.96,
      Ag: 12.0,
      O: 210,
      P: 3.5,
      As: 1.1,
      Sb: 1.0,
      Bi: 0.4,
      Sn: 1.2,
      Se: 0.7,
      Te: 0.5,
      Cr: 0.6,
      Mn: 0.3,
    },
    status: 'PASS',
  },
  {
    id: 1002,
    buyerCompany: 'Prysmian Kablo A.Ş.',
    batchNo: 'PRT-2026-CH02',
    productTypeLabel: 'İnce / Çok İnce Bakır Tel (0.05 - 0.50 mm)',
    testDate: '2026-08-02',
    testerName: 'Yunus Emre Demirhan',
    elements: {
      Cu: 99.95,
      Ag: 14.2,
      O: 180,
      P: 4.0,
      As: 1.5,
      Sb: 1.2,
      Bi: 0.6,
      Sn: 1.8,
      Se: 0.9,
      Te: 0.7,
      Cr: 0.9,
      Mn: 0.4,
    },
    status: 'PASS',
  },
  {
    id: 1003,
    buyerCompany: 'Schneider Electric Turkey',
    batchNo: 'PRT-2026-CH03',
    productTypeLabel: 'Yassı Bakır Tel & Lama',
    testDate: '2026-08-03',
    testerName: 'Hazal Çınar',
    elements: {
      Cu: 99.88, // Fail < 99.90
      Ag: 28.0, // Fail > 25
      O: 480,  // Fail > 450
      P: 18.0,
      As: 6.2,
      Sb: 4.8,
      Bi: 2.8,
      Sn: 12.0,
      Se: 4.1,
      Te: 3.8,
      Cr: 6.0,
      Mn: 5.5,
    },
    status: 'FAIL',
    rejectionReason: 'Cu saflık oranı (%99.88 < %99.90) ve oksit/gümüş element kirlilik sınırları tolere edilebilir değerlerin üzerindedir.',
  },
];

// Validation Logic Function for Physical/Electrical Tests
export const validateQualityLimits = (
  conductivity: number,
  surface: SurfaceCondition,
  diameter: number,
  tensile: number
): {
  status: QualityApprovalStatus;
  reasons: string[];
  fieldValidity: {
    conductivity: boolean;
    diameter: boolean;
    tensile: boolean;
    surface: boolean;
  };
} => {
  const reasons: string[] = [];
  const fieldValidity = {
    conductivity: true,
    diameter: true,
    tensile: true,
    surface: true,
  };

  if (isNaN(conductivity) || conductivity < SARKUYSAN_TOLERANCES.CONDUCTIVITY.min || conductivity > SARKUYSAN_TOLERANCES.CONDUCTIVITY.max) {
    fieldValidity.conductivity = false;
    reasons.push(
      `İletkenlik değeri standart tolerans aralığının dışındadır (%${conductivity || 0} IACS; kabul aralığı: Min %100.0 - Maks %102.5 IACS).`
    );
  }

  if (isNaN(diameter) || diameter < SARKUYSAN_TOLERANCES.DIAMETER.min || diameter > SARKUYSAN_TOLERANCES.DIAMETER.max) {
    fieldValidity.diameter = false;
    reasons.push(
      `Çap / Ölçü değeri standart tolerans aralığının dışındadır (${diameter || 0} mm; kabul aralığı: Min 0.05 mm - Maks 8.00 mm).`
    );
  }

  if (isNaN(tensile) || tensile < SARKUYSAN_TOLERANCES.TENSILE_STRENGTH.min || tensile > SARKUYSAN_TOLERANCES.TENSILE_STRENGTH.max) {
    fieldValidity.tensile = false;
    reasons.push(
      `Kopma / Çekme Mukavemeti standart tolerans aralığının dışındadır (${tensile || 0} N/mm²; kabul aralığı: Min 200 N/mm² - Maks 280 N/mm²).`
    );
  }

  if (surface === 'OKSITLI') {
    fieldValidity.surface = false;
    reasons.push('Yüzey muayenesinde aşırı pürüzlü / derin oksitli kusur tespit edilmiştir (Uygunsuz Ürün).');
  }

  const status: QualityApprovalStatus = reasons.length === 0 ? 'ONAYLI' : 'UYGUNSUZ_HURDA';

  return {
    status,
    reasons,
    fieldValidity,
  };
};

export const QualityControlView: React.FC<QualityControlViewProps> = ({
  records = [],
  currentUser,
  onAddRecord,
  onUpdateRecord,
  onDeleteRecord,
  onRequestConfirm,
}) => {
  // Main Sub-Tab State
  const [activeSubTab, setActiveSubTab] = useState<'PHYSICAL' | 'CHEMICAL_COA'>('CHEMICAL_COA');

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | QualityApprovalStatus>('ALL');
  const [productTypeFilter, setProductTypeFilter] = useState<string>('ALL');

  // Selected Record for Physical CoA Certificate Modal
  const [selectedCoARecord, setSelectedCoARecord] = useState<QualityTestRecord | null>(null);

  // Modal State for New / Edit Quality Test Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<QualityTestRecord | null>(null);

  // Form Field States for Physical Quality Test
  const [formProductType, setFormProductType] = useState<SarkuysanProductType>('FILMASIN_8MM');
  const [formBatchNo, setFormBatchNo] = useState('');
  const [formProductionLine, setFormProductionLine] = useState('Dökümhane 1. Hat (Sürekli Döküm)');
  const [formTesterName, setFormTesterName] = useState('Salih Temiz');
  const [formConductivity, setFormConductivity] = useState<number | string>(100.2);
  const [formDiameter, setFormDiameter] = useState<number | string>(8.0);
  const [formTensile, setFormTensile] = useState<number | string>(245);
  const [formSurface, setFormSurface] = useState<SurfaceCondition>('UYGUN');
  const [formError, setFormError] = useState('');

  // --- CHEMICAL ANALYSIS COA STATE & FORM ---
  const [chemicalCoARecords, setChemicalCoARecords] = useState<ChemicalCoARecord[]>(INITIAL_CHEMICAL_COA_RECORDS);
  const [selectedChemCoARecord, setSelectedChemCoARecord] = useState<ChemicalCoARecord | null>(null);

  const [chemBuyerCompany, setChemBuyerCompany] = useState<string>(BUYER_COMPANIES[0]);
  const [chemBatchNo, setChemBatchNo] = useState('PRT-2026-CH04');
  const [chemProductTypeLabel, setChemProductTypeLabel] = useState('Elektrolitik Bakır Filmaşin (8.0 mm) / Cu-ETP');
  const [chemTesterName, setChemTesterName] = useState('Salih Temiz');
  const [editingChemId, setEditingChemId] = useState<number | null>(null);

  // 12 Elements State
  const [chemElements, setChemElements] = useState<Record<string, number>>({
    Cu: 99.95,
    Ag: 12.0,
    O: 220,
    P: 4.0,
    As: 1.2,
    Sb: 1.1,
    Bi: 0.5,
    Sn: 1.5,
    Se: 0.8,
    Te: 0.6,
    Cr: 0.8,
    Mn: 0.4,
  });

  const handleElementChange = (symbol: string, value: string) => {
    const num = parseFloat(value);
    setChemElements((prev) => ({
      ...prev,
      [symbol]: isNaN(num) ? 0 : num,
    }));
  };

  const handleElementStep = (symbol: string, direction: 'UP' | 'DOWN') => {
    const cfg = CHEMICAL_ELEMENTS_CONFIG[symbol];
    const step = symbol === 'Cu' ? 0.01 : symbol === 'O' ? 1.0 : 0.1;
    const currentVal = chemElements[symbol] ?? (cfg ? cfg.defaultVal : 0);

    let newVal = direction === 'UP' ? currentVal + step : currentVal - step;
    if (symbol === 'Cu') {
      newVal = parseFloat(newVal.toFixed(2));
    } else if (symbol === 'O') {
      newVal = parseFloat(newVal.toFixed(1));
    } else {
      newVal = parseFloat(newVal.toFixed(2));
    }

    if (newVal < 0) newVal = 0;

    setChemElements((prev) => ({
      ...prev,
      [symbol]: newVal,
    }));
  };

  // Validate all 12 elements against Sarkomet tolerances
  const validateChemicalElements = () => {
    let allPass = true;
    const failures: string[] = [];

    Object.entries(CHEMICAL_ELEMENTS_CONFIG).forEach(([symbol, cfg]) => {
      const val = chemElements[symbol] ?? cfg.defaultVal;
      if (cfg.min !== undefined && val < cfg.min) {
        allPass = false;
        failures.push(`${symbol} (${cfg.name}): ${val} ${cfg.unit} < Min ${cfg.min} ${cfg.unit}`);
      }
      if (val > cfg.max) {
        allPass = false;
        failures.push(`${symbol} (${cfg.name}): ${val} ${cfg.unit} > Max ${cfg.max} ${cfg.unit}`);
      }
    });

    return {
      isPass: allPass,
      status: (allPass ? 'PASS' : 'FAIL') as 'PASS' | 'FAIL',
      rejectionReason: failures.length > 0 ? failures.join('; ') : undefined,
    };
  };

  const currentChemValidation = validateChemicalElements();

  // Create or Update Chemical CoA
  const handleSaveChemicalCoA = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const validation = validateChemicalElements();

    if (editingChemId) {
      const updatedList = chemicalCoARecords.map((rec) => {
        if (rec.id === editingChemId) {
          return {
            ...rec,
            buyerCompany: chemBuyerCompany,
            batchNo: chemBatchNo.trim().toUpperCase(),
            productTypeLabel: chemProductTypeLabel,
            testerName: chemTesterName,
            elements: { ...chemElements },
            status: validation.status,
            rejectionReason: validation.rejectionReason,
          };
        }
        return rec;
      });
      setChemicalCoARecords(updatedList);
      const updatedRec = updatedList.find((r) => r.id === editingChemId) || null;
      setSelectedChemCoARecord(updatedRec);
      setEditingChemId(null);
    } else {
      const newId = chemicalCoARecords.length > 0 ? Math.max(...chemicalCoARecords.map((r) => r.id)) + 1 : 1001;
      const newRecord: ChemicalCoARecord = {
        id: newId,
        buyerCompany: chemBuyerCompany,
        batchNo: chemBatchNo.trim().toUpperCase() || `PRT-2026-CH${newId}`,
        productTypeLabel: chemProductTypeLabel,
        testDate: todayStr,
        testerName: chemTesterName,
        elements: { ...chemElements },
        status: validation.status,
        rejectionReason: validation.rejectionReason,
      };

      setChemicalCoARecords([newRecord, ...chemicalCoARecords]);
      setSelectedChemCoARecord(newRecord);
      setChemBatchNo(`PRT-2026-CH${newId + 1}`);
    }
  };

  // Edit Chemical CoA
  const handleEditChemCoA = (rec: ChemicalCoARecord) => {
    setEditingChemId(rec.id);
    setChemBuyerCompany(rec.buyerCompany);
    setChemBatchNo(rec.batchNo);
    setChemProductTypeLabel(rec.productTypeLabel);
    setChemTesterName(rec.testerName);
    setChemElements({ ...rec.elements });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete Chemical CoA
  const handleDeleteChemCoA = (id: number) => {
    const rec = chemicalCoARecords.find((r) => r.id === id);
    const msg = `"${rec?.batchNo} - ${rec?.buyerCompany}" kimyasal analiz sertifikasını silmek istediğinize emin misiniz?`;

    if (onRequestConfirm) {
      onRequestConfirm({
        title: 'Kimyasal CoA Sertifikasını Sil',
        message: msg,
        confirmText: 'Evet, Sil',
        variant: 'danger',
        iconType: 'delete',
        onConfirm: () => setChemicalCoARecords((prev) => prev.filter((r) => r.id !== id)),
      });
    } else {
      if (window.confirm(msg)) {
        setChemicalCoARecords((prev) => prev.filter((r) => r.id !== id));
      }
    }
  };

  // --- PHYSICAL QUALITY TEST MODAL HANDLERS ---
  const handleOpenAddModal = () => {
    setEditingRecord(null);
    const nextNum = records.length > 0 ? Math.max(...records.map((r) => r.id)) + 1 : 106;
    setFormProductType('FILMASIN_8MM');
    setFormBatchNo(`PRT-2026-0${nextNum}`);
    setFormProductionLine('Dökümhane 1. Hat (Sürekli Döküm)');
    setFormTesterName('Salih Temiz');
    setFormConductivity(100.2);
    setFormDiameter(8.0);
    setFormTensile(245);
    setFormSurface('UYGUN');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleEditClick = (record: QualityTestRecord) => {
    setEditingRecord(record);
    setFormProductType(record.product_type);
    setFormBatchNo(record.batch_no);
    setFormProductionLine(record.production_line);
    setFormTesterName(record.tester_name);
    setFormConductivity(record.conductivity_iacs);
    setFormDiameter(record.diameter_mm);
    setFormTensile(record.tensile_strength_nmm2);
    setFormSurface(record.surface_inspection);
    setFormError('');
    setIsModalOpen(true);
  };

  const currentConductivityNum = Number(formConductivity);
  const currentDiameterNum = Number(formDiameter);
  const currentTensileNum = Number(formTensile);

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formBatchNo.trim()) {
      setFormError('Lütfen Parti / Şarj Numarasını giriniz!');
      return;
    }
    if (!formProductionLine.trim()) {
      setFormError('Lütfen üretim hattı bilgisini giriniz!');
      return;
    }

    const selectedProductConfig = PRODUCT_TYPE_OPTIONS.find((p) => p.type === formProductType);
    const productLabel = selectedProductConfig ? selectedProductConfig.label : formProductType;

    const approvalResult = validateQualityLimits(
      currentConductivityNum,
      formSurface,
      currentDiameterNum,
      currentTensileNum
    );

    const todayStr = new Date().toISOString().split('T')[0];

    if (editingRecord) {
      if (onUpdateRecord) {
        onUpdateRecord({
          ...editingRecord,
          product_type: formProductType,
          product_label: productLabel,
          batch_no: formBatchNo.trim().toUpperCase(),
          production_line: formProductionLine.trim(),
          tester_name: formTesterName,
          conductivity_iacs: currentConductivityNum,
          diameter_mm: currentDiameterNum,
          tensile_strength_nmm2: currentTensileNum,
          surface_inspection: formSurface,
          status: approvalResult.status,
          rejection_reason: approvalResult.reasons.length > 0 ? approvalResult.reasons.join(' ') : undefined,
        });
      }
    } else {
      onAddRecord({
        product_type: formProductType,
        product_label: productLabel,
        batch_no: formBatchNo.trim().toUpperCase(),
        production_line: formProductionLine.trim(),
        tester_name: formTesterName,
        test_date: todayStr,
        conductivity_iacs: currentConductivityNum,
        diameter_mm: currentDiameterNum,
        tensile_strength_nmm2: currentTensileNum,
        surface_inspection: formSurface,
        status: approvalResult.status,
        rejection_reason: approvalResult.reasons.length > 0 ? approvalResult.reasons.join(' ') : undefined,
      });
    }

    setIsModalOpen(false);
  };

  const handleDeleteClick = (record: QualityTestRecord) => {
    const confirmMessage = `"${record.batch_no} - ${record.product_label}" parti nolu kalite test kaydını silip Geri Dönüşüm Kutusu'na taşımak istediğinize emin misiniz?`;

    if (onRequestConfirm) {
      onRequestConfirm({
        title: 'Kalite Test Kaydını Sil',
        message: confirmMessage,
        confirmText: 'Sil ve Çöp Kutusu\'na Taşı',
        variant: 'danger',
        iconType: 'delete',
        onConfirm: () => onDeleteRecord(record.id),
      });
    } else {
      if (window.confirm(confirmMessage)) {
        onDeleteRecord(record.id);
      }
    }
  };

  // Filtered List for Physical Tests
  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      (r.batch_no || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.product_label || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.production_line || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.tester_name || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchesProductType = productTypeFilter === 'ALL' || r.product_type === productTypeFilter;

    return matchesSearch && matchesStatus && matchesProductType;
  });

  const totalCount = records.length;
  const approvedCount = records.filter((r) => r.status === 'ONAYLI').length;
  const scrapCount = records.filter((r) => r.status === 'UYGUNSUZ_HURDA').length;
  const complianceRate = totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Top Navigation Sub-Tabs */}
      <div className="bg-slate-900 border border-slate-800 p-2 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-lg">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('CHEMICAL_COA')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'CHEMICAL_COA'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <Atom className="w-4 h-4" />
            <span>🧪 Ürün Kimyasal Analiz Sertifikası (CoA) & Element Tolerans Yönetimi</span>
          </button>

          <button
            onClick={() => setActiveSubTab('PHYSICAL')}
            className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === 'PHYSICAL'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20'
                : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            <span>📊 Fiziksel & Elektriksel Test Kayıtları ({records.length})</span>
          </button>
        </div>

        <span className="text-[11px] text-amber-400 font-mono font-bold px-3 py-1 bg-amber-500/10 rounded-lg border border-amber-500/20 hidden lg:inline-block">
          Sarkomet A.Ş. Kalite & Spektrometre Laboratuvarı
        </span>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: CHEMICAL ANALYSIS COA & ELEMENT TOLERANCES */}
      {/* ========================================================================= */}
      {activeSubTab === 'CHEMICAL_COA' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 border border-amber-500/30 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-inner shrink-0">
                <Atom className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  Sarkomet Ürün Kimyasal Analiz Sertifikası (CoA) & Element Tolerans Formu
                </h1>
                <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                  Elektrolitik bakır ürünleri (Cu-ETP / Cu-OF) için Cu saflığı ve 11 kritik emisyon elementinin (Ag, O, P, As, Sb, Bi, Sn, Se, Te, Cr, Mn) ppm ölçüm analizi, müşteri firma seçimi ve resmi A4 sertifika üretimi.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-bold uppercase">Kimyasal Sertifika Sayısı</span>
                <span className="text-lg font-black text-amber-300 font-mono">{chemicalCoARecords.length} Sertifika</span>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="border-b border-slate-800 pb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <FileCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {editingChemId ? '✏️ Kimyasal Analiz Sertifikasını Güncelle' : '➕ Yeni Kimyasal Analiz Sertifikası (CoA) Oluştur'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Sarkomet gerçek kimyasal element parametreleri girişi ve anlık validasyon tablosu
                  </p>
                </div>
              </div>

              {editingChemId && (
                <button
                  onClick={() => {
                    setEditingChemId(null);
                    setChemBatchNo('PRT-2026-CH04');
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
                >
                  Vazgeç / Yeniye Dön
                </button>
              )}
            </div>

            {/* Form Fields Section 1: Customer, Product & Inspector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Alıcı Firma Dropdown */}
              <div>
                <label className="block text-xs font-bold text-amber-300 mb-1 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-amber-400" />
                  Alıcı / Müşteri Firma *
                </label>
                <select
                  value={chemBuyerCompany}
                  onChange={(e) => setChemBuyerCompany(e.target.value)}
                  className="w-full bg-slate-950 border border-amber-500/40 rounded-xl px-3 py-2.5 text-xs text-white font-bold focus:outline-none focus:border-amber-400"
                >
                  {BUYER_COMPANIES.map((company) => (
                    <option key={company} value={company}>
                      {company}
                    </option>
                  ))}
                </select>
              </div>

              {/* Parti / Şarj No */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Parti / Şarj / Batch No *
                </label>
                <input
                  type="text"
                  value={chemBatchNo}
                  onChange={(e) => setChemBatchNo(e.target.value)}
                  placeholder="PRT-2026-CH01"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-amber-300 font-mono font-bold focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Ürün Tipi */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Sarkomet Ürün Tipi *
                </label>
                <select
                  value={chemProductTypeLabel}
                  onChange={(e) => setChemProductTypeLabel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="Elektrolitik Bakır Filmaşin (8.0 mm) / Cu-ETP">Elektrolitik Bakır Filmaşin (8.0 mm) / Cu-ETP</option>
                  <option value="İnce / Çok İnce Bakır Tel (0.05 - 0.50 mm)">İnce / Çok İnce Bakır Tel (0.05 - 0.50 mm)</option>
                  <option value="Bükülü Bakır İletken / Demet Tel">Bükülü Bakır İletken / Demet Tel</option>
                  <option value="Yassı Bakır Tel & Lama">Yassı Bakır Tel & Lama</option>
                  <option value="Dikişsiz Bakır Boru (Cu-DHP / Cu-OF)">Dikişsiz Bakır Boru (Cu-DHP / Cu-OF)</option>
                </select>
              </div>

              {/* Test Uzmanı */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Spektrometre Analiz Uzmanı *
                </label>
                <select
                  value={chemTesterName}
                  onChange={(e) => setChemTesterName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  {QUALITY_INSPECTORS.map((inspector) => (
                    <option key={inspector} value={inspector}>
                      {inspector} (Sarkomet Uzmanı)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 12 Elements Input Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h4 className="text-xs font-extrabold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Atom className="w-4 h-4 text-amber-400" />
                  Sarkomet 12 Element Kimyasal Bileşim Ölçüm Değerleri (ppm / %)
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">
                  Cu-ETP Standart Tolerans Sınırları
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {Object.entries(CHEMICAL_ELEMENTS_CONFIG).map(([symbol, cfg]) => {
                  const val = chemElements[symbol] ?? cfg.defaultVal;
                  const isMinOk = cfg.min === undefined || val >= cfg.min;
                  const isMaxOk = val <= cfg.max;
                  const isPass = isMinOk && isMaxOk;

                  return (
                    <div
                      key={symbol}
                      className={`p-2.5 rounded-xl border transition-all ${
                        isPass
                          ? 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
                          : 'bg-rose-950/30 border-rose-500/60 shadow-lg shadow-rose-950/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-black text-amber-300 font-mono">{symbol}</span>
                        <span className={`text-[10px] font-bold font-mono px-1.5 py-0.2 rounded ${
                          isPass ? 'text-emerald-400 bg-emerald-500/10' : 'text-rose-400 bg-rose-500/20'
                        }`}>
                          {isPass ? 'PASS' : 'FAIL'}
                        </span>
                      </div>

                      <div className="text-[10px] text-slate-400 truncate mb-1" title={cfg.name}>
                        {cfg.name}
                      </div>

                      <div className="relative flex items-center">
                        <input
                          type="number"
                          step={symbol === 'Cu' ? '0.01' : symbol === 'O' ? '1' : '0.1'}
                          value={val}
                          onChange={(e) => handleElementChange(symbol, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'ArrowUp') {
                              e.preventDefault();
                              handleElementStep(symbol, 'UP');
                            } else if (e.key === 'ArrowDown') {
                              e.preventDefault();
                              handleElementStep(symbol, 'DOWN');
                            }
                          }}
                          className={`w-full bg-slate-900 border rounded-lg pl-2 pr-12 py-1 text-xs font-mono font-bold text-white focus:outline-none ${
                            isPass ? 'border-slate-700 focus:border-amber-400' : 'border-rose-500 text-rose-300'
                          }`}
                        />

                        <span className="absolute right-6 text-[10px] font-mono text-slate-500 pointer-events-none">
                          {cfg.unit}
                        </span>

                        <div className="absolute right-0.5 flex flex-col items-center justify-center border-l border-slate-800 pl-0.5">
                          <button
                            type="button"
                            onClick={() => handleElementStep(symbol, 'UP')}
                            className="p-0.5 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 rounded transition-colors cursor-pointer"
                            title={`${symbol} değerini artır (+${symbol === 'Cu' ? '0.01' : symbol === 'O' ? '1' : '0.1'})`}
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleElementStep(symbol, 'DOWN')}
                            className="p-0.5 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 rounded transition-colors cursor-pointer"
                            title={`${symbol} değerini azalt (-${symbol === 'Cu' ? '0.01' : symbol === 'O' ? '1' : '0.1'})`}
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <span className="block text-[9px] text-slate-500 font-mono mt-1">
                        {cfg.description}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Dynamic Real-time Summary Table & Validation Status */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-xl font-black text-xs flex items-center gap-2 border ${
                    currentChemValidation.isPass
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  }`}>
                    {currentChemValidation.isPass ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>✅ UYGUN (PASS) - TÜM KİMYASAL ELEMENTLER SARKOMET TOLERANS SINIIRINDA</span>
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="w-4 h-4 text-rose-400" />
                        <span>🔴 UYGUNSUZ (FAIL) - KİMYASAL BİLEŞİM TOLERANS SINIIRINI AŞTI</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Create & Print CoA Button */}
                <button
                  onClick={handleSaveChemicalCoA}
                  className="px-6 py-3 rounded-xl font-extrabold text-xs bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 shadow-xl shadow-amber-500/20 flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
                >
                  <Printer className="w-4 h-4" />
                  <span>📜 Kimyasal Sertifikayı (CoA) Oluştur ve Yazdır</span>
                </button>
              </div>

              {/* Dynamic Real-Time Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-800">
                      <th className="py-2 px-3">Element</th>
                      <th className="py-2 px-3">Bileşen Adı</th>
                      <th className="py-2 px-3 font-mono">Ölçülen Değer</th>
                      <th className="py-2 px-3">Standart İçerik (Sarkomet Limit)</th>
                      <th className="py-2 px-3 text-center">Durum</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono text-xs">
                    {Object.entries(CHEMICAL_ELEMENTS_CONFIG).map(([symbol, cfg]) => {
                      const val = chemElements[symbol] ?? cfg.defaultVal;
                      const isMinOk = cfg.min === undefined || val >= cfg.min;
                      const isMaxOk = val <= cfg.max;
                      const isPass = isMinOk && isMaxOk;

                      return (
                        <tr key={symbol} className="hover:bg-slate-900/50">
                          <td className="py-2 px-3 font-extrabold text-amber-300">{symbol}</td>
                          <td className="py-2 px-3 font-medium text-slate-300 font-sans">{cfg.name}</td>
                          <td className={`py-2 px-3 font-black ${isPass ? 'text-white' : 'text-rose-400'}`}>
                            {val} {cfg.unit}
                          </td>
                          <td className="py-2 px-3 text-slate-400 font-sans text-[11px]">{cfg.description}</td>
                          <td className="py-2 px-3 text-center">
                            {isPass ? (
                              <span className="text-emerald-400 font-bold text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                ✅ UYGUN (PASS)
                              </span>
                            ) : (
                              <span className="text-rose-400 font-extrabold text-[10px] bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/40">
                                🔴 UYGUNSUZ (FAIL)
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
          </div>

          {/* List of Previously Created Chemical Analysis Certificates */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Atom className="w-4 h-4 text-amber-400" />
                Kayıtlı Kimyasal Analiz Sertifikaları (CoA - Chemical Certificate) ({chemicalCoARecords.length} Adet)
              </h3>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                Sarkomet Spektrometre Laboratuvar Kayıtları
              </span>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">Alıcı / Müşteri Firma</th>
                    <th className="py-3.5 px-4">Parti / Şarj No</th>
                    <th className="py-3.5 px-4">Ürün Tip & Özelliği</th>
                    <th className="py-3.5 px-4 text-center">Cu Saflık (%)</th>
                    <th className="py-3.5 px-4 text-center">Oksijen (ppm)</th>
                    <th className="py-3.5 px-4">Analiz Uzmanı</th>
                    <th className="py-3.5 px-4 text-center">Sertifika Kararı</th>
                    <th className="py-3.5 px-4 text-center">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {chemicalCoARecords.length > 0 ? (
                    chemicalCoARecords.map((rec) => {
                      const isPass = rec.status === 'PASS';
                      const cuVal = rec.elements.Cu ?? 99.95;
                      const oVal = rec.elements.O ?? 220;

                      return (
                        <tr key={rec.id} className="hover:bg-slate-800/50 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-cyan-300">
                            <span className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                              {rec.buyerCompany}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono block">Tarih: {rec.testDate}</span>
                          </td>

                          <td className="py-3.5 px-4 font-mono font-bold">
                            <span className="px-2 py-1 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs">
                              {rec.batchNo}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 font-bold text-white">
                            {rec.productTypeLabel}
                          </td>

                          <td className="py-3.5 px-4 text-center font-mono font-extrabold text-emerald-300">
                            %{cuVal}
                          </td>

                          <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-300">
                            {oVal} ppm
                          </td>

                          <td className="py-3.5 px-4 text-slate-300 font-semibold">
                            {rec.testerName}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            {isPass ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                ✅ ONAYLI (PASS)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-rose-500/20 text-rose-300 border border-rose-500/40" title={rec.rejectionReason}>
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                                🔴 UYGUNSUZ (FAIL)
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setSelectedChemCoARecord(rec)}
                                className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/35 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                                title="Kimyasal CoA Sertifikasını Yazdır ve İndir"
                              >
                                <Printer className="w-3.5 h-3.5 text-amber-400" />
                                <span>📜 Kimyasal CoA</span>
                              </button>

                              <button
                                onClick={() => handleEditChemCoA(rec)}
                                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                                title="Sertifika Bilgilerini ve Element Değerlerini Düzenle"
                              >
                                <Pencil className="w-3.5 h-3.5 text-amber-400" />
                                <span>Düzenle</span>
                              </button>

                              {currentUser.role === 'ADMIN' && (
                                <button
                                  onClick={() => handleDeleteChemCoA(rec.id)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600/30 text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 transition-all cursor-pointer"
                                  title="Sertifikayı Sil"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500 text-xs">
                        Kayıtlı kimyasal analiz sertifikası bulunamadı.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: PHYSICAL & ELECTRICAL TEST RECORDS (Existing) */}
      {/* ========================================================================= */}
      {activeSubTab === 'PHYSICAL' && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-purple-950/40 border border-purple-500/30 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-inner shrink-0">
                <FlaskConical className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                  Sarkomet Ürün Kalite Kontrol & Laboratuvar Testleri
                </h1>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Bakır filmaşin, tel, iletken, boru ve lama ürünlerinin ISO 9001 ve IATF 16949 standartlarında elektriksel iletkenlik (%IACS), kopma mukavemeti ve yüzey oksit analiz sonuçları.
                </p>
              </div>
            </div>

            <button
              onClick={handleOpenAddModal}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-extrabold text-xs bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg shadow-purple-950/50 border border-purple-400/40 transition-all hover:scale-[1.02] cursor-pointer shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              ➕ Yeni Ürün Ekle
            </button>
          </div>

          {/* KPI Overview Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Toplam Analiz</span>
                <span className="text-xl font-black text-white font-mono">{totalCount} Parti</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-800 text-slate-300">
                <FlaskConical className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Kalite Onaylı</span>
                <span className="text-xl font-black text-emerald-400 font-mono">{approvedCount} Parti</span>
              </div>
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Uygunsuz / Hurda</span>
                <span className="text-xl font-black text-rose-400 font-mono">{scrapCount} Parti</span>
              </div>
              <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Kalite Onay Oranı</span>
                <span className="text-xl font-black text-purple-300 font-mono">%{complianceRate}</span>
              </div>
              <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400">
                <Award className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Filter and Search Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Parti no, ürün, hat veya uzman ara..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={productTypeFilter}
                onChange={(e) => setProductTypeFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-purple-500/50 cursor-pointer"
              >
                <option value="ALL">Tüm Ürün Tipleri</option>
                {PRODUCT_TYPE_OPTIONS.map((p) => (
                  <option key={p.type} value={p.type}>
                    {p.label}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === 'ALL'
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  Tümü ({totalCount})
                </button>

                <button
                  onClick={() => setStatusFilter('ONAYLI')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === 'ONAYLI'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  Onaylı ({approvedCount})
                </button>

                <button
                  onClick={() => setStatusFilter('UYGUNSUZ_HURDA')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === 'UYGUNSUZ_HURDA'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                  }`}
                >
                  Hurda ({scrapCount})
                </button>
              </div>
            </div>
          </div>

          {/* Quality Control Test Results Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-purple-400" />
                Laboratuvar Test & Kalite Onay Kayıtları ({filteredRecords.length} Parti)
              </h3>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                Sarkomet Bakır Tolerans Validasyonu (Min-Max)
              </span>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">Parti / Şarj No</th>
                    <th className="py-3.5 px-4">Sarkomet Ürün Tipi</th>
                    <th className="py-3.5 px-4">Üretim Hattı / Tesis</th>
                    <th className="py-3.5 px-4 text-center">İletkenlik (%IACS)</th>
                    <th className="py-3.5 px-4 text-center">Çap (mm)</th>
                    <th className="py-3.5 px-4 text-center">Kopma (N/mm²)</th>
                    <th className="py-3.5 px-4 text-center">Yüzey Muayene</th>
                    <th className="py-3.5 px-4">Test Uzmanı</th>
                    <th className="py-3.5 px-4 text-center">Kalite Kararı</th>
                    <th className="py-3.5 px-4 text-center">İşlemler / CoA</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {filteredRecords.length > 0 ? (
                    filteredRecords.map((r) => {
                      const isApproved = r.status === 'ONAYLI';

                      const isConductivityOk = r.conductivity_iacs >= SARKOMET_TOLERANCES.CONDUCTIVITY.min && r.conductivity_iacs <= SARKOMET_TOLERANCES.CONDUCTIVITY.max;
                      const isDiameterOk = r.diameter_mm >= SARKOMET_TOLERANCES.DIAMETER.min && r.diameter_mm <= SARKOMET_TOLERANCES.DIAMETER.max;
                      const isTensileOk = r.tensile_strength_nmm2 >= SARKOMET_TOLERANCES.TENSILE_STRENGTH.min && r.tensile_strength_nmm2 <= SARKOMET_TOLERANCES.TENSILE_STRENGTH.max;

                      return (
                        <tr key={r.id} className="hover:bg-slate-800/50 transition-colors group">
                          <td className="py-3.5 px-4 font-mono font-bold">
                            <span className="inline-flex items-center px-2 py-1 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs">
                              {r.batch_no}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 font-bold text-white">
                            <span className="block">{r.product_label}</span>
                            <span className="text-[10px] text-slate-400 font-mono font-normal">Tarih: {r.test_date}</span>
                          </td>

                          <td className="py-3.5 px-4 text-slate-300 font-medium">
                            {r.production_line}
                          </td>

                          <td className="py-3.5 px-4 text-center font-mono">
                            <span className={`px-2 py-0.5 rounded font-extrabold ${
                              isConductivityOk
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                            }`}>
                              %{r.conductivity_iacs} {!isConductivityOk && '⚠️'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-center font-mono font-bold">
                            <span className={`px-2 py-0.5 rounded ${
                              isDiameterOk
                                ? 'text-slate-200'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            }`}>
                              {r.diameter_mm} mm {!isDiameterOk && '⚠️'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-center font-mono font-bold">
                            <span className={`px-2 py-0.5 rounded ${
                              isTensileOk
                                ? 'text-purple-300'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            }`}>
                              {r.tensile_strength_nmm2} N/mm² {!isTensileOk && '⚠️'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            {r.surface_inspection === 'UYGUN' ? (
                              <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 text-[11px]">
                                Pürüzsüz & Oksitsiz (Uygun)
                              </span>
                            ) : r.surface_inspection === 'PURUZLU' ? (
                              <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-[11px]">
                                Hafif Oksitli (Şartlı Kabul)
                              </span>
                            ) : (
                              <span className="text-rose-400 font-bold bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20 text-[11px]">
                                Aşırı Pürüzlü / Derin Oksitli (Uygunsuz)
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-slate-300 font-bold">
                            {r.tester_name}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            {isApproved ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                ✅ ISO/IATF KALİTE ONAYLI
                              </span>
                            ) : (
                              <span
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm"
                                title={r.rejection_reason || 'Girilen değerler Sarkomet standart tolerans sınırlarının dışındadır!'}
                              >
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                                🔴 UYGUNSUZ ÜRÜN / İZOLASYON & HURDA
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => setSelectedCoARecord(r)}
                                className="px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 border border-purple-500/40 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                                title="Kalite Analiz Sertifikasını (CoA) Göster ve İndir"
                              >
                                <FileText className="w-3.5 h-3.5 text-purple-400" />
                                <span>CoA Sertifikası</span>
                              </button>

                              <button
                                onClick={() => handleEditClick(r)}
                                className="px-2.5 py-1 rounded-lg bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                                title="Test Kaydını ve Ölçümlerini Düzenle / Güncelle"
                              >
                                <Pencil className="w-3.5 h-3.5 text-amber-400" />
                                <span>Düzenle</span>
                              </button>

                              {currentUser.role === 'ADMIN' && (
                                <button
                                  onClick={() => handleDeleteClick(r)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600/30 text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 transition-all cursor-pointer"
                                  title="Kalite Kaydını Sil (Geri Dönüşüm Kutusu'na Taşı)"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-500 text-xs">
                        <FlaskConical className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                        Kriterlere uygun ürün kalite test kaydı bulunamadı.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Physical Quality Test Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl relative my-8 animate-in fade-in zoom-in duration-200">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {editingRecord
                      ? `✏️ Kalite Test Kaydını Düzenle / Güncelle (${editingRecord.batch_no})`
                      : '➕ Yeni Ürün Ekle (Laboratuvar Kalite Test Formu)'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Sarkomet A.Ş. gerçek bakır üretim standartları tolerans validasyonu
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Sarkomet Ürün Tipi Seçimi *
                </label>
                <select
                  value={formProductType}
                  onChange={(e) => setFormProductType(e.target.value as SarkometProductType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500/50"
                >
                  {PRODUCT_TYPE_OPTIONS.map((p) => (
                    <option key={p.type} value={p.type}>
                      {p.icon} {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Parti / Şarj Numarası *
                  </label>
                  <input
                    type="text"
                    value={formBatchNo}
                    onChange={(e) => setFormBatchNo(e.target.value)}
                    placeholder="PRT-2026-101"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-300 font-mono font-bold focus:outline-none focus:border-purple-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Üretim Hattı / Tesis *
                  </label>
                  <input
                    type="text"
                    value={formProductionLine}
                    onChange={(e) => setFormProductionLine(e.target.value)}
                    placeholder="Dökümhane 1. Hat"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Testi Yapan Kalite Kontrol Uzmanı *
                </label>
                <select
                  value={formTesterName}
                  onChange={(e) => setFormTesterName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500/50"
                >
                  {QUALITY_INSPECTORS.map((inspector) => (
                    <option key={inspector} value={inspector}>
                      {inspector}
                    </option>
                  ))}
                </select>
              </div>

              <div className="border-t border-slate-800 pt-3 space-y-3">
                <h4 className="text-xs font-extrabold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-purple-400" />
                  Laboratuvar Ölçüm Değerleri
                </h4>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      İletkenlik (%IACS) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formConductivity}
                      onChange={(e) => setFormConductivity(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-purple-500/50"
                    />
                    <span className="text-[9px] text-slate-500 block mt-0.5 font-mono">Min %100.0</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Çap / Ölçü (mm) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formDiameter}
                      onChange={(e) => setFormDiameter(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-purple-500/50"
                    />
                    <span className="text-[9px] text-slate-500 block mt-0.5 font-mono">0.05 - 8.00 mm</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Kopma Muk. (N/mm²) *
                    </label>
                    <input
                      type="number"
                      value={formTensile}
                      onChange={(e) => setFormTensile(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-purple-500/50"
                    />
                    <span className="text-[9px] text-slate-500 block mt-0.5 font-mono">200 - 280 N/mm²</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">
                    Yüzey Muayene & Oksit Durumu *
                  </label>
                  <select
                    value={formSurface}
                    onChange={(e) => setFormSurface(e.target.value as SurfaceCondition)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500/50"
                  >
                    <option value="UYGUN">Pürüzsüz & Oksitsiz (Kalite Onaylı)</option>
                    <option value="PURUZLU">Hafif Oksitli (Şartlı Kabul)</option>
                    <option value="OKSITLI">Aşırı Pürüzlü / Derin Oksitli (Uygunsuz Product / Hurda)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300"
                >
                  İptal
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingRecord ? 'Test Kaydını Güncelle' : 'Kaydet & Karar Oluştur'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Physical CoA Certificate Modal */}
      {selectedCoARecord && (
        <CoACertificateModal
          record={selectedCoARecord}
          onClose={() => setSelectedCoARecord(null)}
        />
      )}

      {/* Chemical CoA Certificate Modal */}
      {selectedChemCoARecord && (
        <ChemicalCoAModal
          record={selectedChemCoARecord}
          onClose={() => setSelectedChemCoARecord(null)}
        />
      )}
    </div>
  );
};
