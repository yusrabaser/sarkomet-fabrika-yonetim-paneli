import React, { useState, useEffect } from 'react';
import { Calisan, Departman } from '../types';
import { X, User, Building2, Calendar, Save, CheckCircle2, AlertCircle } from 'lucide-react';

interface EditEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  calisan: Calisan | null;
  departmanlar: Departman[];
  onSave: (updatedCalisan: Calisan) => void;
}

export const EditEmployeeModal: React.FC<EditEmployeeModalProps> = ({
  isOpen,
  onClose,
  calisan,
  departmanlar,
  onSave,
}) => {
  const [ad, setAd] = useState('');
  const [soyad, setSoyad] = useState('');
  const [departmanId, setDepartmanId] = useState<number>(1);
  const [iseGirisTarihi, setIseGirisTarihi] = useState('');
  const [unvan, setUnvan] = useState('');
  const [sicilNo, setSicilNo] = useState('');
  const [telefon, setTelefon] = useState('');
  const [ePosta, setEPosta] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (calisan) {
      setAd(calisan.AD || '');
      setSoyad(calisan.SOYAD || '');
      setDepartmanId(calisan.DEPARTMAN_ID || (departmanlar[0]?.ID ?? 1));
      setIseGirisTarihi(calisan.ISE_GIRIS_TARIHI || new Date().toISOString().slice(0, 10));
      setUnvan((calisan as any).UNVAN || '');
      setSicilNo((calisan as any).SICIL_NO || `SIC-${calisan.ID}`);
      setTelefon((calisan as any).TELEFON || '');
      setEPosta((calisan as any).E_POSTA || '');
      setError(null);
    }
  }, [calisan, isOpen, departmanlar]);

  if (!isOpen || !calisan) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ad.trim()) {
      setError('Lütfen çalışanın adını giriniz.');
      return;
    }
    if (!soyad.trim()) {
      setError('Lütfen çalışanın soyadını giriniz.');
      return;
    }

    const updated: Calisan = {
      ...calisan,
      AD: ad.trim(),
      SOYAD: soyad.trim(),
      DEPARTMAN_ID: Number(departmanId),
      ISE_GIRIS_TARIHI: iseGirisTarihi,
      ...(unvan.trim() ? { UNVAN: unvan.trim() } : {}),
      ...(sicilNo.trim() ? { SICIL_NO: sicilNo.trim() } : {}),
      ...(telefon.trim() ? { TELEFON: telefon.trim() } : {}),
      ...(ePosta.trim() ? { E_POSTA: ePosta.trim() } : {}),
    } as Calisan;

    onSave(updated);
    onClose();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-slate-900 border border-amber-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-slate-100 my-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border-b border-amber-500/30">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-inner">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                Çalışan Bilgilerini Düzenle
                <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  ID: #{calisan.ID}
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                Ad, soyad ve departman bilgilerini güncelleyebilirsiniz.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Ad & Soyad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-amber-300 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-amber-400" />
                Çalışan Adı <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={ad}
                onChange={(e) => setAd(e.target.value)}
                placeholder="Örn: Ahmet"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 font-semibold"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-amber-300 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-amber-400" />
                Çalışan Soyadı <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={soyad}
                onChange={(e) => setSoyad(e.target.value)}
                placeholder="Örn: Yılmaz"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 font-semibold"
                required
              />
            </div>
          </div>

          {/* Departman & İşe Giriş Tarihi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-amber-300 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                Departman <span className="text-rose-400">*</span>
              </label>
              <select
                value={departmanId}
                onChange={(e) => setDepartmanId(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 font-medium"
              >
                {departmanlar.map((d) => (
                  <option key={d.ID} value={d.ID}>
                    {d.AD}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-amber-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                İşe Giriş Tarihi
              </label>
              <input
                type="date"
                value={iseGirisTarihi}
                onChange={(e) => setIseGirisTarihi(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 font-mono"
              />
            </div>
          </div>

          {/* Unvan / Görev & Sicil No */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Ünvan / Pozisyon</label>
              <input
                type="text"
                value={unvan}
                onChange={(e) => setUnvan(e.target.value)}
                placeholder="Örn: Kıdemli Uzman / Bakım Sorumlusu"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Sicil No</label>
              <input
                type="text"
                value={sicilNo}
                onChange={(e) => setSicilNo(e.target.value)}
                placeholder="Örn: SRK-042"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            >
              İptal
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-950/40 transition-all cursor-pointer flex items-center gap-1.5 hover:scale-105"
            >
              <Save className="w-4 h-4" />
              <span>Değişiklikleri Kaydet</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
