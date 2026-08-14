import React, { useState } from 'react';
import {
  Cpu,
  PlusCircle,
  Search,
  Wrench,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Activity,
  Layers,
  Zap,
  Filter,
  X,
  Sparkles,
  ShieldAlert,
  ArrowUpDown,
} from 'lucide-react';
import { Machine, MachineStatus, AuthUser } from '../types';

interface MachinesViewProps {
  machines: Machine[];
  currentUser: AuthUser;
  onAddMachine: (machine: Omit<Machine, 'id'>) => void;
  onUpdateMachine: (machine: Machine) => void;
  onDeleteMachine: (id: number) => void;
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

export const MachinesView: React.FC<MachinesViewProps> = ({
  machines = [],
  currentUser,
  onAddMachine,
  onUpdateMachine,
  onDeleteMachine,
  onRequestConfirm,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | MachineStatus>('ALL');

  // Modal State for Add/Edit Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);

  // Form Field States
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formMaterial, setFormMaterial] = useState('');
  const [formQuantity, setFormQuantity] = useState<number | string>(10000);
  const [formCapacity, setFormCapacity] = useState<number | string>(15000);
  const [formStatus, setFormStatus] = useState<MachineStatus>('AKTIF');
  const [formError, setFormError] = useState('');

  // Handle open modal for adding new machine
  const handleOpenAddModal = () => {
    const nextNum = machines.length > 0 ? Math.max(...machines.map((m) => m.id)) + 1 : 107;
    setEditingMachine(null);
    setFormCode(`MAK-${nextNum}`);
    setFormName('');
    setFormMaterial('');
    setFormQuantity(10000);
    setFormCapacity(15000);
    setFormStatus('AKTIF');
    setFormError('');
    setIsModalOpen(true);
  };

  // Handle open modal for editing existing machine
  const handleOpenEditModal = (machine: Machine) => {
    setEditingMachine(machine);
    setFormCode(machine.machine_code);
    setFormName(machine.machine_name);
    setFormMaterial(machine.target_material);
    setFormQuantity(machine.production_quantity);
    setFormCapacity(machine.daily_capacity);
    setFormStatus(machine.status);
    setFormError('');
    setIsModalOpen(true);
  };

  // Handle form submit
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formCode.trim()) {
      setFormError('Lütfen geçerli bir makine kodu giriniz!');
      return;
    }
    if (!formName.trim()) {
      setFormError('Lütfen makine adını giriniz!');
      return;
    }
    if (!formMaterial.trim()) {
      setFormError('Lütfen üretilen ürün/malzeme bilgisini giriniz!');
      return;
    }

    const qtyNum = Number(formQuantity);
    const capNum = Number(formCapacity);

    if (isNaN(qtyNum) || qtyNum < 0) {
      setFormError('Üretim miktarı geçerli bir pozitif sayı olmalıdır!');
      return;
    }
    if (isNaN(capNum) || capNum <= 0) {
      setFormError('Günlük kapasite 0\'dan büyük bir sayı olmalıdır!');
      return;
    }

    if (editingMachine) {
      // Update existing
      onUpdateMachine({
        id: editingMachine.id,
        machine_code: formCode.trim().toUpperCase(),
        machine_name: formName.trim(),
        target_material: formMaterial.trim(),
        production_quantity: qtyNum,
        daily_capacity: capNum,
        status: formStatus,
      });
    } else {
      // Add new
      onAddMachine({
        machine_code: formCode.trim().toUpperCase(),
        machine_name: formName.trim(),
        target_material: formMaterial.trim(),
        production_quantity: qtyNum,
        daily_capacity: capNum,
        status: formStatus,
      });
    }

