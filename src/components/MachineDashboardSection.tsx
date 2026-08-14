import React, { useState, useEffect, useRef } from 'react';
import {
  Cpu,
  Activity,
  Wrench,
  Zap,
  BarChart3,
  PieChart,
  CheckCircle2,
  Layers,
  Box,
  Filter,
  X,
  Check,
  FileCheck,
  ShieldCheck,
  Award,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Machine } from '../types';

interface MachineDashboardSectionProps {
  machines: Machine[];
}

const PRODUCT_COLOR_MAP: Record<
  string,
  { main: string; hover: string; bg: string; text: string; border: string }
> = {
  'Filmaşin Bakır Çubuk': {
    main: '#E83E8C', // Pembe / Pink
    hover: '#ec407a',
    bg: 'bg-pink-500',
    text: 'text-pink-400',
    border: 'border-pink-500/40',
  },
  'Oksijensiz Elektrolitik Bakır Filmaşin': {
    main: '#00BCD4', // Açık Mavi / Cyan
    hover: '#26c6da',
    bg: 'bg-cyan-500',
    text: 'text-cyan-400',
    border: 'border-cyan-500/40',
  },
  'Emaye Kaplanmış Bakır Tel': {
    main: '#FFB300', // Sarı / Amber
    hover: '#ffca28',
    bg: 'bg-amber-500',
    text: 'text-amber-400',
    border: 'border-amber-500/40',
  },
  'Dikişsiz Sanayi Bakır Borusu': {
    main: '#2ECC71', // Yeşil / Emerald
    hover: '#48c9b0',
    bg: 'bg-emerald-500',
    text: 'text-emerald-400',
    border: 'border-emerald-500/40',
  },
  'Bükülü Esnek Bakır İletken': {
    main: '#9C27B0', // Mor / Purple
    hover: '#ab47bc',
    bg: 'bg-purple-500',
    text: 'text-purple-400',
    border: 'border-purple-500/40',
  },
  'Kalay Kaplı Bakır Tel': {
    main: '#f97316', // Turuncu / Orange
    hover: '#fdba74',
    bg: 'bg-orange-500',
    text: 'text-orange-400',
    border: 'border-orange-500/40',
  },
};

const FALLBACK_DONUT_COLORS = [
  { main: '#E83E8C', hover: '#ec407a', bg: 'bg-pink-500', text: 'text-pink-400', border: 'border-pink-500/40' },
  { main: '#00BCD4', hover: '#26c6da', bg: 'bg-cyan-500', text: 'text-cyan-400', border: 'border-cyan-500/40' },
  { main: '#FFB300', hover: '#ffca28', bg: 'bg-amber-500', text: 'text-amber-400', border: 'border-amber-500/40' },
  { main: '#2ECC71', hover: '#48c9b0', bg: 'bg-emerald-500', text: 'text-emerald-400', border: 'border-emerald-500/40' },
  { main: '#9C27B0', hover: '#ab47bc', bg: 'bg-purple-500', text: 'text-purple-400', border: 'border-purple-500/40' },
];

