import { Departman, Calisan, Egitim, EgitimKatilim, QueryTabKey } from '../types';
import { calculateTrainingStatus, calculateCertificateInfo, formatDateRange, formatDateTimeTR, formatDateTR } from './dateUtils';

export interface SqlQueryResultRow {
  [key: string]: string | number | boolean;
}

export function executeQueryTab(
  tabKey: QueryTabKey,
  departmanlar: Departman[],
  calisanlar: Calisan[],
  egitimler: Egitim[],
  katilimlar: EgitimKatilim[]
): SqlQueryResultRow[] {
  const deptMap = new Map<number, string>(departmanlar.map((d) => [d.ID, d.AD]));
  const calisanMap = new Map<number, Calisan>(calisanlar.map((c) => [c.ID, c]));
  const egitimMap = new Map<number, Egitim>(egitimler.map((e) => [e.ID, e]));

  switch (tabKey) {
    case 'ALL_EMPLOYEES': {
      return calisanlar.map((c) => {
        const empKatilimlar = katilimlar.filter((k) => k.CALISAN_ID === c.ID);
        const completedKatilimlar = empKatilimlar.filter((k) => k.TAMAMLANDI === 1);

        let latestCertExpiry = '-';
        let latestCertStatus = 'Sertifikasız / Beklemede';
        let minDaysRemaining = 9999;
        let latestCategory = 'Beklemede';

        if (completedKatilimlar.length > 0) {
          const certInfos = completedKatilimlar.map((k) => {
            const eg = egitimMap.get(k.EGITIM_ID);
            const endDate = eg?.BITIS_TARIHI || k.BASLANGIC_TARIHI || '2024-01-01';
            const customExpiry = k.SERTIFIKA_BITIS_TARIHI || eg?.SERTIFIKA_BITIS_TARIHI;
            return calculateCertificateInfo(endDate, true, 2, customExpiry);
          });
          certInfos.sort((a, b) => a.daysRemaining - b.daysRemaining);
          const urgentCert = certInfos[0];
          if (urgentCert) {
            latestCertExpiry = urgentCert.expiryDateStr;
            latestCertStatus = urgentCert.label;
            minDaysRemaining = urgentCert.daysRemaining;
            latestCategory = urgentCert.categoryLabel;
          }
        }

        return {
          ID: c.ID,
          AD: c.AD,
          SOYAD: c.SOYAD,
          CALISAN_ADI: `${c.AD} ${c.SOYAD}`,
          DEPARTMAN: deptMap.get(c.DEPARTMAN_ID) || 'Bilinmiyor',
          KATILDIGI_EGITIM_SAYISI: empKatilimlar.length,
          TAMAMLADIGI_SAYI: completedKatilimlar.length,
          ISE_GIRIS_TARIHI: c.ISE_GIRIS_TARIHI,
          SON_SERTIFIKA_BITIS: latestCertExpiry,
          SERTIFIKA_GECERLILIK_TARIHI: latestCertExpiry,
          SERTIFIKA_KALAN_GUN: minDaysRemaining === 9999 ? -999 : minDaysRemaining,
          SERTIFIKA_DURUMU: latestCertStatus,
          SERTIFIKA_UYARI_DURUMU: latestCategory,
        };
      });
    }

    case 'ALL_TRAININGS': {
      return egitimler.map((e) => {
        const dateRange = formatDateRange(e.BASLANGIC_TARIHI, e.BITIS_TARIHI);
        const baslangicSaati = e.BASLANGIC_SAATI || '09:00';
        const bitisSaati = e.BITIS_SAATI || '17:00';
        const statusInfo = calculateTrainingStatus(
          e.BASLANGIC_TARIHI,
          e.BITIS_TARIHI,
          0,
          e.MANUAL_STATUS,
          baslangicSaati,
          bitisSaati,
          e.SERTIFIKA_BITIS_TARIHI
        );
        const trKatilimlar = katilimlar.filter((k) => k.EGITIM_ID === e.ID);
        const totalKatilim = trKatilimlar.length;
        const tamamlananKatilim = trKatilimlar.filter(
          (k) => k.TAMAMLANDI === 1
        ).length;

        const katilanCalisanlar = trKatilimlar
          .map((k) => {
            const calisan = calisanMap.get(k.CALISAN_ID);
            return calisan ? `${calisan.AD} ${calisan.SOYAD}` : null;
          })
          .filter(Boolean)
          .join(', ');

        const currency = e.PARA_BIRIMI || 'TL';
        const isFree = Boolean(e.UCRETSIZ);
        const totalAmount = isFree ? 0 : e.TOPLAM_TUTAR || 0;
        const perPersonAmount = isFree
          ? 0
          : e.KISI_BASI_TUTAR || (totalKatilim > 0 ? Math.round(totalAmount / totalKatilim) : totalAmount);

        const kisiBasiStr = isFree
          ? 'Ücretsiz / 0 TL'
          : `${perPersonAmount.toLocaleString('tr-TR')} ${currency}`;
        const toplamTutarStr = isFree
          ? '0 TL (Ücretsiz)'
          : `${totalAmount.toLocaleString('tr-TR')} ${currency}`;

        const baslangicTarihSaat = formatDateTimeTR(e.BASLANGIC_TARIHI, baslangicSaati);
        const bitisTarihSaat = formatDateTimeTR(e.BITIS_TARIHI, bitisSaati);

        return {
          ID: e.ID,
          EGITIM_ID: e.ID,
          EGITIM_ADI: e.EGITIM_ADI,
          BASLANGIC_TARIHI_SAATI: baslangicTarihSaat,
          BITIS_TARIHI_SAATI: bitisTarihSaat,
          SURE_SAAT: `${e.SURE_SAAT} Saat`,
          TOPLAM_KATILIMCI: `${totalKatilim} Çalışan`,
          DURUM: statusInfo.label,
          // Extra / hidden fields used for detail modal & excel export
          KATILAN_CALISANLAR: katilanCalisanlar || 'Katılımcı Yok',
          TARIH_ARALIGI: `${dateRange} (${baslangicSaati} - ${bitisSaati})`,
          BASLANGIC_TARIHI: e.BASLANGIC_TARIHI,
          BASLANGIC_SAATI: baslangicSaati,
          BITIS_TARIHI: e.BITIS_TARIHI,
          BITIS_SAATI: bitisSaati,
          KISI_BASI_TUTAR: kisiBasiStr,
          TOPLAM_TUTAR: toplamTutarStr,
          PARA_BIRIMI: currency,
          KATILIM_DURUMU: `${tamamlananKatilim}/${totalKatilim} Tamamlandı`,
          RAW_KISI_BASI: perPersonAmount,
          RAW_TOPLAM_TUTAR: totalAmount,
          UCRETSIZ: isFree,
          SERTIFIKA_DOSYA_DATA: e.SERTIFIKA_DOSYA_DATA,
          SERTIFIKA_DOSYA_ADI: e.SERTIFIKA_DOSYA_ADI,
          SERTIFIKA_DOSYA_TIPI: e.SERTIFIKA_DOSYA_TIPI,
        };
      });
    }

    case 'LONGEST_TRAINING': {
      if (egitimler.length === 0) return [];
      const sorted = [...egitimler].sort((a, b) => b.SURE_SAAT - a.SURE_SAAT);
      const longest = sorted[0];
      const trKatilimlar = katilimlar.filter((k) => k.EGITIM_ID === longest.ID);
      const katilanCalisanlar = trKatilimlar
        .map((k) => {
          const calisan = calisanMap.get(k.CALISAN_ID);
          return calisan ? `${calisan.AD} ${calisan.SOYAD}` : null;
        })
        .filter(Boolean)
        .join(', ');

      return [
        {
          ID: longest.ID,
          EGITIM_ID: longest.ID,
          EGITIM_ADI: longest.EGITIM_ADI,
          KATILAN_CALISANLAR: katilanCalisanlar || 'Katılımcı Yok',
          TARIH_ARALIGI: formatDateRange(longest.BASLANGIC_TARIHI, longest.BITIS_TARIHI),
          SURE_SAAT: `${longest.SURE_SAAT} Saat`,
        },
      ];
    }

    default:
      return [];
  }
}
