export interface Departman {
  ID: number;
  AD: string;
}

export interface Calisan {
  ID: number;
  AD: string;
  SOYAD: string;
  DEPARTMAN_ID: number;
  ISE_GIRIS_TARIHI: string;
}

export type ManualStatusType = 'DEVAM_EDIYOR' | 'TAMAMLANDI' | 'TAMAMLANMADI' | 'BASLAMADI' | 'SERTIFIKA_SURESI_DOLDU' | 'AUTO';

export interface Egitim {
  ID: number;
  EGITIM_ADI: string;
  BASLANGIC_TARIHI: string;
  BASLANGIC_SAATI?: string;
  BITIS_TARIHI: string;
  BITIS_SAATI?: string;
  SURE_SAAT: number;
  EGITIM_TARIHI?: string;
  MANUAL_STATUS?: ManualStatusType;
  UCRETSIZ?: boolean;
  TOPLAM_TUTAR?: number;
  PARA_BIRIMI?: 'TL' | 'USD' | 'EUR';
  KISI_BASI_TUTAR?: number;
  GIRIS_TIPI?: 'KISI_BASI' | 'TOPLAM_TUTAR';
  SERTIFIKA_BITIS_TARIHI?: string;
  SERTIFIKA_DOSYA_DATA?: string;
  SERTIFIKA_DOSYA_ADI?: string;
  SERTIFIKA_DOSYA_TIPI?: string;
}

export interface EgitimKatilim {
  ID: number;
  CALISAN_ID: number;
  EGITIM_ID: number;
  TAMAMLANDI: number; // 1: Tamamlandı, 0: Tamamlanmadı, 2: Devam Ediyor
  SURE_SAAT?: number;
  BASLANGIC_TARIHI?: string;
  BASLANGIC_SAATI?: string;
  MANUAL_STATUS?: ManualStatusType;
  UCRETSIZ?: boolean;
  TOPLAM_TUTAR?: number;
  PARA_BIRIMI?: 'TL' | 'USD' | 'EUR';
  KISI_BASI_TUTAR?: number;
  GIRIS_TIPI?: 'KISI_BASI' | 'TOPLAM_TUTAR';
  SERTIFIKA_BITIS_TARIHI?: string;
  SERTIFIKA_DOSYA_DATA?: string;
  SERTIFIKA_DOSYA_ADI?: string;
  SERTIFIKA_DOSYA_TIPI?: string;
}

export type QueryTabKey =
  | 'DASHBOARD'
  | 'ALL_EMPLOYEES'
  | 'ALL_TRAININGS'
  | 'LONGEST_TRAINING'
  | 'CONTRACTOR_TRACKING'
  | 'SKILL_MATRIX'
  | 'ISO_AUDIT'
  | 'MACHINES'
  | 'QUALITY_CONTROL'
  | 'RECYCLE_BIN';

export type AuditStandardType = 'IATF_16949' | 'ISO_9001' | 'ISO_45001' | 'ISO_14001';

export type TrashItemType = 'KATILIM' | 'TASERON' | 'EGITIM' | 'CALISAN' | 'YETKINLIK' | 'MACHINE' | 'QUALITY_TEST';

export type SarkometProductType =
  | 'FILMASIN_8MM'
  | 'INCE_BAKIR_TEL'
  | 'BUKULU_ILETKEN'
  | 'YASSI_TEL_LAMA'
  | 'DIKISSIS_BORU';

export type SarkuysanProductType = SarkometProductType;

export type SurfaceCondition = 'UYGUN' | 'PURUZLU' | 'OKSITLI';

export type QualityApprovalStatus = 'ONAYLI' | 'UYGUNSUZ_HURDA';

export interface QualityTestRecord {
  id: number;
  product_type: SarkuysanProductType;
  product_label: string;
  batch_no: string;
  production_line: string;
  tester_name: string;
  test_date: string;
  conductivity_iacs: number;
  diameter_mm: number;
  tensile_strength_nmm2: number;
  surface_inspection: SurfaceCondition;
  status: QualityApprovalStatus;
  rejection_reason?: string;
}

