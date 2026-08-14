import React, { useState } from 'react';
import { X, HardHat, Building2, User, CreditCard, Briefcase, Calendar, CheckCircle2, ShieldAlert, KeyRound, Sparkles, ShieldCheck } from 'lucide-react';
import { TaseronPersonel } from '../types';

interface AddContractorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddContractor: (newContractor: Omit<TaseronPersonel, 'ID'>) => void;
  existingContractors?: TaseronPersonel[];
}

export const AddContractorModal: React.FC<AddContractorModalProps> = ({
  isOpen,
  onClose,
  onAddContractor,
  existingContractors = [],
}) => {
  const [firmaAdi, setFirmaAdi] = useState('');
  const [personelAdiSoyadi, setPersonelAdiSoyadi] = useState('');
  const [tcPasaportNo, setTcPasaportNo] = useState('');
  const [gorevIs, setGorevIs] = useState('');
  const [isgEgitimTarihi, setIsgEgitimTarihi] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [isgEgitimBitisTarihi, setIsgEgitimBitisTarihi] = useState(
    new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [girisIzniBitisTarihi, setGirisIzniBitisTarihi] = useState(
    new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );

  if (!isOpen) return null;

  // Auto-generate next unique Contractor ID (e.g. TSR-105)
  const nextNum = existingContractors.length > 0
    ? 101 + existingContractors.length
    : 101;
  const autoContractorCode = `TSR-${nextNum}`;
  const defaultPassword = '1234';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!firmaAdi.trim()) {
      alert('Lütfen taşeron firma adını giriniz.');
      return;
    }
    if (!personelAdiSoyadi.trim()) {
      alert('Lütfen taşeron çalışan adı soyadını giriniz.');
      return;
    }
    if (!tcPasaportNo.trim()) {
      alert('Lütfen T.C. Kimlik veya Pasaport numarasını giriniz.');
      return;
    }
    if (!gorevIs.trim()) {
      alert('Lütfen yapılacak iş / görev tanımını giriniz.');
      return;
    }

    onAddContractor({
      TASERON_CODE: autoContractorCode,
      PASSWORD: defaultPassword,
      FIRMA_ADI: firmaAdi.trim(),
      PERSONEL_ADI_SOYADI: personelAdiSoyadi.trim(),
      TC_PASAPORT_NO: tcPasaportNo.trim(),
      GOREV_IS: gorevIs.trim(),
      ISG_EGITIM_TARIHI: isgEgitimTarihi,
      ISG_EGITIM_BITIS_TARIHI: isgEgitimBitisTarihi,
      GIRIS_IZNI_BITIS_TARIHI: girisIzniBitisTarihi,
    });

    // Reset & close
    setFirmaAdi('');
    setPersonelAdiSoyadi('');
    setTcPasaportNo('');
    setGorevIs('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden my-auto text-slate-100">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 bg-slate-950 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <HardHat className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                ➕ Yeni Taşeron Personel Kaydı & Giriş ID Tanımlama
              </h3>
              <p className="text-xs text-slate-400">
                Fabrika sahasına girecek dış yüklenici personelinin İSG ve giriş izin kayıtları
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          {/* Automatic ID & Credentials Preview Banner */}
          <div className="p-4 bg-gradient-to-r from-amber-950/40 via-slate-950 to-orange-950/30 border border-amber-500/40 rounded-2xl shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Otomatik Portal Giriş Kimliği
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                🔑 Hazır Tanımlandı
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-2 pt-2 border-t border-slate-800">
              <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Otomatik Taşeron ID</span>
                <span className="text-amber-300 font-black text-base font-mono block mt-0.5">
                  {autoContractorCode}
                </span>
              </div>

              <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Varsayılan Şifre</span>
                <span className="text-emerald-400 font-black text-base font-mono block mt-0.5">
                  {defaultPassword}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-300 mt-2.5 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Admin bu Taşeron ID'yi (<strong>{autoContractorCode}</strong>) ve şifreyi (<strong>{defaultPassword}</strong>) firma yetkilisine ileterek portal girişini sağlayabilir.</span>
            </p>
          </div>
          
          {/* Firma Adı */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              Taşeron Firma Adı *
            </label>
            <input
              type="text"
              required
              placeholder="Örn: ABC Montaj A.Ş., Kocaeli Vinç Bakım Ltd."
              value={firmaAdi}
              onChange={(e) => setFirmaAdi(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
            />
          </div>

          {/* Çalışan Ad Soyad & T.C. No */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-amber-400" />
                Çalışan Adı Soyadı *
              </label>
              <input
                type="text"
                required
                placeholder="Örn: Ahmet Kemal Yıldız"
                value={personelAdiSoyadi}
                onChange={(e) => setPersonelAdiSoyadi(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                T.C. / Pasaport No *
              </label>
              <input
                type="text"
                required
                placeholder="Örn: 34812904812"
                value={tcPasaportNo}
                onChange={(e) => setTcPasaportNo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all font-mono"
              />
            </div>
          </div>

          {/* Yapılacak İş / Görev */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-amber-400" />
              Yapılacak İş / Görev *
            </label>
            <input
              type="text"
              required
              placeholder="Örn: Dökümhane Tavan Vinci Periyodik Bakımı, Trafo Onarımı"
              value={gorevIs}
              onChange={(e) => setGorevIs(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
            />
          </div>

          {/* Dates Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-amber-400" />
                İSG Oryantasyon Tarihi
              </label>
              <input
                type="date"
                required
                value={isgEgitimTarihi}
                onChange={(e) => setIsgEgitimTarihi(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-amber-400" />
                İSG Eğitim Bitiş Tarihi
              </label>
              <input
                type="date"
                required
                value={isgEgitimBitisTarihi}
                onChange={(e) => setIsgEgitimBitisTarihi(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Giriş İzni Bitiş Tarihi
              </label>
              <input
                type="date"
                required
                value={girisIzniBitisTarihi}
                onChange={(e) => setGirisIzniBitisTarihi(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <p className="text-[11px] text-slate-400 italic bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl">
            💡 <strong>Not:</strong> Kayıt oluşturulduktan sonra taşeron yetkilisi <strong>{autoContractorCode}</strong> ID'si ve <strong>{defaultPassword}</strong> şifresiyle sisteme giriş yapıp 4 zorunlu evrağı yükleyebilecektir.
          </p>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            >
              İptal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg shadow-orange-950/40 transition-all cursor-pointer hover:scale-[1.02]"
            >
              Kaydet & Sahaya Tanımla ({autoContractorCode})
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
