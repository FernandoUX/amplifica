"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronRight, ChevronLeft, Calendar, X } from "lucide-react";

export default function SidebarDatePicker() {
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [dateFrom, _setDateFrom] = useState<string | null>(null);
  const [dateTo, _setDateTo] = useState<string | null>(null);
  const [calMonth, setCalMonth] = useState(() => { const d = new Date(); return [d.getFullYear(), d.getMonth()] as [number, number]; });
  const [pendingFrom, setPendingFrom] = useState<string | null>(null);
  const [pendingTo, setPendingTo] = useState<string | null>(null);
  const [mobileStep, setMobileStep] = useState<"from" | "to">("from");
  const dateRef = useRef<HTMLDivElement>(null);
  const datePortalRef = useRef<HTMLDivElement>(null);

  const setDateRange = (from: string | null, to: string | null) => {
    _setDateFrom(from);
    _setDateTo(to);
    localStorage.setItem("amplifica_filter_date_from", from ?? "");
    localStorage.setItem("amplifica_filter_date_to", to ?? "");
    window.dispatchEvent(new Event("amplifica-filter-change"));
  };

  // Close on click-outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dateRef.current && !dateRef.current.contains(e.target as Node) && (!datePortalRef.current || !datePortalRef.current.contains(e.target as Node))) {
        setDatePickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={dateRef} className="relative">
      <button
        onClick={() => {
          setPendingFrom(dateFrom); setPendingTo(dateTo);
          setMobileStep("from");
          setDatePickerOpen(o => !o);
        }}
        className="w-full flex items-center justify-between bg-white/5 hover:bg-white/10 rounded-lg px-3 py-1.5 text-xs transition-colors duration-300"
      >
        <div className="text-left min-w-0 flex-1">
          <p className="text-white/40 text-[10px] leading-none mb-0.5">Fecha</p>
          <p className="text-white font-medium truncate">{dateFrom && dateTo
            ? `${dateFrom.slice(8)}/${dateFrom.slice(5,7)}/${dateFrom.slice(0,4)}-${dateTo.slice(8)}/${dateTo.slice(5,7)}/${dateTo.slice(0,4)}`
            : dateFrom
            ? `Desde ${dateFrom.slice(8)}/${dateFrom.slice(5,7)}/${dateFrom.slice(0,4)}`
            : "Todas"}</p>
        </div>
        {dateFrom ? (
          <span
            role="button"
            onClick={e => { e.stopPropagation(); setDateRange(null, null); setPendingFrom(null); setPendingTo(null); }}
            className="text-white/40 hover:text-white cursor-pointer flex-shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </span>
        ) : (
          <Calendar className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
        )}
      </button>

      {datePickerOpen && <DatePickerPanel
        calMonth={calMonth}
        setCalMonth={setCalMonth}
        pendingFrom={pendingFrom}
        setPendingFrom={setPendingFrom}
        pendingTo={pendingTo}
        setPendingTo={setPendingTo}
        mobileStep={mobileStep}
        setMobileStep={setMobileStep}
        setDateRange={setDateRange}
        setDatePickerOpen={setDatePickerOpen}
        datePortalRef={datePortalRef}
      />}
    </div>
  );
}

// ─── Inner panel (extracted for readability) ─────────────────────────────────
type PanelProps = {
  calMonth: [number, number];
  setCalMonth: React.Dispatch<React.SetStateAction<[number, number]>>;
  pendingFrom: string | null;
  setPendingFrom: (v: string | null) => void;
  pendingTo: string | null;
  setPendingTo: (v: string | null) => void;
  mobileStep: "from" | "to";
  setMobileStep: (v: "from" | "to") => void;
  setDateRange: (from: string | null, to: string | null) => void;
  setDatePickerOpen: (v: boolean) => void;
  datePortalRef: React.RefObject<HTMLDivElement | null>;
};

