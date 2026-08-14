import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  INITIAL_DEPARTMANLAR,
  INITIAL_CALISANLAR,
  INITIAL_EGITIMLER,
  INITIAL_KATILIMLAR,
  INITIAL_TASERONLAR,
  INITIAL_SKILL_MATRIX,
  INITIAL_MACHINES,
  INITIAL_QUALITY_TESTS,
  QUERY_TAB_OPTIONS,
} from './data/mockData';
import { LayoutDashboard, ChevronRight, Save, Download, Upload, HardDrive } from 'lucide-react';
import { Departman, Calisan, Egitim, EgitimKatilim, TaseronPersonel, SkillMatrixRecord, Machine, QualityTestRecord, QueryTabKey, AuthUser, ManualStatusType, TrashItem, ContractorDocType } from './types';
import { executeQueryTab } from './utils/sqlEngine';
import { formatDateRange, calculateAutoCertExpiryDate } from './utils/dateUtils';
import { LoginScreen } from './components/LoginScreen';
import { EmployeePortalView } from './components/EmployeePortalView';
import { Header } from './components/Header';
import { KpiCards } from './components/KpiCards';
import { QueryTabs } from './components/QueryTabs';
import { DataTable } from './components/DataTable';
import { DepartmentOverview } from './components/DepartmentOverview';
import { AddDataModal } from './components/AddDataModal';
import { EditTrainingModal } from './components/EditTrainingModal';
import { EditEmployeeModal } from './components/EditEmployeeModal';
import { EmployeeProfileModal } from './components/EmployeeProfileModal';
import { TrainingDetailModal } from './components/TrainingDetailModal';
import { CertificateModal, CertificateData } from './components/CertificateModal';
import { ContractorView } from './components/ContractorView';
import { AddContractorModal } from './components/AddContractorModal';
import { SkillMatrixView } from './components/SkillMatrixView';
import { IsoAuditView } from './components/IsoAuditView';
import { MachinesView } from './components/MachinesView';
import { MachineDashboardSection } from './components/MachineDashboardSection';
import { QualityControlView } from './components/QualityControlView';
import { RecycleBinView } from './components/RecycleBinView';
import { ConfirmModal } from './components/ConfirmModal';
import { Sidebar } from './components/Sidebar';
import { ToastNotification, ToastState } from './components/ToastNotification';
import { Footer } from './components/Footer';

const LOCAL_STORAGE_KEY = 'sarkuysan_management_system_data_v2';
const TRASH_STORAGE_KEY = 'sarkuysan_management_system_trash_v2';

const getInitialTrashData = (): TrashItem[] => {
  try {
    const saved = localStorage.getItem(TRASH_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Trash localStorage parsing error:', err);
  }
  return [];
};

const getInitialStoredData = () => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (
        Array.isArray(parsed.calisanlar) &&
        Array.isArray(parsed.egitimler) &&
        Array.isArray(parsed.katilimlar)
      ) {
        return {
          departmanlar: Array.isArray(parsed.departmanlar) ? parsed.departmanlar : INITIAL_DEPARTMANLAR,
          calisanlar: parsed.calisanlar,
          egitimler: parsed.egitimler,
          katilimlar: parsed.katilimlar,
          taseronlar: Array.isArray(parsed.taseronlar) ? parsed.taseronlar : INITIAL_TASERONLAR,
          skillMatrix: Array.isArray(parsed.skillMatrix) ? parsed.skillMatrix : INITIAL_SKILL_MATRIX,
          machines: Array.isArray(parsed.machines) ? parsed.machines : INITIAL_MACHINES,
          qualityRecords: Array.isArray(parsed.qualityRecords) ? parsed.qualityRecords : INITIAL_QUALITY_TESTS,
        };
      }
    }
  } catch (err) {
    console.error('LocalStorage parsing error:', err);
  }
  return {
    departmanlar: INITIAL_DEPARTMANLAR,
    calisanlar: INITIAL_CALISANLAR,
    egitimler: INITIAL_EGITIMLER,
    katilimlar: INITIAL_KATILIMLAR,
    taseronlar: INITIAL_TASERONLAR,
    skillMatrix: INITIAL_SKILL_MATRIX,
    machines: INITIAL_MACHINES,
    qualityRecords: INITIAL_QUALITY_TESTS,
  };
};

