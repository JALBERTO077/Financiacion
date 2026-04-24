import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  Building2, CalendarDays, Percent, HandCoins, 
  Briefcase, Landmark, ChevronRight, Settings2, BarChart3, PieChart as PieChartIcon,
  Activity, TrendingUp, Wallet, Table, ShieldAlert, ArrowRightLeft, Printer
} from 'lucide-react';
import { ComposedChart, Bar, Line } from 'recharts';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper for conditional tailwind classes
function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// Currency formatter
const formatEUR = (num: number) => {
  return new Intl.NumberFormat('es-ES', { 
    style: 'currency', 
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(num);
};

// Percentage formatter
const formatPct = (num: number) => {
  return new Intl.NumberFormat('es-ES', { 
    style: 'percent', 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num / 100);
};

export default function App() {
  // State for dynamic presentation
  const [capital, setCapital] = useState(3250000);
  const [termMonths, setTermMonths] = useState(24);
  const [interestRate, setInterestRate] = useState(12.95);
  const [openingCommPct, setOpeningCommPct] = useState(3.00);
  const [feesPct, setFeesPct] = useState(4.50);
  const [certifications, setCertifications] = useState(6);
  // Default first cert calculation directly from prompt: 900k + 391.666k = 1.291.666
  const [firstCert, setFirstCert] = useState(1291666);

  // Math & Timeline Calculations
  const { timeline, summaries } = useMemo(() => {
    // Limits and safeguards
    const safeFirstCert = Math.min(firstCert, capital);
    const safeCerts = Math.min(certifications, termMonths);
    const remainingCapital = capital - safeFirstCert;
    const certDrawdown = safeCerts > 1 ? remainingCapital / (safeCerts - 1) : 0;
    const monthlyRate = (interestRate / 100) / 12;

    const newTimeline = [];
    let accumulatedCapital = 0;
    let accumulatedInterest = 0;

    for (let m = 1; m <= termMonths; m++) {
      let drawnThisMonth = 0;
      
      // Calculate Drawdowns
      if (m === 1) {
        drawnThisMonth = safeFirstCert;
      } else if (m <= safeCerts) {
        drawnThisMonth = certDrawdown;
      }

      accumulatedCapital += drawnThisMonth;
      // Precision safety capping
      if (accumulatedCapital > capital) accumulatedCapital = capital;

      // Interest only on drawn capital
      const monthlyInterest = accumulatedCapital * monthlyRate;
      accumulatedInterest += monthlyInterest;

      newTimeline.push({
        month: m,
        label: `Mes ${m}`,
        dispuesto: accumulatedCapital,
        capitalRestante: capital - accumulatedCapital,
        nuevoDispuesto: drawnThisMonth,
        interesMensual: monthlyInterest,
        interesAcumulado: accumulatedInterest,
        deudaViva: accumulatedCapital + accumulatedInterest
      });
    }

    const openingCommissionValue = capital * (openingCommPct / 100);
    const feesValue = capital * (feesPct / 100);
    const totalCostes = accumulatedInterest + openingCommissionValue + feesValue;
    const totalADevolver = capital + totalCostes;

    const taeAproximada = capital > 0 && termMonths > 0 ? (totalCostes / capital) * (12 / termMonths) * 100 : 0;
    const cargaFinanciera = capital > 0 ? (totalCostes / capital) * 100 : 0;
    const costeMensualPromedio = termMonths > 0 ? totalCostes / termMonths : 0;

    return {
      timeline: newTimeline,
      summaries: {
        totalInterest: accumulatedInterest,
        openingCommission: openingCommissionValue,
        fees: feesValue,
        totalCostes,
        totalADevolver,
        taeAproximada,
        cargaFinanciera,
        costeMensualPromedio
      }
    };
  }, [capital, termMonths, interestRate, openingCommPct, feesPct, certifications, firstCert]);

  // Chart Data preparation
  const pieData = [
    { name: 'Capital Principal', value: capital, color: '#3b82f6' }, // blue-500
    { name: 'Intereses Totales', value: summaries.totalInterest, color: '#f59e0b' }, // amber-500
    { name: 'Comisión Apertura', value: summaries.openingCommission, color: '#10b981' }, // emerald-500
    { name: 'Honorarios', value: summaries.fees, color: '#6366f1' }, // indigo-500
  ];

  return (
    <div className="flex h-screen w-full bg-slate-50 text-slate-800 font-sans overflow-hidden print:h-auto print:overflow-visible print:bg-white">
      
      {/* Sidebar Controls */}
      <motion.aside 
        initial={{ x: -300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-[360px] flex-shrink-0 bg-slate-900 text-slate-100 flex flex-col h-full shadow-2xl relative z-20 overflow-y-auto overflow-x-hidden print:hidden"
      >
        <div className="p-6 border-b border-slate-800 sticky top-0 bg-slate-900/95 backdrop-blur z-10 w-full">
          <div className="flex items-center gap-3 text-amber-500 mb-2">
            <Settings2 className="w-6 h-6" />
            <h2 className="text-xl font-semibold tracking-tight">Parámetros</h2>
          </div>
          <p className="text-sm text-slate-400">Ajuste los valores del escenario</p>
        </div>

        <div className="p-6 space-y-8 flex-1 w-full">
          {/* Capital Slider */}
          <ControlGroup 
            label="Capital del Préstamo" 
            value={capital} 
            min={50000}
            max={10000000} 
            step={50000} 
            formatter={formatEUR}
            onChange={setCapital} 
            icon={<Landmark className="w-4 h-4 text-slate-400" />}
          />

          {/* Plazo Slider */}
          <ControlGroup 
            label="Plazo (Meses)" 
            value={termMonths} 
            min={1}
            max={56} 
            step={1} 
            formatter={(v) => `${v} meses`}
            onChange={setTermMonths} 
            icon={<CalendarDays className="w-4 h-4 text-slate-400" />}
          />

          {/* Interes Slider */}
          <ControlGroup 
            label="Tipo de Interés (Anual)" 
            value={interestRate} 
            max={25} 
            step={0.05} 
            formatter={(v) => `${v.toFixed(2)} %`}
            onChange={setInterestRate} 
            icon={<Percent className="w-4 h-4 text-slate-400" />}
          />

          {/* Comision Slider */}
          <ControlGroup 
            label="Comisión de Apertura" 
            value={openingCommPct} 
            max={10} 
            step={0.25} 
            formatter={(v) => `${v.toFixed(2)} %`}
            onChange={setOpeningCommPct} 
            icon={<HandCoins className="w-4 h-4 text-slate-400" />}
          />

          {/* Honorarios Slider */}
          <ControlGroup 
            label="Honorarios" 
            value={feesPct} 
            max={10} 
            step={0.25} 
            formatter={(v) => `${v.toFixed(2)} %`}
            onChange={setFeesPct} 
            icon={<Briefcase className="w-4 h-4 text-slate-400" />}
          />

          <div className="border-t border-slate-800 pt-6">
            <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wider mb-6">Desembolsos (Certificaciones)</h3>
            
            <ControlGroup 
              label="Número de Certificaciones" 
              value={certifications} 
              min={1}
              max={Math.max(1, Math.min(termMonths, 24))} 
              step={1} 
              formatter={(v) => v.toString()}
              onChange={setCertifications} 
              icon={<BarChart3 className="w-4 h-4 text-slate-400" />}
            />

            <div className="mt-8">
              <label className="flex items-center justify-between text-sm font-medium text-slate-200 mb-2">
                <span>1ª Certificación</span>
                <span className="text-amber-500 font-mono">{formatEUR(firstCert)}</span>
              </label>
              <input 
                type="range" 
                min={0} 
                max={capital} 
                step={10000} 
                value={firstCert} 
                onChange={(e) => setFirstCert(Number(e.target.value))}
                className="w-full accent-amber-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-2">
                <span>Certs Restantes: {certifications - 1}</span>
                <span>Resto/Cert: {formatEUR(certifications > 1 ? (capital - firstCert) / (certifications - 1) : 0)}</span>
              </div>
            </div>
          </div>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col items-center print:overflow-visible print:h-auto print:block">
        
        <div className="w-full max-w-6xl mx-auto px-8 py-8 flex flex-col gap-6 print:px-0 print:py-0 print:gap-4 print:max-w-full">
          {/* Header Section */}
          <motion.header 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 text-white p-6 border-b-4 border-emerald-500 rounded-lg shadow-md w-full"
          >
            <div>
              <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold mb-1 block">Propuesta de Financiación Inmobiliaria</span>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-1">
                PROYECTO LA SELVA Nº13
              </h1>
              <div className="text-slate-400 text-sm mt-2 flex flex-wrap items-center gap-4">
                <span>Solicitante: <span className="text-white font-medium uppercase">Kronung Overseas SL</span></span>
                <span className="hidden md:inline text-slate-600">|</span>
                <button onClick={() => window.print()} className="flex items-center justify-center gap-1.5 text-indigo-400 hover:text-indigo-300 transition-colors font-medium print:hidden border border-indigo-500/30 px-3 py-1.5 rounded-md hover:bg-slate-800">
                  <Printer className="w-4 h-4" /> Exportar PDF a Inversores
                </button>
              </div>
            </div>
            
            <div className="text-left md:text-right border-t md:border-t-0 md:border-l border-slate-700 pt-4 md:pt-0 md:pl-8 mt-4 md:mt-0 flex flex-col justify-end">
              <div className="text-xl font-bold italic text-slate-100">Soluciones Financieras Siglo XXI</div>
              <div className="text-emerald-400 text-sm mt-1">Ángel Crespo García</div>
            </div>
          </motion.header>

          {/* Top KPIs Summary */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            <KPICard 
              label="Capital Concedido" 
              value={formatEUR(capital)} 
              subtitle="Importe total de la operación"
              icon={<Landmark className="w-6 h-6 text-blue-500" />}
              color="blue"
            />
            <KPICard 
              label="1º Desembolso (Día 1)" 
              value={formatEUR(firstCert)} 
              subtitle={`Equivale al ${((firstCert / capital) * 100).toFixed(1)}% del capital`}
              icon={<CalendarDays className="w-6 h-6 text-indigo-500" />}
              color="indigo"
            />
            <KPICard 
              label="Coste de Intereses" 
              value={formatEUR(summaries.totalInterest)} 
              subtitle={`Calculado al ${formatPct(interestRate)} anual`}
              icon={<Percent className="w-6 h-6 text-amber-500" />}
              color="amber"
            />
            <KPICard 
              label="Honorarios y Comisiones" 
              value={formatEUR(summaries.openingCommission + summaries.fees)} 
              subtitle={`Apertura: ${openingCommPct}% | Honorarios: ${feesPct}%`}
              icon={<HandCoins className="w-6 h-6 text-emerald-500" />}
              color="emerald"
            />
            <KPICard 
              label="T.A.E. Estimada" 
              value={`${summaries.taeAproximada.toFixed(2)}%`} 
              subtitle="Tasa Anual Equivalente Aprox."
              icon={<Activity className="w-6 h-6 text-rose-500" />}
              color="rose"
            />
            <KPICard 
              label="Carga Financiera Total" 
              value={`${summaries.cargaFinanciera.toFixed(2)}%`} 
              subtitle="Ratio: Gastos / Capital Inicial"
              icon={<TrendingUp className="w-6 h-6 text-orange-500" />}
              color="orange"
            />
            <KPICard 
              label="Coste Real / Mes" 
              value={formatEUR(summaries.costeMensualPromedio)} 
              subtitle="Impacto de intereses y comisiones"
              icon={<Wallet className="w-6 h-6 text-teal-500" />}
              color="teal"
            />
            <KPICard 
              label="Total a Devolver" 
              value={formatEUR(summaries.totalADevolver)} 
              subtitle={`Pago total al vencimiento (Mes ${termMonths})`}
              icon={<Briefcase className="w-6 h-6 text-indigo-500" />}
              color="indigo"
              highlight={true}
            />
          </motion.div>

          {/* Charts Row */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full"
          >
            {/* Area Chart: Progression */}
            <div className="col-span-1 lg:col-span-7 bg-white rounded-lg shadow-sm border border-slate-200 p-6 flex flex-col h-[420px]">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xs uppercase text-slate-500 font-bold tracking-wider">Evolución del Desembolso e Intereses</h3>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase">Acumulación a lo largo de los {termMonths} meses</p>
                </div>
                <BarChart3 className="w-5 h-5 text-slate-300" />
              </div>
              <div className="flex-1 min-h-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorDispuesto" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorInteres" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }} 
                      tickFormatter={(val) => `M${val}`}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
                    />
                    <Tooltip 
                      content={<CustomTooltip />} 
                      cursor={{ stroke: '#cbd5e1', strokeWidth: 2, strokeDasharray: '4 4' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="dispuesto" 
                      name="Capital Dispuesto" 
                      stroke="#3b82f6" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorDispuesto)" 
                    />
                    <Area 
                      type="monotone" 
                      dataKey="interesAcumulado" 
                      name="Intereses (Acum.)" 
                      stroke="#f59e0b" 
                      strokeWidth={3} 
                      fillOpacity={1} 
                      fill="url(#colorInteres)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Pie Chart: Cost Breakdown */}
            <div className="col-span-1 lg:col-span-5 bg-white rounded-lg shadow-sm border border-slate-200 p-6 flex flex-col h-[420px]">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs uppercase text-slate-500 font-bold tracking-wider">Desglose de Pago</h3>
                <PieChartIcon className="w-5 h-5 text-slate-300" />
              </div>
              <p className="text-[10px] text-slate-400 mb-6 uppercase">Proporción de capital y gastos</p>
              
              <div className="flex-1 w-full relative -mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val: number) => formatEUR(val)} 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Center text of Pie Chart */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-4">
                  <span className="text-slate-400 text-xs font-semibold uppercase tracking-widest text-center mt-2">Carga<br/>Financ.</span>
                  <span className="text-xl font-bold text-slate-800">
                    {((summaries.totalCostes / capital) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              
              <div className="space-y-3 mt-4">
                {pieData.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-600 font-medium">{item.name}</span>
                    </div>
                    <span className="text-slate-900 font-bold">{((item.value / summaries.totalADevolver)*100).toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Advanced Analytics Row */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 w-full flex flex-col lg:flex-row gap-8 print:break-inside-avoid print:shadow-none print:border-slate-300"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs uppercase text-slate-500 font-bold tracking-wider">Flujos de Caja y Exposición (LTV Acumulado)</h3>
                <ShieldAlert className="w-5 h-5 text-slate-300" />
              </div>
              <p className="text-[10px] text-slate-400 mb-6 uppercase">Relación entre Desembolsos y Crecimiento de la Deuda</p>
              
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={timeline} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="month" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 10 }} 
                      tickFormatter={(val) => `M${val}`} 
                    />
                    <YAxis 
                      yAxisId="left" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 10 }}
                      tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#64748b', fontSize: 10 }}
                      tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar 
                      yAxisId="left" 
                      dataKey="nuevoDispuesto" 
                      name="Flujo Saliente (Capital)" 
                      fill="#10b981" 
                      radius={[4, 4, 0, 0]} 
                      maxBarSize={40}
                    />
                    <Line 
                      yAxisId="right" 
                      type="monotone" 
                      dataKey="deudaViva" 
                      name="Deuda Total Acumulada" 
                      stroke="#6366f1" 
                      strokeWidth={3} 
                      dot={false}
                      activeDot={{ r: 6 }} 
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="lg:w-80 flex flex-col gap-4 justify-center border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-6">
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                <div className="flex items-center gap-2 text-indigo-600 mb-2">
                  <ArrowRightLeft className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Break-Even de Exposición</span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  El riesgo máximo se alcanza en el mes <span className="font-bold text-slate-900">{termMonths}</span> con una exposición de <span className="font-bold text-slate-900">{formatEUR(summaries.totalADevolver)}</span> justo antes del Bullet.
                </p>
              </div>
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                <div className="flex items-center gap-2 text-amber-600 mb-2">
                  <Activity className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Velocidad de Interés</span>
                </div>
                <p className="text-sm text-amber-800 leading-relaxed">
                  A partir del mes <span className="font-bold">{certifications}</span> (última certificación), la deuda viva crece a un ritmo de <span className="font-bold">{formatEUR(capital * ((interestRate/100)/12))} / mes</span> debido a la disposición total.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Full Amortization Table */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden w-full flex flex-col print:shadow-none print:border-slate-300 print:break-inside-avoid"
          >
            <div className="bg-slate-100 px-5 py-4 border-b border-slate-200 flex flex-col md:flex-row justify-between md:items-center gap-2">
              <div className="flex flex-col">
                <span className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <Table className="w-4 h-4 text-emerald-600" />
                  Cuadro de Amortización Completo
                </span>
                <span className="text-xs text-slate-500 mt-0.5">Vista detallada mes a mes del préstamo bullet</span>
              </div>
            </div>
            {/* Make table scrollable */}
            <div className="overflow-x-auto overflow-y-auto max-h-[600px] print:max-h-none p-0 relative">
              <table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
                <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 text-slate-600 outline outline-1 outline-slate-200">
                  <tr>
                    <th className="py-3 px-5 font-semibold text-xs tracking-wider uppercase">Periodo</th>
                    <th className="py-3 px-5 font-semibold text-xs tracking-wider uppercase">Flujo (Desembolso)</th>
                    <th className="py-3 px-5 font-semibold text-xs tracking-wider uppercase">Capital Restante</th>
                    <th className="py-3 px-5 font-semibold text-xs tracking-wider uppercase">Capital Vivo</th>
                    <th className="py-3 px-5 font-semibold text-xs tracking-wider uppercase text-right">Interés del Mes</th>
                    <th className="py-3 px-5 font-semibold text-xs tracking-wider uppercase text-right">Interés Acum.</th>
                    <th className="py-3 px-5 font-semibold text-xs tracking-wider uppercase text-right">Deuda Viva Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {timeline.map((item) => (
                    <tr key={item.month} className="hover:bg-indigo-50/30 transition-colors group">
                      <td className="py-3 px-5 font-medium text-slate-800 flex items-center gap-2">
                        <span className="w-6 text-slate-400 font-mono text-xs">{item.month}</span>
                        Mes {item.month}
                        {item.month === termMonths ? <span className="ml-2 text-white font-bold bg-indigo-500 px-2.5 py-0.5 rounded text-[10px] select-none print:text-indigo-600 print:bg-transparent">BULLET</span> : null}
                      </td>
                      <td className="py-3 px-5 text-emerald-600 font-medium">
                        {item.nuevoDispuesto > 0 ? `+${formatEUR(item.nuevoDispuesto)}` : '-'}
                      </td>
                      <td className="py-3 px-5 text-slate-500 text-xs">
                        {formatEUR(item.capitalRestante)}
                      </td>
                      <td className="py-3 px-5 text-slate-900 font-medium">{formatEUR(item.dispuesto)}</td>
                      <td className="py-3 px-5 text-right text-amber-600">
                        {formatEUR(item.interesMensual)}
                      </td>
                      <td className="py-3 px-5 text-right text-slate-600">
                        {formatEUR(item.interesAcumulado)}
                      </td>
                      <td className="py-3 px-5 text-right font-semibold text-indigo-900 group-hover:text-indigo-600">
                        {formatEUR(item.deudaViva)}
                      </td>
                    </tr>
                  ))}
                  {/* Summary / Totals Row */}
                  <tr className="bg-slate-900 text-white border-t-2 border-slate-700 font-semibold sticky bottom-0">
                    <td className="py-4 px-5 font-bold uppercase tracking-wider text-xs" colSpan={2}>
                      Liquidación Final
                    </td>
                    <td className="py-4 px-5 text-slate-400 text-xs">-</td>
                    <td className="py-4 px-5">
                      {formatEUR(capital)}
                    </td>
                    <td className="py-4 px-5 text-right text-slate-400 text-xs" colSpan={2}>
                      Comisión: {formatEUR(summaries.openingCommission)} | Honorarios: {formatEUR(summaries.fees)}
                    </td>
                    <td className="py-4 px-5 text-right font-black text-emerald-400 text-base">
                      {formatEUR(summaries.totalADevolver)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>
          
          <div className="py-6 pt-10 text-center text-sm text-slate-400 border-t border-slate-200 mt-8 w-full print:mt-12">
            <p className="font-medium text-slate-500 mb-1">© {new Date().getFullYear()} Soluciones Financieras Siglo XXI. Realizado por Ángel Crespo.</p>
            <p className="text-xs">JDET Consulting Corp - Documento generado automáticamente para presentación a inversores</p>
          </div>
        </div>
      </main>
    </div>
  );
}

// Custom Recharts Tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-md p-4 rounded-xl border border-slate-200 shadow-xl w-64 ring-1 ring-slate-900/5">
        <p className="font-bold text-slate-900 mb-3 ml-1">{label}</p>
        <div className="space-y-2.5">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex justify-between items-center text-sm">
              <span className="flex items-center gap-2 font-medium text-slate-500">
                <div className="w-2.5 h-2.5 rounded-sm shadow-inner" style={{ backgroundColor: entry.color }} />
                {entry.name}
              </span>
              <span className="font-bold text-slate-800">{formatEUR(entry.value)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// Reusable KPI Card
function KPICard({ 
  label, value, subtitle, icon, color, highlight = false 
}: { 
  label: string, value: string, subtitle: string, icon: React.ReactNode, color?: string, highlight?: boolean 
}) {
  return (
    <div className="bg-white p-5 border border-slate-200 rounded-lg shadow-sm flex flex-col relative overflow-hidden group">
      {highlight && <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>}
      <div className="flex items-center justify-between mb-1">
        <div className="text-xs uppercase text-slate-500 font-bold tracking-wide">{label}</div>
        <div className="text-slate-300 group-hover:text-emerald-400 transition-colors">
          {React.isValidElement(icon) ? React.cloneElement(icon, { className: 'w-4 h-4' } as any) : icon}
        </div>
      </div>
      <div className={cn("text-3xl font-black mt-2", highlight ? "text-emerald-600" : "text-slate-800")}>
        {value}
      </div>
      <div className="text-[10px] text-slate-400 mt-2 uppercase tracking-wide">
        {subtitle}
      </div>
    </div>
  );
}

// Reusable Custom Slider Component
function ControlGroup({ 
  label, value, max, step, formatter, onChange, icon, min = 0 
}: { 
  label: string, value: number, max: number, step: number, formatter: (val: number) => string, onChange: (val: number) => void, icon?: React.ReactNode, min?: number
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
          {icon} {label}
        </label>
        <AnimatePresence mode="popLayout">
          <motion.span 
            key={value}
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 10, opacity: 0 }}
            className="text-amber-500 font-mono font-bold text-sm bg-amber-500/10 px-2 py-0.5 rounded"
          >
            {formatter(value)}
          </motion.span>
        </AnimatePresence>
      </div>
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={step} 
        value={value} 
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-amber-500 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer hover:bg-slate-600 transition-colors"
      />
    </div>
  );
}