function DatePickerPanel({
  calMonth, setCalMonth,
  pendingFrom, setPendingFrom, pendingTo, setPendingTo,
  mobileStep, setMobileStep,
  setDateRange, setDatePickerOpen, datePortalRef,
}: PanelProps) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`;
  const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const DAYS_HEADER = ["Lu","Ma","Mi","Ju","Vi","Sa","Do"];
  const YEARS = Array.from({ length: 10 }, (_, i) => today.getFullYear() - 5 + i);

  const fmtDisplay = (d: string) => `${d.slice(8)}/${d.slice(5,7)}/${d.slice(0,4)}`;

  // Presets
  const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r; };
  const toStr = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const presets: { label: string; from: string | null; to: string | null }[] = [
    { label: "Hoy", from: todayStr, to: todayStr },
    { label: "Ayer", from: toStr(addDays(today, -1)), to: toStr(addDays(today, -1)) },
    { label: "Este mes", from: `${today.getFullYear()}-${pad(today.getMonth()+1)}-01`, to: todayStr },
    { label: "Mes pasado", from: toStr(new Date(today.getFullYear(), today.getMonth()-1, 1)), to: toStr(new Date(today.getFullYear(), today.getMonth(), 0)) },
    { label: "Últimos 7 días", from: toStr(addDays(today, -6)), to: todayStr },
    { label: "Últimos 30 días", from: toStr(addDays(today, -29)), to: todayStr },
    { label: "Últimos 60 días", from: toStr(addDays(today, -59)), to: todayStr },
    { label: "Últimos 90 días", from: toStr(addDays(today, -89)), to: todayStr },
    { label: "Todo", from: null, to: null },
  ];

  const handleDayClick = (ds: string) => {
    if (!pendingFrom || (pendingFrom && pendingTo)) {
      setPendingFrom(ds); setPendingTo(null);
    } else if (ds < pendingFrom) {
      setPendingFrom(ds); setPendingTo(pendingFrom);
    } else {
      setPendingTo(ds);
    }
  };

  const handleMobileDayClick = (ds: string) => {
    if (mobileStep === "from") {
      setPendingFrom(ds);
      setPendingTo(null);
      setMobileStep("to");
    } else {
      if (ds < (pendingFrom ?? "")) {
        setPendingTo(pendingFrom);
        setPendingFrom(ds);
      } else {
        setPendingTo(ds);
      }
    }
  };

  const applyRange = () => { setDateRange(pendingFrom, pendingTo); setDatePickerOpen(false); };
  const clearRange = () => { setPendingFrom(null); setPendingTo(null); setDateRange(null, null); setDatePickerOpen(false); };

  // Build calendar cells
  const buildCells = (y: number, m: number) => {
    const firstDayRaw = new Date(y, m, 1).getDay();
    const firstDay = firstDayRaw === 0 ? 6 : firstDayRaw - 1;
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const prevMonthDays = new Date(y, m, 0).getDate();

    const cells: { day: number; ds: string; isCurrentMonth: boolean }[] = [];
    for (let i = firstDay - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const pm = m === 0 ? 11 : m - 1;
      const py = m === 0 ? y - 1 : y;
      cells.push({ day: d, ds: `${py}-${pad(pm+1)}-${pad(d)}`, isCurrentMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ day: d, ds: `${y}-${pad(m+1)}-${pad(d)}`, isCurrentMonth: true });
    }
    const remaining = (7 - (cells.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nm = m === 11 ? 0 : m + 1;
      const ny = m === 11 ? y + 1 : y;
      cells.push({ day: d, ds: `${ny}-${pad(nm+1)}-${pad(d)}`, isCurrentMonth: false });
    }
    return cells;
  };

  const renderMonth = (y: number, m: number, showNav: "left" | "right" | "both" | "none", onDayClick?: (ds: string) => void) => (
    <div className="flex-1">
      <div className="flex items-center justify-between mb-3 gap-1">
        {(showNav === "left" || showNav === "both") ? (
          <button onClick={() => setCalMonth(([yy,mm]) => mm === 0 ? [yy-1,11] : [yy,mm-1])} className="p-1 hover:bg-neutral-100 rounded-lg text-neutral-500">
            <ChevronLeft className="w-4 h-4" />
          </button>
        ) : <div className="w-6" />}
        <div className="flex items-center gap-1">
          <div className="relative">
            <select
              value={m}
              onChange={e => {
                const nm = Number(e.target.value);
                if (showNav === "left" || showNav === "both") setCalMonth(([yy]) => [yy, nm]);
                else setCalMonth(([yy]) => [yy, nm === 0 ? 11 : nm - 1]);
              }}
              className="h-7 appearance-none bg-neutral-100 rounded-lg pl-2.5 pr-6 text-sm font-semibold text-neutral-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors hover:bg-neutral-200"
            >
              {MONTHS.map((name, i) => <option key={i} value={i}>{name}</option>)}
            </select>
            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
          </div>
          <div className="relative">
            <select
              value={y}
              onChange={e => {
                const ny = Number(e.target.value);
                setCalMonth(([, mm]) => [ny, mm]);
              }}
              className="h-7 appearance-none bg-neutral-100 rounded-lg pl-2.5 pr-6 text-sm font-semibold text-neutral-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors hover:bg-neutral-200"
            >
              {YEARS.map(yr => <option key={yr} value={yr}>{yr}</option>)}
            </select>
            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
          </div>
        </div>
        {(showNav === "right" || showNav === "both") ? (
          <button onClick={() => setCalMonth(([yy,mm]) => mm === 11 ? [yy+1,0] : [yy,mm+1])} className="p-1 hover:bg-neutral-100 rounded-lg text-neutral-500">
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : <div className="w-6" />}
      </div>
      <div className="grid grid-cols-7 text-center text-[11px] font-medium text-neutral-400 mb-1">
        {DAYS_HEADER.map(d => <div key={d} className="py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 text-center text-sm">
        {buildCells(y, m).map((cell, i) => {
          const isToday = cell.ds === todayStr;
          const isFrom = cell.ds === pendingFrom;
          const isTo = cell.ds === pendingTo;
          const inRange = pendingFrom && pendingTo && cell.ds > pendingFrom && cell.ds < pendingTo;
          return (
            <button
              key={i}
              onClick={() => (onDayClick ?? handleDayClick)(cell.ds)}
              className={`py-1.5 transition-colors duration-150 ${
                !cell.isCurrentMonth ? "rounded-lg text-neutral-300" :
                isFrom ? "bg-primary-500 text-white font-medium rounded-l-lg rounded-r-none" :
                isTo ? "bg-primary-500 text-white font-medium rounded-r-lg rounded-l-none" :
                inRange ? "bg-primary-50 text-primary-700 rounded-none" :
                isToday ? "bg-primary-500 text-white font-medium rounded-lg ring-2 ring-primary-300" :
                "rounded-lg text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              {cell.day}
            </button>
          );
        })}
      </div>
    </div>
  );

  const m1y = calMonth[0];
  const m1m = calMonth[1];
  const m2y = calMonth[0] + Math.floor((calMonth[1] + 1) / 12);
  const m2m = (calMonth[1] + 1) % 12;

  return (<>
    {/* Mobile: portal */}
    {typeof document !== "undefined" && createPortal(
      <div ref={datePortalRef} className="lg:hidden fixed inset-0 z-[9999] flex items-center justify-center bg-black/30" onClick={() => setDatePickerOpen(false)}>
        <div className="bg-white rounded-2xl shadow-xl border border-neutral-200 overflow-hidden flex flex-col" style={{ maxHeight: "85vh", width: "90%" }} onClick={e => e.stopPropagation()}>
          <div className="px-4 pt-3 pb-3 border-b border-neutral-100 space-y-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-neutral-800">Seleccionar fecha</span>
              <button onClick={() => setDatePickerOpen(false)} className="p-1 -mr-1 hover:bg-neutral-100 rounded-lg text-neutral-400 hover:text-neutral-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="relative">
              <select
                value={
                  presets.findIndex(p => p.from === pendingFrom && p.to === pendingTo) >= 0
                    ? presets.findIndex(p => p.from === pendingFrom && p.to === pendingTo)
                    : ""
                }
                onChange={e => {
                  const idx = Number(e.target.value);
                  if (!isNaN(idx) && presets[idx]) {
                    const p = presets[idx];
                    setPendingFrom(p.from); setPendingTo(p.to);
                    if (p.from) {
                      const d = new Date(p.from);
                      setCalMonth([d.getFullYear(), d.getMonth()]);
                    }
                    setMobileStep("from");
                  }
                }}
                className="w-full h-9 appearance-none bg-neutral-100 rounded-lg pl-3 pr-8 text-sm text-neutral-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors"
              >
                <option value="" disabled>Rango predefinido...</option>
                {presets.map((p, i) => <option key={p.label} value={i}>{p.label}</option>)}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setMobileStep("from")}
                className={`flex-1 text-left rounded-lg px-3.5 pt-1.5 pb-2 transition-all border-2 ${
                  mobileStep === "from" ? "border-primary-500 bg-white" : "border-transparent bg-neutral-100"
                }`}
              >
                <span className={`block text-[11px] font-semibold mb-0.5 ${mobileStep === "from" ? "text-primary-600" : "text-neutral-500"}`}>Desde</span>
                <span className={`block text-sm tabular-nums ${pendingFrom ? "text-neutral-800 font-medium" : "text-neutral-400"}`}>{pendingFrom ? fmtDisplay(pendingFrom) : "dd/mm/aaaa"}</span>
              </button>
              <button
                onClick={() => setMobileStep("to")}
                className={`flex-1 text-left rounded-lg px-3.5 pt-1.5 pb-2 transition-all border-2 ${
                  mobileStep === "to" ? "border-primary-500 bg-white" : "border-transparent bg-neutral-100"
                }`}
              >
                <span className={`block text-[11px] font-semibold mb-0.5 ${mobileStep === "to" ? "text-primary-600" : "text-neutral-500"}`}>Hasta</span>
                <span className={`block text-sm tabular-nums ${pendingTo ? "text-neutral-800 font-medium" : "text-neutral-400"}`}>{pendingTo ? fmtDisplay(pendingTo) : "dd/mm/aaaa"}</span>
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {renderMonth(m1y, m1m, "both", handleMobileDayClick)}
          </div>
          <div className="border-t border-neutral-200 px-4 py-3 flex items-center justify-between bg-neutral-50 flex-shrink-0">
            <button onClick={clearRange} className="text-sm font-medium text-neutral-700 hover:text-neutral-900">Borrar</button>
            <button onClick={applyRange} disabled={!pendingFrom} className="text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed px-5 py-2 rounded-lg transition-colors">Aplicar</button>
          </div>
        </div>
      </div>,
      document.body
    )}

    {/* Desktop: side panel */}
    <div className="hidden lg:flex absolute left-full top-0 ml-2 z-50 bg-white rounded-xl shadow-xl border border-neutral-200 flex-col" style={{ width: 700 }}>
      <div className="flex flex-1">
        <div className="w-44 border-r border-neutral-200 py-3 flex-shrink-0">
          {presets.map(p => (
            <button
              key={p.label}
              onClick={() => {
                setPendingFrom(p.from); setPendingTo(p.to);
                if (p.from) {
                  const d = new Date(p.from);
                  setCalMonth([d.getFullYear(), d.getMonth()]);
                }
              }}
              className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                pendingFrom === p.from && pendingTo === p.to
                  ? "text-primary-600 bg-primary-50 font-medium"
                  : "text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex-1 p-4 flex gap-6">
          {renderMonth(m1y, m1m, "left")}
          {renderMonth(m2y, m2m, "right")}
        </div>
      </div>
      <div className="border-t border-neutral-200 px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-neutral-500 tabular-nums">
          {pendingFrom && pendingTo ? `${fmtDisplay(pendingFrom)}-${fmtDisplay(pendingTo)}` : pendingFrom ? `${fmtDisplay(pendingFrom)} — ...` : "Sin selección"}
        </span>
        <div className="flex items-center gap-3">
          <button onClick={clearRange} className="text-sm font-semibold text-neutral-700 hover:text-neutral-900 transition-colors">Borrar</button>
          <button onClick={applyRange} className="text-sm font-medium text-white bg-primary-500 hover:bg-primary-600 px-5 py-2 rounded-lg transition-colors">Aplicar</button>
        </div>
      </div>
    </div>
  </>);
}