export default function App() {
  useEffect(() => {
    document.title = 'Sarkomet A.Ş. - İnsan Kaynakları & Kalite Yönetim Portalı';
  }, []);

  // Auth state - starts null to force Login screen
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  // Initial stored data loader
  const initialStored = useMemo(() => getInitialStoredData(), []);

  // State for database tables
  const [departmanlar, setDepartmanlar] = useState<Departman[]>(initialStored.departmanlar);
  const [calisanlar, setCalisanlar] = useState<Calisan[]>(initialStored.calisanlar);
  const [egitimler, setEgitimler] = useState<Egitim[]>(initialStored.egitimler);
  const [katilimlar, setKatilimlar] = useState<EgitimKatilim[]>(initialStored.katilimlar);
  const [taseronlar, setTaseronlar] = useState<TaseronPersonel[]>(initialStored.taseronlar);
  const [skillMatrix, setSkillMatrix] = useState<SkillMatrixRecord[]>(initialStored.skillMatrix);
  const [machines, setMachines] = useState<Machine[]>(initialStored.machines);
  const [qualityRecords, setQualityRecords] = useState<QualityTestRecord[]>(initialStored.qualityRecords);
  const [trashItems, setTrashItems] = useState<TrashItem[]>(getInitialTrashData);

  // Modal states for contractor personnel
  const [isAddContractorModalOpen, setIsAddContractorModalOpen] = useState(false);

  // Confirmation Dialog State
  const [confirmModalConfig, setConfirmModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    iconType?: 'delete' | 'restore' | 'warning';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const openConfirmModal = (config: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    iconType?: 'delete' | 'restore' | 'warning';
    onConfirm: () => void;
  }) => {
    setConfirmModalConfig({
      isOpen: true,
      ...config,
    });
  };

  // Hidden File Input ref for Dashboard Restore Button
  const dashboardFileInputRef = useRef<HTMLInputElement | null>(null);

  // Auto-save data to LocalStorage whenever tables change
  useEffect(() => {
    try {
      const payload = {
        version: '1.0',
        lastSavedAt: new Date().toISOString(),
        departmanlar,
        calisanlar,
        egitimler,
        katilimlar,
        taseronlar,
        skillMatrix,
        machines,
        qualityRecords,
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
    } catch (err) {
      console.error('LocalStorage save error:', err);
    }
  }, [departmanlar, calisanlar, egitimler, katilimlar, taseronlar, skillMatrix, machines, qualityRecords]);

  // Auto-save trashItems to TRASH_STORAGE_KEY
  useEffect(() => {
    try {
      localStorage.setItem(TRASH_STORAGE_KEY, JSON.stringify(trashItems));
    } catch (err) {
      console.error('Trash LocalStorage save error:', err);
    }
  }, [trashItems]);

  // Contractor Handlers
  const handleAddContractor = (newContractor: Omit<TaseronPersonel, 'ID'>) => {
    const newId = taseronlar.length > 0 ? Math.max(...taseronlar.map((t) => t.ID)) + 1 : 301;
    const autoCode = newContractor.TASERON_CODE || `TSR-${101 + taseronlar.length}`;
    const autoPass = newContractor.PASSWORD || '1234';
    const item: TaseronPersonel = {
      ID: newId,
      TASERON_CODE: autoCode,
      PASSWORD: autoPass,
      ...newContractor,
    };
    setTaseronlar((prev) => [item, ...prev]);
    setToast({
      message: `🎉 Yeni Taşeron Kaydedildi! ID: ${autoCode} | Şifre: ${autoPass} | Firma: ${newContractor.FIRMA_ADI}`,
      type: 'success',
    });
  };

  const handleDeleteContractor = (id: number) => {
    const found = taseronlar.find((t) => t.ID === id);
    if (!found) return;

    const titleStr = `${found.PERSONEL_ADI_SOYADI} (${found.FIRMA_ADI})`;

    openConfirmModal({
      title: 'Taşeron Kaydını Sil (Çöp Kutusu)',
      message: `Seçilen "${titleStr}" taşeron personel kaydı ve yüklenmiş tüm belgeler silinerek Geri Dönüşüm Kutusu'na taşınacaktır. Devam etmek istiyor musunuz?`,
      confirmText: 'Evet, Sil (Çöp Kutusu\'na Taşı)',
      cancelText: 'Vazgeç',
      variant: 'warning',
      iconType: 'delete',
      onConfirm: () => {
        setTaseronlar((prev) => prev.filter((t) => t.ID !== id));

        const hasAnyDoc = Boolean(
          found.KIMLIK_DOSYA_DATA ||
            found.SAGLIK_DOSYA_DATA ||
            found.ISG_DOSYA_DATA ||
            found.SABIKA_DOSYA_DATA ||
            found.DOSYA_DATA
        );

        const newTrashItem: TrashItem = {
          id: `trash_taseron_${id}_${Date.now()}`,
          originalId: id,
          type: 'TASERON',
          title: found.PERSONEL_ADI_SOYADI,
          subtitle: `${found.FIRMA_ADI} — ${found.GOREV_IS}`,
          deletedAt: new Date().toLocaleString('tr-TR'),
          hasDocument: hasAnyDoc,
          documentName: found.KIMLIK_DOSYA_ADI || found.SAGLIK_DOSYA_ADI || found.ISG_DOSYA_ADI || found.SABIKA_DOSYA_ADI || found.DOSYA_ADI,
          payload: {
            taseron: found,
          },
        };

        setTrashItems((prev) => [newTrashItem, ...prev]);

        setToast({
          message: `"${found.PERSONEL_ADI_SOYADI}" kaydı Geri Dönüşüm Kutusu'na taşındı.`,
          type: 'info',
        });
      },
    });
  };

  const handleUploadContractorDoc = (
    id: number,
    docType: ContractorDocType,
    fileData: string,
    fileName: string,
    fileType: string
  ) => {
    setTaseronlar((prev) =>
      prev.map((t) => {
        if (t.ID !== id) return t;

        const updated = { ...t };
        if (docType === 'KIMLIK') {
          updated.KIMLIK_DOSYA_DATA = fileData;
          updated.KIMLIK_DOSYA_ADI = fileName;
          updated.KIMLIK_DOSYA_TIPI = fileType;
        } else if (docType === 'SAGLIK') {
          updated.SAGLIK_DOSYA_DATA = fileData;
          updated.SAGLIK_DOSYA_ADI = fileName;
          updated.SAGLIK_DOSYA_TIPI = fileType;
        } else if (docType === 'ISG') {
          updated.ISG_DOSYA_DATA = fileData;
          updated.ISG_DOSYA_ADI = fileName;
          updated.ISG_DOSYA_TIPI = fileType;
          updated.DOSYA_DATA = fileData;
          updated.DOSYA_ADI = fileName;
          updated.DOSYA_TIPI = fileType;
        } else if (docType === 'SABIKA') {
          updated.SABIKA_DOSYA_DATA = fileData;
          updated.SABIKA_DOSYA_ADI = fileName;
          updated.SABIKA_DOSYA_TIPI = fileType;
        }

        return updated;
      })
    );

    setToast({
      message: `Evrak [${fileName}] başarıyla yüklendi.`,
      type: 'success',
    });
  };

  const handleRemoveContractorDoc = (id: number, docType: ContractorDocType) => {
    setTaseronlar((prev) =>
      prev.map((t) => {
        if (t.ID !== id) return t;

        const updated = { ...t };
        if (docType === 'KIMLIK') {
          delete updated.KIMLIK_DOSYA_DATA;
          delete updated.KIMLIK_DOSYA_ADI;
          delete updated.KIMLIK_DOSYA_TIPI;
        } else if (docType === 'SAGLIK') {
          delete updated.SAGLIK_DOSYA_DATA;
          delete updated.SAGLIK_DOSYA_ADI;
          delete updated.SAGLIK_DOSYA_TIPI;
        } else if (docType === 'ISG') {
          delete updated.ISG_DOSYA_DATA;
          delete updated.ISG_DOSYA_ADI;
          delete updated.ISG_DOSYA_TIPI;
          delete updated.DOSYA_DATA;
          delete updated.DOSYA_ADI;
          delete updated.DOSYA_TIPI;
        } else if (docType === 'SABIKA') {
          delete updated.SABIKA_DOSYA_DATA;
          delete updated.SABIKA_DOSYA_ADI;
          delete updated.SABIKA_DOSYA_TIPI;
        }

        return updated;
      })
    );

    setToast({
      message: 'Evrak kaldırıldı. Saha giriş onay durumu güncellendi.',
      type: 'warning',
    });
  };

  // Skill Matrix Handlers
  const handleAddSkillRecord = (newRec: Omit<SkillMatrixRecord, 'ID'>) => {
    const newId = skillMatrix.length > 0 ? Math.max(...skillMatrix.map((s) => s.ID)) + 1 : 501;
    const item: SkillMatrixRecord = { ID: newId, ...newRec };
    setSkillMatrix((prev) => [item, ...prev]);
    setToast({
      message: `"${newRec.PERSONEL_ADI}" yetkinlik kaydı "${newRec.HAT_ADI}" hattına başarıyla eklendi!`,
      type: 'success',
    });
  };

  const handleUpdateSkillRecord = (updatedRec: SkillMatrixRecord) => {
    setSkillMatrix((prev) => prev.map((s) => (s.ID === updatedRec.ID ? updatedRec : s)));
    setToast({
      message: `"${updatedRec.PERSONEL_ADI}" yetkinlik ve sertifika bilgisi güncellendi. Hatta çalışma izni onaylandı!`,
      type: 'success',
    });
  };

  const handleDeleteSkillRecord = (recordId: number) => {
    const found = skillMatrix.find((s) => s.ID === recordId);
    if (!found) return;

    setSkillMatrix((prev) => prev.filter((s) => s.ID !== recordId));

    const newTrashItem: TrashItem = {
      id: `trash_yetkinlik_${recordId}_${Date.now()}`,
      originalId: recordId,
      type: 'YETKINLIK',
      title: `${found.PERSONEL_ADI} — ${found.HAT_ADI}`,
      subtitle: `Vardiya: ${found.VARDIYA} — Sertifika: ${found.SERTIFIKA_ADI}`,
      deletedAt: new Date().toLocaleString('tr-TR'),
      hasDocument: Boolean(found.SERTIFIKA_DOSYA_DATA),
      documentName: found.SERTIFIKA_DOSYA_ADI,
      payload: {
        yetkinlik: found,
      },
    };

    setTrashItems((prev) => [newTrashItem, ...prev]);

    setToast({
      message: `"${found.PERSONEL_ADI}" yetkinlik kaydı Geri Dönüşüm Kutusu'na taşındı.`,
      type: 'info',
    });
  };

  // Machine Handlers
  const handleAddMachine = (newMachine: Omit<Machine, 'id'>) => {
    const newId = machines.length > 0 ? Math.max(...machines.map((m) => m.id)) + 1 : 101;
    const item: Machine = { id: newId, ...newMachine };
    setMachines((prev) => [...prev, item]);
    setToast({
      message: `Yeni makine "${item.machine_code} - ${item.machine_name}" sisteme başarıyla eklendi!`,
      type: 'success',
    });
  };

  const handleUpdateMachine = (updatedMachine: Machine) => {
    setMachines((prev) => prev.map((m) => (m.id === updatedMachine.id ? updatedMachine : m)));
    setToast({
      message: `"${updatedMachine.machine_code} - ${updatedMachine.machine_name}" makine bilgileri ve üretim kapasitesi güncellendi.`,
      type: 'success',
    });
  };

  const handleDeleteMachine = (machineId: number) => {
    const found = machines.find((m) => m.id === machineId);
    if (!found) return;

    setMachines((prev) => prev.filter((m) => m.id !== machineId));

    const newTrashItem: TrashItem = {
      id: `trash_machine_${machineId}_${Date.now()}`,
      originalId: machineId,
      type: 'MACHINE',
      title: `${found.machine_code} — ${found.machine_name}`,
      subtitle: `Ürün: ${found.target_material} — Üretim: ${found.production_quantity.toLocaleString()} Kg`,
      deletedAt: new Date().toLocaleString('tr-TR'),
      hasDocument: false,
      payload: {
        machine: found,
      },
    };

    setTrashItems((prev) => [newTrashItem, ...prev]);

    setToast({
      message: `"${found.machine_code}" makine kaydı Geri Dönüşüm Kutusu'na taşındı.`,
      type: 'info',
    });
  };

  // Quality Control Handlers
  const handleAddQualityRecord = (newRecord: Omit<QualityTestRecord, 'id'>) => {
    const newId = qualityRecords.length > 0 ? Math.max(...qualityRecords.map((q) => q.id)) + 1 : 101;
    const item: QualityTestRecord = { id: newId, ...newRecord };
    setQualityRecords((prev) => [item, ...prev]);
    setToast({
      message: `"${item.batch_no} - ${item.product_label}" kalite test kaydı başarıyla eklendi!`,
      type: 'success',
    });
  };

  const handleUpdateQualityRecord = (updatedRecord: QualityTestRecord) => {
    setQualityRecords((prev) =>
      prev.map((q) => (q.id === updatedRecord.id ? updatedRecord : q))
    );
    setToast({
      message: `"${updatedRecord.batch_no}" kalite test kaydı güncellendi. Status: ${
        updatedRecord.status === 'ONAYLI' ? '✅ ISO/IATF ONAYLI' : '🔴 UYGUNSUZ ÜRÜN / HURDA'
      }`,
      type: updatedRecord.status === 'ONAYLI' ? 'success' : 'warning',
    });
  };

  const handleDeleteQualityRecord = (recordId: number) => {
    const found = qualityRecords.find((q) => q.id === recordId);
    if (!found) return;

    setQualityRecords((prev) => prev.filter((q) => q.id !== recordId));

    const newTrashItem: TrashItem = {
      id: `trash_quality_${recordId}_${Date.now()}`,
      originalId: recordId,
      type: 'QUALITY_TEST',
      title: `${found.batch_no} — ${found.product_label}`,
      subtitle: `Uzman: ${found.tester_name} — Karar: ${found.status === 'ONAYLI' ? 'ONAYLI' : 'KARANTİNA / HURDA'}`,
      deletedAt: new Date().toLocaleString('tr-TR'),
      hasDocument: false,
      payload: {
        qualityTest: found,
      },
    };

    setTrashItems((prev) => [newTrashItem, ...prev]);

    setToast({
      message: `"${found.batch_no}" kalite test kaydı Geri Dönüşüm Kutusu'na taşındı.`,
      type: 'info',
    });
  };

  // Handler: Export JSON Backup File
  const handleExportBackup = () => {
    try {
      const backupObj = {
        appName: 'SARKOMET_YONETIM_PANELI',
        version: '2.0',
        exportDate: new Date().toISOString(),
        data: {
          departmanlar,
          calisanlar,
          egitimler,
          katilimlar,
          taseronlar,
          skillMatrix,
          machines,
          qualityRecords,
          trashItems,
        },
      };

      const jsonString = JSON.stringify(backupObj, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const dateStr = new Date().toISOString().slice(0, 10);
      const fileName = `Sarkomet_Sistem_Yedegi_${dateStr}.json`;

      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setToast({
        message: `Tüm sistem verileriniz ve çöp kutusu [${fileName}] yedek dosyası olarak bilgisayarınıza indirildi.`,
        type: 'success',
      });
    } catch (err) {
      console.error('Export backup error:', err);
      alert('Yedek dosyası indirilirken bir sorun oluştu.');
    }
  };

  // Handler: Import & Restore JSON Backup File
  const handleImportBackup = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        const data = parsed.data || parsed;

        if (!data.calisanlar || !data.egitimler || !data.katilimlar) {
          alert('Geçersiz yedek dosyası! Lütfen geçerli bir Sarkomet JSON veri yedeği dosyası seçiniz.');
          return;
        }

        setCalisanlar(data.calisanlar);
        setEgitimler(data.egitimler);
        setKatilimlar(data.katilimlar);
        if (Array.isArray(data.departmanlar)) {
          setDepartmanlar(data.departmanlar);
        }
        if (Array.isArray(data.taseronlar)) {
          setTaseronlar(data.taseronlar);
        }
        if (Array.isArray(data.skillMatrix)) {
          setSkillMatrix(data.skillMatrix);
        }
        if (Array.isArray(data.machines)) {
          setMachines(data.machines);
        }
        if (Array.isArray(data.qualityRecords)) {
          setQualityRecords(data.qualityRecords);
        }
        if (Array.isArray(data.trashItems)) {
          setTrashItems(data.trashItems);
        }

        setToast({
          message: `Yedek dosyası [${file.name}] başarıyla yüklendi! Tüm sistem verileriniz geri yüklendi.`,
          type: 'success',
        });
      } catch (err) {
        console.error('Import backup error:', err);
        alert('Yedek dosyası okunamadı. Lütfen geçerli bir .json dosyası olduğundan emin olun.');
      }
    };
    reader.readAsText(file);
  };

  // Active Query Tab & Risk Filter
  const [activeTab, setActiveTab] = useState<QueryTabKey>('DASHBOARD');
  const [activeCertFilter, setActiveCertFilter] = useState<string>('ALL');

  const handleSelectCertFilter = (filter: string) => {
    setActiveCertFilter(filter);
    if (activeTab === 'DASHBOARD') {
      setActiveTab('ALL_EMPLOYEES');
    }

    setTimeout(() => {
      const tableElement =
        document.getElementById('data-table-container') ||
        document.getElementById('query-tabs-container');
      if (tableElement) {
        tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  // Modals
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editingTraining, setEditingTraining] = useState<Egitim | null>(null);
  const [isEditEmployeeModalOpen, setIsEditEmployeeModalOpen] = useState<boolean>(false);
  const [editingEmployee, setEditingEmployee] = useState<Calisan | null>(null);
  const [selectedEmployeeIdForModal, setSelectedEmployeeIdForModal] = useState<number | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [selectedTrainingIdForModal, setSelectedTrainingIdForModal] = useState<number | null>(null);
  const [isTrainingModalOpen, setIsTrainingModalOpen] = useState<boolean>(false);
  const [selectedCertificateData, setSelectedCertificateData] = useState<CertificateData | null>(null);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState<boolean>(false);

  const handleOpenCertificate = (certData: CertificateData) => {
    setSelectedCertificateData(certData);
    setIsCertificateModalOpen(true);
  };

  // Toast Notification State
  const [toast, setToast] = useState<ToastState | null>(null);

  // Compute KPI Statistics
  const totalEmployees = calisanlar.length;
  const totalDepartments = departmanlar.length;
  const totalTrainings = egitimler.length;
  const totalParticipations = katilimlar.length;
  const completedParticipations = katilimlar.filter((k) => k.TAMAMLANDI === 1).length;
  const completionRate =
    totalParticipations > 0 ? Math.round((completedParticipations / totalParticipations) * 100) : 0;

  // Live time ticker for real-time automatic status recalculation
  const [nowTick, setNowTick] = useState<number>(Date.now());
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTick(Date.now());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Compute Active Tab SQL Query Results
  const currentQueryResult = useMemo(() => {
    return executeQueryTab(
      activeTab,
      departmanlar,
      calisanlar,
      egitimler,
      katilimlar
    );
  }, [activeTab, departmanlar, calisanlar, egitimler, katilimlar, nowTick]);

  // Handler: Add Calisan
  const handleAddCalisan = (newEmp: Omit<Calisan, 'ID'>) => {
    const nextId = calisanlar.length > 0 ? Math.max(...calisanlar.map((c) => c.ID)) + 1 : 1;
    setCalisanlar((prev) => [...prev, { ...newEmp, ID: nextId }]);
  };

  // Handler: Add Egitim
  const handleAddEgitim = (newTr: Omit<Egitim, 'ID'>) => {
    const nextId = egitimler.length > 0 ? Math.max(...egitimler.map((e) => e.ID)) + 1 : 201;
    setEgitimler((prev) => [...prev, { ...newTr, ID: nextId }]);
    setToast({
      message: `"${newTr.EGITIM_ADI}" yeni eğitim programı başarıyla eklendi.`,
      type: 'success',
    });
  };

  // Handler: Open Edit Training Modal
  const handleOpenEditTraining = (egitimId: number) => {
    const found = egitimler.find((e) => e.ID === egitimId);
    if (found) {
      setEditingTraining(found);
      setIsEditModalOpen(true);
    }
  };

  // Handler: Open Edit Employee Modal
  const handleOpenEditEmployee = (empIdOrEmp: number | Calisan) => {
    let emp: Calisan | undefined;
    if (typeof empIdOrEmp === 'number') {
      emp = calisanlar.find((c) => c.ID === empIdOrEmp);
    } else {
      emp = empIdOrEmp;
    }
    if (emp) {
      setEditingEmployee(emp);
      setIsEditEmployeeModalOpen(true);
    }
  };

  // Handler: Save Updated Employee
  const handleSaveUpdatedEmployee = (updatedEmp: Calisan) => {
    setCalisanlar((prev) =>
      prev.map((c) => (c.ID === updatedEmp.ID ? updatedEmp : c))
    );
    setToast({
      message: `${updatedEmp.AD} ${updatedEmp.SOYAD} isimli çalışanın ad ve bilgileri başarıyla güncellendi.`,
      type: 'success',
    });
  };

  // Handler: Save Updated Training
  const handleSaveUpdatedTraining = (updatedEgitim: Egitim) => {
    setEgitimler((prev) =>
      prev.map((e) => (e.ID === updatedEgitim.ID ? updatedEgitim : e))
    );
    setKatilimlar((prev) =>
      prev.map((k) => {
        if (k.EGITIM_ID === updatedEgitim.ID) {
          return {
            ...k,
            UCRETSIZ: updatedEgitim.UCRETSIZ,
            TOPLAM_TUTAR: updatedEgitim.TOPLAM_TUTAR,
            KISI_BASI_TUTAR: updatedEgitim.KISI_BASI_TUTAR,
            PARA_BIRIMI: updatedEgitim.PARA_BIRIMI,
            GIRIS_TIPI: updatedEgitim.GIRIS_TIPI,
          };
        }
        return k;
      })
    );
    setToast({
      message: `"${updatedEgitim.EGITIM_ADI}" eğitim bilgileri ve maliyet verileri güncellendi.`,
      type: 'success',
    });
  };

  // Handler: Delete Training
  const handleDeleteTraining = (egitimId: number) => {
    const found = egitimler.find((e) => e.ID === egitimId);
    if (!found) return;

    const related = katilimlar.filter((k) => k.EGITIM_ID === egitimId);

    openConfirmModal({
      title: 'Eğitimi Sil (Çöp Kutusu)',
      message: `Seçilen "${found.EGITIM_ADI}" eğitimi ve bu eğitime katılmış olan ${related.length} çalışan katılım kaydı silinecek ve Geri Dönüşüm Kutusu'na taşınacaktır. Devam etmek istiyor musunuz?`,
      confirmText: 'Evet, Sil (Çöp Kutusu\'na Taşı)',
      cancelText: 'Vazgeç',
      variant: 'warning',
      iconType: 'delete',
      onConfirm: () => {
        setEgitimler((prev) => prev.filter((e) => e.ID !== egitimId));
        setKatilimlar((prev) => prev.filter((k) => k.EGITIM_ID !== egitimId));

        const newTrashItem: TrashItem = {
          id: `trash_egitim_${egitimId}_${Date.now()}`,
          originalId: egitimId,
          type: 'EGITIM',
          title: found.EGITIM_ADI,
          subtitle: `Eğitim Programı (${found.SURE_SAAT} Saat) — ${related.length} Katılımcı`,
          deletedAt: new Date().toLocaleString('tr-TR'),
          hasDocument: Boolean(found.SERTIFIKA_DOSYA_DATA),
          documentName: found.SERTIFIKA_DOSYA_ADI,
          payload: {
            egitim: found,
            relatedKatilimlar: related,
          },
        };

        setTrashItems((prev) => [newTrashItem, ...prev]);

        setToast({
          message: `"${found.EGITIM_ADI}" eğitimi Geri Dönüşüm Kutusu'na taşındı.`,
          type: 'info',
        });
      },
    });
  };

  // Handler: Delete Participation
  const handleDeleteParticipation = (katilimId: number, infoStr?: string) => {
    const foundKatilim = katilimlar.find((k) => k.ID === katilimId);
    if (!foundKatilim) return;

    const emp = calisanlar.find((c) => c.ID === foundKatilim.CALISAN_ID);
    const eg = egitimler.find((e) => e.ID === foundKatilim.EGITIM_ID);
    const dept = emp ? departmanlar.find((d) => d.ID === emp.DEPARTMAN_ID) : null;

    const titleStr = infoStr || `${emp ? `${emp.AD} ${emp.SOYAD}` : 'Çalışan'} - ${eg ? eg.EGITIM_ADI : 'Eğitim'}`;
    const deptName = dept ? dept.AD : 'Genel';

    openConfirmModal({
      title: 'Eğitim Katılım Kaydını Sil (Çöp Kutusu)',
      message: `Seçilen "${titleStr}" kaydı silinecek ve Geri Dönüşüm Kutusu'na taşınacaktır. Daha sonra istediğiniz an geri yükleyebilirsiniz. Devam etmek istiyor musunuz?`,
      confirmText: 'Evet, Sil (Çöp Kutusu\'na Taşı)',
      cancelText: 'Vazgeç',
      variant: 'warning',
      iconType: 'delete',
      onConfirm: () => {
        setKatilimlar((prev) => prev.filter((k) => k.ID !== katilimId));

        const newTrashItem: TrashItem = {
          id: `trash_katilim_${katilimId}_${Date.now()}`,
          originalId: katilimId,
          type: 'KATILIM',
          title: titleStr,
          subtitle: deptName,
          deletedAt: new Date().toLocaleString('tr-TR'),
          hasDocument: Boolean(foundKatilim.SERTIFIKA_DOSYA_DATA),
          documentName: foundKatilim.SERTIFIKA_DOSYA_ADI,
          payload: {
            katilim: foundKatilim,
          },
        };

        setTrashItems((prev) => [newTrashItem, ...prev]);

        setToast({
          message: `"${titleStr}" kaydı Geri Dönüşüm Kutusu'na taşındı.`,
          type: 'info',
        });
      },
    });
  };

  // Handler: Delete Employee
  const handleDeleteEmployee = (employeeId: number, infoStr?: string) => {
    const emp = calisanlar.find((c) => c.ID === employeeId);
    if (!emp) return;

    const name = infoStr || `${emp.AD} ${emp.SOYAD}`;
    const dept = departmanlar.find((d) => d.ID === emp.DEPARTMAN_ID);
    const related = katilimlar.filter((k) => k.CALISAN_ID === employeeId);

    openConfirmModal({
      title: 'Çalışan Kaydını Sil (Çöp Kutusu)',
      message: `Seçilen "${name}" çalışan kaydı ve buna bağlı ${related.length} adet eğitim katılım kaydı silinecek ve Geri Dönüşüm Kutusu'na taşınacaktır. Devam etmek istiyor musunuz?`,
      confirmText: 'Evet, Sil (Çöp Kutusu\'na Taşı)',
      cancelText: 'Vazgeç',
      variant: 'warning',
      iconType: 'delete',
      onConfirm: () => {
        setCalisanlar((prev) => prev.filter((c) => c.ID !== employeeId));
        setKatilimlar((prev) => prev.filter((k) => k.CALISAN_ID !== employeeId));

        const newTrashItem: TrashItem = {
          id: `trash_calisan_${employeeId}_${Date.now()}`,
          originalId: employeeId,
          type: 'CALISAN',
          title: name,
          subtitle: `${dept ? dept.AD : 'Departman'} — ${related.length} Katılım Kaydı`,
          deletedAt: new Date().toLocaleString('tr-TR'),
          hasDocument: false,
          payload: {
            calisan: emp,
            relatedKatilimlar: related,
          },
        };

        setTrashItems((prev) => [newTrashItem, ...prev]);

        setToast({
          message: `"${name}" çalışan kaydı Geri Dönüşüm Kutusu'na taşındı.`,
          type: 'info',
        });
      },
    });
  };

  // Handlers for Recycle Bin (Restore & Permanent Delete)
  const handleRestoreTrashItem = (item: TrashItem) => {
    setTrashItems((prev) => prev.filter((i) => i.id !== item.id));

    if (item.type === 'KATILIM' && item.payload.katilim) {
      setKatilimlar((prev) => {
        if (prev.some((k) => k.ID === item.payload.katilim?.ID)) return prev;
        return [item.payload.katilim!, ...prev];
      });
      setToast({
        message: `"${item.title}" eğitimi ve sertifika belgesi başarıyla geri yüklendi!`,
        type: 'success',
      });
    } else if (item.type === 'TASERON' && item.payload.taseron) {
      setTaseronlar((prev) => {
        if (prev.some((t) => t.ID === item.payload.taseron?.ID)) return prev;
        return [item.payload.taseron!, ...prev];
      });
      setToast({
        message: `"${item.title}" taşeron personel kaydı ve belgesi başarıyla geri yüklendi!`,
        type: 'success',
      });
    } else if (item.type === 'EGITIM' && item.payload.egitim) {
      setEgitimler((prev) => {
        if (prev.some((e) => e.ID === item.payload.egitim?.ID)) return prev;
        return [item.payload.egitim!, ...prev];
      });
      if (item.payload.relatedKatilimlar && item.payload.relatedKatilimlar.length > 0) {
        setKatilimlar((prev) => {
          const existingIds = new Set(prev.map((k) => k.ID));
          const toAdd = item.payload.relatedKatilimlar!.filter((k) => !existingIds.has(k.ID));
          return [...toAdd, ...prev];
        });
      }
      setToast({
        message: `"${item.title}" eğitimi ve bağlı tüm katılım kayıtları başarıyla geri yüklendi!`,
        type: 'success',
      });
    } else if (item.type === 'CALISAN' && item.payload.calisan) {
      setCalisanlar((prev) => {
        if (prev.some((c) => c.ID === item.payload.calisan?.ID)) return prev;
        return [item.payload.calisan!, ...prev];
      });
      if (item.payload.relatedKatilimlar && item.payload.relatedKatilimlar.length > 0) {
        setKatilimlar((prev) => {
          const existingIds = new Set(prev.map((k) => k.ID));
          const toAdd = item.payload.relatedKatilimlar!.filter((k) => !existingIds.has(k.ID));
          return [...toAdd, ...prev];
        });
      }
      setToast({
        message: `"${item.title}" çalışanı ve bağlı eğitim geçmişi başarıyla geri yüklendi!`,
        type: 'success',
      });
    } else if (item.type === 'YETKINLIK' && item.payload.yetkinlik) {
      setSkillMatrix((prev) => {
        if (prev.some((s) => s.ID === item.payload.yetkinlik?.ID)) return prev;
        return [item.payload.yetkinlik!, ...prev];
      });
      setToast({
        message: `"${item.title}" yetkinlik ve vardiya kaydı başarıyla geri yüklendi!`,
        type: 'success',
      });
    } else if (item.type === 'MACHINE' && item.payload.machine) {
      setMachines((prev) => {
        if (prev.some((m) => m.id === item.payload.machine?.id)) return prev;
        return [item.payload.machine!, ...prev];
      });
      setToast({
        message: `"${item.title}" makine kaydı başarıyla geri yüklendi!`,
        type: 'success',
      });
    } else if (item.type === 'QUALITY_TEST' && item.payload.qualityTest) {
      setQualityRecords((prev) => {
        if (prev.some((q) => q.id === item.payload.qualityTest?.id)) return prev;
        return [item.payload.qualityTest!, ...prev];
      });
      setToast({
        message: `"${item.title}" kalite test kaydı başarıyla geri yüklendi!`,
        type: 'success',
      });
    }
  };

  const handlePermanentDeleteTrashItem = (itemId: string) => {
    setTrashItems((prev) => prev.filter((i) => i.id !== itemId));
    setToast({
      message: 'Kayıt kalıcı olarak silindi.',
      type: 'info',
    });
  };

  const handleClearAllTrash = () => {
    setTrashItems([]);
    setToast({
      message: 'Geri dönüşüm kutusundaki tüm silinmiş kayıtlar temizlendi.',
      type: 'info',
    });
  };

  // Handler: Add Katilim (Unified Single & Bulk)
  const handleAddKatilim = (
    calisanIds: number[],
    egitimId: number,
    baslangicTarihi?: string,
    baslangicSaati?: string,
    bitisTarihi?: string,
    bitisSaati?: string,
    feeData?: {
      ucretsiz: boolean;
      toplamTutar: number;
      kisiBasiTutar: number;
      paraBirimi: 'TL' | 'USD' | 'EUR';
      girisTipi: 'KISI_BASI' | 'TOPLAM_TUTAR';
      sertifikaBitisTarihi?: string;
      sertifikaDosyaData?: string;
      sertifikaDosyaAdi?: string;
      sertifikaDosyaTipi?: string;
    },
    sureSaat?: number
  ) => {
    handleBulkAssignKatilim(
      calisanIds,
      egitimId,
      1,
      baslangicTarihi,
      baslangicSaati,
      bitisTarihi,
      bitisSaati,
      feeData,
      sureSaat
    );
  };

  // Handler: Upload Certificate Document directly to Katilim, Egitim, or Quality Record
  const handleUploadCertificateDocument = (
    id: number,
    fileData: string,
    fileName: string,
    fileType: string,
    targetType: 'KATILIM' | 'EGITIM' | 'QUALITY_TEST' = 'KATILIM'
  ) => {
    if (targetType === 'EGITIM') {
      setEgitimler((prev) =>
        prev.map((e) =>
          e.ID === id
            ? {
                ...e,
                SERTIFIKA_DOSYA_DATA: fileData,
                SERTIFIKA_DOSYA_ADI: fileName,
                SERTIFIKA_DOSYA_TIPI: fileType,
              }
            : e
        )
      );
    } else if (targetType === 'QUALITY_TEST') {
      setQualityRecords((prev) =>
        prev.map((q) =>
          q.id === id
            ? {
                ...q,
                DOSYA_DATA: fileData,
                DOSYA_ADI: fileName,
                DOSYA_TIPI: fileType,
              }
            : q
        )
      );
    } else {
      setKatilimlar((prev) =>
        prev.map((k) =>
          k.ID === id
            ? {
                ...k,
                SERTIFIKA_DOSYA_DATA: fileData,
                SERTIFIKA_DOSYA_ADI: fileName,
                SERTIFIKA_DOSYA_TIPI: fileType,
              }
            : k
        )
      );
    }
    setToast({
      message: `Belge [${fileName}] başarıyla yüklendi ve sistemde güncellendi.`,
      type: 'success',
    });
  };

  // Handler: Bulk Assign Katilim
  const handleBulkAssignKatilim = (
    calisanIds: number[],
    egitimId: number,
    defaultStatus: number,
    baslangicTarihi?: string,
    baslangicSaati?: string,
    bitisTarihi?: string,
    bitisSaati?: string,
    feeData?: {
      ucretsiz: boolean;
      toplamTutar: number;
      kisiBasiTutar: number;
      paraBirimi: 'TL' | 'USD' | 'EUR';
      girisTipi: 'KISI_BASI' | 'TOPLAM_TUTAR';
      sertifikaBitisTarihi?: string;
      sertifikaDosyaData?: string;
      sertifikaDosyaAdi?: string;
      sertifikaDosyaTipi?: string;
    },
    sureSaat?: number
  ) => {
    let newlyAddedCount = 0;
    let updatedCount = 0;
    const targetEgitim = egitimler.find((e) => e.ID === egitimId);
    const egitimName = targetEgitim ? targetEgitim.EGITIM_ADI : 'Eğitim';

    // Auto-calculate certificate validity date
    const baseDate = bitisTarihi || targetEgitim?.BITIS_TARIHI || baslangicTarihi || targetEgitim?.BASLANGIC_TARIHI;
    const autoCertExpiry = feeData?.sertifikaBitisTarihi || calculateAutoCertExpiryDate(egitimName, baseDate);

    // Update parent Egitim dates, times and fees if provided
    setEgitimler((prev) =>
      prev.map((eg) => {
        if (eg.ID === egitimId) {
          const newStartDate = baslangicTarihi || eg.BASLANGIC_TARIHI;
          const newStartTime = baslangicSaati || eg.BASLANGIC_SAATI || '09:00';
          const newEndDate = bitisTarihi || eg.BITIS_TARIHI;
          const newEndTime = bitisSaati || eg.BITIS_SAATI || '17:00';
          return {
            ...eg,
            BASLANGIC_TARIHI: newStartDate,
            BASLANGIC_SAATI: newStartTime,
            BITIS_TARIHI: newEndDate,
            BITIS_SAATI: newEndTime,
            EGITIM_TARIHI: formatDateRange(newStartDate, newEndDate),
            SERTIFIKA_BITIS_TARIHI: autoCertExpiry,
            ...(feeData
              ? {
                  UCRETSIZ: feeData.ucretsiz,
                  TOPLAM_TUTAR: feeData.toplamTutar,
                  KISI_BASI_TUTAR: feeData.kisiBasiTutar,
                  PARA_BIRIMI: feeData.paraBirimi,
                  GIRIS_TIPI: feeData.girisTipi,
                  ...(feeData.sertifikaDosyaData ? {
                    SERTIFIKA_DOSYA_DATA: feeData.sertifikaDosyaData,
                    SERTIFIKA_DOSYA_ADI: feeData.sertifikaDosyaAdi,
                    SERTIFIKA_DOSYA_TIPI: feeData.sertifikaDosyaTipi,
                  } : {}),
                }
              : {}),
          };
        }
        return eg;
      })
    );

    let sampleUpdatedEmpName = '';

    setKatilimlar((prev) => {
      let currentMaxId = prev.length > 0 ? Math.max(...prev.map((k) => k.ID)) : 0;
      const updatedPrev = [...prev];
      const newEntries: EgitimKatilim[] = [];

      calisanIds.forEach((empId) => {
        const existingIdx = updatedPrev.findIndex(
          (k) => k.CALISAN_ID === empId && k.EGITIM_ID === egitimId
        );
        const emp = calisanlar.find((c) => c.ID === empId);

        if (existingIdx >= 0) {
          if (emp) sampleUpdatedEmpName = `${emp.AD} ${emp.SOYAD}`;
          updatedPrev[existingIdx] = {
            ...updatedPrev[existingIdx],
            TAMAMLANDI: defaultStatus,
            MANUAL_STATUS: 'AUTO', // Reset manual override to refresh status
            BASLANGIC_TARIHI: baslangicTarihi || updatedPrev[existingIdx].BASLANGIC_TARIHI,
            BASLANGIC_SAATI: baslangicSaati || updatedPrev[existingIdx].BASLANGIC_SAATI,
            SERTIFIKA_BITIS_TARIHI: autoCertExpiry,
            SURE_SAAT: sureSaat !== undefined ? sureSaat : updatedPrev[existingIdx].SURE_SAAT || targetEgitim?.SURE_SAAT,
            ...(feeData
              ? {
                  UCRETSIZ: feeData.ucretsiz,
                  TOPLAM_TUTAR: feeData.toplamTutar,
                  KISI_BASI_TUTAR: feeData.kisiBasiTutar,
                  PARA_BIRIMI: feeData.paraBirimi,
                  GIRIS_TIPI: feeData.girisTipi,
                }
              : {}),
          };
          updatedCount++;
        } else {
          currentMaxId++;
          newEntries.push({
            ID: currentMaxId,
            CALISAN_ID: empId,
            EGITIM_ID: egitimId,
            TAMAMLANDI: defaultStatus,
            MANUAL_STATUS: 'AUTO',
            BASLANGIC_TARIHI: baslangicTarihi,
            BASLANGIC_SAATI: baslangicSaati,
            SERTIFIKA_BITIS_TARIHI: autoCertExpiry,
            SURE_SAAT: sureSaat !== undefined ? sureSaat : targetEgitim?.SURE_SAAT,
            ...(feeData
              ? {
                  UCRETSIZ: feeData.ucretsiz,
                  TOPLAM_TUTAR: feeData.toplamTutar,
                  KISI_BASI_TUTAR: feeData.kisiBasiTutar,
                  PARA_BIRIMI: feeData.paraBirimi,
                  GIRIS_TIPI: feeData.girisTipi,
                }
              : {}),
          });
          newlyAddedCount++;
        }
      });

      return [...updatedPrev, ...newEntries];
    });

    if (updatedCount === 1 && sampleUpdatedEmpName) {
      setToast({
        message: `${sampleUpdatedEmpName} isimli çalışanın süresi dolan ${egitimName} eğitimi yeni tarihlerle güncellendi/yenilendi.`,
        type: 'success',
      });
    } else if (updatedCount > 0) {
      setToast({
        message: `${updatedCount} çalışanın süresi dolan "${egitimName}" eğitimi yeni tarihlerle güncellendi/yenilendi (${newlyAddedCount} yeni kayıt).`,
        type: 'success',
      });
    } else {
      setToast({
        message: `${calisanIds.length} çalışan "${egitimName}" eğitimine atandı.`,
        type: 'success',
      });
    }
  };

  // Handler: Toggle Completion Status (1 <-> 0)
  const handleToggleStatus = (participationId: number) => {
    setKatilimlar((prev) =>
      prev.map((k) => (k.ID === participationId ? { ...k, TAMAMLANDI: k.TAMAMLANDI === 1 ? 0 : 1 } : k))
    );
  };

  // Handler: Set Manual Status (Admin Override)
  const handleSetManualStatus = (
    id: number,
    status: ManualStatusType,
    targetType: 'PARTICIPATION' | 'TRAINING'
  ) => {
    const statusLabels: Record<ManualStatusType, string> = {
      DEVAM_EDIYOR: 'Devam Ediyor',
      TAMAMLANDI: 'Geçerli / Tamamlandı',
      TAMAMLANMADI: 'Tamamlanmadı',
      BASLAMADI: 'Başlamadı / Planlandı',
      SERTIFIKA_SURESI_DOLDU: 'Sertifika Süresi Doldu',
      AUTO: 'Tarihe Göre Otomatik',
    };

    if (targetType === 'PARTICIPATION') {
      setKatilimlar((prev) =>
        prev.map((k) => {
          if (k.ID === id) {
            let updatedTamamlandi = k.TAMAMLANDI;
            if (status === 'TAMAMLANDI') updatedTamamlandi = 1;
            if (status === 'TAMAMLANMADI') updatedTamamlandi = 0;
            if (status === 'DEVAM_EDIYOR') updatedTamamlandi = 2;
            return {
              ...k,
              MANUAL_STATUS: status,
              TAMAMLANDI: updatedTamamlandi,
            };
          }
          return k;
        })
      );
      setToast({
        message: `Katılım durumu manuel olarak "${statusLabels[status]}" olarak güncellendi.`,
        type: 'info',
      });
    } else {
      setEgitimler((prev) =>
        prev.map((e) => {
          if (e.ID === id) {
            return {
              ...e,
              MANUAL_STATUS: status,
            };
          }
          return e;
        })
      );
      setToast({
        message: `Eğitim programı durumu manuel olarak "${statusLabels[status]}" olarak güncellendi.`,
        type: 'info',
      });
    }
  };

  // Handler: Reset Data to Defaults
  const handleResetData = () => {
    if (window.confirm('Tüm veriler ilk fabrika varsayılan durumuna getirilsin mi? Kaydedilmiş tüm verileriniz sıfırlanacaktır.')) {
      try {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      } catch (e) {
        console.error(e);
      }
      setDepartmanlar(INITIAL_DEPARTMANLAR);
      setCalisanlar(INITIAL_CALISANLAR);
      setEgitimler(INITIAL_EGITIMLER);
      setKatilimlar(INITIAL_KATILIMLAR);
      setTaseronlar(INITIAL_TASERONLAR);
      setSkillMatrix(INITIAL_SKILL_MATRIX);
      setMachines(INITIAL_MACHINES);
      setQualityRecords(INITIAL_QUALITY_TESTS);
      setActiveTab('DASHBOARD');
      setToast({
        message: 'Tüm sistem verileri fabrika varsayılan durumuna döndürüldü.',
        type: 'info',
      });
    }
  };

  // Handler: Select Department Filter
  const handleSelectDepartmentFilter = (_deptName: string) => {
    setActiveTab('ALL_EMPLOYEES');
    setTimeout(() => {
      const tableElement =
        document.getElementById('data-table-container') ||
        document.getElementById('query-tabs-container');
      if (tableElement) {
        tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    if (user.role === 'CONTRACTOR') {
      setActiveTab('CONTRACTOR_TRACKING');
    } else {
      setActiveTab('DASHBOARD');
    }
  };

  // If not logged in -> Show Login Screen
  if (!currentUser) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} taseronlar={taseronlar} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-amber-500 selection:text-slate-950">
      {/* Sidebar Navigation for Admin */}
      {currentUser.role === 'ADMIN' && (
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          currentUser={currentUser}
          trashCount={trashItems.length}
          onLogout={() => setCurrentUser(null)}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onExportBackup={handleExportBackup}
          onImportBackup={handleImportBackup}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Main Wrapper with Sidebar Padding */}
      <div className={currentUser.role === 'ADMIN' ? 'lg:pl-72 min-h-screen flex flex-col transition-all duration-300' : 'min-h-screen flex flex-col'}>
        {/* Header */}
        <Header
          currentUser={currentUser}
          onLogout={() => setCurrentUser(null)}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        />

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
          {currentUser.role === 'EMPLOYEE' ? (
            /* Staff/Employee Exclusive Portal View */
            <EmployeePortalView
              user={currentUser}
              departmanlar={departmanlar}
              calisanlar={calisanlar}
              egitimler={egitimler}
              katilimlar={katilimlar}
              onToggleStatus={handleToggleStatus}
              onOpenProfile={(empId) => {
                setSelectedEmployeeIdForModal(empId);
                setIsProfileModalOpen(true);
              }}
              onOpenCertificate={handleOpenCertificate}
            />
          ) : (
            /* Admin / Management Tabbed View */
            <>
              {activeTab === 'DASHBOARD' ? (
                <>
                  {/* KPI Summary Cards & Risk Filter Badges */}
                  <KpiCards
                    totalEmployees={totalEmployees}
                    totalDepartments={totalDepartments}
                    totalTrainings={totalTrainings}
                    completionRate={completionRate}
                    completedParticipations={completedParticipations}
                    totalParticipations={totalParticipations}
                    egitimler={egitimler}
                    katilimlar={katilimlar}
                    calisanlar={calisanlar}
                    departmanlar={departmanlar}
                    activeCertFilter={activeCertFilter}
                    onSelectCertFilter={handleSelectCertFilter}
                  />

                  {/* System Data Backup & Automatic Local Storage Card */}
                  <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30 border border-amber-500/30 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Save className="w-5 h-5 text-amber-400" />
                        <h3 className="text-base font-bold text-white">
                          Tek Tıkla JSON Veri Yedeği İndirme & Geri Yükleme
                        </h3>
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Kalıcı Hafıza Aktif
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                        Girdiğiniz tüm çalışanlar, eğitimler ve katılım verileri tarayıcınızda otomatik olarak kaydedilir. 
                        <strong> Veri Yedeği İndir</strong> butonuna basarak tüm verilerinizi <code>.json</code> formatında bilgisayarınıza indirebilir, 
                        farklı bir cihazdan geldiğinizde <strong>Yedek Yükle</strong> butonu ile kaldığınız yerden anında devam edebilirsiniz.
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <button
                        onClick={handleExportBackup}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-950/40 border border-amber-400/40 transition-all hover:scale-[1.02] cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        Veri Yedeği İndir (.json)
                      </button>

                      <button
                        onClick={() => dashboardFileInputRef.current?.click()}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 hover:border-amber-500/40 transition-all cursor-pointer"
                      >
                        <Upload className="w-4 h-4 text-amber-400" />
                        Yedek Yükle / Geri Yükle
                      </button>

                      <input
                        ref={dashboardFileInputRef}
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleImportBackup(file);
                            e.target.value = '';
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Machine Dashboard Section */}
                  <MachineDashboardSection machines={machines} />
                </>
              ) : activeTab === 'CONTRACTOR_TRACKING' ? (
                <ContractorView
                  taseronlar={taseronlar}
                  onAddClick={() => setIsAddContractorModalOpen(true)}
                  onDeleteContractor={handleDeleteContractor}
                  onUploadDoc={handleUploadContractorDoc}
                  onRemoveDoc={handleRemoveContractorDoc}
                  onOpenCertificate={handleOpenCertificate}
                  currentUser={currentUser}
                />
              ) : activeTab === 'SKILL_MATRIX' ? (
                <SkillMatrixView
                  skillMatrix={skillMatrix}
                  calisanlar={calisanlar}
                  departmanlar={departmanlar}
                  currentUser={currentUser}
                  onAddSkillRecord={handleAddSkillRecord}
                  onUpdateSkillRecord={handleUpdateSkillRecord}
                  onDeleteSkillRecord={handleDeleteSkillRecord}
                  onOpenCertificate={handleOpenCertificate}
                  onRequestConfirm={openConfirmModal}
                />
              ) : activeTab === 'ISO_AUDIT' ? (
                <IsoAuditView
                  calisanlar={calisanlar}
                  departmanlar={departmanlar}
                  skillMatrix={skillMatrix}
                  currentUser={currentUser}
                  onOpenCertificate={handleOpenCertificate}
                  onRequestConfirm={openConfirmModal}
                />
              ) : activeTab === 'MACHINES' ? (
                <MachinesView
                  machines={machines}
                  currentUser={currentUser}
                  onAddMachine={handleAddMachine}
                  onUpdateMachine={handleUpdateMachine}
                  onDeleteMachine={handleDeleteMachine}
                  onRequestConfirm={openConfirmModal}
                />
              ) : activeTab === 'QUALITY_CONTROL' ? (
                <QualityControlView
                  records={qualityRecords}
                  currentUser={currentUser}
                  onAddRecord={handleAddQualityRecord}
                  onUpdateRecord={handleUpdateQualityRecord}
                  onDeleteRecord={handleDeleteQualityRecord}
                  onRequestConfirm={openConfirmModal}
                />
              ) : activeTab === 'RECYCLE_BIN' ? (
                <RecycleBinView
                  trashItems={trashItems}
                  onRestoreItem={handleRestoreTrashItem}
                  onPermanentDeleteItem={handlePermanentDeleteTrashItem}
                  onClearAllTrash={handleClearAllTrash}
                  onOpenCertificate={handleOpenCertificate}
                  onRequestConfirm={openConfirmModal}
                />
              ) : (
                <>
                  {/* Active Module Header & Quick Controls */}
                  <QueryTabs
                    activeTab={activeTab}
                    onSelectTab={setActiveTab}
                    resultCount={currentQueryResult.length}
                  />

                  {/* Active Module Table View ONLY */}
                  <DataTable
                    data={currentQueryResult}
                    activeTab={activeTab}
                    isAdmin={currentUser.role === 'ADMIN'}
                    onToggleStatus={handleToggleStatus}
                    onSetStatus={handleSetManualStatus}
                    onEditTraining={handleOpenEditTraining}
                    onDeleteTraining={handleDeleteTraining}
                    onDeleteParticipation={handleDeleteParticipation}
                    onDeleteEmployee={handleDeleteEmployee}
                    onEditEmployee={handleOpenEditEmployee}
                    onSelectEmployee={(empId) => {
                      setSelectedEmployeeIdForModal(empId);
                      setIsProfileModalOpen(true);
                    }}
                    onSelectTraining={(trId) => {
                      setSelectedTrainingIdForModal(trId);
                      setIsTrainingModalOpen(true);
                    }}
                    onOpenCertificate={handleOpenCertificate}
                    onUploadCertificateDocument={handleUploadCertificateDocument}
                    externalStatusFilter={activeCertFilter}
                    onStatusFilterChange={setActiveCertFilter}
                  />
                </>
              )}
            </>
          )}
        </main>

        <Footer />
      </div>

      {/* Add Data Modal (Tekli ve Toplu Katılım) */}
      <AddDataModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        departmanlar={departmanlar}
        calisanlar={calisanlar}
        egitimler={egitimler}
        userRole={currentUser.role}
        onAddCalisan={handleAddCalisan}
        onAddEgitim={handleAddEgitim}
        onAddKatilim={handleAddKatilim}
      />

      {/* Add Contractor Modal */}
      <AddContractorModal
        isOpen={isAddContractorModalOpen}
        onClose={() => setIsAddContractorModalOpen(false)}
        onAddContractor={handleAddContractor}
        existingContractors={taseronlar}
      />

      {/* Edit Training Modal */}
      <EditTrainingModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTraining(null);
        }}
        egitim={editingTraining}
        userRole={currentUser.role}
        katilimSayisi={editingTraining ? katilimlar.filter((k) => k.EGITIM_ID === editingTraining.ID).length : 1}
        onSave={handleSaveUpdatedTraining}
      />

      {/* Edit Employee Modal */}
      <EditEmployeeModal
        isOpen={isEditEmployeeModalOpen}
        onClose={() => {
          setIsEditEmployeeModalOpen(false);
          setEditingEmployee(null);
        }}
        calisan={editingEmployee}
        departmanlar={departmanlar}
        onSave={handleSaveUpdatedEmployee}
      />

      {/* Detailed Employee Profile Modal */}
      <EmployeeProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => {
          setIsProfileModalOpen(false);
          setSelectedEmployeeIdForModal(null);
        }}
        calisanId={selectedEmployeeIdForModal}
        calisanlar={calisanlar}
        departmanlar={departmanlar}
        egitimler={egitimler}
        katilimlar={katilimlar}
        onOpenCertificate={handleOpenCertificate}
        onDeleteParticipation={handleDeleteParticipation}
        onEditEmployee={handleOpenEditEmployee}
        onUploadCertificateDocument={handleUploadCertificateDocument}
      />

      {/* Detailed Training & Participants Pop-up Modal */}
      <TrainingDetailModal
        isOpen={isTrainingModalOpen}
        onClose={() => {
          setIsTrainingModalOpen(false);
          setSelectedTrainingIdForModal(null);
        }}
        egitimId={selectedTrainingIdForModal}
        egitimler={egitimler}
        calisanlar={calisanlar}
        departmanlar={departmanlar}
        katilimlar={katilimlar}
        onToggleStatus={handleToggleStatus}
        onSelectEmployee={(empId) => {
          setSelectedEmployeeIdForModal(empId);
          setIsProfileModalOpen(true);
        }}
        onOpenCertificate={handleOpenCertificate}
        onDeleteParticipation={handleDeleteParticipation}
        onEditTraining={handleOpenEditTraining}
        onUploadCertificateDocument={handleUploadCertificateDocument}
      />

      {/* Digital Certificate Viewer Modal */}
      <CertificateModal
        isOpen={isCertificateModalOpen}
        onClose={() => setIsCertificateModalOpen(false)}
        data={selectedCertificateData}
        onUploadCertificateDocument={handleUploadCertificateDocument}
      />

      {/* Confirmation Dialog Modal */}
      <ConfirmModal
        isOpen={confirmModalConfig.isOpen}
        onClose={() => setConfirmModalConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModalConfig.onConfirm}
        title={confirmModalConfig.title}
        message={confirmModalConfig.message}
        confirmText={confirmModalConfig.confirmText}
        cancelText={confirmModalConfig.cancelText}
        variant={confirmModalConfig.variant}
        iconType={confirmModalConfig.iconType}
      />

      {/* Toast Notification */}
      <ToastNotification toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
