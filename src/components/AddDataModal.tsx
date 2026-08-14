import React, { useState, useEffect, useMemo } from 'react';
import { Departman, Calisan, Egitim, UserRole } from '../types';
import { calculateAutoCertExpiryDate } from '../utils/dateUtils';
import { X, UserPlus, BookPlus, UserCheck, Plus, Check, Users, Search, BookOpen, Calendar, Clock, DollarSign, ShieldAlert } from 'lucide-react';

interface AddDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  departmanlar: Departman[];
  calisanlar: Calisan[];
  egitimler: Egitim[];
  userRole?: UserRole;
  onAddCalisan: (calisan: Omit<Calisan, 'ID'>) => void;
  onAddEgitim: (egitim: Omit<Egitim, 'ID'>) => void;
  onAddKatilim: (
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
    },
    sureSaat?: number
  ) => void;
}

export const AddDataModal: React.FC<AddDataModalProps> = ({
  isOpen,
  onClose,
  departmanlar,
  calisanlar,
  egitimler,
  userRole = 'ADMIN',
  onAddCalisan,
  onAddEgitim,
  onAddKatilim,
}) => {
  const [activeFormTab, setActiveFormTab] = useState<'CALISAN' | 'KATILIM'>('KATILIM');

  // Employee Form State
  const [empName, setEmpName] = useState('');
  const [empSurname, setEmpSurname] = useState('');
  const [empDeptId, setEmpDeptId] = useState<number>(departmanlar[0]?.ID || 101);
  const [empDate, setEmpDate] = useState(new Date().toISOString().split('T')[0]);

  // Unified Participation Form State (Single & Bulk)
  const [selectedEmpIds, setSelectedEmpIds] = useState<number[]>([]);
  const [empSearchQuery, setEmpSearchQuery] = useState('');
  const [partEgitimTitle, setPartEgitimTitle] = useState<string>(egitimler[0]?.EGITIM_ADI || '');
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  const [partStartDate, setPartStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [partStartTime, setPartStartTime] = useState<string>('09:30');
  const [partEndDate, setPartEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [partEndTime, setPartEndTime] = useState<string>('17:00');
  const [partHours, setPartHours] = useState<number>(8);
  const [partCertExpiryDate, setPartCertExpiryDate] = useState<string>('');

  const [partIsFree, setPartIsFree] = useState<boolean>(false);
  const [partGirisTipi, setPartGirisTipi] = useState<'KISI_BASI' | 'TOPLAM_TUTAR'>('KISI_BASI');
  const [partPriceInput, setPartPriceInput] = useState<number>(5000);
  const [partCurrency, setPartCurrency] = useState<'TL' | 'USD' | 'EUR'>('TL');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync participation defaults when partEgitimTitle changes or modal opens
  useEffect(() => {
    if (isOpen && egitimler.length > 0 && !partEgitimTitle) {
      setPartEgitimTitle(egitimler[0].EGITIM_ADI);
    }
  }, [isOpen, egitimler]);

  // Helper when user types or selects training
  const handleTrainingTitleChange = (newTitle: string) => {
    setPartEgitimTitle(newTitle);

    const found = egitimler.find(
      (e) => e.EGITIM_ADI.toLowerCase() === newTitle.trim().toLowerCase()
    );

    if (found) {
      const sDate = found.BASLANGIC_TARIHI || new Date().toISOString().split('T')[0];
      const sTime = found.BASLANGIC_SAATI || '09:30';
      const eDate = found.BITIS_TARIHI || sDate;
      const eTime = found.BITIS_SAATI || '17:00';

      setPartStartDate(sDate);
      setPartStartTime(sTime);
      setPartEndDate(eDate);
      setPartEndTime(eTime);
      setPartHours(found.SURE_SAAT || 8);

      const autoCert = found.SERTIFIKA_BITIS_TARIHI || calculateAutoCertExpiryDate(found.EGITIM_ADI, eDate);
      setPartCertExpiryDate(autoCert);

      setPartIsFree(found.UCRETSIZ ?? false);
      setPartGirisTipi(found.GIRIS_TIPI || 'KISI_BASI');
      setPartPriceInput(
        found.GIRIS_TIPI === 'TOPLAM_TUTAR'
          ? found.TOPLAM_TUTAR || 5000
          : found.KISI_BASI_TUTAR || 5000
      );
      setPartCurrency(found.PARA_BIRIMI || 'TL');
    } else if (newTitle.trim()) {
      const autoCert = calculateAutoCertExpiryDate(
        newTitle.trim(),
        partEndDate || new Date().toISOString().split('T')[0]
      );
      setPartCertExpiryDate(autoCert);
    }
  };

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Toggle single employee selection
  const toggleEmpSelect = (empId: number) => {
    setSelectedEmpIds((prev) =>
      prev.includes(empId) ? prev.filter((id) => id !== empId) : [...prev, empId]
    );
  };

  // Select/Unselect All
  const toggleSelectAll = () => {
    if (selectedEmpIds.length === calisanlar.length) {
      setSelectedEmpIds([]);
    } else {
      setSelectedEmpIds(calisanlar.map((c) => c.ID));
    }
  };

  // Filtered employee list for multi-select box
  const filteredCalisanlar = calisanlar.filter((c) => {
    if (!empSearchQuery.trim()) return true;
    const q = empSearchQuery.toLowerCase();
    const deptName = departmanlar.find((d) => d.ID === c.DEPARTMAN_ID)?.AD || '';
    return (
      c.AD.toLowerCase().includes(q) ||
      c.SOYAD.toLowerCase().includes(q) ||
      deptName.toLowerCase().includes(q) ||
      `#${c.ID}`.includes(q)
    );
  });

  const handleCalisanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName.trim() || !empSurname.trim()) return;

    onAddCalisan({
      AD: empName.trim(),
      SOYAD: empSurname.trim(),
      DEPARTMAN_ID: Number(empDeptId),
      ISE_GIRIS_TARIHI: empDate,
    });

    setEmpName('');
    setEmpSurname('');
    showToast('Yeni çalışan veritabanına başarıyla eklendi!');
  };

  // Dynamic fee calculation for Unified Katilim form
  const selectedCount = Math.max(1, selectedEmpIds.length);
  let computedKatilimKisiBasi = 0;
  let computedKatilimToplam = 0;
  let katilimInfoNote = '';

  if (partIsFree) {
    computedKatilimKisiBasi = 0;
    computedKatilimToplam = 0;
    katilimInfoNote = 'Ücretsiz Eğitim (Maliyetsiz - 0 TL)';
  } else if (partGirisTipi === 'KISI_BASI') {
    computedKatilimKisiBasi = partPriceInput;
    computedKatilimToplam = partPriceInput * selectedCount;
    katilimInfoNote = `Seçilen ${selectedCount} çalışan için kişi başı ${partPriceInput.toLocaleString('tr-TR')} ${partCurrency} (Toplam ${computedKatilimToplam.toLocaleString('tr-TR')} ${partCurrency})`;
  } else {
    computedKatilimToplam = partPriceInput;
    computedKatilimKisiBasi = Math.round(partPriceInput / selectedCount);
    katilimInfoNote = `Toplam ${partPriceInput.toLocaleString('tr-TR')} ${partCurrency} bütçe seçilen ${selectedCount} çalışana bölündü (Kişi başı ${computedKatilimKisiBasi.toLocaleString('tr-TR')} ${partCurrency})`;
  }

  const handleKatilimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = partEgitimTitle.trim();
    if (!trimmedTitle) {
      showToast('Lütfen geçerli bir eğitim adı yazın veya seçin!');
      return;
    }
    if (selectedEmpIds.length === 0) {
      showToast('Lütfen en az 1 çalışan seçin!');
      return;
    }

    let finalKisiBasi = 0;
    let finalToplam = 0;

    if (partIsFree) {
      finalKisiBasi = 0;
      finalToplam = 0;
    } else if (partGirisTipi === 'KISI_BASI') {
      finalKisiBasi = partPriceInput;
      finalToplam = partPriceInput * selectedCount;
    } else {
      finalToplam = partPriceInput;
      finalKisiBasi = Math.round(partPriceInput / selectedCount);
    }

    // Check if training already exists in egitimler
    let targetEgitim = egitimler.find(
      (eg) => eg.EGITIM_ADI.toLowerCase() === trimmedTitle.toLowerCase()
    );

    let effectiveEgitimId: number;

    if (targetEgitim) {
      effectiveEgitimId = targetEgitim.ID;
    } else {
      // Auto create new training module dynamically if typed title is new
      const nextId = egitimler.length > 0 ? Math.max(...egitimler.map((eg) => eg.ID)) + 1 : 201;
      effectiveEgitimId = nextId;

      onAddEgitim({
        EGITIM_ADI: trimmedTitle,
        SURE_SAAT: Number(partHours),
        BASLANGIC_TARIHI: partStartDate,
        BASLANGIC_SAATI: partStartTime,
        BITIS_TARIHI: partEndDate,
        BITIS_SAATI: partEndTime,
        EGITIM_TARIHI: `${partStartDate} - ${partEndDate}`,
        UCRETSIZ: partIsFree,
        TOPLAM_TUTAR: finalToplam,
        PARA_BIRIMI: partCurrency,
        KISI_BASI_TUTAR: finalKisiBasi,
        GIRIS_TIPI: partGirisTipi,
        SERTIFIKA_BITIS_TARIHI: partCertExpiryDate || undefined,
      });
    }

    onAddKatilim(
      selectedEmpIds,
      effectiveEgitimId,
      partStartDate,
      partStartTime,
      partEndDate,
      partEndTime,
      {
        ucretsiz: partIsFree,
        toplamTutar: finalToplam,
        kisiBasiTutar: finalKisiBasi,
        paraBirimi: partCurrency,
        girisTipi: partGirisTipi,
        sertifikaBitisTarihi: partCertExpiryDate || undefined,
      },
      partHours
    );

    showToast(
      selectedEmpIds.length === 1
        ? 'Çalışan için eğitim katılım kaydı oluşturuldu/güncellendi!'
        : `${selectedEmpIds.length} çalışan için toplu eğitim katılım kaydı oluşturuldu/güncellendi!`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/90 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/50">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Sarkuysan DB - Veri Ekleme Paneli</h3>
              <p className="text-xs text-slate-400">Tekli veya Toplu Eğitim Katılımı, Yeni Çalışan Ekleyin</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Tab Selector (2 Tabs) */}
        <div className="grid grid-cols-2 gap-1 p-2 bg-slate-950 border-b border-slate-800 text-xs font-semibold">
          <button
            onClick={() => setActiveFormTab('KATILIM')}
            className={`py-2 px-3 rounded-lg flex items-center justify-center space-x-1.5 transition-colors cursor-pointer ${
              activeFormTab === 'KATILIM'
                ? 'bg-amber-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Eğitim Katılımı (Tek/Toplu)</span>
          </button>

          <button
            onClick={() => setActiveFormTab('CALISAN')}
            className={`py-2 px-3 rounded-lg flex items-center justify-center space-x-1.5 transition-colors cursor-pointer ${
              activeFormTab === 'CALISAN'
                ? 'bg-amber-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Yeni Çalışan</span>
          </button>
        </div>

        {/* Notification Toast */}
        {toastMessage && (
          <div className="mx-4 mt-3 p-2.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center space-x-2">
            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Tab Forms */}
        <div className="p-4 sm:p-5">
          {/* 1. UNIFIED KATILIM FORM (Tekli & Toplu) */}
          {activeFormTab === 'KATILIM' && (
            <form onSubmit={handleKatilimSubmit} className="space-y-4 text-xs sm:text-sm">
              {/* Autocomplete Training Selection */}
              <div className="relative">
                <label className="block text-slate-300 font-bold mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-amber-400" />
                    Eğitim Adı Ara veya Yaz *
                  </span>
                  <span className="text-[10px] text-amber-400 font-normal">
                    (Listeden Seçin veya Elle Yeni Eğitim Girin)
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    list="egitim-autocomplete-datalist"
                    required
                    value={partEgitimTitle}
                    onFocus={() => setIsDropdownOpen(true)}
                    onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
                    onChange={(e) => handleTrainingTitleChange(e.target.value)}
                    placeholder="Eğitim Adı Ara veya Yaz..."
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white font-medium focus:border-amber-500 focus:outline-none placeholder-slate-500"
                  />
                  <datalist id="egitim-autocomplete-datalist">
                    {egitimler.map((e) => (
                      <option key={e.ID} value={e.EGITIM_ADI} />
                    ))}
                  </datalist>

                  {/* Filtered Interactive Suggestions Dropdown */}
                  {isDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1 z-30 max-h-48 overflow-y-auto bg-slate-900 border border-amber-500/50 rounded-xl shadow-2xl custom-scrollbar">
                      {egitimler.filter((e) =>
                        e.EGITIM_ADI.toLowerCase().includes(partEgitimTitle.toLowerCase().trim())
                      ).length === 0 ? (
                        <div className="p-3 text-xs text-amber-300 italic flex items-center gap-1.5">
                          <span>✨ "{partEgitimTitle}" adında yeni eğitim modülü oluşturulacaktır.</span>
                        </div>
                      ) : (
                        egitimler
                          .filter((e) =>
                            e.EGITIM_ADI.toLowerCase().includes(partEgitimTitle.toLowerCase().trim())
                          )
                          .map((e) => (
                            <div
                              key={e.ID}
                              onMouseDown={() => {
                                handleTrainingTitleChange(e.EGITIM_ADI);
                                setIsDropdownOpen(false);
                              }}
                              className="px-3.5 py-2.5 hover:bg-amber-500/20 text-xs text-slate-100 hover:text-white cursor-pointer border-b border-slate-800/60 last:border-0 flex items-center justify-between font-medium transition-colors"
                            >
                              <span className="flex items-center gap-2">
                                <BookOpen className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                                <span>{e.EGITIM_ADI}</span>
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">ID: #{e.ID}</span>
                            </div>
                          ))
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Employee Selection Area (Scrollable Checkbox List) */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-amber-400 font-bold text-xs flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    Katılımcı Çalışan(lar) Seçimi *
                  </label>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {selectedEmpIds.length} / {calisanlar.length} Seçildi
                  </span>
                </div>

                {/* Filter and Select All Row */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-1">
                  <label className="flex items-center space-x-2 text-xs text-slate-200 font-semibold cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={calisanlar.length > 0 && selectedEmpIds.length === calisanlar.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 accent-amber-500 rounded border-slate-700 cursor-pointer"
                    />
                    <span>[ ] Tüm Çalışanları Seç</span>
                  </label>

                  <div className="relative flex-1 max-w-xs">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="İsim veya departman ara..."
                      value={empSearchQuery}
                      onChange={(e) => setEmpSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-100 placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Scrollable Checkbox List */}
                <div className="max-h-40 overflow-y-auto space-y-1 p-1 bg-slate-900/80 border border-slate-800 rounded-lg custom-scrollbar">
                  {filteredCalisanlar.length === 0 ? (
                    <div className="p-3 text-center text-slate-500 text-xs">Aranan çalışan bulunamadı.</div>
                  ) : (
                    filteredCalisanlar.map((c) => {
                      const isSelected = selectedEmpIds.includes(c.ID);
                      const deptName = departmanlar.find((d) => d.ID === c.DEPARTMAN_ID)?.AD || 'Genel';
                      return (
                        <div
                          key={c.ID}
                          onClick={() => toggleEmpSelect(c.ID)}
                          className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-amber-500/20 border-amber-500/70 text-white font-semibold'
                              : 'bg-slate-950 border-slate-800/80 text-slate-300 hover:bg-slate-800/70'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}} // div onClick handles toggle
                              className="w-4 h-4 accent-amber-500 rounded border-slate-700 cursor-pointer"
                            />
                            <span className="font-mono text-amber-400 font-bold">#{c.ID}</span>
                            <span>{c.AD} {c.SOYAD}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                            {deptName}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Start & End Dates & Times */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-amber-300 font-medium mb-1">Başlangıç Tarihi *</label>
                  <input
                    type="date"
                    required
                    value={partStartDate}
                    onChange={(e) => setPartStartDate(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-amber-300 font-medium mb-1">Başlangıç Saati *</label>
                  <input
                    type="time"
                    required
                    value={partStartTime}
                    onChange={(e) => setPartStartTime(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Bitiş Tarihi *</label>
                  <input
                    type="date"
                    required
                    value={partEndDate}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPartEndDate(val);
                      setPartCertExpiryDate(calculateAutoCertExpiryDate(partEgitimTitle || '', val));
                    }}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Bitiş Saati *</label>
                  <input
                    type="time"
                    required
                    value={partEndTime}
                    onChange={(e) => setPartEndTime(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Sertifika Geçerlilik Tarihi & Süre */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1 flex items-center justify-between">
                    <span>Sertifika Bitiş Tarihi</span>
                  </label>
                  <input
                    type="date"
                    disabled={userRole !== 'ADMIN'}
                    value={partCertExpiryDate}
                    onChange={(e) => setPartCertExpiryDate(e.target.value)}
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-amber-500 focus:outline-none disabled:opacity-40"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      Eğitim Süresi (Saat) *
                    </span>
                    <span className="text-[10px] text-amber-400 font-normal">(Kişiye Özel)</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={partHours}
                    onChange={(e) => setPartHours(Math.max(1, Number(e.target.value)))}
                    placeholder="Örn: 14"
                    className="w-full p-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Dynamic Fee & Budget Module */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                  <span className="text-amber-400 font-bold text-xs uppercase tracking-wider">
                    Eğitim Ücreti & Bütçe Yönetimi
                  </span>
                  <label htmlFor="partIsFree" className="text-xs text-amber-300 font-semibold flex items-center gap-1.5 cursor-pointer">
                    <input
                      id="partIsFree"
                      type="checkbox"
                      checked={partIsFree}
                      disabled={userRole !== 'ADMIN'}
                      onChange={(e) => {
                        setPartIsFree(e.target.checked);
                        if (e.target.checked) setPartPriceInput(0);
                      }}
                      className="w-4 h-4 accent-amber-500 rounded border-slate-700 cursor-pointer"
                    />
                    Ücretsiz
                  </label>
                </div>

                {/* Entry Type Radio Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <label className={`flex items-center justify-center gap-2 p-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-all ${
                    partGirisTipi === 'KISI_BASI'
                      ? 'bg-amber-500/20 border-amber-500/80 text-amber-300 shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}>
                    <input
                      type="radio"
                      name="partGirisTipiRadio"
                      value="KISI_BASI"
                      checked={partGirisTipi === 'KISI_BASI'}
                      disabled={partIsFree || userRole !== 'ADMIN'}
                      onChange={() => setPartGirisTipi('KISI_BASI')}
                      className="accent-amber-500"
                    />
                    🔘 Kişi Başı Tutar
                  </label>

                  <label className={`flex items-center justify-center gap-2 p-1.5 rounded-lg border text-xs font-bold cursor-pointer transition-all ${
                    partGirisTipi === 'TOPLAM_TUTAR'
                      ? 'bg-amber-500/20 border-amber-500/80 text-amber-300 shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}>
                    <input
                      type="radio"
                      name="partGirisTipiRadio"
                      value="TOPLAM_TUTAR"
                      checked={partGirisTipi === 'TOPLAM_TUTAR'}
                      disabled={partIsFree || userRole !== 'ADMIN'}
                      onChange={() => setPartGirisTipi('TOPLAM_TUTAR')}
                      className="accent-amber-500"
                    />
                    🔘 Toplam Tutar
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-1">
                      {partGirisTipi === 'KISI_BASI' ? 'Kişi Başı Tutar' : 'Toplam Bütçe / Tutar'}
                    </label>
                    <input
                      type="number"
                      min="0"
                      disabled={partIsFree || userRole !== 'ADMIN'}
                      value={partPriceInput}
                      onChange={(e) => setPartPriceInput(Number(e.target.value))}
                      placeholder="Örn: 5000"
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-xs focus:border-amber-500 focus:outline-none disabled:opacity-40"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-1">Para Birimi</label>
                    <select
                      disabled={partIsFree || userRole !== 'ADMIN'}
                      value={partCurrency}
                      onChange={(e) => setPartCurrency(e.target.value as 'TL' | 'USD' | 'EUR')}
                      className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs focus:border-amber-500 focus:outline-none disabled:opacity-40"
                    >
                      <option value="TL">TL (₺)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>
                </div>

                {/* Dynamic Calculation Info Note */}
                <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 font-medium flex items-center justify-between gap-2">
                  <span className="font-bold text-[11px] uppercase tracking-wider text-amber-400">💡 Bütçe Hesabı:</span>
                  <span className="text-right font-semibold">{katilimInfoNote}</span>
                </div>

                {/* Automatic Generated Certificate Number Badge */}
                <div className="p-2.5 rounded-lg bg-slate-950 border border-amber-500/30 text-xs text-slate-300 flex items-center justify-between gap-2">
                  <span className="font-bold text-[11px] text-amber-400 flex items-center gap-1.5">
                    <span>📄 Otomatik Sertifika Kodu:</span>
                  </span>
                  <span className="font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                    SRK-2026-ISG-{Math.floor(1000 + Math.random() * 8999)}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">
                  {selectedEmpIds.length > 0 ? `${selectedEmpIds.length} çalışan seçili` : 'Lütfen çalışan seçin'}
                </span>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    Kapat
                  </button>
                  <button
                    type="submit"
                    disabled={selectedEmpIds.length === 0}
                    className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold transition-colors shadow cursor-pointer"
                  >
                    {selectedEmpIds.length > 1
                      ? `Toplu Katılım Kaydet (${selectedEmpIds.length} Çalışan)`
                      : 'Katılım Kaydını Oluştur'}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* 2. CALISAN FORM */}
          {activeFormTab === 'CALISAN' && (
            <form onSubmit={handleCalisanSubmit} className="space-y-4 text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Ad *</label>
                  <input
                    type="text"
                    required
                    value={empName}
                    onChange={(e) => setEmpName(e.target.value)}
                    placeholder="Örn: Mehmet"
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Soyad *</label>
                  <input
                    type="text"
                    required
                    value={empSurname}
                    onChange={(e) => setEmpSurname(e.target.value)}
                    placeholder="Örn: Yılmaz"
                    className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Departman *</label>
                <select
                  value={empDeptId}
                  onChange={(e) => setEmpDeptId(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-amber-500 focus:outline-none cursor-pointer"
                >
                  {departmanlar.map((d) => (
                    <option key={d.ID} value={d.ID}>
                      [{d.ID}] {d.AD}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">İşe Giriş Tarihi</label>
                <input
                  type="date"
                  value={empDate}
                  onChange={(e) => setEmpDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-lg text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Kapat
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold transition-colors shadow cursor-pointer"
                >
                  Çalışanı Kaydet (INSERT)
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