export type MachineStatus = 'AKTIF' | 'BAKIMDA' | 'PASIF';

export interface Machine {
  id: number;
  machine_code: string;
  machine_name: string;
  target_material: string;
  production_quantity: number;
  daily_capacity: number;
  status: MachineStatus;
}

export type UretimHattiType = 'DOKUMHANE' | 'FILMASIN' | 'BORU_TAVLAMA' | 'INCE_TEL';

export interface SkillMatrixRecord {
  ID: number;
  CALISAN_ID?: number;
  PERSONEL_ADI: string;
  DEPARTMAN_ADI: string;
  VARDIYA: '08:00 - 16:00' | '16:00 - 24:00' | '24:00 - 08:00';
  HAT_KEY: UretimHattiType;
  HAT_ADI: string;
  SERTIFIKA_ADI: string;
  HAS_CERTIFICATE: boolean;
  CERTIFICATE_EXPIRY_DATE?: string;
  SERTIFIKA_DOSYA_DATA?: string;
  SERTIFIKA_DOSYA_ADI?: string;
  SERTIFIKA_DOSYA_TIPI?: string;
}

export interface TrashItem {
  id: string; // unique ID
  originalId: number;
  type: TrashItemType;
  title: string;
  subtitle: string;
  deletedAt: string;
  hasDocument: boolean;
  documentName?: string;
  payload: {
    katilim?: EgitimKatilim;
    taseron?: TaseronPersonel;
    egitim?: Egitim;
    calisan?: Calisan;
    relatedKatilimlar?: EgitimKatilim[];
    yetkinlik?: SkillMatrixRecord;
    machine?: Machine;
    qualityTest?: QualityTestRecord;
  };
}

export type ContractorDocType = 'KIMLIK' | 'SAGLIK' | 'ISG' | 'SABIKA';

export interface TaseronPersonel {
  ID: number;
  TASERON_CODE?: string; // Örn: TSR-101
  PASSWORD?: string; // Varsayılan: 1234
  FIRMA_ADI: string;
  PERSONEL_ADI_SOYADI: string;
  TC_PASAPORT_NO: string;
  GOREV_IS: string;
  ISG_EGITIM_TARIHI: string;
  ISG_EGITIM_BITIS_TARIHI: string;
  GIRIS_IZNI_BITIS_TARIHI: string;

  // Legacy single file support
  DOSYA_DATA?: string;
  DOSYA_ADI?: string;
  DOSYA_TIPI?: string;

  // 1. Kimlik Fotokopisi / T.C. Doğrulama
  KIMLIK_DOSYA_DATA?: string;
  KIMLIK_DOSYA_ADI?: string;
  KIMLIK_DOSYA_TIPI?: string;

  // 2. Periyodik Sağlık Raporu / Ek-2
  SAGLIK_DOSYA_DATA?: string;
  SAGLIK_DOSYA_ADI?: string;
  SAGLIK_DOSYA_TIPI?: string;

  // 3. İSG / Oryantasyon Eğitim Belgesi
  ISG_DOSYA_DATA?: string;
  ISG_DOSYA_ADI?: string;
  ISG_DOSYA_TIPI?: string;

  // 4. Adli Sicil Kaydı (Sabıka Kaydı)
  SABIKA_DOSYA_DATA?: string;
  SABIKA_DOSYA_ADI?: string;
  SABIKA_DOSYA_TIPI?: string;
}

export interface QueryTabOption {
  key: QueryTabKey;
  label: string;
  iconName: string;
  sql: string;
  description: string;
}

export type UserRole = 'ADMIN' | 'EMPLOYEE' | 'CONTRACTOR';

export interface AuthUser {
  id: number;
  username: string;
  fullName: string;
  role: UserRole;
  departmentId?: number;
  departmentName?: string;
  title: string;
  employeeId?: number; // Calisan ID if employee
  contractorCompany?: string;
  contractorCompanyCode?: string;
}

export interface UserSession {
  user: AuthUser;
  loginTime: string;
}