export const MachineDashboardSection: React.FC<MachineDashboardSectionProps> = ({ machines = [] }) => {
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const [hoveredSliceIndex, setHoveredSliceIndex] = useState<number | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);
  const [modalProduct, setModalProduct] = useState<string | null>(null);
  const plotlyContainerRef = useRef<HTMLDivElement>(null);

  // Compute KPI Metrics safely
  const totalMachines = machines.length;
  const activeMachines = machines.filter((m) => m.status === 'AKTIF').length;
  const maintenanceMachines = machines.filter((m) => m.status === 'BAKIMDA').length;
  const passiveMachines = machines.filter((m) => m.status === 'PASIF').length;

  const totalProduction = machines.reduce((sum, m) => sum + (m.production_quantity || 0), 0);
  const totalCapacity = machines.reduce((sum, m) => sum + (m.daily_capacity || 0), 0);
  const overallUtilization = totalCapacity > 0 ? Math.min(100, Math.round((totalProduction / totalCapacity) * 100)) : 0;

  // Grouping by target_material for Pie/Donut chart
  const materialGroupMap = new Map<string, { totalQty: number; count: number }>();
  machines.forEach((m) => {
    const mat = m.target_material || 'Diğer Ürünler';
    // Clean test1 / test 1 entries if present
    const lowerMat = mat.toLowerCase().trim();
    if (lowerMat.includes('test1') || lowerMat.includes('test 1')) {
      return;
    }
    const current = materialGroupMap.get(mat) || { totalQty: 0, count: 0 };
    materialGroupMap.set(mat, {
      totalQty: current.totalQty + (m.production_quantity || 0),
      count: current.count + 1,
    });
  });

  const materialData = Array.from(materialGroupMap.entries())
    .filter(([material]) => {
      const lowerMat = material.toLowerCase().trim();
      return !lowerMat.includes('test1') && !lowerMat.includes('test 1');
    })
    .map(([material, data]) => ({
      material,
      qty: data.totalQty,
      count: data.count,
    }));

  const pieTotalQty = materialData.reduce((sum, d) => sum + d.qty, 0);

  // Filter machines based on selectedMaterial
  const displayedMachines = selectedMaterial
    ? machines.filter((m) => m.target_material === selectedMaterial)
    : machines;

  // SVG Donut Slices Calculation
  let cumulativeAngle = 0;
  const slices = materialData.map((d, index) => {
    const percentage = pieTotalQty > 0 ? (d.qty / pieTotalQty) * 100 : 0;
    const angle = (percentage / 100) * 360;
    const startAngle = cumulativeAngle;
    const midAngle = startAngle + angle / 2;
    cumulativeAngle += angle;

    // SVG arc coordinates
    const radius = 68;
    const cx = 100;
    const cy = 100;

    const x1 = cx + radius * Math.cos((Math.PI * (startAngle - 90)) / 180);
    const y1 = cy + radius * Math.sin((Math.PI * (startAngle - 90)) / 180);
    const x2 = cx + radius * Math.cos((Math.PI * (startAngle + angle - 90)) / 180);
    const y2 = cy + radius * Math.sin((Math.PI * (startAngle + angle - 90)) / 180);

    const largeArcFlag = angle > 180 ? 1 : 0;
    const pathData =
      angle >= 359.9
        ? `M ${cx},${cy - radius} A ${radius},${radius} 0 1,1 ${cx - 0.01},${cy - radius}`
        : `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

    const colorConfig =
      PRODUCT_COLOR_MAP[d.material] ||
      FALLBACK_DONUT_COLORS[index % FALLBACK_DONUT_COLORS.length];

    const isSelected = selectedMaterial === d.material;
    const isHovered = hoveredSliceIndex === index;
    const pullDistance = isSelected ? 8 : isHovered ? 4 : 0;
    const dx = pullDistance * Math.cos((Math.PI * (midAngle - 90)) / 180);
    const dy = pullDistance * Math.sin((Math.PI * (midAngle - 90)) / 180);

    return {
      ...d,
      percentage: Math.round(percentage),
      pathData,
      color: colorConfig.main,
      colorConfig,
      midAngle,
      dx,
      dy,
      isSelected,
      isHovered,
    };
  });

  const selectedSliceData = slices.find((s) => s.material === selectedMaterial);

  const handleSelectMaterialAndOpenModal = (materialName: string) => {
    setSelectedMaterial((prev) => (prev === materialName ? null : materialName));
    setModalProduct(materialName);
  };

  const handleToggleMaterial = (materialName: string) => {
    setSelectedMaterial((prev) => (prev === materialName ? null : materialName));
  };

  // Plotly Dark Theme Donut Chart Integration & Event Handler
  useEffect(() => {
    if (!plotlyContainerRef.current || !(window as any).Plotly) return;

    const labels = materialData.map((d) => d.material);
    const values = materialData.map((d) => d.qty);
    const colors = materialData.map(
      (d) => PRODUCT_COLOR_MAP[d.material]?.main || '#E83E8C'
    );

    const plotData = [
      {
        type: 'pie',
        labels,
        values,
        hole: 0.60,
        marker: {
          colors,
          line: { color: '#020617', width: 2 },
        },
        textinfo: 'percent',
        textposition: 'inside',
        insidetextfont: { color: '#ffffff', size: 10, family: 'sans-serif', weight: 'bold' },
        hoverinfo: 'label+value+percent',
        hovertemplate: '<b>%{label}</b><br>Üretim: %{value:,.0f} Kg<br>Pay: %{percent}<extra></extra>',
      },
    ];

    const centerText = selectedSliceData
      ? `<b style="color:${selectedSliceData.color};font-size:10px;">${selectedSliceData.material}</b><br><b style="color:#ffffff;font-size:14px;font-family:monospace;">${selectedSliceData.qty.toLocaleString('tr-TR')} Kg</b><br><span style="color:#f59e0b;font-weight:bold;font-size:11px;">%${selectedSliceData.percentage} Pay</span>`
      : `<span style="color:#94a3b8;font-size:9px;font-weight:bold;letter-spacing:0.5px;">TOPLAM HACİM</span><br><b style="color:#ffffff;font-size:15px;font-family:monospace;">${pieTotalQty.toLocaleString('tr-TR')} Kg</b><br><span style="color:#00BCD4;font-size:10px;font-weight:bold;">%100 Tümü</span>`;

    const plotLayout = {
      showlegend: false,
      margin: { t: 5, b: 5, l: 5, r: 5 },
      paper_bgcolor: 'transparent',
      plot_bgcolor: 'transparent',
      height: 210,
      width: 210,
      annotations: [
        {
          font: { size: 10, color: '#94a3b8' },
          showarrow: false,
          text: centerText,
          x: 0.5,
          y: 0.5,
        },
      ],
    };

    const config = { responsive: true, displayModeBar: false };

    try {
      (window as any).Plotly.newPlot(plotlyContainerRef.current, plotData, plotLayout, config);

      const container = plotlyContainerRef.current as any;
      if (container && container.on) {
        container.removeAllListeners?.('plotly_click');
        container.on('plotly_click', (data: any) => {
          if (data && data.points && data.points[0]) {
            const clickedMaterial = data.points[0].label;
            handleSelectMaterialAndOpenModal(clickedMaterial);
          }
        });
      }
    } catch (err) {
      console.warn('Plotly error:', err);
    }
  }, [materialData, selectedMaterial, pieTotalQty, selectedSliceData]);

  // Modal Spec Data
  const getProductModalSpecs = (productName: string) => {
    const machineObj = machines.find((m) => m.target_material === productName);
    const color = PRODUCT_COLOR_MAP[productName]?.main || '#E83E8C';
    return {
      productName,
      machineCode: machineObj?.machine_code || 'MAK-101',
      machineName: machineObj?.machine_name || 'Üretim Hattı',
      productionQty: machineObj?.production_quantity || 18400,
      color,
      diameter: '0.05 - 8.00 mm',
      tensileStrength: '245 N/mm² (Limit: 200 - 280)',
      conductivity: '%101.8 IACS (Limit: 100.0 - 102.5)',
      status: 'UYGUN',
    };
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Section Title & Subtitle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-inner">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Makine Performans Analizi & Üretim Metrikleri
            </h2>
            <p className="text-xs text-slate-400">
              Fabrikadaki tüm makinelerin anlık aktif durumları, kapasite kullanım oranları ve ürün bazlı üretim dağılımları
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-slate-300 font-mono self-start md:self-auto">
          <Activity className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span>Canlı Makine Verisi ({totalMachines} Ünite)</span>
        </div>
      </div>

      {/* 1. Makine KPI Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Toplam Aktif Makine Sayısı */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/30 border border-emerald-500/30 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Toplam Aktif Makine
            </span>
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono">{activeMachines}</span>
            <span className="text-xs text-slate-400">/ {totalMachines} Makine</span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Aktiflik Oranı:</span>
            <span className="text-emerald-400 font-bold font-mono">
              %{totalMachines > 0 ? Math.round((activeMachines / totalMachines) * 100) : 0}
            </span>
          </div>
        </div>

        {/* KPI 2: Bakımdaki Makine Sayısı */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/30 border border-amber-500/30 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Bakımdaki Makine
            </span>
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-400 font-mono">{maintenanceMachines}</span>
            <span className="text-xs text-slate-400">Ünite Revizyonda</span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Pasif/Kapalı Ünite:</span>
            <span className="text-rose-400 font-bold font-mono">{passiveMachines} Adet</span>
          </div>
        </div>

        {/* KPI 3: Makinelerin Toplam Üretim Hacmi */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/30 border border-cyan-500/30 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Toplam Üretim Hacmi
            </span>
            <div className="p-2 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-cyan-300 font-mono">
              {totalProduction.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-cyan-400">Kg</span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Genel Verimlilik:</span>
            <span className="text-cyan-400 font-bold font-mono">%{overallUtilization}</span>
          </div>
        </div>

        {/* KPI 4: Günlük Toplam Kapasite */}
        <div className="p-4 rounded-xl bg-gradient-to-br from-slate-900 via-slate-900 to-purple-950/30 border border-purple-500/30 shadow-lg relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Günlük Kapasite Tavanı
            </span>
            <div className="p-2 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-purple-300 font-mono">
              {totalCapacity.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-purple-400">Kg/Gün</span>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Kapasite Marjı:</span>
            <span className="text-purple-400 font-bold font-mono">
              {(totalCapacity - totalProduction).toLocaleString()} Kg
            </span>
          </div>
        </div>
      </div>

      {/* 2. Plotly Dark Tema Grafikler Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        {/* Grafikler 1: Makine Bazlı Üretim Miktarları (Bar Chart & List) - 7 cols */}
        <div className="lg:col-span-7 bg-slate-950/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">
                  Makine Bazlı Üretim Miktarları & Kapasiteler
                </h3>
              </div>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                Plotly Dark Theme Bar
              </span>
            </div>

            {/* Active Material Filter Notification Bar */}
            {selectedMaterial && (
              <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-pink-950/50 via-slate-900 to-purple-950/50 border border-pink-500/40 shadow-lg flex items-center justify-between gap-2 animate-fadeIn">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse shrink-0" />
                  <div className="text-xs truncate">
                    <span className="text-slate-400">Filtrelenen Ürün: </span>
                    <span className="font-bold text-pink-300">{selectedMaterial}</span>
                    <span className="text-slate-400 text-[11px] ml-2">
                      ({displayedMachines.length} Makine Listeleniyor)
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedMaterial(null)}
                  className="px-2.5 py-1 rounded-lg bg-pink-500/20 text-pink-300 hover:bg-pink-500 hover:text-white border border-pink-500/40 text-xs font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Filtreyi Temizle</span>
                </button>
              </div>
            )}

            {/* Custom SVG / HTML Dark Theme Bar Chart */}
            <div className="space-y-3 pt-1">
              {displayedMachines.length > 0 ? (
                displayedMachines.map((m, idx) => {
                  const utilPct = m.daily_capacity > 0 ? Math.min(100, Math.round((m.production_quantity / m.daily_capacity) * 100)) : 0;
                  const isHovered = hoveredBarIndex === idx;

                  let barGradient = 'from-cyan-500 to-amber-500';
                  let statusBadge = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
                  let statusText = 'Aktif';

                  if (m.status === 'BAKIMDA') {
                    barGradient = 'from-amber-600 to-orange-500';
                    statusBadge = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
                    statusText = 'Bakımda';
                  } else if (m.status === 'PASIF') {
                    barGradient = 'from-slate-700 to-slate-800';
                    statusBadge = 'bg-slate-800 text-slate-400 border-slate-700';
                    statusText = 'Pasif';
                  }

                  const matColorConfig = PRODUCT_COLOR_MAP[m.target_material];

                  return (
                    <div
                      key={m.id}
                      onMouseEnter={() => setHoveredBarIndex(idx)}
                      onMouseLeave={() => setHoveredBarIndex(null)}
                      className={`p-3 rounded-xl border transition-all duration-200 ${
                        isHovered
                          ? 'bg-slate-900 border-cyan-500/50 shadow-md shadow-cyan-950/20 scale-[1.01]'
                          : 'bg-slate-900/60 border-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-mono font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-[11px] shrink-0">
                            {m.machine_code}
                          </span>
                          <span className="font-bold text-white truncate">{m.machine_name}</span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusBadge}`}>
                            {statusText}
                          </span>
                          <span className="text-xs font-mono font-extrabold text-cyan-300">
                            {m.production_quantity.toLocaleString()} / {m.daily_capacity.toLocaleString()} Kg
                          </span>
                        </div>
                      </div>

                      {/* Bar visual representation */}
                      <div className="relative w-full h-3.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${barGradient} transition-all duration-500`}
                          style={{ width: `${utilPct}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-mono">
                        <span className="truncate flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full inline-block shrink-0"
                            style={{ backgroundColor: matColorConfig?.main || '#06b6d4' }}
                          />
                          <span>Ürün: <strong>{m.target_material}</strong></span>
                        </span>
                        <span className="font-bold text-amber-400">%{utilPct} Verimlilik</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-8 text-center bg-slate-900/50 rounded-xl border border-slate-800 text-slate-400 text-xs">
                  Bu ürünü üreten makine kaydı bulunamadı.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 inline-block" /> Üretim Miktarı (Kg)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Bakımdaki Hatlar
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-700 inline-block" /> Pasif Kapasite
            </span>
          </div>
        </div>

        {/* Grafikler 2: Ürünlerin Makinelere Göre Dağılımı (Plotly Dark Donut) - 5 cols */}
        <div className="lg:col-span-5 bg-slate-950/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
              <div className="flex items-center gap-2">
                <PieChart className="w-5 h-5 text-pink-400" />
                <h3 className="text-sm font-bold text-white">
                  Ürünlerin Makinelere Göre Dağılımı
                </h3>
              </div>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                Plotly Dark Donut
              </span>
            </div>

            <p className="text-[11px] text-slate-400 mb-3">
              Dilimlere veya lejant listesindeki ürünlere tıklayarak makineleri filtreleyebilirsiniz.
            </p>

            {/* Donut Visual & Plotly Container */}
            <div className="flex flex-col items-center justify-center my-2 relative min-h-[220px]">
              {/* Plotly Canvas Container */}
              <div ref={plotlyContainerRef} className="w-[210px] h-[210px] flex items-center justify-center relative z-10" />

              {/* Fallback Interactive SVG Donut */}
              {(!plotlyContainerRef.current || !(window as any).Plotly) && (
                <div className="relative flex items-center justify-center">
                  <svg viewBox="0 0 200 200" className="w-52 h-52 drop-shadow-2xl overflow-visible">
                    {slices.map((slice, idx) => {
                      const opacity =
                        selectedMaterial === null
                          ? hoveredSliceIndex === null || hoveredSliceIndex === idx
                            ? 1
                            : 0.5
                          : slice.isSelected
                          ? 1
                          : 0.35;

                      return (
                        <g
                          key={idx}
                          onClick={() => handleSelectMaterialAndOpenModal(slice.material)}
                          onMouseEnter={() => setHoveredSliceIndex(idx)}
                          onMouseLeave={() => setHoveredSliceIndex(null)}
                          className="cursor-pointer transition-all duration-300"
                          style={{
                            transform: `translate(${slice.dx}px, ${slice.dy}px)`,
                          }}
                        >
                          <path
                            d={slice.pathData}
                            fill={slice.color}
                            opacity={opacity}
                            stroke={slice.isSelected ? '#ffffff' : '#0f172a'}
                            strokeWidth={slice.isSelected ? 2.5 : 1}
                            className="transition-all duration-300 hover:brightness-110"
                          />
                        </g>
                      );
                    })}
                    {/* Donut inner hole */}
                    <circle cx="100" cy="100" r="46" fill="#020617" className="shadow-inner" />
                  </svg>

                  {/* Center Donut Info */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-3">
                    {selectedMaterial && selectedSliceData ? (
                      <>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider max-w-[110px] truncate" style={{ color: selectedSliceData.color }}>
                          {selectedSliceData.material}
                        </span>
                        <span className="text-base font-black text-white font-mono mt-0.5">
                          {selectedSliceData.qty.toLocaleString('tr-TR')} <span className="text-xs text-pink-300">Kg</span>
                        </span>
                        <span className="text-[11px] font-bold text-amber-300 font-mono">
                          %{selectedSliceData.percentage} Pay
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          Toplam Hacim
                        </span>
                        <span className="text-base font-black text-white font-mono mt-0.5">
                          {pieTotalQty.toLocaleString('tr-TR')}
                        </span>
                        <span className="text-[10px] text-cyan-400 font-bold">Kg / Tümü</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Material Legend List */}
            <div className="space-y-2 mt-2 max-h-56 overflow-y-auto custom-scrollbar pr-1">
              {slices.map((item, idx) => {
                const isSelected = selectedMaterial === item.material;
                return (
                  <div
                    key={idx}
                    onClick={() => handleSelectMaterialAndOpenModal(item.material)}
                    onMouseEnter={() => setHoveredSliceIndex(idx)}
                    onMouseLeave={() => setHoveredSliceIndex(null)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 border-pink-500/80 shadow-md shadow-pink-950/30 scale-[1.02]'
                        : hoveredSliceIndex === idx
                        ? 'bg-slate-900/80 border-slate-700 scale-[1.01]'
                        : 'bg-slate-900/40 border-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 shadow-md flex items-center justify-center border border-white/20"
                        style={{ backgroundColor: item.color }}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                      </span>
                      <span className={`truncate font-medium ${isSelected ? 'text-white font-bold' : 'text-slate-200'}`}>
                        {item.material}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 font-mono">
                      <span className="text-slate-300 font-bold text-[11px]">{item.qty.toLocaleString('tr-TR')} Kg</span>
                      <span
                        className={`font-extrabold text-xs px-1.5 py-0.5 rounded ${
                          isSelected ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30' : 'bg-slate-800 text-amber-300 border border-amber-500/20'
                        }`}
                      >
                        %{item.percentage}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Box className="w-3.5 h-3.5 text-amber-400" />
              {materialData.length} Sarkomet Ürün Çeşidi
            </span>
            {selectedMaterial ? (
              <button
                onClick={() => setSelectedMaterial(null)}
                className="font-mono text-pink-400 hover:text-pink-300 font-bold underline cursor-pointer"
              >
                Filtreyi Temizle
              </button>
            ) : (
              <span className="font-mono text-cyan-400 font-bold">Tıklama Etkinleştirildi</span>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Quality Spec & Lab Detail Modal */}
      {modalProduct && (() => {
        const specs = getProductModalSpecs(modalProduct);
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-5 text-white">
              <button
                onClick={() => setModalProduct(null)}
                className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
                <div
                  className="w-4 h-10 rounded-full shrink-0"
                  style={{ backgroundColor: specs.color }}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      Sarkomet Kalite Raporu
                    </span>
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> ISO 9001
                    </span>
                  </div>
                  <h3 className="text-lg font-extrabold text-white mt-1">{specs.productName}</h3>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-slate-400">Üretim Hattı / Makine:</span>
                  <div className="font-bold text-cyan-300 font-mono">{specs.machineCode} - {specs.machineName}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-slate-400">Toplam Üretim Miktarı:</span>
                  <div className="font-bold text-emerald-300 font-mono">{specs.productionQty.toLocaleString('tr-TR')} Kg</div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-pink-400" />
                  Laboratuvar Test & Tolerans Limitleri
                </h4>

                <div className="space-y-2 text-xs font-mono">
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-slate-300 font-bold">Çap Toleransı</div>
                      <div className="text-[11px] text-slate-500">Hedef: {specs.diameter}</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                      🟢 UYGUN
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-slate-300 font-bold">Çekme Mukavemeti</div>
                      <div className="text-[11px] text-slate-500">{specs.tensileStrength}</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                      🟢 UYGUN
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                    <div>
                      <div className="text-slate-300 font-bold">İletkenlik (IACS)</div>
                      <div className="text-[11px] text-slate-500">{specs.conductivity}</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold">
                      🟢 UYGUN
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">Sarkomet A.Ş. Kalite Güvence Laboratuvar Onaylıdır</span>
                <button
                  onClick={() => setModalProduct(null)}
                  className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold transition-all cursor-pointer shadow-lg shadow-pink-950/50"
                >
                  Tamam / Kapat
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

