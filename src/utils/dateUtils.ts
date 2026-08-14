export type TrainingStatus = 'DEVAM_EDIYOR' | 'TAMAMLANDI' | 'TAMAMLANMADI' | 'PLANLANDI' | 'BASLAMADI' | 'SERTIFIKA_SURESI_DOLDU';

export interface StatusInfo {
  code: TrainingStatus;
  label: string;
  badgeClass: string;
}

export function formatDateTR(dateStr: string): string {
  if (!dateStr) return '';
  if (dateStr.includes('.')) return dateStr;
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d}.${m}.${y}`;
  }
  return dateStr;
}

export function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function formatDateRange(startDateStr: string, endDateStr: string): string {
  if (!startDateStr && !endDateStr) return '-';
  if (!endDateStr) return formatDateTR(startDateStr);
  return `${formatDateTR(startDateStr)} - ${formatDateTR(endDateStr)}`;
}

export function formatDateTimeTR(dateStr?: string, timeStr?: string): string {
  if (!dateStr) return '-';
  const formattedDate = formatDateTR(dateStr);
  if (!timeStr) return formattedDate;
  return `${formattedDate} - ${timeStr}`;
}

/**
 * Dynamically computes status based on current time (new Date()) and training start/end datetime:
 * - BASLAMADI: Current time is before Start Date & Time.
 * - DEVAM EDİYOR: Current time is between Start Date/Time and End Date/Time (inclusive).
 * - TAMAMLANDI: Current time has passed End Date & Time (or completion flag = 1).
 */
export function calculateTrainingStatus(
  baslangicTarihi: string,
  bitisTarihi: string,
  tamamlandiFlag: number,
  manualStatus?: string,
  baslangicSaati?: string,
  bitisSaati?: string,
  sertifikaBitisTarihi?: string
): StatusInfo {
  // Manual status override check (if set and not AUTO)
  if (manualStatus === 'TAMAMLANDI') {
    return {
      code: 'TAMAMLANDI',
      label: 'Geçerli',
      badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    };
  }
  if (manualStatus === 'SERTIFIKA_SURESI_DOLDU' || manualStatus === 'TAMAMLANMADI') {
    return {
      code: 'SERTIFIKA_SURESI_DOLDU',
      label: 'Sertifika Süresi Doldu',
      badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    };
  }
  if (manualStatus === 'DEVAM_EDIYOR') {
    return {
      code: 'DEVAM_EDIYOR',
      label: 'Devam Ediyor',
      badgeClass: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    };
  }
  if (manualStatus === 'BASLAMADI' || manualStatus === 'PLANLANDI') {
    return {
      code: 'BASLAMADI',
      label: 'Başlamadı',
      badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    };
  }

  const now = new Date();

  // Parse start hour and minute
  let startHour = 9;
  let startMin = 0;
  if (baslangicSaati && baslangicSaati.includes(':')) {
    const [h, m] = baslangicSaati.split(':').map(Number);
    startHour = isNaN(h) ? 9 : h;
    startMin = isNaN(m) ? 0 : m;
  }

  let startDate: Date;
  if (!baslangicTarihi) {
    startDate = new Date(1970, 0, 1);
  } else if (baslangicTarihi.includes('.')) {
    const [d, m, y] = baslangicTarihi.split('.').map(Number);
    startDate = new Date(y, m - 1, d, startHour, startMin);
  } else {
    const [y, m, d] = baslangicTarihi.split('-').map(Number);
    startDate = new Date(y, m - 1, d, startHour, startMin);
  }

  // Parse end hour and minute
  let endHour = 17;
  let endMin = 0;
  if (bitisSaati && bitisSaati.includes(':')) {
    const [h, m] = bitisSaati.split(':').map(Number);
    endHour = isNaN(h) ? 17 : h;
    endMin = isNaN(m) ? 0 : m;
  } else if (!bitisSaati) {
    endHour = 23;
    endMin = 59;
  }

  let endDate: Date;
  if (!bitisTarihi) {
    endDate = new Date(2099, 11, 31, 23, 59, 59);
  } else if (bitisTarihi.includes('.')) {
    const [d, m, y] = bitisTarihi.split('.').map(Number);
    endDate = new Date(y, m - 1, d, endHour, endMin);
  } else {
    const [y, m, d] = bitisTarihi.split('-').map(Number);
    endDate = new Date(y, m - 1, d, endHour, endMin);
  }

  // Determine Sertifika Expiry Date
  let certExpiryDate: Date | null = null;
  if (sertifikaBitisTarihi && sertifikaBitisTarihi.trim()) {
    const sStr = sertifikaBitisTarihi.trim();
    if (sStr.includes('.')) {
      const [d, m, y] = sStr.split('.').map(Number);
      certExpiryDate = new Date(y, m - 1, d, 23, 59, 59);
    } else if (sStr.includes('-')) {
      const [y, m, d] = sStr.split('-').map(Number);
      certExpiryDate = new Date(y, m - 1, d, 23, 59, 59);
    }
  } else if (bitisTarihi) {
    // Standard 2 year validity from end date if no explicit cert expiry date
    certExpiryDate = new Date(endDate);
    certExpiryDate.setFullYear(certExpiryDate.getFullYear() + 2);
  }

  // 1. Sertifika Süresi Doldu check: If certExpiryDate is passed
  if (certExpiryDate && now > certExpiryDate) {
    return {
      code: 'SERTIFIKA_SURESI_DOLDU',
      label: 'Sertifika Süresi Doldu',
      badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
    };
  }

  // 2. Currently ongoing (startDate <= now <= endDate)
  if (now >= startDate && now <= endDate) {
    return {
      code: 'DEVAM_EDIYOR',
      label: 'Devam Ediyor',
      badgeClass: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
    };
  }

  // 3. Not started yet (now < startDate)
  if (now < startDate) {
    return {
      code: 'BASLAMADI',
      label: 'Başlamadı',
      badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    };
  }

  // 4. End Date & Time passed AND Cert is still valid -> "Geçerli"
  return {
    code: 'TAMAMLANDI',
    label: 'Geçerli',
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  };
}

export interface CertificateInfo {
  expiryDateStr: string;
  status: 'EXPIRED' | 'CRITICAL_30' | 'WARNING_90' | 'VALID' | 'NOT_COMPLETED';
  categoryLabel: string;
  label: string;
  badgeClass: string;
  daysRemaining: number;
}

export function calculateCertificateInfo(
  completionDateStr: string,
  isCompleted: boolean,
  validityYearsOrEgitimAdi: number | string = 2,
  customExpiryDateStr?: string
): CertificateInfo {
  let years = 2;
  if (typeof validityYearsOrEgitimAdi === 'number') {
    years = validityYearsOrEgitimAdi;
  } else if (typeof validityYearsOrEgitimAdi === 'string') {
    const uppercaseName = validityYearsOrEgitimAdi.toUpperCase();
    if (uppercaseName.includes('İSG') || uppercaseName.includes('ISG') || uppercaseName.includes('GÜVENLİK') || uppercaseName.includes('GUVENLIK')) {
      years = 3;
    } else {
      const parsed = parseInt(validityYearsOrEgitimAdi, 10);
      years = !isNaN(parsed) ? parsed : 2;
    }
  }
  if (!completionDateStr && !customExpiryDateStr) {
    return {
      expiryDateStr: '-',
      status: 'NOT_COMPLETED',
      categoryLabel: 'Beklemede',
      label: 'Sertifikasız / Beklemede',
      badgeClass: 'bg-slate-800 text-slate-400 border border-slate-700 font-medium',
      daysRemaining: -999,
    };
  }

  let expiryDate: Date;
  let expiryDateStr: string;

  if (customExpiryDateStr && customExpiryDateStr.trim() !== '') {
    const trimmed = customExpiryDateStr.trim();
    if (trimmed.includes('.')) {
      const [d, m, y] = trimmed.split('.').map(Number);
      expiryDate = new Date(y, isNaN(m) ? 0 : m - 1, isNaN(d) ? 1 : d);
      const dayStr = String(isNaN(d) ? 1 : d).padStart(2, '0');
      const monthStr = String(isNaN(m) ? 1 : m).padStart(2, '0');
      expiryDateStr = `${dayStr}.${monthStr}.${y}`;
    } else if (trimmed.includes('-')) {
      const [y, m, d] = trimmed.split('-').map(Number);
      expiryDate = new Date(isNaN(y) ? 2026 : y, isNaN(m) ? 0 : m - 1, isNaN(d) ? 1 : d);
      const day = String(expiryDate.getDate()).padStart(2, '0');
      const month = String(expiryDate.getMonth() + 1).padStart(2, '0');
      const year = expiryDate.getFullYear();
      expiryDateStr = `${day}.${month}.${year}`;
    } else {
      expiryDate = new Date();
      expiryDateStr = trimmed;
    }
  } else {
    let baseDate: Date;
    if (completionDateStr.includes('.')) {
      const [d, m, y] = completionDateStr.split('.').map(Number);
      baseDate = new Date(y, isNaN(m) ? 0 : m - 1, isNaN(d) ? 1 : d);
    } else if (completionDateStr.includes('-')) {
      const [y, m, d] = completionDateStr.split('-').map(Number);
      baseDate = new Date(isNaN(y) ? 2026 : y, isNaN(m) ? 0 : m - 1, isNaN(d) ? 1 : d);
    } else {
      baseDate = new Date();
    }

    expiryDate = new Date(
      baseDate.getFullYear() + years,
      baseDate.getMonth(),
      baseDate.getDate()
    );

    const day = String(expiryDate.getDate()).padStart(2, '0');
    const month = String(expiryDate.getMonth() + 1).padStart(2, '0');
    const year = expiryDate.getFullYear();
    expiryDateStr = `${day}.${month}.${year}`;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiryDate.setHours(0, 0, 0, 0);

  const diffMs = expiryDate.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (daysRemaining <= 0) {
    return {
      expiryDateStr,
      status: 'EXPIRED',
      categoryLabel: 'Süresi Doldu',
      label: `🔴 Süresi Doldu (${daysRemaining} Gün)`,
      badgeClass: 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold',
      daysRemaining,
    };
  } else if (daysRemaining <= 30) {
    return {
      expiryDateStr,
      status: 'CRITICAL_30',
      categoryLabel: '30 Gün İçinde Dolanlar',
      label: `🟠 ${daysRemaining} Gün Kaldı (Acil)`,
      badgeClass: 'bg-orange-500/20 text-orange-300 border border-orange-500/40 font-bold',
      daysRemaining,
    };
  } else if (daysRemaining <= 90) {
    return {
      expiryDateStr,
      status: 'WARNING_90',
      categoryLabel: '90 Gün İçinde Dolanlar',
      label: `🟡 ${daysRemaining} Gün Kaldı (Yaklaşıyor)`,
      badgeClass: 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold',
      daysRemaining,
    };
  } else {
    return {
      expiryDateStr,
      status: 'VALID',
      categoryLabel: 'Geçerli',
      label: `🟢 ${daysRemaining} Gün Kaldı (Geçerli)`,
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold',
      daysRemaining,
    };
  }
}

/**
 * Automatically calculates Certificate Validity / Expiry Date based on training name & base training date:
 * - İSG / İş Güvenliği / Sıcaklık -> +3 Years
 * - Elektrik / Bakım / Arıza / Teknik -> +2 Years
 * - ISO / Kalite / Standart -> +1 Year
 * - Default -> +2 Years
 * Returns formatted YYYY-MM-DD for HTML date inputs.
 */
export function calculateAutoCertExpiryDate(trainingName: string, baseDateStr?: string): string {
  if (!trainingName || !trainingName.trim()) {
    return getFutureDateString(baseDateStr, 2);
  }

  const trLower = trainingName.toLocaleLowerCase('tr-TR') + ' ' + trainingName.toLowerCase();
  let yearsToAdd = 2; // Default fallback

  if (
    trLower.includes('isg') ||
    trLower.includes('iş güvenliği') ||
    trLower.includes('is guvenligi') ||
    trLower.includes('sıcaklık') ||
    trLower.includes('sicaklik')
  ) {
    yearsToAdd = 3;
  } else if (
    trLower.includes('elektrik') ||
    trLower.includes('bakım') ||
    trLower.includes('bakim') ||
    trLower.includes('arıza') ||
    trLower.includes('ariza') ||
    trLower.includes('teknik')
  ) {
    yearsToAdd = 2;
  } else if (
    trLower.includes('iso') ||
    trLower.includes('kalite') ||
    trLower.includes('standart')
  ) {
    yearsToAdd = 1;
  }

  return getFutureDateString(baseDateStr, yearsToAdd);
}

function getFutureDateString(baseDateStr: string | undefined, yearsToAdd: number): string {
  let baseDate: Date = new Date();

  if (baseDateStr && baseDateStr.trim()) {
    const trimmed = baseDateStr.trim();
    if (trimmed.includes('-')) {
      const [y, m, d] = trimmed.split('-').map(Number);
      baseDate = new Date(isNaN(y) ? 2026 : y, isNaN(m) ? 0 : m - 1, isNaN(d) ? 1 : d);
    } else if (trimmed.includes('.')) {
      const [d, m, y] = trimmed.split('.').map(Number);
      baseDate = new Date(isNaN(y) ? 2026 : y, isNaN(m) ? 0 : m - 1, isNaN(d) ? 1 : d);
    }
  }

  const expiryDate = new Date(
    baseDate.getFullYear() + yearsToAdd,
    baseDate.getMonth(),
    baseDate.getDate()
  );

  const y = expiryDate.getFullYear();
  const m = String(expiryDate.getMonth() + 1).padStart(2, '0');
  const d = String(expiryDate.getDate()).padStart(2, '0');

  return `${y}-${m}-${d}`;
}

/**
 * Generates official Sarkomet certificate code format: SRK-YYYY-{PREFIX}-{ID}
 */
export function generateCertificateCode(
  katilimOrEgitimId: number,
  egitimAdi?: string,
  calisanId?: number
): string {
  const year = new Date().getFullYear();
  let codePrefix = 'ISG';
  if (egitimAdi) {
    const uppercase = egitimAdi.toUpperCase();
    if (uppercase.includes('İSG') || uppercase.includes('ISG') || uppercase.includes('GÜVENLİK')) {
      codePrefix = 'ISG';
    } else if (uppercase.includes('ELEKTRİK') || uppercase.includes('BAKIM')) {
      codePrefix = 'BKM';
    } else if (uppercase.includes('KALİTE') || uppercase.includes('ISO')) {
      codePrefix = 'KLT';
    } else if (uppercase.includes('YALIN') || uppercase.includes('ÜRETİM')) {
      codePrefix = 'URT';
    } else {
      const clean = uppercase.replace(/[^A-Z]/g, '');
      codePrefix = clean.length >= 3 ? clean.substring(0, 3) : 'EGT';
    }
  }
  const paddedId = String(katilimOrEgitimId || 1000).padStart(4, '0');
  const empSuffix = calisanId ? `-${calisanId}` : '';
  return `SRK-${year}-${codePrefix}-${paddedId}${empSuffix}`;
}

/**
 * Triggers direct browser download for a Base64 data URL file using Blob URLs
 */
export function downloadFileFromBase64(dataUrl: string, fileName: string) {
  if (!dataUrl) return;
  try {
    let blobUrl = dataUrl;
    let isTempBlob = false;

    if (dataUrl.startsWith('data:')) {
      const parts = dataUrl.split(';base64,');
      const contentType = parts[0].replace('data:', '') || 'application/pdf';
      const base64Str = parts[1] || '';
      const cleanBase64 = base64Str.replace(/[\r\n\s]/g, '');
      const binaryString = atob(cleanBase64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: contentType });
      blobUrl = URL.createObjectURL(blob);
      isTempBlob = true;
    }

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName || 'sertifika_belgesi.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (isTempBlob) {
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    }
  } catch (err) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = fileName || 'sertifika_belgesi.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

