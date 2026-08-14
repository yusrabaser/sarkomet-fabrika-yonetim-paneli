import React, { useState, useEffect } from 'react';
import { Egitim, ManualStatusType, UserRole } from '../types';
import { calculateTrainingStatus, formatDateRange, calculateAutoCertExpiryDate } from '../utils/dateUtils';
import { Edit3, X, Calendar, Clock, BookOpen, Save, Sparkles, CheckCircle2, ShieldAlert, Upload, Paperclip } from 'lucide-react';

interface EditTrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  egitim: Egitim | null;
  userRole?: UserRole;
  katilimSayisi?: number;
  onSave: (updatedEgitim: Egitim) => void;
}

export const EditTrainingModal: React.FC<EditTrainingModalProps> = ({
  isOpen,
  onClose,
  egitim,
  userRole = 'ADMIN',
  katilimSayisi = 1,
  onSave,
}) => {
  const [egitimAdi, setEgitimAdi] = useState('');
  const [baslangicTarihi, setBaslangicTarihi] = useState('');
  const [baslangicSaati, setBaslangicSaati] = useState('');
  const [bitisTarihi, setBitisTarihi] = useState('');
  const [bitisSaati, setBitisSaati] = useState('');
  const [sureSaat, setSureSaat] = useState(1);
  const [sertifikaBitisTarihi, setSertifikaBitisTarihi] = useState('');
  const [manualStatus, setManualStatus] = useState<ManualStatusType>('AUTO');
  const [ucretsiz, setUcretsiz] = useState(false);
  const [girisTipi, setGirisTipi] = useState<'KISI_BASI' | 'TOPLAM_TUTAR'>('KISI_BASI');
  const [priceInput, setPriceInput] = useState<number>(0);
  const [paraBirimi, setParaBirimi] = useState<'TL' | 'USD' | 'EUR'>('TL');
  const [certFileData, setCertFileData] = useState<string | undefined>(undefined);
  const [certFileName, setCertFileName] = useState<string | undefined>(undefined);
  const [certFileType, setCertFileType] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const handleCertFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCertFileData(reader.result as string);
        setCertFileName(file.name);
        setCertFileType(file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (egitim) {
      setEgitimAdi(egitim.EGITIM_ADI || '');
      setBaslangicTarihi(egitim.BASLANGIC_TARIHI || '');
      setBaslangicSaati(egitim.BASLANGIC_SAATI || '09:00');
      setBitisTarihi(egitim.BITIS_TARIHI || '');
      setBitisSaati(egitim.BITIS_SAATI || '17:00');
      setSureSaat(egitim.SURE_SAAT || 1);
      const defaultCertDate = egitim.SERTIFIKA_BITIS_TARIHI || calculateAutoCertExpiryDate(egitim.EGITIM_ADI, egitim.BITIS_TARIHI || egitim.BASLANGIC_TARIHI);
      setSertifikaBitisTarihi(defaultCertDate);
      setManualStatus(egitim.MANUAL_STATUS || 'AUTO');
      setUcretsiz(Boolean(egitim.UCRETSIZ));
      setCertFileData(egitim.SERTIFIKA_DOSYA_DATA);
      setCertFileName(egitim.SERTIFIKA_DOSYA_ADI);
      setCertFileType(egitim.SERTIFIKA_DOSYA_TIPI);
      
      const type = egitim.GIRIS_TIPI || 'KISI_BASI';
      setGirisTipi(type);
      if (type === 'TOPLAM_TUTAR') {
        setPriceInput(egitim.TOPLAM_TUTAR ?? 0);
      } else {
        setPriceInput(egitim.KISI_BASI_TUTAR ?? egitim.TOPLAM_TUTAR ?? 0);
      }

      setParaBirimi(egitim.PARA_BIRIMI || 'TL');
      setError(null);
    }
  }, [egitim, isOpen]);

  if (!isOpen || !egitim) return null;

  // Live computed status badge based on input dates, time & manual override
  const statusInfo = calculateTrainingStatus(baslangicTarihi, bitisTarihi, 0, manualStatus, baslangicSaati);

  // Dynamic fee calculation logic
  const effectiveCount = Math.max(1, katilimSayisi);
  let computedKisiBasi = 0;
  let computedToplam = 0;
  let infoNote = '';

  if (ucretsiz) {
    computedKisiBasi = 0;
    computedToplam = 0;
    infoNote = 'Ücretsiz Eğitim (Maliyetsiz - 0 TL)';
  } else if (girisTipi === 'KISI_BASI') {
    computedKisiBasi = priceInput;
    computedToplam = priceInput * effectiveCount;
    infoNote = `Kişi başı ${priceInput.toLocaleString('tr-TR')} ${paraBirimi}'den ${effectiveCount} kayıtlı kişi için toplam ${computedToplam.toLocaleString('tr-TR')} ${paraBirimi}`;
  } else {
    computedToplam = priceInput;
    computedKisiBasi = Math.round(priceInput / effectiveCount);
    infoNote = `Toplam ${priceInput.toLocaleString('tr-TR')} ${paraBirimi} bütçe ${effectiveCount} kişiye bölündü (Kişi başı ${computedKisiBasi.toLocaleString('tr-TR')} ${paraBirimi})`;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!egitimAdi.trim()) {
      setError('Eğitim adı boş olamaz!');
      return;
    }
    if (!baslangicTarihi || !bitisTarihi) {
      setError('Başlangıç ve Bitiş tarihlerini eksiksiz giriniz!');
      return;
    }
    if (new Date(baslangicTarihi) > new Date(bitisTarihi)) {
      setError('Başlangıç tarihi Bitiş tarihinden sonra olamaz!');
      return;
    }

    const updated: Egitim = {
      ...egitim,
      EGITIM_ADI: egitimAdi.trim(),
      BASLANGIC_TARIHI: baslangicTarihi,
      BASLANGIC_SAATI: baslangicSaati || '09:00',
      BITIS_TARIHI: bitisTarihi,
      BITIS_SAATI: bitisSaati || '17:00',
      SURE_SAAT: Number(sureSaat),
      EGITIM_TARIHI: formatDateRange(baslangicTarihi, bitisTarihi),
      MANUAL_STATUS: manualStatus,
      UCRETSIZ: ucretsiz,
      TOPLAM_TUTAR: computedToplam,
      KISI_BASI_TUTAR: computedKisiBasi,
      PARA_BIRIMI: paraBirimi,
      GIRIS_TIPI: girisTipi,
      SERTIFIKA_BITIS_TARIHI: sertifikaBitisTarihi || undefined,
      SERTIFIKA_DOSYA_DATA: certFileData,
      SERTIFIKA_DOSYA_ADI: certFileName,
      SERTIFIKA_DOSYA_TIPI: certFileType,
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Eğitim Bilgilerini Güncelle</h3>
              <p className="text-xs text-slate-400 font-mono">
                Eğitim ID: #{egitim.ID} (Yönetici Yetkisi)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Eğitim Adı */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Eğitim Programı Adı
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <BookOpen className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={egitimAdi}
                onChange={(e) => setEgitimAdi(e.target.value)}
                placeholder="Örn: Yüksek Sıcaklıkta İş Güvenliği"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all font-sans"
                required
              />
            </div>
          </div>

          {/* Tarih ve Saat Bilgileri */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-300 mb-1.5">
                Başlangıç Tarihi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="w-4 h-4 text-amber-400" />
                </div>
                <input
                  type="date"
                  value={baslangicTarihi}
                  onChange={(e) => setBaslangicTarihi(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-amber-300 mb-1.5">
                Başlangıç Saati
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
                <input
                  type="time"
                  value={baslangicSaati}
                  onChange={(e) => setBaslangicSaati(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all font-mono"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Bitiş Tarihi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type="date"
                  value={bitisTarihi}
                  onChange={(e) => setBitisTarihi(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all font-mono"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Bitiş Saati
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Clock className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type="time"
                  value={bitisSaati}
                  onChange={(e) => setBitisSaati(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all font-mono"
                  required
                />
              </div>
            </div>
          </div>

          {/* Sertifika Geçerlilik / Bitiş Tarihi (Manuel Takvim + Otomatik) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Sertifika Geçerlilik / Bitiş Tarihi
              </label>
              <button
                type="button"
                onClick={() => setSertifikaBitisTarihi(calculateAutoCertExpiryDate(egitimAdi, bitisTarihi || baslangicTarihi))}
                className="text-[11px] text-amber-400 hover:text-amber-300 hover:underline flex items-center font-medium"
                title="Eğitim Adındaki Anahtar Kelimelere Göre Otomatik Hesapla"
              >
                <Sparkles className="w-3 h-3 mr-1 text-amber-400" />
                Türüne Göre Otomatik Doldur
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Calendar className="w-4 h-4 text-amber-400" />
              </div>
              <input
                type="date"
                disabled={userRole !== 'ADMIN'}
                value={sertifikaBitisTarihi}
                onChange={(e) => setSertifikaBitisTarihi(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all font-mono disabled:opacity-40 cursor-pointer"
              />
            </div>
          </div>

          {/* Süre (Saat) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              Eğitim Süresi (Saat)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Clock className="w-4 h-4" />
              </div>
              <input
                type="number"
                min="1"
                max="500"
                value={sureSaat}
                onChange={(e) => setSureSaat(Number(e.target.value))}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl text-sm text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all font-mono"
                required
              />
            </div>
          </div>

          {/* Gerçek Sertifika Belgesi Yükleme (PDF, PNG, JPG) */}
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
            <label className="block text-slate-300 font-medium text-xs flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-amber-300 font-bold">
                <Upload className="w-4 h-4 text-amber-400" />
                Sertifika Belgesi Yükle / Güncelle (PDF, PNG, JPG)
              </span>
              {certFileName && (
                <span className="text-[11px] text-emerald-400 font-mono font-bold truncate max-w-[200px] flex items-center gap-1">
                  <Paperclip className="w-3.5 h-3.5 text-emerald-400" />
                  {certFileName}
                </span>
              )}
            </label>
            <input
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleCertFileChange}
              className="w-full text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-amber-500/20 file:text-amber-300 hover:file:bg-amber-500/30 cursor-pointer"
            />
            <p className="text-[10px] text-slate-400">
              Yüklenen gerçek belge (PDF veya Görsel) sistemde Base64 formatında saklanır ve "Belgeyi İndir" veya "Belgeyi Gör" modallarında doğrudan görüntülenebilir/indirilebilir.
            </p>
          </div>

          {/* Finansal Bütçe ve Maliyet Yönetimi */}
          <div className="p-3.5 bg-slate-950/90 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <span className="text-amber-400 font-bold text-xs uppercase tracking-wider">
                Eğitim Ücreti & Bütçe Yönetimi
              </span>
              <label htmlFor="editUcretsiz" className="text-xs text-amber-300 font-semibold flex items-center gap-1.5 cursor-pointer">
                <input
                  id="editUcretsiz"
                  type="checkbox"
                  checked={ucretsiz}
                  disabled={userRole !== 'ADMIN'}
                  onChange={(e) => {
                    setUcretsiz(e.target.checked);
                    if (e.target.checked) setPriceInput(0);
                  }}
                  className="w-4 h-4 accent-amber-500 rounded border-slate-700 cursor-pointer"
                />
                Ücretsiz
              </label>
            </div>

            {/* Giriş Tipi Radio Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <label className={`flex items-center justify-center gap-2 p-2 rounded-lg border text-xs font-bold cursor-pointer transition-all ${
                girisTipi === 'KISI_BASI'
                  ? 'bg-amber-500/20 border-amber-500/80 text-amber-300 shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}>
                <input
                  type="radio"
                  name="editGirisTipi"
                  value="KISI_BASI"
                  checked={girisTipi === 'KISI_BASI'}
                  disabled={ucretsiz || userRole !== 'ADMIN'}
                  onChange={() => setGirisTipi('KISI_BASI')}
                  className="accent-amber-500"
                />
                🔘 Kişi Başı Tutar
              </label>

              <label className={`flex items-center justify-center gap-2 p-2 rounded-lg border text-xs font-bold cursor-pointer transition-all ${
                girisTipi === 'TOPLAM_TUTAR'
                  ? 'bg-amber-500/20 border-amber-500/80 text-amber-300 shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}>
                <input
                  type="radio"
                  name="editGirisTipi"
                  value="TOPLAM_TUTAR"
                  checked={girisTipi === 'TOPLAM_TUTAR'}
                  disabled={ucretsiz || userRole !== 'ADMIN'}
                  onChange={() => setGirisTipi('TOPLAM_TUTAR')}
                  className="accent-amber-500"
                />
                🔘 Toplam Tutar
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {girisTipi === 'KISI_BASI' ? 'Kişi Başı Tutar' : 'Toplam Bütçe / Tutar'}
                </label>
                <input
                  type="number"
                  min="0"
                  disabled={ucretsiz || userRole !== 'ADMIN'}
                  value={priceInput}
                  onChange={(e) => setPriceInput(Number(e.target.value))}
                  placeholder="Örn: 5000"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:border-amber-500 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Para Birimi
                </label>
                <select
                  disabled={ucretsiz || userRole !== 'ADMIN'}
                  value={paraBirimi}
                  onChange={(e) => setParaBirimi(e.target.value as 'TL' | 'USD' | 'EUR')}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white focus:border-amber-500 focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <option value="TL">TL (₺)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>
            </div>

            {/* Dynamic Calculation Info Note */}
            <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 font-medium flex items-center justify-between gap-2">
              <span className="font-bold text-[11px] uppercase tracking-wider text-amber-400">💡 Bilgi Notu:</span>
              <span className="text-right font-semibold">{infoNote}</span>
            </div>
          </div>

          {/* Dynamic Status Preview Box */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-slate-300 font-medium">
                Hesaplanan Otomatik Durum:
              </span>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-bold border ${statusInfo.badgeClass}`}
            >
              {statusInfo.label}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              İptal
            </button>
            <button
              type="submit"
              className="inline-flex items-center px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4 mr-1.5" />
              Kaydet / Güncelle
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