    setIsModalOpen(false);
  };

  // Handle machine deletion with confirm modal
  const handleDeleteClick = (machine: Machine) => {
    const confirmMessage = `"${machine.machine_code} - ${machine.machine_name}" isimli makine kaydını silip Geri Dönüşüm Kutusu'na taşımak istediğinize emin misiniz?`;

    if (onRequestConfirm) {
      onRequestConfirm({
        title: 'Makine Kaydını Sil',
        message: confirmMessage,
        confirmText: 'Sil ve Çöp Kutusu\'na Taşı',
        variant: 'danger',
        iconType: 'delete',
        onConfirm: () => onDeleteMachine(machine.id),
      });
    } else {
      if (window.confirm(confirmMessage)) {
        onDeleteMachine(machine.id);
      }
    }
  };

  // Filter machines by search term and status
  const filteredMachines = machines.filter((m) => {
    const matchesSearch =
      (m.machine_code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.machine_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.target_material || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // KPI Calculations
  const totalCount = machines.length;
  const activeCount = machines.filter((m) => m.status === 'AKTIF').length;
  const maintenanceCount = machines.filter((m) => m.status === 'BAKIMDA').length;
  const passiveCount = machines.filter((m) => m.status === 'PASIF').length;

  const totalProduction = machines.reduce((sum, m) => sum + (m.production_quantity || 0), 0);
  const totalCapacity = machines.reduce((sum, m) => sum + (m.daily_capacity || 0), 0);
  const avgUtilization = totalCapacity > 0 ? Math.round((totalProduction / totalCapacity) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-cyan-500/30 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-inner shrink-0">
            <Cpu className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              Makinalar ve Üretim Hatları Yönetimi
            </h1>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Fabrika sahasındaki tüm ergitme, filmaşin, boru ve tel çekme makinelerinin anlık üretim hacimleri, günlük kapasiteleri ve revizyon durum takibi.
            </p>
          </div>
        </div>

        {currentUser.role === 'ADMIN' && (
          <button
            onClick={handleOpenAddModal}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-extrabold text-xs bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-950/50 border border-cyan-400/40 transition-all hover:scale-[1.02] cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            Yeni Makine Ekle
          </button>
        )}
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Toplam Makine</span>
            <span className="text-xl font-black text-white font-mono">{totalCount} Adet</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-800 text-slate-300">
            <Cpu className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Aktif Hatlar</span>
            <span className="text-xl font-black text-emerald-400 font-mono">{activeCount} Adet</span>
          </div>
          <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Bakımdaki Hatlar</span>
            <span className="text-xl font-black text-amber-400 font-mono">{maintenanceCount} Adet</span>
          </div>
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
            <Wrench className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Ortalama Verimlilik</span>
            <span className="text-xl font-black text-cyan-300 font-mono">%{avgUtilization}</span>
          </div>
          <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400">
            <Zap className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Makine kodu, adı veya ürün ara..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 text-slate-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'ALL'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            Tüm Makinalar ({totalCount})
          </button>

          <button
            onClick={() => setStatusFilter('AKTIF')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'AKTIF'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            Aktif ({activeCount})
          </button>

          <button
            onClick={() => setStatusFilter('BAKIMDA')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'BAKIMDA'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            Bakımda ({maintenanceCount})
          </button>

          <button
            onClick={() => setStatusFilter('PASIF')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === 'PASIF'
                ? 'bg-slate-800 text-slate-200 border border-slate-700 shadow-sm'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            Pasif ({passiveCount})
          </button>
        </div>
      </div>

      {/* Machine List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            Makine & Üretim Hattı Listesi ({filteredMachines.length} Kayıt)
          </h3>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3.5 px-4">Makine Kodu</th>
                <th className="py-3.5 px-4">Makine / Hat Adı</th>
                <th className="py-3.5 px-4">Üretilen Ürün / Malzeme</th>
                <th className="py-3.5 px-4 text-right">Anlık Üretim (Kg)</th>
                <th className="py-3.5 px-4 text-right">Günlük Kapasite (Kg)</th>
                <th className="py-3.5 px-4 min-w-36">Kapasite Kullanımı</th>
                <th className="py-3.5 px-4 text-center">Durum</th>
                {currentUser.role === 'ADMIN' && (
                  <th className="py-3.5 px-4 text-center">İşlemler</th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredMachines.length > 0 ? (
                filteredMachines.map((m) => {
                  const utilPct = m.daily_capacity > 0 ? Math.min(100, Math.round((m.production_quantity / m.daily_capacity) * 100)) : 0;

                  return (
                    <tr key={m.id} className="hover:bg-slate-800/50 transition-colors group">
                      {/* Makine Kodu */}
                      <td className="py-3.5 px-4 font-mono font-bold">
                        <span className="inline-flex items-center px-2 py-1 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 text-xs">
                          {m.machine_code}
                        </span>
                      </td>

                      {/* Makine Adı */}
                      <td className="py-3.5 px-4 font-bold text-white">
                        <div className="flex items-center gap-2">
                          <Cpu className="w-4 h-4 text-cyan-400 shrink-0" />
                          <span>{m.machine_name}</span>
                        </div>
                      </td>

                      {/* Üretilen Ürün/Malzeme */}
                      <td className="py-3.5 px-4 text-slate-300 font-medium">
                        {m.target_material}
                      </td>

                      {/* Üretim Miktarı */}
                      <td className="py-3.5 px-4 text-right font-mono font-extrabold text-cyan-300">
                        {m.production_quantity.toLocaleString()} Kg
                      </td>

                      {/* Günlük Kapasite */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-400">
                        {m.daily_capacity.toLocaleString()} Kg
                      </td>

                      {/* Kapasite Kullanım Barı */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                            <span className="text-slate-400">%{utilPct}</span>
                            <span className={utilPct >= 80 ? 'text-emerald-400' : utilPct >= 40 ? 'text-amber-400' : 'text-slate-400'}>
                              {utilPct >= 80 ? 'Yüksek' : utilPct >= 40 ? 'Normal' : 'Düşük'}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                utilPct >= 80
                                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                  : utilPct >= 40
                                  ? 'bg-gradient-to-r from-amber-500 to-orange-400'
                                  : 'bg-slate-600'
                              }`}
                              style={{ width: `${utilPct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Durum Badge */}
                      <td className="py-3.5 px-4 text-center">
                        {m.status === 'AKTIF' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            <CheckCircle2 className="w-3 h-3" />
                            Aktif
                          </span>
                        ) : m.status === 'BAKIMDA' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            <Wrench className="w-3 h-3" />
                            Bakımda
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-slate-800 text-slate-400 border border-slate-700">
                            <XCircle className="w-3 h-3" />
                            Pasif
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      {currentUser.role === 'ADMIN' && (
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(m)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-600/30 text-slate-300 hover:text-cyan-300 border border-slate-700 hover:border-cyan-500/40 transition-all cursor-pointer"
                              title="Makine Bilgilerini Düzenle"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteClick(m)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600/30 text-slate-300 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 transition-all cursor-pointer"
                              title="Makineyi Sil (Geri Dönüşüm Kutusu'na Taşı)"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={currentUser.role === 'ADMIN' ? 8 : 7}
                    className="py-12 text-center text-slate-500 text-xs"
                  >
                    <Cpu className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                    Kriterlere uygun makine kaydı bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Machine Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {editingMachine ? 'Makine Bilgilerini Güncelle' : 'Yeni Makine Kaydı Ekle'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Makine kodu, üretilen ürün ve kapasite parametrelerini tanımlayın
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

            {/* Modal Form */}
            <form onSubmit={handleSubmitForm} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {/* Makine Kodu */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Makine Kodu *
                  </label>
                  <input
                    type="text"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    placeholder="Örn: MAK-107"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                {/* Durum */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Çalışma Durumu *
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as MachineStatus)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="AKTIF">Aktif (Üretimde)</option>
                    <option value="BAKIMDA">Bakımda (Revizyonda)</option>
                    <option value="PASIF">Pasif (Kapalı)</option>
                  </select>
                </div>
              </div>

              {/* Makine Adı */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Makine / Üretim Hattı Adı *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Örn: Döküm Ergitme Fırını 2"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              {/* Üretilen Ürün/Malzeme */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Üretilen Ürün / Malzeme *
                </label>
                <input
                  type="text"
                  value={formMaterial}
                  onChange={(e) => setFormMaterial(e.target.value)}
                  placeholder="Örn: Oksijensiz Elektrolitik Bakır Filmaşin"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Üretim Miktarı */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Üretim Miktarı (Kg) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formQuantity}
                    onChange={(e) => setFormQuantity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                {/* Günlük Kapasite */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Günlük Kapasite (Kg) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-amber-300 font-mono focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                >
                  İptal
                </button>

                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-950/40"
                >
                  {editingMachine ? 'Güncelle' : 'Kaydet'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
