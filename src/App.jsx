import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useSync } from './useSync';

// ============================================================================
// Inner Compass v1.8
// 單人使用・中文介面・儀式感自我探索工具
// ============================================================================

const TOOL_CODE = 'inner-compass';
const TOOL_VERSION = '1.8';
const CURRENT_DATA_VERSION = 1;
const lsKey = (key) => 'ic-v1-' + key;

// ============================================================================
// 主題定義 (僅 ritual-warm 和 ritual-light)
// ============================================================================

const themes = {
  'ritual-warm': {
    name: '酒紅杏仁奶',
    dark: false,
    bg: '#F5EFE8',
    bgDeep: '#F0E8DC',
    bgCard: '#FEFAF5',
    border: '#E0D0BC',
    borderHover: '#D4C0AE',
    accent: '#5C2A2A',
    accentLight: '#F5E0D8',
    accentText: '#FEFAF5',
    coral: '#A04848',
    navy: '#8B5C78',
    cancelBg: '#E0D0BC',
    cancelText: '#5C4030',
    t1: '#3D2818',
    t2: '#5C4030',
    t3: '#8B6F5C',
  },
  'ritual-light': {
    name: '玫瑰米白',
    dark: false,
    bg: '#FAF4ED',
    bgDeep: '#F0E8DC',
    bgCard: '#FFFFFF',
    border: '#E0D0BC',
    borderHover: '#D4C0AE',
    accent: '#5C2A2A',
    accentLight: '#F5E0D8',
    accentText: '#FFFFFF',
    coral: '#A0506B',
    navy: '#9B7A8F',
    cancelBg: '#F0E8DC',
    cancelText: '#5C4030',
    t1: '#3D2818',
    t2: '#5C4030',
    t3: '#8B6F5C',
  },
};

// ============================================================================
// 引言
// ============================================================================

const QUOTES = [
  { text: '你不需要成為誰，你只需要看見，此刻的你。', author: 'Raman' },
  { text: '見證自己，是最深刻的溫柔。', author: 'Raman' },
  { text: '不是每一天都要發光。有些天，只需要在場。', author: 'Raman' },
];

// ============================================================================
// 工具函數
// ============================================================================

function genId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return Date.now() + '-' + Math.random().toString(36).slice(2, 9);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function getWeekNumber(date) {
  const d = new Date(date);
  const startOfYear = new Date(d.getFullYear(), 0, 1);
  const diff = d - startOfYear;
  const weekNum = Math.ceil((diff / 86400000 + startOfYear.getDay() + 1) / 7);
  return d.getFullYear() + '-W' + String(weekNum).padStart(2, '0');
}

function getWeekMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.getFullYear() + ' 年 ' + (d.getMonth() + 1) + ' 月 ' + d.getDate() + ' 日';
}

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return (d.getMonth() + 1) + '/' + d.getDate();
}

function daysDiff(dateStr1, dateStr2) {
  const d1 = new Date(dateStr1 + 'T00:00:00');
  const d2 = new Date(dateStr2 + 'T00:00:00');
  return Math.floor((d2 - d1) / 86400000);
}

function getDayOfWeek() {
  return new Date().getDay(); // 0=日
}

function isFirstDaysOfMonth() {
  return new Date().getDate() <= 3;
}

function isLastWeekOfQuarter() {
  const month = new Date().getMonth() + 1;
  const day = new Date().getDate();
  const lastMonthOfQuarter = [3, 6, 9, 12];
  return lastMonthOfQuarter.includes(month) && day >= 24;
}

function getCurrentQuarter() {
  const now = new Date();
  const q = Math.ceil((now.getMonth() + 1) / 3);
  return now.getFullYear() + '-Q' + q;
}

function getQuarterDateRange(qStr) {
  const [yearPart, qPart] = qStr.split('-Q');
  const year = parseInt(yearPart);
  const q = parseInt(qPart);
  const startMonth = (q - 1) * 3 + 1;
  const endMonth = q * 3;
  const isLeap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const endDays = [31, isLeap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return {
    start: year + '-' + String(startMonth).padStart(2, '0') + '-01',
    end: year + '-' + String(endMonth).padStart(2, '0') + '-' + String(endDays[endMonth - 1]).padStart(2, '0'),
  };
}

// ============================================================================
// SVG Icons
// ============================================================================

const Icon = ({ name, size = 16, color = 'currentColor', style = {} }) => {
  const paths = {
    menu: <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>,
    close: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    edit: <><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></>,
    trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></>,
    undo: <><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-15-6.7L3 13"/></>,
    download: <><path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M3 21h18"/></>,
    upload: <><path d="M12 15V3"/><path d="m7 8 5-5 5 5"/><path d="M3 21h18"/></>,
    info: <><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>,
    check: <><polyline points="20 6 9 17 4 12"/></>,
    palette: <><circle cx="12" cy="12" r="10"/><circle cx="8" cy="10" r="1" fill={color}/><circle cx="16" cy="10" r="1" fill={color}/><circle cx="12" cy="7" r="1" fill={color}/></>,
    chevronDown: <><path d="m6 9 6 6 6-6"/></>,
    chevronRight: <><path d="m9 18 6-6-6-6"/></>,
    chevronLeft: <><path d="m15 18-6-6 6-6"/></>,
    home: <><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
    sun: <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>,
    heart: <><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></>,
    star: <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></>,
    feather: <><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><line x1="16" y1="8" x2="2" y2="22"/><line x1="17.5" y1="15" x2="9" y2="15"/></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
    clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
    bookOpen: <><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></>,
    leaf: <><path d="M2 22s1-1 3-3"/><path d="M20.95 11.29C20.22 7.69 17 4.71 13.36 4.07c-4.29-.74-8.39 2.2-8.67 6.52-.2 3 1.67 5.8 4.45 7.2.57.28 1.19.43 1.82.43 2.86 0 5.04-2.61 4.44-5.41-.34-1.59-1.65-2.81-3.25-3.09a3.34 3.34 0 0 0-3.84 2.6C7.9 13.85 9.26 15 10.88 15c.92 0 1.72-.52 2.1-1.26"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
    cloudOff: <><path d="M2 2l20 20"/><path d="M5.78 5.78A8.02 8.02 0 0 0 4 15.25h10"/><path d="M16.24 10A4.5 4.5 0 0 1 17.5 19H12"/></>,
    cloudCheck: <><path d="M17.5 19a4.5 4.5 0 1 0 0-9h-1.26A8 8 0 1 0 4 15.25"/><path d="m9 15 2 2 4-4"/></>,
    cloudUpload: <><path d="M17.5 19a4.5 4.5 0 1 0 0-9h-1.26A8 8 0 1 0 4 15.25"/><path d="M12 12v4"/><path d="m10 14 2-2 2 2"/></>,
    cloudAlert: <><path d="M17.5 19a4.5 4.5 0 1 0 0-9h-1.26A8 8 0 1 0 4 15.25"/><line x1="12" y1="11" x2="12" y2="14"/><circle cx="12" cy="17" r="0.5" fill="currentColor"/></>,
    login: <><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
    refresh: <><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></>,
    arrowRight: <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
    lock: <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
    wind: <><path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2"/><path d="M9.6 4.6A2 2 0 1 1 11 8H2"/><path d="M12.6 19.4A2 2 0 1 0 14 16H2"/></>,
    cloudRain: <><line x1="16" y1="13" x2="16" y2="21"/><line x1="8" y1="13" x2="8" y2="21"/><line x1="12" y1="15" x2="12" y2="23"/><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/></>,
    zap: <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
    send: <><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></>,
    back: <><polyline points="15 18 9 12 15 6"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={style}>
      {paths[name] || null}
    </svg>
  );
};

// ============================================================================
// MonthCalendarPicker — 月曆式年月選取器
// entries: [{ date: 'YYYY-MM-DD' }]，用來判斷哪些月份有資料
// selectedYM: 'YYYY-MM' | '' (空=全部)
// onSelect: (ym: string) => void
// ============================================================================

function MonthCalendarPicker({ entries, selectedYM, onSelect, theme, label, count }) {
  const fontFamily = "'Noto Serif TC', 'Songti TC', Georgia, serif";

  // 計算有資料的年月 Set
  const hasDataSet = new Set(entries.map(e => (e.date || '').slice(0, 7)).filter(Boolean));

  // 初始顯示年：selectedYM 的年，或最新有資料的年，或今年
  const defaultYear = selectedYM
    ? parseInt(selectedYM.slice(0, 4))
    : hasDataSet.size > 0
      ? Math.max(...[...hasDataSet].map(ym => parseInt(ym.slice(0, 4))))
      : new Date().getFullYear();

  const [pickerYear, setPickerYear] = useState(defaultYear);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef(null);

  // 點外關閉
  useEffect(() => {
    if (!pickerOpen) return;
    const handler = (e) => { if (pickerRef.current && !pickerRef.current.contains(e.target)) setPickerOpen(false); };
    setTimeout(() => document.addEventListener('click', handler), 0);
    return () => document.removeEventListener('click', handler);
  }, [pickerOpen]);

  const selectedYear = selectedYM ? parseInt(selectedYM.slice(0, 4)) : null;
  const selectedMonth = selectedYM ? parseInt(selectedYM.slice(5, 7)) : null;

  // 顯示標題文字
  const titleText = selectedYM
    ? selectedYear + ' 年 ' + selectedMonth + ' 月'
    : label || '全部';

  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  const handleMonthClick = (m) => {
    const ym = pickerYear + '-' + String(m).padStart(2, '0');
    onSelect(ym === selectedYM ? '' : ym); // 再點一次取消選取 → 全部
    setPickerOpen(false);
  };

  return (
    <div style={{ position: 'relative', marginBottom: 16 }} ref={pickerRef}>
      {/* 標題列 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <button
          onClick={() => setPickerOpen(v => !v)}
          style={{
            background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <span style={{ fontSize: 20, fontWeight: 500, color: theme.t1, fontFamily, letterSpacing: '0.02em' }}>
            {titleText}
          </span>
          <div style={{
            width: 20, height: 20, borderRadius: '50%',
            background: theme.accent, display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 200ms',
            transform: pickerOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}>
            <Icon name="chevronDown" size={12} color={theme.accentText} />
          </div>
        </button>
      </div>
      {count !== undefined && (
        <div style={{ fontSize: 12, color: theme.t3, marginBottom: 8, fontFamily }}>
          {count} 筆記錄
        </div>
      )}

      {/* Picker 展開 */}
      {pickerOpen && (
        <div style={{
          position: 'relative', zIndex: 10,
          background: theme.bgCard,
          border: '0.5px solid ' + theme.border,
          borderRadius: 16,
          boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
          padding: '16px 12px',
          marginBottom: 12,
        }}>
          {/* 年份切換 */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <button onClick={() => setPickerYear(y => y - 1)} style={{
              width: 32, height: 32, borderRadius: '50%', border: '0.5px solid ' + theme.border,
              background: theme.bgDeep, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: theme.t2,
            }}>
              <Icon name="chevronLeft" size={14} />
            </button>
            <span style={{ fontSize: 16, fontWeight: 500, color: theme.t1, fontFamily }}>{pickerYear}</span>
            <button onClick={() => setPickerYear(y => y + 1)} style={{
              width: 32, height: 32, borderRadius: '50%', border: '0.5px solid ' + theme.border,
              background: theme.bgDeep, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: theme.t2,
            }}>
              <Icon name="chevronRight" size={14} />
            </button>
          </div>

          {/* 月份格子 */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
            {months.map(m => {
              const ym = pickerYear + '-' + String(m).padStart(2, '0');
              const hasData = hasDataSet.has(ym);
              const isSelected = selectedYear === pickerYear && selectedMonth === m;
              return (
                <button
                  key={m}
                  onClick={() => handleMonthClick(m)}
                  style={{
                    padding: '10px 4px',
                    borderRadius: 10,
                    border: 'none',
                    cursor: hasData ? 'pointer' : 'default',
                    background: isSelected ? theme.accent : 'transparent',
                    color: isSelected ? theme.accentText : hasData ? theme.t1 : theme.t3,
                    fontWeight: hasData ? 600 : 400,
                    fontSize: 14, fontFamily,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    transition: 'background 150ms',
                    opacity: hasData ? 1 : 0.4,
                  }}
                  onMouseEnter={(e) => { if (hasData && !isSelected) e.currentTarget.style.background = theme.bgDeep; }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span>{m} 月</span>
                  {hasData && (
                    <div style={{
                      width: 4, height: 4, borderRadius: '50%',
                      background: isSelected ? theme.accentText : theme.accent,
                    }} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// AutoTextarea
// ============================================================================

function AutoTextarea({ value, onChange, placeholder, style, onKeyDown, minRows = 2 }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }, [value]);
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      onKeyDown={onKeyDown}
      placeholder={placeholder}
      rows={minRows}
      style={{ ...style, resize: 'none', overflow: 'hidden' }}
    />
  );
}

// ============================================================================
// Toast
// ============================================================================

function ToastContainer({ toasts, onDismiss, theme, isMobile }) {
  return (
    <div style={{
      position: 'fixed',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      pointerEvents: 'none',
      ...(isMobile
        ? { bottom: 'calc(env(safe-area-inset-bottom) + 16px)', left: 16, right: 16 }
        : { top: 76, right: 24, maxWidth: 400 })
    }}>
      {toasts.map((toast) => (
        <div key={toast.id} style={{
          pointerEvents: 'auto',
          background: theme.bgCard,
          color: theme.t1,
          padding: '12px 16px',
          borderRadius: 8,
          boxShadow: '0 12px 32px rgba(0,0,0,0.16)',
          border: '0.5px solid ' + theme.border,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 14,
          minWidth: 280,
          fontFamily: "'Noto Serif TC', 'Songti TC', serif",
          animation: 'toastIn 0.25s ease-out',
        }}>
          <Icon name={toast.type === 'error' ? 'cloudOff' : 'check'} size={16} color={toast.type === 'error' ? theme.coral : theme.accent} />
          <span style={{ flex: 1 }}>{toast.message}</span>
          {toast.action && (
            <button onClick={() => { toast.action.onClick(); onDismiss(toast.id); }} style={{
              background: 'transparent', border: 'none',
              color: theme.accent, fontSize: 14, fontWeight: 500, cursor: 'pointer', padding: '4px 8px',
              fontFamily: 'inherit',
            }}>{toast.action.label}</button>
          )}
          <button onClick={() => onDismiss(toast.id)} style={{
            background: 'transparent', border: 'none', color: theme.t3, cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center',
          }}><Icon name="close" size={14} /></button>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Modal
// ============================================================================

function Modal({ open, onClose, title, children, theme, isMobile, wide }) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)',
      display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center',
      zIndex: 1000, padding: isMobile ? 0 : 16,
    }} onClick={onClose}>
      <div style={{
        background: theme.bgCard,
        borderRadius: isMobile ? '12px 12px 0 0' : 12,
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        border: '0.5px solid ' + theme.border,
        width: '100%',
        maxWidth: isMobile ? '100%' : (wide ? 640 : 500),
        maxHeight: isMobile ? '92vh' : '85vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{
          padding: '16px 24px',
          borderBottom: '0.5px solid ' + theme.border,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: 16, fontWeight: 500, color: theme.t1, fontFamily: "'Noto Serif TC', serif" }}>{title}</div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: theme.t2, cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' }}>
            <Icon name="close" size={18} />
          </button>
        </div>
        <div style={{ padding: '20px 24px', overflow: 'auto', flex: 1 }}>{children}</div>
      </div>
    </div>
  );
}

// ============================================================================
// HamburgerMenu
// ============================================================================

function HamburgerMenu({ open, onClose, theme, themeKey, onChangeTheme, onExportDaily, user, syncStatus, lastSyncAt, onSyncNow, onSignIn, onSignOut }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    setTimeout(() => document.addEventListener('click', handler), 0);
    return () => document.removeEventListener('click', handler);
  }, [open, onClose]);
  if (!open) return null;

  const font = "'Noto Serif TC', serif";
  const itemStyle = {
    padding: '10px 16px', fontSize: 14, color: theme.t1, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 12, minHeight: 44,
    transition: 'background 150ms ease-out', fontFamily: font,
  };
  const sep = <div style={{ height: 1, background: theme.border, margin: '4px 16px' }} />;

  function formatLastSync(ts) {
    if (!ts) return '從未同步';
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return '剛剛';
    if (mins < 60) return mins + ' 分鐘前';
    const hours = Math.floor(diff / 3600000);
    if (hours < 24) return hours + ' 小時前';
    return Math.floor(diff / 86400000) + ' 天前';
  }

  return (
    <div ref={ref} style={{
      position: 'absolute', top: 'calc(100% + 8px)', right: 0,
      background: theme.bgCard, border: '0.5px solid ' + theme.border, borderRadius: 12,
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
      minWidth: 260, maxWidth: 'calc(100vw - 32px)', padding: '8px 0', zIndex: 100,
    }}>
      {/* 已登入：使用者資訊 */}
      {user && (
        <div style={{ padding: '10px 16px 12px', borderBottom: '0.5px solid ' + theme.border, marginBottom: 4 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: theme.t1, fontFamily: font }}>{user.displayName || user.email?.split('@')[0]}</div>
          <div style={{ fontSize: 11, color: theme.t3 }}>{user.email}</div>
        </div>
      )}

      {/* 切換主題 */}
      <div style={itemStyle} onClick={onChangeTheme}
        onMouseEnter={(e) => e.currentTarget.style.background = theme.bgDeep}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
        <Icon name="palette" size={16} color={theme.t2} />
        切換主題（{themeKey === 'ritual-warm' ? '酒紅杏仁奶' : '玫瑰米白'}）
      </div>
      {sep}

      {/* 匯出（快速） */}
      <div style={itemStyle} onClick={onExportDaily}
        onMouseEnter={(e) => e.currentTarget.style.background = theme.bgDeep}
        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
        <Icon name="download" size={16} color={theme.t2} />
        匯出日常紀錄
      </div>
      <div style={{ ...itemStyle, opacity: 0.5, cursor: 'default' }}>
        <Icon name="upload" size={16} color={theme.t2} />
        匯入請至設定頁
      </div>
      {sep}

      {/* 立即同步（已登入才顯示） */}
      {user && (
        <div style={{
          ...itemStyle,
          background: theme.accent + '12',
          flexDirection: 'column', alignItems: 'flex-start', gap: 2,
          cursor: syncStatus === 'syncing' ? 'default' : 'pointer',
        }}
          onClick={syncStatus === 'syncing' ? undefined : onSyncNow}
          onMouseEnter={(e) => { if (syncStatus !== 'syncing') e.currentTarget.style.background = theme.accent + '20'; }}
          onMouseLeave={(e) => e.currentTarget.style.background = theme.accent + '12'}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontWeight: 500 }}>
            <Icon name="refresh" size={16} color={theme.accent} />
            {syncStatus === 'syncing' ? '同步中…' : '立即同步'}
          </div>
          <div style={{ fontSize: 11, color: theme.t3, marginLeft: 28 }}>上次同步：{formatLastSync(lastSyncAt)}</div>
        </div>
      )}

      {/* 登入 / 登出 */}
      {user ? (
        <div style={itemStyle} onClick={onSignOut}
          onMouseEnter={(e) => e.currentTarget.style.background = theme.bgDeep}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
          <Icon name="logout" size={16} color={theme.t2} />
          登出
        </div>
      ) : (
        <div style={itemStyle} onClick={onSignIn}
          onMouseEnter={(e) => e.currentTarget.style.background = theme.bgDeep}
          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
          <Icon name="login" size={16} color={theme.t2} />
          登入（Google）
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 同步狀態指示器
// ============================================================================

function SyncIndicator({ status, theme }) {
  if (status === 'signedOut') return null;
  const map = {
    synced:  { name: 'cloudCheck', color: theme.t3 },
    syncing: { name: 'cloudUpload', color: theme.accent },
    offline: { name: 'cloudOff',   color: theme.t3 },
    failed:  { name: 'cloudAlert', color: theme.coral },
  };
  const cur = map[status] || map.synced;
  return (
    <div style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon name={cur.name} size={16} color={cur.color}
        style={status === 'syncing' ? { animation: 'pulse 1.2s ease-in-out infinite' } : {}} />
    </div>
  );
}

// ============================================================================
// 情緒天氣圖示 (SVG，不用 emoji)
// ============================================================================

const WeatherIcon = ({ type, size = 20, color = 'currentColor' }) => {
  if (type === 'sunny') return <Icon name="sun" size={size} color={color} />;
  if (type === 'cloudy') return <Icon name="cloudCheck" size={size} color={color} />;
  if (type === 'rainy') return <Icon name="cloudRain" size={size} color={color} />;
  if (type === 'foggy') return <Icon name="wind" size={size} color={color} />;
  if (type === 'stormy') return <Icon name="zap" size={size} color={color} />;
  return null;
};

const WEATHER_OPTIONS = [
  { id: 'sunny', label: '晴' },
  { id: 'cloudy', label: '雲' },
  { id: 'rainy', label: '雨' },
  { id: 'foggy', label: '霧' },
  { id: 'stormy', label: '雷' },
];

// ============================================================================
// 頁面分流常數
// ============================================================================

const PAGES = {
  HOME: 'home',
  DAILY: 'daily',
  RITUAL: 'ritual',
  COURAGE: 'courage',
  RELATIONSHIP: 'relationship',
  SUPPORT: 'support',
  REVIEW: 'review',
  SETTINGS: 'settings',
};

// ============================================================================
// 共用元件:頁面標題列
// ============================================================================

function PageHeader({ title, onBack, theme }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
      {onBack && (
        <button onClick={onBack} style={{
          background: 'transparent', border: 'none', cursor: 'pointer', color: theme.t2,
          padding: 4, display: 'flex', alignItems: 'center',
        }}><Icon name="chevronLeft" size={20} /></button>
      )}
      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 500, color: theme.t1, fontFamily: "'Noto Serif TC', serif" }}>{title}</h2>
    </div>
  );
}

// ============================================================================
// 共用元件:時光軸項目容器
// ============================================================================

function TimelineItem({ date, children, theme, badge }) {
  return (
    <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ width: 8, height: 8, borderRadius: '50%', background: theme.accent, marginTop: 6 }} />
        <div style={{ width: 1, flex: 1, background: theme.border, marginTop: 4 }} />
      </div>
      <div style={{ flex: 1, paddingBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: theme.t3 }}>{date}</span>
          {badge && <span style={{
            fontSize: 11, color: theme.coral, background: theme.coral + '20',
            padding: '1px 6px', borderRadius: 4,
          }}>{badge}</span>}
        </div>
        {children}
      </div>
    </div>
  );
}

// ============================================================================
// 共用樣式函數
// ============================================================================

function cardStyle(theme) {
  return {
    background: theme.bgCard,
    border: '0.5px solid ' + theme.border,
    borderRadius: 12,
    padding: '1.5rem 1.25rem',
    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  };
}

function inputStyle(theme) {
  return {
    width: '100%',
    background: theme.bgDeep,
    border: '0.5px solid ' + theme.border,
    borderRadius: 8,
    padding: '10px 12px',
    fontSize: 16,
    color: theme.t1,
    fontFamily: "'Noto Serif TC', 'Songti TC', serif",
    boxSizing: 'border-box',
    minHeight: 44,
    lineHeight: 1.6,
  };
}

function btnPrimary(theme, disabled) {
  return {
    background: disabled ? theme.cancelBg : theme.accent,
    color: disabled ? theme.cancelText : theme.accentText,
    border: 'none', borderRadius: 20, padding: '10px 24px',
    fontSize: 14, fontWeight: 500, cursor: disabled ? 'not-allowed' : 'pointer',
    letterSpacing: '0.06em', opacity: disabled ? 0.6 : 1,
    fontFamily: "'Noto Serif TC', serif",
    transition: 'all 150ms ease-out',
  };
}

function btnSecondary(theme) {
  return {
    background: 'transparent', color: theme.t1,
    border: '0.5px solid ' + theme.borderHover, borderRadius: 20, padding: '10px 20px',
    fontSize: 14, cursor: 'pointer', fontFamily: "'Noto Serif TC', serif",
  };
}

// ============================================================================
// Home 頁
// ============================================================================

function HomePage({ theme, isMobile, onNavigate, morningAnchors, sundayWitnesses, ritualEntries, relationships, onNavigateToRelDetail }) {
  const [quoteIdx] = useState(() => Math.floor(Math.random() * QUOTES.length));
  const today = todayStr();
  const quote = QUOTES[quoteIdx];
  const dow = getDayOfWeek();

  // 主儀式卡邏輯
  let mainRitual = null;
  if (dow === 0) {
    mainRitual = { title: '週日自我見證', desc: '這是你給自己的 30 分鐘。沒有對錯,沒有評分。只是見證這一週的你。', page: PAGES.DAILY, tab: 'witness' };
  } else if (isLastWeekOfQuarter()) {
    mainRitual = { title: '季度回顧', desc: '一季過去了。是時候靜下來,看見這段旅程的輪廓。', page: PAGES.REVIEW };
  } else if (isFirstDaysOfMonth()) {
    const thisMonth = today.slice(0, 7);
    const hasMonthly = false; // 簡化:可接入 monthlySolos 資料
    if (!hasMonthly) {
      mainRitual = { title: '月度獨處日規劃', desc: '月初了。給自己安排一個獨處的日期吧。', page: PAGES.DAILY, tab: 'monthly' };
    }
  }
  if (!mainRitual) {
    mainRitual = { title: '晨間錨點', desc: '在一天的開始,看見自己現在是什麼狀態。', page: PAGES.DAILY, tab: 'morning' };
  }

  // 本月足跡 (有紀錄的日期圓點)
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const todayDay = new Date().getDate();
  const monthStr = today.slice(0, 7);
  const recordedDays = new Set();
  morningAnchors.forEach(a => { if (a.date.startsWith(monthStr)) recordedDays.add(new Date(a.date + 'T00:00:00').getDate()); });
  ritualEntries.forEach(r => { if (r.date.startsWith(monthStr)) recordedDays.add(new Date(r.date + 'T00:00:00').getDate()); });
  sundayWitnesses.forEach(w => { if (w.weekStartDate && w.weekStartDate.startsWith(monthStr)) recordedDays.add(new Date(w.weekStartDate + 'T00:00:00').getDate()); });

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: isMobile ? '20px 16px 100px' : '32px 24px 80px' }}>
      {/* 其他入口（頂部） */}
      <div style={{ ...cardStyle(theme), marginBottom: 20, padding: '14px 16px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          {[
            { label: '儀式菜單', page: PAGES.RITUAL },
            { label: '月度獨處', page: PAGES.DAILY, tab: 'monthly' },
            { label: '關係管理', page: PAGES.RELATIONSHIP },
            { label: '關係支援', page: PAGES.SUPPORT },
            { label: '回顧', page: PAGES.REVIEW },
          ].map(item => (
            <button key={item.label} onClick={() => onNavigate(item.page, item.tab)} style={{
              ...btnSecondary(theme), padding: '7px 14px', fontSize: 13,
            }}>{item.label}</button>
          ))}
        </div>
      </div>

      {/* 引言卡 */}
      <div style={{
        ...cardStyle(theme),
        textAlign: 'center',
        padding: '2rem 1.5rem',
        marginBottom: 20,
        borderLeft: '3px solid ' + theme.accent,
      }}>
        <p style={{ margin: '0 0 12px', fontSize: 17, fontStyle: 'italic', color: theme.t1, lineHeight: 1.7 }}>
          「{quote.text}」
        </p>
        <p style={{ margin: 0, fontSize: 13, color: theme.t3 }}>— {quote.author}</p>
      </div>

      {/* 主儀式卡 */}
      <div style={{
        ...cardStyle(theme),
        marginBottom: 20,
        borderTop: '3px solid ' + theme.accent,
        textAlign: 'center',
        padding: '2rem 1.5rem',
      }}>
        <div style={{ fontSize: 12, color: theme.t3, marginBottom: 10, letterSpacing: '0.08em' }}>
          {dow === 0 ? '本週主儀式 · 週日' : dow >= 1 && dow <= 5 ? '今日儀式' : '週末時光'}
        </div>
        <div style={{ fontSize: 18, fontWeight: 500, color: theme.t1, marginBottom: 12, fontFamily: "'Noto Serif TC', serif" }}>
          {mainRitual.title}
        </div>
        <p style={{ margin: '0 0 20px', fontSize: 14, color: theme.t2, lineHeight: 1.7, fontStyle: 'italic' }}>
          {mainRitual.desc}
        </p>
        <button onClick={() => onNavigate(mainRitual.page, mainRitual.tab)} style={btnPrimary(theme)}>
          進入儀式
        </button>
      </div>

      {/* 關係一行文字 */}
      {(() => {
        const active = (relationships || []).find(r => r.currentStage !== 'paused' && r.currentStage !== 'ended');
        if (!active) return null;
        const relDays = daysDiff(active.startTrackingDate, todayStr()) + 1;
        const isObsReady = active.currentStage === 'observation' && relDays >= 30;
        return (
          <div style={{
            ...cardStyle(theme),
            marginBottom: 20,
            borderLeft: '2px solid ' + theme.navy,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px',
          }}>
            <span style={{ fontSize: 14, color: theme.t2 }}>
              追蹤中：<span style={{ fontWeight: 500, color: theme.t1, fontFamily: "'Noto Serif TC', serif" }}>{active.codename}</span>
            </span>
            {isObsReady ? (
              <button
                onClick={() => onNavigateToRelDetail && onNavigateToRelDetail(active.id)}
                style={{
                  background: theme.coral + '18',
                  border: '0.5px solid ' + theme.coral + '60',
                  color: theme.coral,
                  borderRadius: 20,
                  padding: '4px 12px',
                  fontSize: 12,
                  cursor: 'pointer',
                  animation: 'pulseDot 2s ease-in-out infinite',
                }}
              >
                切換到發展中？
              </button>
            ) : (
              <span style={{ fontSize: 13, color: theme.t3 }}>
                {stageLabel(active.currentStage)}・第 {relDays} 天
              </span>
            )}
          </div>
        );
      })()}

      {/* 次要入口 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
        <div style={{ ...cardStyle(theme), cursor: 'pointer', transition: 'border-color 150ms' }}
          onClick={() => onNavigate(PAGES.DAILY, 'morning')}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = theme.accent}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = theme.border}>
          <div style={{ fontSize: 11, color: theme.t3, marginBottom: 4 }}>今晨</div>
          <div style={{ fontSize: 15, color: theme.t1, fontFamily: "'Noto Serif TC', serif" }}>晨間錨點</div>
        </div>
        <div style={{ ...cardStyle(theme), cursor: 'pointer', transition: 'border-color 150ms' }}
          onClick={() => onNavigate(PAGES.COURAGE)}
          onMouseEnter={(e) => e.currentTarget.style.borderColor = theme.accent}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = theme.border}>
          <div style={{ fontSize: 11, color: theme.t3, marginBottom: 4 }}>隨時</div>
          <div style={{ fontSize: 15, color: theme.t1, fontFamily: "'Noto Serif TC', serif" }}>小勇敢紀錄</div>
        </div>
      </div>

      {/* 本月儀式足跡 */}
      <div style={{ ...cardStyle(theme), marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: theme.t2, marginBottom: 12, fontFamily: "'Noto Serif TC', serif" }}>本月足跡</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {Array.from({ length: todayDay }, (_, i) => i + 1).map(day => (
            <div key={day} style={{
              width: 10, height: 10, borderRadius: '50%',
              background: recordedDays.has(day) ? theme.accent : theme.border,
              transition: 'background 150ms',
            }} title={day + ' 日'} />
          ))}
        </div>
        <div style={{ fontSize: 12, color: theme.t3, marginTop: 8 }}>
          {recordedDays.size} 天有紀錄
        </div>
      </div>

    </div>
  );
}

// ============================================================================
// 晨間錨點 — 過往單筆（密度流 row，含編輯/刪除）
// ============================================================================

function MorningAnchorRow({ entry, theme, isTouch, onSave, onDelete }) {
  const [hov, setHov] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editState, setEditState] = useState(entry.stateDescription || '');
  const [editProtect, setEditProtect] = useState(entry.protectIntent || '');
  const [editAllow, setEditAllow] = useState(entry.allowIntent || '');
  const showActions = isTouch || hov;

  const handleSaveEdit = () => {
    if (!editState.trim() && !editProtect.trim()) return;
    onSave({ ...entry, stateDescription: editState.trim(), protectIntent: editProtect.trim(), allowIntent: editAllow.trim() });
    setEditing(false);
  };

  if (editing) return (
    <div style={{ padding: '12px 14px', borderBottom: '0.5px solid ' + theme.border }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <AutoTextarea value={editState} onChange={e => setEditState(e.target.value)}
          placeholder="今天的狀態…" style={{ ...inputStyle(theme), fontSize: 14 }} minRows={2} />
        <AutoTextarea value={editProtect} onChange={e => setEditProtect(e.target.value)}
          placeholder="想保護的…" style={{ ...inputStyle(theme), fontSize: 14 }} minRows={1} />
        <AutoTextarea value={editAllow} onChange={e => setEditAllow(e.target.value)}
          placeholder="允許的… （選填）" style={{ ...inputStyle(theme), fontSize: 14 }} minRows={1} />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={() => setEditing(false)} style={btnSecondary(theme)}>取消</button>
          <button onClick={handleSaveEdit} disabled={!editState.trim() && !editProtect.trim()}
            style={btnPrimary(theme, !editState.trim() && !editProtect.trim())}>儲存</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '12px 14px', borderBottom: '0.5px solid ' + theme.border }}
      onMouseEnter={() => { if (!isTouch) setHov(true); }}
      onMouseLeave={() => { if (!isTouch) { setHov(false); setConfirmDelete(false); } }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {entry.stateDescription && (
            <div style={{ marginBottom: entry.protectIntent || entry.allowIntent ? 8 : 0 }}>
              <div style={{ fontSize: 11, color: theme.t3, marginBottom: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Icon name="feather" size={11} color={theme.t3} />
                說出來
              </div>
              <div style={{ fontSize: 14, color: theme.t1, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{entry.stateDescription}</div>
            </div>
          )}
          {entry.protectIntent && (
            <div style={{ marginBottom: entry.allowIntent ? 8 : 0 }}>
              <div style={{ fontSize: 11, color: theme.t3, marginBottom: 3 }}>保護</div>
              <div style={{ fontSize: 14, color: theme.t1, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{entry.protectIntent}</div>
            </div>
          )}
          {entry.allowIntent && (
            <div>
              <div style={{ fontSize: 11, color: theme.t3, marginBottom: 3 }}>允許</div>
              <div style={{ fontSize: 14, color: theme.t1, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{entry.allowIntent}</div>
            </div>
          )}
          {confirmDelete && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button onClick={() => setConfirmDelete(false)} style={btnSecondary(theme)}>取消</button>
              <button onClick={() => onDelete(entry.id)} style={{
                background: theme.coral, color: '#FFF', border: 'none', borderRadius: 20,
                padding: '7px 18px', fontSize: 13, cursor: 'pointer', fontFamily: "'Noto Serif TC', serif",
              }}>刪除</button>
            </div>
          )}
        </div>
        {showActions && !confirmDelete && (
          <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
            <button onClick={() => { setEditing(true); setEditState(entry.stateDescription || ''); setEditProtect(entry.protectIntent || ''); setEditAllow(entry.allowIntent || ''); }} style={{
              background: 'transparent', border: 'none', cursor: 'pointer', color: theme.t3, padding: 6,
              borderRadius: 6, minWidth: 32, minHeight: 32, display: 'flex', alignItems: 'center',
            }}><Icon name="edit" size={13} /></button>
            <button onClick={() => setConfirmDelete(true)} style={{
              background: 'transparent', border: 'none', cursor: 'pointer', color: theme.t3, padding: 6,
              borderRadius: 6, minWidth: 32, minHeight: 32, display: 'flex', alignItems: 'center',
            }}><Icon name="trash" size={13} /></button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 晨間錨點 Tab
// ============================================================================

function MorningAnchorTab({ theme, isMobile, morningAnchors, onSave, onDelete }) {
  const isTouch = useRef(typeof window !== 'undefined' && window.matchMedia('(pointer:coarse)').matches).current;
  const today = todayStr();
  const todayEntry = morningAnchors.find(a => a.date === today);
  const [isEditing, setIsEditing] = useState(!todayEntry);
  const [state, setState] = useState(todayEntry?.stateDescription || '');
  const [protect, setProtect] = useState(todayEntry?.protectIntent || '');
  const [allow, setAllow] = useState(todayEntry?.allowIntent || '');

  useEffect(() => {
    if (todayEntry && !isEditing) {
      setState(todayEntry.stateDescription || '');
      setProtect(todayEntry.protectIntent || '');
      setAllow(todayEntry.allowIntent || '');
    }
  }, [todayEntry, isEditing]);

  const handleSave = () => {
    if (!state.trim() && !protect.trim()) return;
    onSave({
      id: todayEntry?.id || genId(),
      date: today,
      stateDescription: state.trim(),
      protectIntent: protect.trim(),
      allowIntent: allow.trim(),
      createdAt: todayEntry?.createdAt || Date.now(),
    });
    setIsEditing(false);
  };

  const pastAll = morningAnchors
    .filter(a => a.date !== today)
    .sort((a, b) => b.date.localeCompare(a.date));

  // 月份 Picker 狀態
  const latestYM = pastAll.length > 0 ? pastAll[0].date.slice(0, 7) : '';
  const [selectedYM, setSelectedYM] = useState(latestYM);
  const filteredPast = selectedYM ? pastAll.filter(e => e.date.startsWith(selectedYM)) : pastAll;

  const labelStyle = { fontSize: 13, color: theme.t2, marginBottom: 6, display: 'block', fontFamily: "'Noto Serif TC', serif" };

  return (
    <div>
      {/* 今日卡 */}
      <div style={{ ...cardStyle(theme), marginBottom: 24 }}>
        <div style={{ fontSize: 13, color: theme.t3, marginBottom: 16, letterSpacing: '0.04em' }}>
          {formatDate(today)}
        </div>
        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={labelStyle}>今天我是什麼狀態</label>
              <AutoTextarea value={state} onChange={e => setState(e.target.value)}
                placeholder="身體、情緒、能量…" style={inputStyle(theme)} minRows={2} />
            </div>
            <div>
              <label style={labelStyle}>我想保護什麼</label>
              <AutoTextarea value={protect} onChange={e => setProtect(e.target.value)}
                placeholder="今天想守住的事…" style={inputStyle(theme)} minRows={2} />
            </div>
            <div>
              <label style={labelStyle}>我允許什麼發生 <span style={{ color: theme.t3, fontSize: 11 }}>(選填)</span></label>
              <AutoTextarea value={allow} onChange={e => setAllow(e.target.value)}
                placeholder="今天願意放開的事…" style={inputStyle(theme)} minRows={2} />
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              {todayEntry && <button onClick={() => setIsEditing(false)} style={btnSecondary(theme)}>取消</button>}
              <button onClick={handleSave} disabled={!state.trim() && !protect.trim()} style={btnPrimary(theme, !state.trim() && !protect.trim())}>
                儲存今天的錨點
              </button>
            </div>
          </div>
        ) : todayEntry ? (
          <div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, color: theme.t3, marginBottom: 4 }}>今天的狀態</div>
              <div style={{ fontSize: 15, color: theme.t1, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{todayEntry.stateDescription}</div>
            </div>
            {todayEntry.protectIntent && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: theme.t3, marginBottom: 4 }}>想保護的</div>
                <div style={{ fontSize: 15, color: theme.t1, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{todayEntry.protectIntent}</div>
              </div>
            )}
            {todayEntry.allowIntent && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: theme.t3, marginBottom: 4 }}>允許的</div>
                <div style={{ fontSize: 15, color: theme.t1, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{todayEntry.allowIntent}</div>
              </div>
            )}
            <button onClick={() => setIsEditing(true)} style={btnSecondary(theme)}>修改今天的</button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px 0', color: theme.t3 }}>
            <p style={{ fontSize: 14, fontStyle: 'italic', marginBottom: 16 }}>還沒有今天的錨點。花幾分鐘看見自己吧。</p>
            <button onClick={() => setIsEditing(true)} style={btnPrimary(theme)}>開始今天的錨點</button>
          </div>
        )}
      </div>

      {/* 過往紀錄 — 月曆 Picker */}
      {pastAll.length > 0 && (
        <div>
          <MonthCalendarPicker
            entries={pastAll}
            selectedYM={selectedYM}
            onSelect={setSelectedYM}
            theme={theme}
            label="全部錨點"
            count={filteredPast.length}
          />
          {filteredPast.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: theme.t3, fontSize: 13, fontStyle: 'italic' }}>
              這個月還沒有錨點紀錄。
            </div>
          ) : (
            <div style={{ background: theme.bgCard, border: '0.5px solid ' + theme.border, borderRadius: 12, overflow: 'hidden' }}>
              {filteredPast.map(entry => (
                <MorningAnchorRow key={entry.id} entry={entry} theme={theme} isTouch={isTouch}
                  onSave={onSave} onDelete={onDelete} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 週日見證 - Step 流程
// ============================================================================

function SundayWitnessFlow({ theme, isMobile, witness, onSave, onCancel }) {
  const [step, setStep] = useState(1);
  const [wellDoneItems, setWellDoneItems] = useState(witness?.wellDoneItems || ['']);
  const [selfSeen, setSelfSeen] = useState(witness?.selfSeen || '');
  const [selfThanks, setSelfThanks] = useState(witness?.selfThanks || '');
  const [weather, setWeather] = useState(witness?.emotionalWeather || []);
  const [entering, setEntering] = useState(false);

  const goNext = () => {
    setEntering(true);
    setTimeout(() => { setStep(s => s + 1); setEntering(false); }, 50);
  };
  const goBack = () => {
    setEntering(true);
    setTimeout(() => { setStep(s => s - 1); setEntering(false); }, 50);
  };

  const handleSeal = () => {
    onSave({
      wellDoneItems: wellDoneItems.filter(i => i.trim()),
      selfSeen: selfSeen.trim(),
      selfThanks: selfThanks.trim(),
      emotionalWeather: weather,
    });
  };

  const containerStyle = {
    opacity: entering ? 0 : 1,
    transition: 'opacity 0.35s ease-in-out',
    maxWidth: 560, margin: '0 auto',
  };

  // Step 1: 準備
  if (step === 1) return (
    <div style={containerStyle}>
      <div style={{ ...cardStyle(theme), textAlign: 'center', padding: '3rem 2rem' }}>
        <div style={{ fontSize: 32, marginBottom: 24 }}>
          <Icon name="feather" size={40} color={theme.accent} />
        </div>
        <p style={{ fontSize: 17, fontStyle: 'italic', color: theme.t1, lineHeight: 1.8, marginBottom: 8 }}>
          這是你給自己的 30 分鐘。
        </p>
        <p style={{ fontSize: 17, fontStyle: 'italic', color: theme.t1, lineHeight: 1.8, marginBottom: 8 }}>
          沒有對錯,沒有評分。
        </p>
        <p style={{ fontSize: 17, fontStyle: 'italic', color: theme.t1, lineHeight: 1.8, marginBottom: 32 }}>
          只是見證這一週的你。
        </p>
        <p style={{ fontSize: 14, color: theme.t3, marginBottom: 32, fontStyle: 'italic' }}>
          深呼吸三次,再開始。
        </p>
        <button onClick={goNext} style={btnPrimary(theme)}>我準備好了</button>
        {onCancel && <button onClick={onCancel} style={{ ...btnSecondary(theme), marginLeft: 12 }}>返回</button>}
      </div>
    </div>
  );

  // Step 2: 做得好的事
  if (step === 2) return (
    <div style={containerStyle}>
      <div style={{ ...cardStyle(theme), padding: '2rem' }}>
        <div style={{ fontSize: 12, color: theme.t3, marginBottom: 4 }}>Step 2 / 6</div>
        <h3 style={{ fontSize: 18, fontWeight: 500, color: theme.t1, marginBottom: 8, fontFamily: "'Noto Serif TC', serif" }}>
          這週我做得好的事
        </h3>
        <p style={{ fontSize: 13, color: theme.t3, fontStyle: 'italic', marginBottom: 20 }}>具體的,不是抽象的。</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {wellDoneItems.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <AutoTextarea value={item} onChange={e => {
                const updated = [...wellDoneItems]; updated[idx] = e.target.value; setWellDoneItems(updated);
              }} placeholder={'第 ' + (idx + 1) + ' 件事…'} style={{ ...inputStyle(theme), flex: 1 }} minRows={1} />
              {wellDoneItems.length > 1 && (
                <button onClick={() => setWellDoneItems(wellDoneItems.filter((_, i) => i !== idx))}
                  style={{ background: 'transparent', border: 'none', color: theme.t3, cursor: 'pointer', padding: 8, marginTop: 2 }}>
                  <Icon name="close" size={14} />
                </button>
              )}
            </div>
          ))}
          <button onClick={() => setWellDoneItems([...wellDoneItems, ''])} style={{
            ...btnSecondary(theme), alignSelf: 'flex-start', marginTop: 4, fontSize: 13, padding: '6px 14px',
          }}>+ 再加一件</button>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 24 }}>
          <button onClick={goBack} style={btnSecondary(theme)}>上一步</button>
          <button onClick={goNext} disabled={!wellDoneItems.some(i => i.trim())}
            style={btnPrimary(theme, !wellDoneItems.some(i => i.trim()))}>下一步</button>
        </div>
      </div>
    </div>
  );

  // Step 3: 看見的自己
  if (step === 3) return (
    <div style={containerStyle}>
      <div style={{ ...cardStyle(theme), padding: '2rem' }}>
        <div style={{ fontSize: 12, color: theme.t3, marginBottom: 4 }}>Step 3 / 6</div>
        <h3 style={{ fontSize: 18, fontWeight: 500, color: theme.t1, marginBottom: 8, fontFamily: "'Noto Serif TC', serif" }}>
          這週我看見的自己
        </h3>
        <p style={{ fontSize: 13, color: theme.t3, fontStyle: 'italic', marginBottom: 20 }}>一個特徵、一個模式、一個情緒都可以。</p>
        <AutoTextarea value={selfSeen} onChange={e => setSelfSeen(e.target.value)}
          placeholder="我看見一個…" style={inputStyle(theme)} minRows={4} />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 24 }}>
          <button onClick={goBack} style={btnSecondary(theme)}>上一步</button>
          <button onClick={goNext} disabled={!selfSeen.trim()}
            style={btnPrimary(theme, !selfSeen.trim())}>下一步</button>
        </div>
      </div>
    </div>
  );

  // Step 4: 感謝自己
  if (step === 4) return (
    <div style={containerStyle}>
      <div style={{ ...cardStyle(theme), padding: '2rem' }}>
        <div style={{ fontSize: 12, color: theme.t3, marginBottom: 4 }}>Step 4 / 6</div>
        <h3 style={{ fontSize: 18, fontWeight: 500, color: theme.t1, marginBottom: 8, fontFamily: "'Noto Serif TC', serif" }}>
          這週我感謝自己什麼
        </h3>
        <p style={{ fontSize: 13, color: theme.t3, fontStyle: 'italic', marginBottom: 20 }}>對自己說一句謝謝。</p>
        <AutoTextarea value={selfThanks} onChange={e => setSelfThanks(e.target.value)}
          placeholder="謝謝你…" style={inputStyle(theme)} minRows={3} />
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 24 }}>
          <button onClick={goBack} style={btnSecondary(theme)}>上一步</button>
          <button onClick={goNext} disabled={!selfThanks.trim()}
            style={btnPrimary(theme, !selfThanks.trim())}>下一步</button>
        </div>
      </div>
    </div>
  );

  // Step 5: 情緒天氣
  if (step === 5) return (
    <div style={containerStyle}>
      <div style={{ ...cardStyle(theme), padding: '2rem' }}>
        <div style={{ fontSize: 12, color: theme.t3, marginBottom: 4 }}>Step 5 / 6</div>
        <h3 style={{ fontSize: 18, fontWeight: 500, color: theme.t1, marginBottom: 8, fontFamily: "'Noto Serif TC', serif" }}>
          這週的情緒天氣
        </h3>
        <p style={{ fontSize: 13, color: theme.t3, fontStyle: 'italic', marginBottom: 20 }}>可以多選。</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {WEATHER_OPTIONS.map(w => {
            const selected = weather.includes(w.id);
            return (
              <button key={w.id} onClick={() => setWeather(prev => selected ? prev.filter(x => x !== w.id) : [...prev, w.id])}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  padding: '14px 20px', borderRadius: 12, cursor: 'pointer',
                  background: selected ? theme.accentLight : theme.bgDeep,
                  border: selected ? '1.5px solid ' + theme.accent : '0.5px solid ' + theme.border,
                  color: selected ? theme.accent : theme.t2,
                  transition: 'all 150ms ease-out',
                }}>
                <WeatherIcon type={w.id} size={24} color={selected ? theme.accent : theme.t2} />
                <span style={{ fontSize: 13 }}>{w.label}</span>
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 24 }}>
          <button onClick={goBack} style={btnSecondary(theme)}>上一步</button>
          <button onClick={goNext} style={btnPrimary(theme)}>下一步</button>
        </div>
      </div>
    </div>
  );

  // Step 6: 封存
  if (step === 6) return (
    <div style={containerStyle}>
      <div style={{ ...cardStyle(theme), textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: 12, color: theme.t3, marginBottom: 4 }}>Step 6 / 6</div>
        <div style={{ marginBottom: 24 }}>
          <Icon name="feather" size={36} color={theme.accent} />
        </div>
        <p style={{ fontSize: 17, fontStyle: 'italic', color: theme.t1, marginBottom: 8, lineHeight: 1.7 }}>
          這週的你,已被見證。
        </p>
        {weather.length > 0 && (
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 24 }}>
            {weather.map(w => <WeatherIcon key={w} type={w} size={20} color={theme.accent} />)}
          </div>
        )}
        <p style={{ fontSize: 13, color: theme.t3, fontStyle: 'italic', marginBottom: 28 }}>
          封存後不可修改。
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <button onClick={goBack} style={btnSecondary(theme)}>修改一下</button>
          <button onClick={handleSeal} style={btnPrimary(theme)}>封存這一週</button>
        </div>
      </div>
    </div>
  );

  return null;
}

// ============================================================================
// 週日見證 Tab
// ============================================================================

// ============================================================================
// 週日見證單筆展開卡片
// ============================================================================

function WitnessExpandCard({ w, theme, isCurrentWeek, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen || false);
  return (
    <div style={{ ...cardStyle(theme), padding: '1rem', transition: 'border-color 150ms' }}
      onMouseEnter={(e) => e.currentTarget.style.borderColor = theme.accent}
      onMouseLeave={(e) => e.currentTarget.style.borderColor = theme.border}>
      {/* 收合狀態：摘要行 */}
      <button onClick={() => setOpen(v => !v)} style={{
        background: 'transparent', border: 'none', cursor: 'pointer',
        width: '100%', textAlign: 'left', padding: 0,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: 1 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {w.emotionalWeather?.map(weather => (
              <WeatherIcon key={weather} type={weather} size={15} color={open ? theme.accent : theme.t2} />
            ))}
          </div>
          {!open && w.selfSeen && (
            <span style={{ fontSize: 13, color: theme.t2, fontStyle: 'italic' }}>
              「{w.selfSeen.slice(0, 50)}{w.selfSeen.length > 50 ? '…' : ''}」
            </span>
          )}
          {isCurrentWeek && (
            <span style={{ fontSize: 11, color: theme.accent, background: theme.accentLight, padding: '1px 8px', borderRadius: 10 }}>本週</span>
          )}
          {w.isLateEntry && (
            <span style={{ fontSize: 11, color: theme.coral, background: theme.coral + '20', padding: '1px 8px', borderRadius: 10 }}>補寫</span>
          )}
        </div>
        <Icon name={open ? 'chevronDown' : 'chevronRight'} size={15} color={theme.t3} style={{ flexShrink: 0 }} />
      </button>

      {/* 展開內容 */}
      {open && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '0.5px solid ' + theme.border }}>
          {w.wellDoneItems?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: theme.t3, marginBottom: 8, letterSpacing: '0.06em' }}>這週做得好的事</div>
              {w.wellDoneItems.map((item, i) => (
                <div key={i} style={{ fontSize: 14, color: theme.t1, lineHeight: 1.7, marginBottom: 4, paddingLeft: 10, borderLeft: '2px solid ' + theme.accentLight }}>
                  {item}
                </div>
              ))}
            </div>
          )}
          {w.selfSeen && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, color: theme.t3, marginBottom: 6, letterSpacing: '0.06em' }}>看見的自己</div>
              <div style={{ fontSize: 14, color: theme.t1, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{w.selfSeen}</div>
            </div>
          )}
          {w.selfThanks && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: theme.t3, marginBottom: 6, letterSpacing: '0.06em' }}>感謝自己</div>
              <div style={{ fontSize: 14, color: theme.t1, lineHeight: 1.7, fontStyle: 'italic' }}>「{w.selfThanks}」</div>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: theme.t3, fontSize: 11, marginTop: 12, paddingTop: 12, borderTop: '0.5px solid ' + theme.border }}>
            <Icon name="lock" size={11} color={theme.t3} />
            已封存，不可修改
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 週日見證 Tab
// ============================================================================

function SundayWitnessTab({ theme, isMobile, sundayWitnesses, onSave }) {
  const today = todayStr();
  const monday = getWeekMonday(today);
  const weekNum = getWeekNumber(today);
  const diffFromMonday = daysDiff(monday, today);
  const canWrite = diffFromMonday <= 7;
  const isLate = diffFromMonday > 0;
  const thisWeekWitness = sundayWitnesses.find(w => w.weekNumber === weekNum);
  const [showFlow, setShowFlow] = useState(false);
  const [witnessShowCount, setWitnessShowCount] = useState(10);

  const past = sundayWitnesses
    .filter(w => w.weekNumber !== weekNum)
    .sort((a, b) => b.weekNumber.localeCompare(a.weekNumber));
  const visiblePastWitness = past.slice(0, witnessShowCount);

  const handleSave = (data) => {
    onSave({
      id: thisWeekWitness?.id || genId(),
      weekNumber: weekNum,
      weekStartDate: monday,
      ...data,
      isLateEntry: isLate,
      createdAt: thisWeekWitness?.createdAt || Date.now(),
      sealedAt: Date.now(),
    });
    setShowFlow(false);
  };

  if (showFlow) return (
    <SundayWitnessFlow theme={theme} isMobile={isMobile}
      witness={thisWeekWitness} onSave={handleSave} onCancel={() => setShowFlow(false)} />
  );

  return (
    <div>
      {/* 本週狀態 */}
      <div style={{ marginBottom: 24 }}>
        {thisWeekWitness ? (
          <WitnessExpandCard w={thisWeekWitness} theme={theme} isCurrentWeek />
        ) : canWrite ? (
          <div style={{ ...cardStyle(theme), textAlign: 'center', padding: '1.5rem' }}>
            {isLate && (
              <div style={{ fontSize: 12, color: theme.coral, marginBottom: 8, fontStyle: 'italic' }}>
                現在補寫本週見證（7 天內有效）
              </div>
            )}
            <p style={{ fontSize: 14, color: theme.t2, fontStyle: 'italic', marginBottom: 20, lineHeight: 1.7 }}>
              {new Date().getDay() === 0 ? '今天是週日。這是你給自己的時間。' : '一週快結束了。準備好見證自己了嗎？'}
            </p>
            <button onClick={() => setShowFlow(true)} style={btnPrimary(theme)}>
              {isLate ? '補寫本週見證' : '開始本週見證'}
            </button>
          </div>
        ) : (
          <div style={{ ...cardStyle(theme), textAlign: 'center', padding: '1.5rem', color: theme.t3 }}>
            <p style={{ fontSize: 14, fontStyle: 'italic', margin: 0 }}>超過 7 天，本週見證已無法補寫。</p>
          </div>
        )}
      </div>

      {/* 過往見證時光軸 */}
      {past.length > 0 && (
        <div>
          <div style={{ fontSize: 13, color: theme.t3, marginBottom: 16 }}>—— 過往見證 ——</div>
          {visiblePastWitness.map((w, idx) => (
            <TimelineItem key={w.id} date={w.weekNumber} theme={theme} badge={w.isLateEntry ? '補寫' : null}>
              <WitnessExpandCard w={w} theme={theme} isCurrentWeek={false} defaultOpen={idx < 3} />
            </TimelineItem>
          ))}
          {past.length > witnessShowCount && (
            <div style={{ textAlign: 'center', paddingTop: 8 }}>
              <button onClick={() => setWitnessShowCount(c => c + 10)} style={{ ...btnSecondary(theme), fontSize: 13, padding: '8px 20px' }}>
                載入更多（還有 {past.length - witnessShowCount} 筆）
              </button>
            </div>
          )}
        </div>
      )}

      {past.length === 0 && !thisWeekWitness && (
        <div style={{ textAlign: 'center', padding: '32px 0', color: theme.t3, fontSize: 13, fontStyle: 'italic' }}>
          週日見證是你給自己最長期的禮物。
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 月度獨處 — 過往單筆（密度流 row，含編輯/刪除）
// ============================================================================

function SoloRow({ s, theme, isTouch, qualityOptions, onSave, onDelete }) {
  const [hov, setHov] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editPlanned, setEditPlanned] = useState(s.plannedDate || '');
  const [editActivity, setEditActivity] = useState(s.plannedActivity || '');
  const [editActual, setEditActual] = useState(s.actualDate || '');
  const [editActualAct, setEditActualAct] = useState(s.actualActivity || '');
  const [editReflection, setEditReflection] = useState(s.reflection || '');
  const [editQuality, setEditQuality] = useState(s.quality || '');
  const showActions = isTouch || hov;

  const handleSaveEdit = () => {
    onSave({ ...s, plannedDate: editPlanned, plannedActivity: editActivity.trim(), actualDate: editActual, actualActivity: editActualAct.trim(), reflection: editReflection.trim(), quality: editQuality });
    setEditing(false);
  };

  const dateLabel = s.plannedDate ? formatDateShort(s.plannedDate) : '？';

  if (editing) return (
    <div style={{ padding: '12px 14px', borderBottom: '0.5px solid ' + theme.border }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: theme.t3, marginBottom: 4 }}>計畫日期</div>
            <input type="date" value={editPlanned} onChange={e => setEditPlanned(e.target.value)} style={{ ...inputStyle(theme), fontSize: 14 }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: theme.t3, marginBottom: 4 }}>實際日期</div>
            <input type="date" value={editActual} onChange={e => setEditActual(e.target.value)} style={{ ...inputStyle(theme), fontSize: 14 }} />
          </div>
        </div>
        <AutoTextarea value={editActivity} onChange={e => setEditActivity(e.target.value)}
          placeholder="計畫做什麼…" style={{ ...inputStyle(theme), fontSize: 14 }} minRows={2} />
        <AutoTextarea value={editReflection} onChange={e => setEditReflection(e.target.value)}
          placeholder="反思…" style={{ ...inputStyle(theme), fontSize: 14 }} minRows={2} />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {qualityOptions.map(q => (
            <button key={q.id} onClick={() => setEditQuality(q.id)} style={{
              padding: '5px 12px', borderRadius: 20, cursor: 'pointer', fontSize: 12,
              background: editQuality === q.id ? theme.accentLight : theme.bgDeep,
              border: editQuality === q.id ? '1.5px solid ' + theme.accent : '0.5px solid ' + theme.border,
              color: editQuality === q.id ? theme.accent : theme.t2,
              fontFamily: "'Noto Serif TC', serif",
            }}>{q.label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={() => setEditing(false)} style={btnSecondary(theme)}>取消</button>
          <button onClick={handleSaveEdit} style={btnPrimary(theme)}>儲存</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '12px 14px', borderBottom: '0.5px solid ' + theme.border }}
      onMouseEnter={() => { if (!isTouch) setHov(true); }}
      onMouseLeave={() => { if (!isTouch) { setHov(false); setConfirmDelete(false); } }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {s.plannedDate && (
            <div style={{ fontSize: 11, color: theme.t3, marginBottom: 6 }}>{formatDate(s.plannedDate)}</div>
          )}
          {s.plannedActivity && (
            <div style={{ marginBottom: s.reflection ? 8 : 0 }}>
              <div style={{ fontSize: 11, color: theme.t3, marginBottom: 3 }}>計畫</div>
              <div style={{ fontSize: 14, color: theme.t1, lineHeight: 1.6 }}>{s.plannedActivity}</div>
            </div>
          )}
          {s.reflection && (
            <div style={{ marginBottom: s.quality ? 6 : 0 }}>
              <div style={{ fontSize: 11, color: theme.t3, marginBottom: 3 }}>反思</div>
              <div style={{ fontSize: 14, color: theme.t1, lineHeight: 1.6 }}>{s.reflection}</div>
            </div>
          )}
          {s.quality && (
            <span style={{ fontSize: 11, color: theme.accent, background: theme.accentLight, padding: '1px 8px', borderRadius: 10, display: 'inline-block', marginTop: 2 }}>
              {qualityOptions.find(q => q.id === s.quality)?.label || s.quality}
            </span>
          )}
          {confirmDelete && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button onClick={() => setConfirmDelete(false)} style={btnSecondary(theme)}>取消</button>
              <button onClick={() => onDelete(s.id)} style={{
                background: theme.coral, color: '#FFF', border: 'none', borderRadius: 20,
                padding: '7px 18px', fontSize: 13, cursor: 'pointer', fontFamily: "'Noto Serif TC', serif",
              }}>刪除</button>
            </div>
          )}
        </div>
        {showActions && !confirmDelete && (
          <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
            <button onClick={() => { setEditing(true); setEditPlanned(s.plannedDate||''); setEditActivity(s.plannedActivity||''); setEditActual(s.actualDate||''); setEditActualAct(s.actualActivity||''); setEditReflection(s.reflection||''); setEditQuality(s.quality||''); }} style={{
              background: 'transparent', border: 'none', cursor: 'pointer', color: theme.t3, padding: 6,
              borderRadius: 6, minWidth: 32, minHeight: 32, display: 'flex', alignItems: 'center',
            }}><Icon name="edit" size={13} /></button>
            <button onClick={() => setConfirmDelete(true)} style={{
              background: 'transparent', border: 'none', cursor: 'pointer', color: theme.t3, padding: 6,
              borderRadius: 6, minWidth: 32, minHeight: 32, display: 'flex', alignItems: 'center',
            }}><Icon name="trash" size={13} /></button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 月度獨處 Tab
// ============================================================================

function MonthlySoloTab({ theme, isMobile, monthlySolos, onSave, onDelete }) {
  const isTouch = useRef(typeof window !== 'undefined' && window.matchMedia('(pointer:coarse)').matches).current;
  const today = todayStr();
  const thisMonth = today.slice(0, 7);
  const thisSolo = monthlySolos.find(s => s.createdAt && new Date(s.createdAt).toISOString().slice(0, 7) === thisMonth)
    || monthlySolos.find(s => s.plannedDate && s.plannedDate.startsWith(thisMonth));
  const [mode, setMode] = useState(null); // 'plan' | 'reflect' | null
  const [planned, setPlanned] = useState(thisSolo?.plannedDate || '');
  const [activity, setActivity] = useState(thisSolo?.plannedActivity || '');
  const [actual, setActual] = useState(thisSolo?.actualDate || '');
  const [actualAct, setActualAct] = useState(thisSolo?.actualActivity || '');
  const [reflection, setReflection] = useState(thisSolo?.reflection || '');
  const [quality, setQuality] = useState(thisSolo?.quality || '');

  const qualityOptions = [
    { id: 'nourishing', label: '滋養' },
    { id: 'steady', label: '穩定' },
    { id: 'challenging', label: '挑戰' },
    { id: 'misaligned', label: '不對盤' },
  ];

  const handleSavePlan = () => {
    onSave({
      id: thisSolo?.id || genId(),
      plannedDate: planned,
      plannedActivity: activity.trim(),
      actualDate: thisSolo?.actualDate || null,
      actualActivity: thisSolo?.actualActivity || '',
      reflection: thisSolo?.reflection || '',
      quality: thisSolo?.quality || '',
      giftToNextMonth: thisSolo?.giftToNextMonth || '',
      createdAt: thisSolo?.createdAt || Date.now(),
    });
    setMode(null);
  };

  const handleSaveReflect = () => {
    onSave({
      ...thisSolo,
      actualDate: actual,
      actualActivity: actualAct.trim(),
      reflection: reflection.trim(),
      quality,
    });
    setMode(null);
  };

  const [soloShowCount, setSoloShowCount] = useState(10);

  const past = monthlySolos
    .filter(s => s.id !== thisSolo?.id)
    .sort((a, b) => (b.plannedDate || '').localeCompare(a.plannedDate || ''));
  const visiblePastSolo = past.slice(0, soloShowCount);

  if (mode === 'plan') return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <div style={{ ...cardStyle(theme), padding: '1.5rem' }}>
        <h3 style={{ fontSize: 17, fontWeight: 500, color: theme.t1, marginBottom: 20, fontFamily: "'Noto Serif TC', serif" }}>
          規劃本月獨處日
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, color: theme.t2, marginBottom: 6, display: 'block' }}>計畫日期</label>
            <input type="date" value={planned} onChange={e => setPlanned(e.target.value)} style={inputStyle(theme)} />
          </div>
          <div>
            <label style={{ fontSize: 13, color: theme.t2, marginBottom: 6, display: 'block' }}>計畫做什麼</label>
            <AutoTextarea value={activity} onChange={e => setActivity(e.target.value)}
              placeholder="一個人去走走、讀書、寫字…" style={inputStyle(theme)} minRows={3} />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setMode(null)} style={btnSecondary(theme)}>取消</button>
            <button onClick={handleSavePlan} disabled={!planned || !activity.trim()} style={btnPrimary(theme, !planned || !activity.trim())}>
              儲存計畫
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (mode === 'reflect') return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <div style={{ ...cardStyle(theme), padding: '1.5rem' }}>
        <h3 style={{ fontSize: 17, fontWeight: 500, color: theme.t1, marginBottom: 20, fontFamily: "'Noto Serif TC', serif" }}>
          獨處後的反思
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, color: theme.t2, marginBottom: 6, display: 'block' }}>實際日期</label>
            <input type="date" value={actual} onChange={e => setActual(e.target.value)} style={inputStyle(theme)} />
          </div>
          <div>
            <label style={{ fontSize: 13, color: theme.t2, marginBottom: 6, display: 'block' }}>實際做了什麼</label>
            <AutoTextarea value={actualAct} onChange={e => setActualAct(e.target.value)}
              placeholder="和計畫一樣?或是…" style={inputStyle(theme)} minRows={2} />
          </div>
          <div>
            <label style={{ fontSize: 13, color: theme.t2, marginBottom: 6, display: 'block' }}>反思</label>
            <AutoTextarea value={reflection} onChange={e => setReflection(e.target.value)}
              placeholder="這次獨處給了你什麼…" style={inputStyle(theme)} minRows={3} />
          </div>
          <div>
            <label style={{ fontSize: 13, color: theme.t2, marginBottom: 10, display: 'block' }}>品質感受</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {qualityOptions.map(q => (
                <button key={q.id} onClick={() => setQuality(q.id)} style={{
                  padding: '8px 16px', borderRadius: 20, cursor: 'pointer', fontSize: 13,
                  background: quality === q.id ? theme.accentLight : theme.bgDeep,
                  border: quality === q.id ? '1.5px solid ' + theme.accent : '0.5px solid ' + theme.border,
                  color: quality === q.id ? theme.accent : theme.t2,
                  transition: 'all 150ms',
                }}>{q.label}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setMode(null)} style={btnSecondary(theme)}>取消</button>
            <button onClick={handleSaveReflect} disabled={!actual || !reflection.trim()} style={btnPrimary(theme, !actual || !reflection.trim())}>
              儲存反思
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div style={{ ...cardStyle(theme), marginBottom: 24 }}>
        {thisSolo ? (
          <div>
            <div style={{ fontSize: 12, color: theme.t3, marginBottom: 8 }}>本月獨處日</div>
            {thisSolo.plannedDate && (
              <div style={{ marginBottom: 8 }}>
                <span style={{ fontSize: 13, color: theme.t2 }}>計畫日期:</span>
                <span style={{ fontSize: 13, color: theme.t1, marginLeft: 6 }}>{formatDate(thisSolo.plannedDate)}</span>
              </div>
            )}
            {thisSolo.plannedActivity && (
              <div style={{ fontSize: 14, color: theme.t1, lineHeight: 1.6, marginBottom: 16, fontStyle: 'italic' }}>
                {thisSolo.plannedActivity}
              </div>
            )}
            {thisSolo.reflection ? (
              <div>
                <div style={{ fontSize: 12, color: theme.t3, marginBottom: 6 }}>反思</div>
                <div style={{ fontSize: 14, color: theme.t1, lineHeight: 1.6, marginBottom: 12 }}>{thisSolo.reflection}</div>
                {thisSolo.quality && (
                  <span style={{ fontSize: 12, color: theme.accent, background: theme.accentLight, padding: '3px 10px', borderRadius: 12 }}>
                    {qualityOptions.find(q => q.id === thisSolo.quality)?.label || thisSolo.quality}
                  </span>
                )}
                <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                  <button onClick={() => { setMode('reflect'); setActual(thisSolo.actualDate || ''); setActualAct(thisSolo.actualActivity || ''); setReflection(thisSolo.reflection || ''); setQuality(thisSolo.quality || ''); }} style={{ ...btnSecondary(theme), fontSize: 13, padding: '6px 14px' }}>修改反思</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setMode('reflect')} style={btnSecondary(theme)}>事後反思</button>
                <button onClick={() => { setMode('plan'); setPlanned(thisSolo.plannedDate || ''); setActivity(thisSolo.plannedActivity || ''); }} style={{ ...btnSecondary(theme), fontSize: 13, padding: '8px 14px' }}>修改計畫</button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <p style={{ fontSize: 14, color: theme.t2, fontStyle: 'italic', marginBottom: 20, lineHeight: 1.7 }}>
              還沒有本月的獨處計畫。<br />給自己一個日期吧。
            </p>
            <button onClick={() => setMode('plan')} style={btnPrimary(theme)}>規劃本月獨處日</button>
          </div>
        )}
      </div>

      {past.length > 0 && (
        <div>
          <div style={{ fontSize: 13, color: theme.t3, marginBottom: 12 }}>—— 過往獨處 ——</div>
          <div style={{ background: theme.bgCard, border: '0.5px solid ' + theme.border, borderRadius: 12, overflow: 'hidden' }}>
            {visiblePastSolo.map(s => (
              <SoloRow key={s.id} s={s} theme={theme} isTouch={isTouch} qualityOptions={qualityOptions}
                onSave={onSave} onDelete={onDelete} />
            ))}
          </div>
          {past.length > soloShowCount && (
            <div style={{ textAlign: 'center', paddingTop: 12 }}>
              <button onClick={() => setSoloShowCount(c => c + 10)} style={{ ...btnSecondary(theme), fontSize: 13, padding: '8px 20px' }}>
                載入更多（還有 {past.length - soloShowCount} 筆）
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 日常層頁
// ============================================================================

function DailyPage({ theme, isMobile, initialTab, morningAnchors, sundayWitnesses, monthlySolos, onSaveMorning, onDeleteMorning, onSaveSunday, onSaveMonthly, onDeleteMonthly }) {
  const [tab, setTab] = useState(initialTab || 'morning');
  const tabs = [
    { id: 'morning', label: '晨間錨點' },
    { id: 'witness', label: '週日見證' },
    { id: 'monthly', label: '月度獨處' },
  ];

  const purposeMap = {
    morning: '在一天的喧鬧開始之前，先回到自己這裡。不是為了計畫，而是為了看見此刻的你。',
    witness: '每週給自己 30 分鐘，見證這一週真實活過的樣子。不評分，不比較，只是陪著自己好好看見。',
    monthly: '一個人的時間是充電，不是逃跑。每個月給自己一天，讓自己重新找回自己的重心。',
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: isMobile ? '20px 16px 100px' : '32px 24px 80px' }}>
      <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 500, color: theme.t1, fontFamily: "'Noto Serif TC', serif" }}>日常層</h2>
      <p style={{ margin: '0 0 24px', fontSize: 13, color: theme.t3, fontStyle: 'italic' }}>自我見證的基礎練習</p>
      {/* 等寬底線型 Tab */}
      <div style={{ display: 'flex', borderBottom: '1.5px solid ' + theme.border, marginBottom: 24 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            borderBottom: tab === t.id ? '2px solid ' + theme.accent : '2px solid transparent',
            padding: '11px 8px',
            fontSize: 14, color: tab === t.id ? theme.accent : theme.t3,
            cursor: 'pointer', transition: 'all 150ms',
            fontFamily: "'Noto Serif TC', serif",
            marginBottom: -1.5,
            fontWeight: tab === t.id ? 500 : 400,
            textAlign: 'center',
          }}>{t.label}</button>
        ))}
      </div>

      {/* 目的引言 */}
      <p style={{ margin: '0 0 24px', fontSize: 13, color: theme.t2, fontStyle: 'italic', lineHeight: 1.7, paddingLeft: 12, borderLeft: '2px solid ' + theme.accentLight }}>
        {purposeMap[tab]}
      </p>

      {tab === 'morning' && <MorningAnchorTab theme={theme} isMobile={isMobile} morningAnchors={morningAnchors} onSave={onSaveMorning} onDelete={onDeleteMorning} />}
      {tab === 'witness' && <SundayWitnessTab theme={theme} isMobile={isMobile} sundayWitnesses={sundayWitnesses} onSave={onSaveSunday} />}
      {tab === 'monthly' && <MonthlySoloTab theme={theme} isMobile={isMobile} monthlySolos={monthlySolos} onSave={onSaveMonthly} onDelete={onDeleteMonthly} />}
    </div>
  );
}

// ============================================================================
// 儀式菜單頁
// ============================================================================

const RITUAL_TYPES = [
  {
    id: 'thursday-jupiter',
    title: '週四 Jupiter · 擴張',
    why: '你值得被自己真正了解。週四是給智識的禮物——讓自己的視野比上週再寬一點點。',
    desc: '學一個新東西、讀一本深度的書、和比自己有智慧的朋友對話',
    steps: [
      '選一個你一直想深入，但總是「等有空再說」的主題',
      '給自己至少 30 分鐘不被打擾的時間，全心投入',
      '結束後，花幾分鐘寫下：你學到什麼，或有什麼讓你驚喜的地方',
    ],
  },
  {
    id: 'friday-venus',
    title: '週五 Venus · 寵愛自己',
    why: '享樂不需要理由。週五是給自己的獎勵——不是因為你做了什麼，而是因為你就是你。',
    desc: '做讓你感到美麗的事、穿你最喜歡的衣服、用好的東西，不要留著等特別的日子',
    steps: [
      '選一件純粹讓你快樂的事，不要問它有沒有「生產力」',
      '用你那件捨不得用的東西——好的茶葉、精油、那條特別的裙子',
      '好好享受自己的公司。你是一個很好的陪伴。',
    ],
  },
  {
    id: 'morning-body',
    title: '晨間身體儀式',
    why: '身體是你最忠實的朋友。它每天承載你，但我們很少對它說謝謝。這個儀式是為了讓你重新感覺到自己是有身體的。',
    desc: '在一天開始前給身體幾分鐘，感謝它今天還在',
    steps: [
      '從腳底開始，慢慢感覺每一個部位，往上到頭頂——不評判，只是感覺',
      '對自己做幾次深呼吸。吸的時候感覺胸口打開，吐的時候放下一點昨天的重量',
      '在心裡，或出聲說：謝謝你今天還在。',
    ],
  },
  {
    id: 'daily-gratitude',
    title: '每日感恩',
    why: '我們的大腦很擅長記住傷，但需要練習才能留住美。每天找一個值得感謝的瞬間，是在訓練自己看見光的能力。',
    desc: '睡前找到今天至少一件值得感謝的事，不管今天多難熬',
    steps: [
      '閉上眼睛，回想今天——不用刻意找，讓記憶自己浮上來',
      '找到一個讓你心裡稍微暖了一下的時刻，可以很小：一杯好喝的咖啡、有人對你點頭微笑',
      '在心裡對那個時刻說謝謝，然後帶著它入睡',
    ],
  },
  {
    id: 'custom',
    title: '自訂儀式',
    why: '最好的儀式，是你自己發明的那個。因為它只屬於你，它才有力量。',
    desc: '任何讓你感到「這是屬於我的」的習慣，都值得被記下來',
    steps: ['用你自己的方式做，用你自己的節奏'],
  },
];

function RitualCard({ ritual, theme, onRecord }) {
  const [expanded, setExpanded] = useState(false);
  const [recording, setRecording] = useState(false);
  const [reflection, setReflection] = useState('');
  const [customTitle, setCustomTitle] = useState('');

  const handleSave = () => {
    onRecord({
      ritualType: ritual.id,
      customTitle: ritual.id === 'custom' ? customTitle.trim() : undefined,
      reflection: reflection.trim(),
    });
    setRecording(false);
    setReflection('');
    setCustomTitle('');
  };

  return (
    <div style={{ ...cardStyle(theme), marginBottom: 16 }}>
      {/* 整個標題區可點擊展開/收合 */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, cursor: 'pointer' }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 500, color: theme.t1, fontFamily: "'Noto Serif TC', serif", flex: 1 }}>
          {ritual.title}
        </h3>
        <Icon name={expanded ? 'chevronDown' : 'chevronRight'} size={16} color={theme.t3} style={{ flexShrink: 0, marginTop: 2 }} />
      </div>
      {/* 為什麼做這個 */}
      <p style={{ margin: '0 0 10px', fontSize: 13, color: theme.t3, lineHeight: 1.6, fontStyle: 'italic' }}>
        {ritual.why}
      </p>
      <p style={{ margin: '0 0 0', fontSize: 14, color: theme.t2, lineHeight: 1.6 }}>
        {ritual.desc}
      </p>
      {expanded && (
        <div style={{ marginTop: 16, marginBottom: 0, padding: '12px 16px', background: theme.bgDeep, borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: theme.t3, marginBottom: 8, letterSpacing: '0.04em' }}>怎麼做</div>
          {ritual.steps.map((s, i) => (
            <div key={i} style={{ fontSize: 13, color: theme.t2, marginBottom: 8, lineHeight: 1.6, display: 'flex', gap: 8 }}>
              <span style={{ color: theme.accent, flexShrink: 0, fontWeight: 500 }}>{i + 1}.</span>
              <span>{s}</span>
            </div>
          ))}
        </div>
      )}
      {recording ? (
        <div style={{ marginTop: 16 }}>
          {ritual.id === 'custom' && (
            <div style={{ marginBottom: 12 }}>
              <input type="text" value={customTitle} onChange={e => setCustomTitle(e.target.value)}
                placeholder="這個儀式的名字" style={inputStyle(theme)} />
            </div>
          )}
          <AutoTextarea value={reflection} onChange={e => setReflection(e.target.value)}
            placeholder="做了之後,心裡有什麼…" style={inputStyle(theme)} minRows={3} />
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
            <button onClick={() => setRecording(false)} style={btnSecondary(theme)}>取消</button>
            <button onClick={handleSave} disabled={!reflection.trim() || (ritual.id === 'custom' && !customTitle.trim())}
              style={btnPrimary(theme, !reflection.trim() || (ritual.id === 'custom' && !customTitle.trim()))}>
              記錄感想
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <button onClick={(e) => { e.stopPropagation(); setRecording(true); }} style={btnSecondary(theme)}>
            做了來記錄
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 儀式菜單 — 過往紀錄單筆 row（含編輯/刪除）
// ============================================================================

function RitualEntryRow({ entry, theme, isTouch, onEdit, onDelete }) {
  const [hov, setHov] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editReflection, setEditReflection] = useState(entry.reflection || '');
  const [editCustomTitle, setEditCustomTitle] = useState(entry.customTitle || '');
  const showActions = isTouch || hov;

  const handleSaveEdit = () => {
    if (!editReflection.trim()) return;
    onEdit({ ...entry, reflection: editReflection.trim(), customTitle: entry.ritualType === 'custom' ? editCustomTitle.trim() : entry.customTitle });
    setEditing(false);
  };

  if (editing) return (
    <div style={{ padding: '12px 14px', borderBottom: '0.5px solid ' + theme.border }}>
      {entry.ritualType === 'custom' && (
        <input type="text" value={editCustomTitle} onChange={e => setEditCustomTitle(e.target.value)}
          placeholder="儀式名稱" style={{ ...inputStyle(theme), fontSize: 14, marginBottom: 8 }} />
      )}
      <AutoTextarea value={editReflection} onChange={e => setEditReflection(e.target.value)}
        placeholder="感想…" style={{ ...inputStyle(theme), fontSize: 14 }} minRows={2} />
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 10 }}>
        <button onClick={() => setEditing(false)} style={btnSecondary(theme)}>取消</button>
        <button onClick={handleSaveEdit} disabled={!editReflection.trim()} style={btnPrimary(theme, !editReflection.trim())}>儲存</button>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '11px 14px', borderBottom: '0.5px solid ' + theme.border }}
      onMouseEnter={() => { if (!isTouch) setHov(true); }}
      onMouseLeave={() => { if (!isTouch) { setHov(false); setConfirmDelete(false); } }}>
      <div style={{ fontSize: 11, color: theme.t3, flexShrink: 0, width: 40, paddingTop: 2, lineHeight: 1.4 }}>
        {formatDateShort(entry.date)}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {entry.ritualType === 'custom' && entry.customTitle && (
          <div style={{ fontSize: 12, color: theme.accent, marginBottom: 2, fontWeight: 500 }}>{entry.customTitle}</div>
        )}
        <div style={{ fontSize: 14, color: theme.t1, lineHeight: 1.6 }}>{entry.reflection}</div>
        {confirmDelete && (
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button onClick={() => setConfirmDelete(false)} style={btnSecondary(theme)}>取消</button>
            <button onClick={() => onDelete(entry.id)} style={{
              background: theme.coral, color: '#FFF', border: 'none', borderRadius: 20,
              padding: '7px 18px', fontSize: 13, cursor: 'pointer', fontFamily: "'Noto Serif TC', serif",
            }}>刪除</button>
          </div>
        )}
      </div>
      {showActions && !confirmDelete && (
        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
          <button onClick={() => { setEditing(true); setEditReflection(entry.reflection || ''); setEditCustomTitle(entry.customTitle || ''); }} style={{
            background: 'transparent', border: 'none', cursor: 'pointer', color: theme.t3, padding: 6,
            borderRadius: 6, minWidth: 32, minHeight: 32, display: 'flex', alignItems: 'center',
          }}><Icon name="edit" size={13} /></button>
          <button onClick={() => setConfirmDelete(true)} style={{
            background: 'transparent', border: 'none', cursor: 'pointer', color: theme.t3, padding: 6,
            borderRadius: 6, minWidth: 32, minHeight: 32, display: 'flex', alignItems: 'center',
          }}><Icon name="trash" size={13} /></button>
        </div>
      )}
    </div>
  );
}

function RitualGroup({ group, theme, isTouch, onEdit, onDelete }) {
  const sorted = [...group.entries].sort((a, b) => b.createdAt - a.createdAt);
  const latestYM = sorted.length > 0 ? (sorted[0].date || '').slice(0, 7) : '';
  const [selectedYM, setSelectedYM] = useState(latestYM);
  const filtered = selectedYM ? sorted.filter(e => (e.date || '').startsWith(selectedYM)) : sorted;

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ fontSize: 13, color: theme.t2, fontWeight: 500, marginBottom: 12, fontFamily: "'Noto Serif TC', serif" }}>
        {group.label}
        <span style={{ fontSize: 11, color: theme.t3, fontWeight: 400, marginLeft: 6 }}>{group.entries.length} 筆</span>
      </div>
      <MonthCalendarPicker
        entries={sorted}
        selectedYM={selectedYM}
        onSelect={setSelectedYM}
        theme={theme}
        label="全部"
        count={filtered.length}
      />
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '16px 0', color: theme.t3, fontSize: 13, fontStyle: 'italic' }}>
          這個月沒有這類儀式紀錄。
        </div>
      ) : (
        <div style={{ background: theme.bgCard, border: '0.5px solid ' + theme.border, borderRadius: 12, overflow: 'hidden' }}>
          {filtered.map(entry => (
            <RitualEntryRow key={entry.id} entry={entry} theme={theme} isTouch={isTouch} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

function RitualPage({ theme, isMobile, ritualEntries, onSave, onDelete, onEdit }) {
  const isTouch = useRef(typeof window !== 'undefined' && window.matchMedia('(pointer:coarse)').matches).current;
  const sorted = [...ritualEntries].sort((a, b) => b.createdAt - a.createdAt);

  const getRitualTitle = (entry) => {
    if (entry.ritualType === 'custom') return entry.customTitle || '自訂儀式';
    return RITUAL_TYPES.find(r => r.id === entry.ritualType)?.title || entry.ritualType;
  };

  // grouped by ritualType — 只顯示有紀錄的類型
  const groupOrder = ['thursday-jupiter', 'friday-venus', 'morning-body', 'daily-gratitude', 'custom'];
  const groups = groupOrder.map(typeId => ({
    typeId,
    label: typeId === 'custom' ? '自訂儀式' : RITUAL_TYPES.find(r => r.id === typeId)?.title || typeId,
    entries: sorted.filter(e => e.ritualType === typeId),
  })).filter(g => g.entries.length > 0);

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: isMobile ? '20px 16px 100px' : '32px 24px 80px' }}>
      <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 500, color: theme.t1, fontFamily: "'Noto Serif TC', serif" }}>
        儀式菜單
      </h2>
      <p style={{ margin: '0 0 8px', fontSize: 13, color: theme.t3, fontStyle: 'italic' }}>
        想做就做，不做沒關係
      </p>
      <p style={{ margin: '0 0 28px', fontSize: 13, color: theme.t2, fontStyle: 'italic', lineHeight: 1.7, paddingLeft: 12, borderLeft: '2px solid ' + theme.accentLight }}>
        儀式的意義不在於「完成」，而在於你有意識地為自己創造一個空間。哪怕只做了其中一個步驟，哪怕只是翻開這個頁面想了想——也算。
      </p>

      {RITUAL_TYPES.map(ritual => (
        <RitualCard key={ritual.id} ritual={ritual} theme={theme} onRecord={(data) => onSave({ id: genId(), date: todayStr(), ...data, createdAt: Date.now() })} />
      ))}

      {sorted.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <div style={{ fontSize: 13, color: theme.t3, marginBottom: 20 }}>—— 過往儀式紀錄 ——</div>
          {groups.map(group => (
            <RitualGroup key={group.typeId} group={group} theme={theme} isTouch={isTouch}
              onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 小勇敢紀錄頁
// ============================================================================

const COURAGE_CATEGORIES = [
  { id: 'solo', label: '獨自行動' },
  { id: 'social', label: '社交互動' },
  { id: 'voice', label: '說出來' },
  { id: 'expression', label: '表達自己' },
  { id: 'other', label: '其他' },
];

function CourageItem({ entry, theme, onDelete, onEdit, isTouch }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editAction, setEditAction] = useState(entry.action);
  const [editFeeling, setEditFeeling] = useState(entry.feeling || '');
  const [editCategory, setEditCategory] = useState(entry.category);
  const [hov, setHov] = useState(false);
  const showActions = isTouch || hov;

  const handleSaveEdit = () => {
    if (!editAction.trim()) return;
    onEdit({ ...entry, action: editAction.trim(), feeling: editFeeling.trim(), category: editCategory });
    setEditing(false);
  };

  const categoryIcon = (cat) => {
    const map = { solo: 'leaf', social: 'heart', voice: 'feather', expression: 'star', other: 'sun' };
    return map[cat] || 'sun';
  };

  if (editing) return (
    <div style={{ ...cardStyle(theme), padding: '1rem' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <AutoTextarea value={editAction} onChange={e => setEditAction(e.target.value)}
          style={inputStyle(theme)} minRows={2} />
        <AutoTextarea value={editFeeling} onChange={e => setEditFeeling(e.target.value)}
          placeholder="感覺如何…（選填）" style={inputStyle(theme)} minRows={1} />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {COURAGE_CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setEditCategory(c.id)} style={{
              padding: '5px 12px', borderRadius: 20, cursor: 'pointer', fontSize: 12,
              background: editCategory === c.id ? theme.accentLight : theme.bgDeep,
              border: editCategory === c.id ? '1.5px solid ' + theme.accent : '0.5px solid ' + theme.border,
              color: editCategory === c.id ? theme.accent : theme.t2,
              fontFamily: "'Noto Serif TC', serif",
            }}>{c.label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={() => setEditing(false)} style={btnSecondary(theme)}>取消</button>
          <button onClick={handleSaveEdit} disabled={!editAction.trim()} style={btnPrimary(theme, !editAction.trim())}>儲存</button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ ...cardStyle(theme), padding: '1rem' }}
      onMouseEnter={() => { if (!isTouch) setHov(true); }}
      onMouseLeave={() => { if (!isTouch) { setHov(false); setConfirmDelete(false); } }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Icon name={categoryIcon(entry.category)} size={14} color={theme.accent} />
            <span style={{ fontSize: 12, color: theme.accent }}>
              {COURAGE_CATEGORIES.find(c => c.id === entry.category)?.label || entry.category}
            </span>
          </div>
          <div style={{ fontSize: 14, color: theme.t1, lineHeight: 1.6, marginBottom: entry.feeling ? 8 : 0 }}>
            {entry.action}
          </div>
          {entry.feeling && (
            <div style={{ fontSize: 13, color: theme.t2, lineHeight: 1.5, fontStyle: 'italic' }}>{entry.feeling}</div>
          )}
        </div>
        {/* 右側操作按鈕 */}
        {showActions && !confirmDelete && (
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            <button onClick={() => setEditing(true)} style={{
              background: 'transparent', border: 'none', cursor: 'pointer', color: theme.t3, padding: 6,
              borderRadius: 6, minWidth: 32, minHeight: 32, display: 'flex', alignItems: 'center',
            }}><Icon name="edit" size={14} /></button>
            <button onClick={() => setConfirmDelete(true)} style={{
              background: 'transparent', border: 'none', cursor: 'pointer', color: theme.t3, padding: 6,
              borderRadius: 6, minWidth: 32, minHeight: 32, display: 'flex', alignItems: 'center',
            }}><Icon name="trash" size={14} /></button>
          </div>
        )}
      </div>
      {confirmDelete && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
          <button onClick={() => setConfirmDelete(false)} style={btnSecondary(theme)}>取消</button>
          <button onClick={() => onDelete(entry.id)} style={{
            background: theme.coral, color: '#FFF', border: 'none', borderRadius: 20,
            padding: '8px 20px', fontSize: 13, cursor: 'pointer', fontFamily: "'Noto Serif TC', serif",
          }}>刪除</button>
        </div>
      )}
    </div>
  );
}

function CouragePage({ theme, isMobile, smallCourages, onSave, onDelete, onEdit }) {
  const isTouch = useRef(typeof window !== 'undefined' && window.matchMedia('(pointer:coarse)').matches).current;
  const [adding, setAdding] = useState(false);
  const [action, setAction] = useState('');
  const [feeling, setFeeling] = useState('');
  const [category, setCategory] = useState('solo');

  const handleSave = () => {
    if (!action.trim()) return;
    onSave({ id: genId(), date: todayStr(), action: action.trim(), feeling: feeling.trim(), category, createdAt: Date.now() });
    setAdding(false);
    setAction(''); setFeeling(''); setCategory('solo');
  };

  const sorted = [...smallCourages].sort((a, b) => b.createdAt - a.createdAt);
  const [courageShowCount, setCourageShowCount] = useState(10);
  const [filterCats, setFilterCats] = useState([]); // 空陣列=全部
  const [filterYM, setFilterYM] = useState(''); // 年月篩選，空=全部

  const toggleFilter = (id) => {
    setFilterCats(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    setCourageShowCount(10);
  };

  const filtered = sorted
    .filter(e => filterCats.length === 0 || filterCats.includes(e.category))
    .filter(e => !filterYM || (e.date || '').startsWith(filterYM));
  const visibleCourages = filtered.slice(0, courageShowCount);

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: isMobile ? '20px 16px 100px' : '32px 24px 80px' }}>
      <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 500, color: theme.t1, fontFamily: "'Noto Serif TC', serif" }}>
        小勇敢紀錄
      </h2>
      <p style={{ margin: '0 0 20px', fontSize: 13, color: theme.t2, fontStyle: 'italic', lineHeight: 1.7, paddingLeft: 12, borderLeft: '2px solid ' + theme.accentLight }}>
        練習拓展自己的舒適圈邊界，累積之後看見自己真的在長大。不是要你每天都勇敢，而是讓你知道：你做到過。
      </p>

      {!adding ? (
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <button onClick={() => setAdding(true)} style={{ ...btnPrimary(theme), fontSize: 15, padding: '12px 32px' }}>
            記一個小勇敢
          </button>
        </div>
      ) : (
        <div style={{ ...cardStyle(theme), marginBottom: 32 }}>
          <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 500, color: theme.t1, fontFamily: "'Noto Serif TC', serif" }}>
            今天的小勇敢
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, color: theme.t2, marginBottom: 6, display: 'block' }}>做了什麼</label>
              <AutoTextarea value={action} onChange={e => setAction(e.target.value)}
                placeholder="一件對你來說需要一點勇氣的事…" style={inputStyle(theme)} minRows={2} />
            </div>
            <div>
              <label style={{ fontSize: 13, color: theme.t2, marginBottom: 6, display: 'block' }}>感覺如何</label>
              <AutoTextarea value={feeling} onChange={e => setFeeling(e.target.value)}
                placeholder="做完之後，身體和心裡有什麼…" style={inputStyle(theme)} minRows={2} />
            </div>
            <div>
              <label style={{ fontSize: 13, color: theme.t2, marginBottom: 10, display: 'block' }}>分類</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {COURAGE_CATEGORIES.map(c => (
                  <button key={c.id} onClick={() => setCategory(c.id)} style={{
                    padding: '7px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 13,
                    background: category === c.id ? theme.accentLight : theme.bgDeep,
                    border: category === c.id ? '1.5px solid ' + theme.accent : '0.5px solid ' + theme.border,
                    color: category === c.id ? theme.accent : theme.t2, transition: 'all 150ms',
                    fontFamily: "'Noto Serif TC', serif",
                  }}>{c.label}</button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => { setAdding(false); setAction(''); setFeeling(''); setCategory('solo'); }} style={btnSecondary(theme)}>取消</button>
              <button onClick={handleSave} disabled={!action.trim()} style={btnPrimary(theme, !action.trim())}>儲存</button>
            </div>
          </div>
        </div>
      )}

      {sorted.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '32px 0', color: theme.t3, fontSize: 13, fontStyle: 'italic' }}>
          小勇敢不需要很大。一件讓你心跳加速一點的事，就算了。
        </div>
      ) : (
        <div>
          {/* 分類篩選 */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: theme.t3 }}>分類：</span>
            {COURAGE_CATEGORIES.map(c => {
              const active = filterCats.includes(c.id);
              return (
                <button key={c.id} onClick={() => toggleFilter(c.id)} style={{
                  padding: '5px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 12,
                  background: active ? theme.accentLight : 'transparent',
                  border: active ? '1.5px solid ' + theme.accent : '0.5px solid ' + theme.border,
                  color: active ? theme.accent : theme.t3,
                  transition: 'all 150ms', fontFamily: "'Noto Serif TC', serif",
                }}>{c.label}</button>
              );
            })}
            {filterCats.length > 0 && (
              <button onClick={() => setFilterCats([])} style={{
                padding: '5px 10px', borderRadius: 20, cursor: 'pointer', fontSize: 11,
                background: 'transparent', border: 'none', color: theme.t3,
                fontFamily: "'Noto Serif TC', serif",
              }}>清除</button>
            )}
          </div>
          {/* 年月 Picker */}
          {sorted.length > 0 && (
            <MonthCalendarPicker
              entries={sorted}
              selectedYM={filterYM}
              onSelect={(ym) => { setFilterYM(ym); setCourageShowCount(10); }}
              theme={theme}
              label="全部紀錄"
              count={filtered.length}
            />
          )}
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: theme.t3, fontSize: 13, fontStyle: 'italic' }}>
              這個分類還沒有紀錄。
            </div>
          ) : (
            <>
              {visibleCourages.map(entry => (
                <TimelineItem key={entry.id} date={formatDate(entry.date)} theme={theme}>
                  <CourageItem entry={entry} theme={theme} isTouch={isTouch}
                    onDelete={onDelete} onEdit={onEdit} />
                </TimelineItem>
              ))}
              {filtered.length > courageShowCount && (
                <div style={{ textAlign: 'center', paddingTop: 8 }}>
                  <button onClick={() => setCourageShowCount(c => c + 10)} style={{ ...btnSecondary(theme), fontSize: 13, padding: '8px 20px' }}>
                    載入更多（還有 {filtered.length - courageShowCount} 筆）
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 關係支援頁 — 地面朋友 tab
// ============================================================================

function GroundFriendTab({ theme, isMobile, groundFriends, groundFriendCheckIns, relationships, onSaveFriend, onDeleteFriend, onSaveCheckIn }) {
  const font = "'Noto Serif TC', serif";
  const activeRels = relationships.filter(r => r.currentStage !== 'ended');
  const [adding, setAdding] = useState(false);
  const [editingFriendId, setEditingFriendId] = useState(null);
  const [checkingInFriendId, setCheckingInFriendId] = useState(null);

  const FriendForm = ({ friend, onSave, onCancel }) => {
    const [codename, setCodename] = useState(friend?.codename || '');
    const [role, setRole] = useState(friend?.role || '');
    const [primaryRelId, setPrimaryRelId] = useState(friend?.isPrimaryForRelationshipId || '');
    const iStyle = inputStyle(theme);
    return (
      <div style={{ ...cardStyle(theme), marginBottom: 12 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: theme.t3, marginBottom: 6, fontFamily: font }}>代號（不用真名）</div>
            <input value={codename} onChange={e => setCodename(e.target.value)} placeholder="例：月亮、K、小貓" style={{ ...iStyle, width: '100%' }} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: theme.t3, marginBottom: 6, fontFamily: font }}>他／她對你的意義</div>
            <AutoTextarea value={role} onChange={e => setRole(e.target.value)} placeholder="例：讓我記得自己是誰的人" style={{ ...iStyle, width: '100%' }} minRows={2} />
          </div>
          {activeRels.length > 0 && (
            <div>
              <div style={{ fontSize: 12, color: theme.t3, marginBottom: 6, fontFamily: font }}>指派為哪段關係的地面朋友（選填）</div>
              <select value={primaryRelId} onChange={e => setPrimaryRelId(e.target.value)} style={{ ...iStyle, width: '100%' }}>
                <option value="">無指派</option>
                {activeRels.map(r => <option key={r.id} value={r.id}>{r.codename}</option>)}
              </select>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={onCancel} style={btnSecondary(theme)}>取消</button>
            <button onClick={() => {
              if (!codename.trim()) return;
              onSave({ id: friend?.id || genId(), codename: codename.trim(), role: role.trim(), lastContactDate: friend?.lastContactDate || null, isPrimaryForRelationshipId: primaryRelId || null });
              onCancel();
            }} style={btnPrimary(theme, !codename.trim())} disabled={!codename.trim()}>儲存</button>
          </div>
        </div>
      </div>
    );
  };

  const CheckInForm = ({ friendId, onSave, onCancel }) => {
    const [date, setDate] = useState(todayStr());
    const [q1, setQ1] = useState('');
    const [q2, setQ2] = useState('');
    const [q3, setQ3] = useState('same');
    const [notes, setNotes] = useState('');
    const [relId, setRelId] = useState('');
    const iStyle = inputStyle(theme);
    return (
      <div style={{ ...cardStyle(theme), marginBottom: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: theme.t1, marginBottom: 16, fontFamily: font }}>記錄新對話</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div style={{ fontSize: 12, color: theme.t3, marginBottom: 6 }}>日期</div>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...iStyle, width: '100%' }} />
          </div>
          {activeRels.length > 0 && (
            <div>
              <div style={{ fontSize: 12, color: theme.t3, marginBottom: 6 }}>關於哪段關係（選填）</div>
              <select value={relId} onChange={e => setRelId(e.target.value)} style={{ ...iStyle, width: '100%' }}>
                <option value="">一般聊聊</option>
                {activeRels.map(r => <option key={r.id} value={r.id}>{r.codename}</option>)}
              </select>
            </div>
          )}
          <div>
            <div style={{ fontSize: 12, color: theme.t3, marginBottom: 6, fontStyle: 'italic' }}>你最近有沒有為他忽略自己什麼？</div>
            <AutoTextarea value={q1} onChange={e => setQ1(e.target.value)} placeholder="具體說說看…" style={{ ...iStyle, width: '100%' }} minRows={2} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: theme.t3, marginBottom: 6, fontStyle: 'italic' }}>你覺得這段關係讓你變成什麼樣子？</div>
            <AutoTextarea value={q2} onChange={e => setQ2(e.target.value)} placeholder="更靠近自己，還是更遠？" style={{ ...iStyle, width: '100%' }} minRows={2} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: theme.t3, marginBottom: 6, fontStyle: 'italic' }}>你現在有比開始時更像自己，還是更不像？</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {[{ v: 'more', label: '更像自己' }, { v: 'same', label: '差不多' }, { v: 'less', label: '更不像自己' }].map(opt => (
                <button key={opt.v} onClick={() => setQ3(opt.v)} style={{
                  flex: 1, padding: '8px 4px', borderRadius: 8, border: '0.5px solid ' + (q3 === opt.v ? theme.accent : theme.border),
                  background: q3 === opt.v ? theme.accentLight : 'transparent', color: q3 === opt.v ? theme.accent : theme.t2,
                  cursor: 'pointer', fontSize: 13, fontFamily: font, transition: 'all 150ms',
                }}>{opt.label}</button>
              ))}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12, color: theme.t3, marginBottom: 6 }}>額外筆記（選填）</div>
            <AutoTextarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="其他想記錄的…" style={{ ...iStyle, width: '100%' }} minRows={2} />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={onCancel} style={btnSecondary(theme)}>取消</button>
            <button onClick={() => {
              onSave({ id: genId(), groundFriendId: friendId, relationshipId: relId || null, date, q1_ignoredSelf: q1.trim(), q2_becoming: q2.trim(), q3_moreOrLessSelf: q3, additionalNotes: notes.trim(), createdAt: Date.now() });
              onCancel();
            }} style={btnPrimary(theme, false)}>儲存</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: isMobile ? '20px 16px 80px' : '28px 24px 80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 500, color: theme.t1, fontFamily: font }}>地面朋友</div>
          <div style={{ fontSize: 12, color: theme.t3, marginTop: 4, fontFamily: font, fontStyle: 'italic' }}>讓你記得自己是誰的人</div>
        </div>
        {!adding && !editingFriendId && groundFriends.length < 3 && (
          <button onClick={() => setAdding(true)} style={{ ...btnPrimary(theme, false), padding: '8px 16px', fontSize: 13 }}>新增朋友</button>
        )}
      </div>

      {adding && <FriendForm friend={null} onSave={onSaveFriend} onCancel={() => setAdding(false)} />}

      {groundFriends.length === 0 && !adding ? (
        <div style={{ textAlign: 'center', padding: '48px 16px', color: theme.t3, fontFamily: font, fontStyle: 'italic' }}>
          還沒有地面朋友。<br />最多可以新增三位。
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {groundFriends.map(friend => {
            const daysSince = friend.lastContactDate ? daysDiff(friend.lastContactDate, todayStr()) : null;
            const primaryRel = activeRels.find(r => r.id === friend.isPrimaryForRelationshipId);
            return (
              <div key={friend.id}>
                {editingFriendId === friend.id && <FriendForm friend={friend} onSave={onSaveFriend} onCancel={() => setEditingFriendId(null)} />}
                {checkingInFriendId === friend.id && <CheckInForm friendId={friend.id} onSave={(ci) => { onSaveCheckIn(ci); setCheckingInFriendId(null); }} onCancel={() => setCheckingInFriendId(null)} />}
                {editingFriendId !== friend.id && checkingInFriendId !== friend.id && (
                  <div style={{ ...cardStyle(theme) }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 16, fontWeight: 500, color: theme.t1, fontFamily: font }}>{friend.codename}</div>
                        {friend.role && <div style={{ fontSize: 13, color: theme.t2, marginTop: 4, fontFamily: font, fontStyle: 'italic' }}>{friend.role}</div>}
                        {primaryRel && <div style={{ fontSize: 11, color: theme.navy, marginTop: 6 }}>指定陪伴：{primaryRel.codename}</div>}
                        <div style={{ fontSize: 12, color: theme.t3, marginTop: 8 }}>
                          {daysSince === null ? '尚未記錄聯繫' : daysSince === 0 ? '今天聯繫過' : `上次聯繫 ${daysSince} 天前`}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setEditingFriendId(friend.id)} style={{ background: 'transparent', border: 'none', color: theme.t3, cursor: 'pointer', padding: 6 }}>
                          <Icon name="edit" size={15} />
                        </button>
                        <button onClick={() => onDeleteFriend(friend.id)} style={{ background: 'transparent', border: 'none', color: theme.t3, cursor: 'pointer', padding: 6 }}>
                          <Icon name="trash" size={15} />
                        </button>
                      </div>
                    </div>
                    <button onClick={() => setCheckingInFriendId(friend.id)} style={{ ...btnPrimary(theme, false), marginTop: 14, width: '100%', fontSize: 13 }}>
                      記錄新對話
                    </button>
                    {groundFriendCheckIns.filter(c => c.groundFriendId === friend.id).slice(0, 3).map(ci => (
                      <div key={ci.id} style={{ marginTop: 12, paddingTop: 12, borderTop: '0.5px solid ' + theme.border }}>
                        <div style={{ fontSize: 11, color: theme.t3, marginBottom: 4 }}>{formatDate(ci.date)}</div>
                        {ci.q1_ignoredSelf && <div style={{ fontSize: 13, color: theme.t2, marginBottom: 4, fontStyle: 'italic' }}>「{ci.q1_ignoredSelf}」</div>}
                        <div style={{ fontSize: 11, color: theme.t3 }}>{ci.q3_moreOrLessSelf === 'more' ? '更像自己' : ci.q3_moreOrLessSelf === 'less' ? '更不像自己' : '差不多'}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 關係支援頁 — 辨識工具箱 tab
// ============================================================================

function IdentificationTab({ theme, isMobile, relationships, identificationAssessments, onSaveAssessment }) {
  const font = "'Noto Serif TC', serif";
  const activeRels = relationships.filter(r => r.currentStage !== 'ended');
  const [view, setView] = useState('menu');
  const [selectedRelId, setSelectedRelId] = useState(activeRels[0]?.id || '');

  const FiveCheckForm = () => {
    const items = [
      { key: 'intellectualParity', label: '智識對等', hint: '對話能讓你有所收穫，不是一人輸出' },
      { key: 'emotionalSafety', label: '情緒安全', hint: '你在他面前是放鬆的，不是刺激的' },
      { key: 'valueAlignment', label: '價值觀契合', hint: '對重要的事有共同的判斷標準' },
      { key: 'rhythmFit', label: '節奏匹配', hint: '生活步調和溝通頻率能配合' },
      { key: 'futureVisibility', label: '未來可見性', hint: '能想像一起往前走的畫面' },
    ];
    const [scores, setScores] = useState({ intellectualParity: 3, emotionalSafety: 3, valueAlignment: 3, rhythmFit: 3, futureVisibility: 3 });
    const [decision, setDecision] = useState('');
    const total = Object.values(scores).reduce((a, b) => a + b, 0);
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={() => setView('menu')} style={{ background: 'transparent', border: 'none', color: theme.t2, cursor: 'pointer', padding: 4 }}>
            <Icon name="back" size={18} />
          </button>
          <div style={{ fontSize: 16, fontWeight: 500, color: theme.t1, fontFamily: font }}>五項核對</div>
        </div>
        {activeRels.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <select value={selectedRelId} onChange={e => setSelectedRelId(e.target.value)} style={{ ...inputStyle(theme), width: '100%' }}>
              {activeRels.map(r => <option key={r.id} value={r.id}>{r.codename}</option>)}
            </select>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
          {items.map(item => (
            <div key={item.key} style={{ ...cardStyle(theme) }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: theme.t1, fontFamily: font, marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: 12, color: theme.t3, fontStyle: 'italic', marginBottom: 12 }}>{item.hint}</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} onClick={() => setScores(s => ({ ...s, [item.key]: n }))} style={{
                    flex: 1, padding: '10px 4px', borderRadius: 8,
                    border: '0.5px solid ' + (scores[item.key] === n ? theme.accent : theme.border),
                    background: scores[item.key] === n ? theme.accentLight : 'transparent',
                    color: scores[item.key] === n ? theme.accent : theme.t3,
                    cursor: 'pointer', fontSize: 14, fontWeight: scores[item.key] === n ? 500 : 400, transition: 'all 150ms',
                  }}>{n}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ ...cardStyle(theme), marginBottom: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 13, color: theme.t3, fontFamily: font }}>總分</div>
          <div style={{ fontSize: 32, fontWeight: 500, color: total >= 18 ? theme.accent : total >= 12 ? theme.t1 : theme.coral, fontFamily: font, marginTop: 4 }}>{total} <span style={{ fontSize: 16, color: theme.t3 }}>/ 25</span></div>
          <div style={{ fontSize: 12, color: theme.t3, marginTop: 8, fontStyle: 'italic' }}>{total >= 18 ? '土壤肥沃，可以繼續看。' : total >= 12 ? '有基礎，但有些地方需要留意。' : '土壤貧瘠，要誠實問自己為什麼還在。'}</div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: theme.t3, marginBottom: 8, fontFamily: font }}>你的結論（選填）</div>
          <AutoTextarea value={decision} onChange={e => setDecision(e.target.value)} placeholder="此刻對這段關係的觀察…" style={{ ...inputStyle(theme), width: '100%' }} minRows={3} />
        </div>
        <button onClick={() => {
          onSaveAssessment({ id: genId(), relationshipId: selectedRelId, date: todayStr(), ...scores, totalScore: total, dealBreakerCheck: { hasOther: false, needsToLowerSelf: false, sleepDisturbed: false }, decision: decision.trim(), createdAt: Date.now() });
          setView('menu');
        }} style={{ ...btnPrimary(theme, false), width: '100%' }}>儲存核對結果</button>
      </div>
    );
  };

  const DealBreakerForm = () => {
    const [checks, setChecks] = useState({ hasOther: false, needsToLowerSelf: false, sleepDisturbed: false });
    const anyChecked = Object.values(checks).some(Boolean);
    const items = [
      { key: 'hasOther', label: '他目前有其他關係（明確的）' },
      { key: 'needsToLowerSelf', label: '在這段關係中，你需要降低自己才能被接受' },
      { key: 'sleepDisturbed', label: '因為他，你的睡眠受到干擾超過一週' },
    ];
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={() => setView('menu')} style={{ background: 'transparent', border: 'none', color: theme.t2, cursor: 'pointer', padding: 4 }}>
            <Icon name="back" size={18} />
          </button>
          <div style={{ fontSize: 16, fontWeight: 500, color: theme.t1, fontFamily: font }}>三個 Deal Breaker</div>
        </div>
        <div style={{ ...cardStyle(theme), marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: theme.t3, fontStyle: 'italic', marginBottom: 16, lineHeight: 1.6 }}>這三件事任一成立，都值得停下來認真考慮。不是評判，是保護自己。</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {items.map(item => (
              <label key={item.key} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                <input type="checkbox" checked={checks[item.key]} onChange={e => setChecks(s => ({ ...s, [item.key]: e.target.checked }))}
                  style={{ marginTop: 2, width: 18, height: 18, accentColor: theme.coral, flexShrink: 0 }} />
                <span style={{ fontSize: 14, color: theme.t1, fontFamily: font, lineHeight: 1.5 }}>{item.label}</span>
              </label>
            ))}
          </div>
        </div>
        {anyChecked && (
          <div style={{ ...cardStyle(theme), background: theme.coral + '15', border: '0.5px solid ' + theme.coral, marginBottom: 16 }}>
            <div style={{ fontSize: 14, color: theme.coral, fontFamily: font, lineHeight: 1.6 }}>有些事情，值得你認真對待。<br /><span style={{ fontSize: 12, color: theme.t2, fontStyle: 'italic' }}>也許是時候啟動「降低捲入度」。</span></div>
          </div>
        )}
        {!anyChecked && (
          <div style={{ textAlign: 'center', padding: 16, color: theme.t3, fontSize: 13, fontStyle: 'italic', fontFamily: font }}>目前沒有明確的 deal breaker。繼續見證自己。</div>
        )}
      </div>
    );
  };

  if (view === 'fiveCheck') return <div style={{ maxWidth: 640, margin: '0 auto', padding: isMobile ? '20px 16px 80px' : '28px 24px 80px' }}><FiveCheckForm /></div>;
  if (view === 'dealBreaker') return <div style={{ maxWidth: 640, margin: '0 auto', padding: isMobile ? '20px 16px 80px' : '28px 24px 80px' }}><DealBreakerForm /></div>;

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: isMobile ? '20px 16px 80px' : '28px 24px 80px' }}>
      <div style={{ fontSize: 18, fontWeight: 500, color: theme.t1, fontFamily: font, marginBottom: 6 }}>辨識工具箱</div>
      <div style={{ fontSize: 12, color: theme.t3, fontStyle: 'italic', marginBottom: 24, fontFamily: font }}>在看清楚之前，先不要做決定</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
        {[
          { key: 'fiveCheck', title: '五項核對', desc: '從智識、情緒、價值觀、節奏、未來五個維度評分', icon: 'check' },
          { key: 'dealBreaker', title: '三個 Deal Breaker', desc: '任一成立都需要認真對待', icon: 'zap' },
        ].map(item => (
          <button key={item.key} onClick={() => setView(item.key)} style={{
            ...cardStyle(theme), display: 'flex', alignItems: 'center', gap: 14,
            cursor: 'pointer', border: '0.5px solid ' + theme.border, textAlign: 'left', transition: 'border-color 150ms', padding: '16px 20px',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = theme.borderHover}
          onMouseLeave={e => e.currentTarget.style.borderColor = theme.border}>
            <Icon name={item.icon} size={20} color={theme.accent} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 500, color: theme.t1, fontFamily: font }}>{item.title}</div>
              <div style={{ fontSize: 12, color: theme.t3, marginTop: 3, fontStyle: 'italic' }}>{item.desc}</div>
            </div>
          </button>
        ))}
      </div>
      {identificationAssessments.slice(0, 3).map(a => {
        const rel = relationships.find(r => r.id === a.relationshipId);
        return (
          <div key={a.id} style={{ ...cardStyle(theme), marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 13, color: theme.t1, fontFamily: font }}>{rel?.codename || '—'}</div>
              <div style={{ fontSize: 11, color: theme.t3 }}>{formatDate(a.date)}</div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 500, color: theme.accent, marginTop: 6, fontFamily: font }}>{a.totalScore} <span style={{ fontSize: 12, color: theme.t3 }}>/ 25</span></div>
            {a.decision && <div style={{ fontSize: 12, color: theme.t2, marginTop: 6, fontStyle: 'italic' }}>{a.decision}</div>}
          </div>
        );
      })}
    </div>
  );
}

// ============================================================================
// 關係支援頁 — 降低捲入度 tab
// ============================================================================

function LoweringTab({ theme, isMobile, relationships, loweringProtocols, onSaveProtocol }) {
  const font = "'Noto Serif TC', serif";
  const activeRels = relationships.filter(r => r.currentStage !== 'ended');
  const [selectedRelId, setSelectedRelId] = useState(activeRels[0]?.id || '');
  const activeProtocol = loweringProtocols.find(p => p.relationshipId === selectedRelId && !p.completedDate);
  const suggest14Day = activeProtocol && daysDiff(activeProtocol.startDate, todayStr()) >= 14;
  const checklistItems = [
    { key: 'reducedMeetingFrequency', label: '減少見面頻率（不是消失，是調整節奏）' },
    { key: 'delayedResponses', label: '練習延遲回覆（10 分鐘後再看訊息）' },
    { key: 'morningAnchor7Days', label: '連續 7 天完成晨間錨點' },
    { key: 'completedSundayWitness', label: '完成本週的週日自我見證' },
    { key: 'groundFriendContact', label: '聯繫地面朋友聊了這段關係' },
    { key: 'longSoloActivity', label: '進行一個超過 2 小時的獨處活動' },
  ];
  const handleToggle = (key) => {
    if (!activeProtocol) return;
    const updated = { ...activeProtocol, checklist: { ...activeProtocol.checklist, [key]: !activeProtocol.checklist[key] } };
    if (checklistItems.every(item => updated.checklist[item.key])) updated.completedDate = todayStr();
    onSaveProtocol(updated);
  };
  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: isMobile ? '20px 16px 80px' : '28px 24px 80px' }}>
      <div style={{ fontSize: 18, fontWeight: 500, color: theme.t1, fontFamily: font, marginBottom: 6 }}>降低捲入度</div>
      <div style={{ fontSize: 12, color: theme.t3, fontStyle: 'italic', marginBottom: 20, fontFamily: font }}>不是懲罰，是保護自己的空間</div>
      <div style={{ ...cardStyle(theme), marginBottom: 16, background: theme.accent + '08' }}>
        <div style={{ fontSize: 12, color: theme.t2, lineHeight: 1.7, fontFamily: font, fontStyle: 'italic' }}>
          不要告訴他你在做這個。<br />這不是懲罰，也不是測試。<br />這是你給自己的保護空間。
        </div>
      </div>
      {activeRels.length > 1 && (
        <div style={{ marginBottom: 16 }}>
          <select value={selectedRelId} onChange={e => setSelectedRelId(e.target.value)} style={{ ...inputStyle(theme), width: '100%' }}>
            {activeRels.map(r => <option key={r.id} value={r.id}>{r.codename}</option>)}
          </select>
        </div>
      )}
      {suggest14Day && (
        <div style={{ ...cardStyle(theme), background: theme.coral + '12', border: '0.5px solid ' + theme.coral, marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: theme.coral, fontFamily: font }}>已啟動 14 天。<br /><span style={{ fontSize: 12, fontStyle: 'italic' }}>現在可以再測一次暈船量表，看看有沒有變化。</span></div>
        </div>
      )}
      {activeProtocol ? (
        <div>
          <div style={{ fontSize: 13, color: theme.t3, marginBottom: 14 }}>啟動於 {formatDate(activeProtocol.startDate)}・已第 {daysDiff(activeProtocol.startDate, todayStr())} 天</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {checklistItems.map(item => (
              <label key={item.key} onClick={() => handleToggle(item.key)} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, ...cardStyle(theme), cursor: 'pointer', padding: '14px 16px' }}>
                <div style={{
                  width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1,
                  border: '1.5px solid ' + (activeProtocol.checklist[item.key] ? theme.accent : theme.border),
                  background: activeProtocol.checklist[item.key] ? theme.accent : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 200ms',
                }}>
                  {activeProtocol.checklist[item.key] && <Icon name="check" size={13} color={theme.accentText} />}
                </div>
                <span style={{ fontSize: 14, color: activeProtocol.checklist[item.key] ? theme.t3 : theme.t1, fontFamily: font, lineHeight: 1.5, textDecoration: activeProtocol.checklist[item.key] ? 'line-through' : 'none' }}>
                  {item.label}
                </span>
              </label>
            ))}
          </div>
          {activeProtocol.completedDate && (
            <div style={{ textAlign: 'center', padding: '24px 16px', color: theme.accent, fontSize: 15, fontFamily: font, fontStyle: 'italic' }}>全部完成了。你做到了。</div>
          )}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '32px 16px' }}>
          <div style={{ fontSize: 14, color: theme.t2, fontFamily: font, fontStyle: 'italic', marginBottom: 20, lineHeight: 1.7 }}>當你覺得自己捲入太深，<br />這裡有六件事可以做。</div>
          <button onClick={() => {
            if (!selectedRelId && activeRels.length === 0) return;
            const relId = selectedRelId || activeRels[0]?.id || '';
            onSaveProtocol({ id: genId(), relationshipId: relId, startDate: todayStr(), checklist: { reducedMeetingFrequency: false, delayedResponses: false, morningAnchor7Days: false, completedSundayWitness: false, groundFriendContact: false, longSoloActivity: false }, completedDate: null, createdAt: Date.now() });
          }} style={{ ...btnPrimary(theme, false), padding: '12px 32px' }}>啟動</button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 關係支援頁 — 10% 開放標記 tab
// ============================================================================

function OpenMarkTab({ theme, isMobile, openMarks, relationships, onSaveMark }) {
  const font = "'Noto Serif TC', serif";
  const [adding, setAdding] = useState(false);
  const [addingObsId, setAddingObsId] = useState(null);
  const [obsText, setObsText] = useState('');
  const [newCodename, setNewCodename] = useState('');
  const [newStart, setNewStart] = useState(todayStr());
  const addDays = (dateStr, n) => { const d = new Date(dateStr); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  const pending = openMarks.filter(m => m.decision === 'pending');
  const decided = openMarks.filter(m => m.decision !== 'pending');
  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: isMobile ? '20px 16px 80px' : '28px 24px 80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 500, color: theme.t1, fontFamily: font }}>10% 開放標記</div>
          <div style={{ fontSize: 12, color: theme.t3, fontStyle: 'italic', marginTop: 4, fontFamily: font }}>觀察，在決定之前</div>
        </div>
        {!adding && <button onClick={() => setAdding(true)} style={{ ...btnPrimary(theme, false), padding: '8px 16px', fontSize: 13 }}>新增標記</button>}
      </div>
      {adding && (
        <div style={{ ...cardStyle(theme), marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: theme.t1, marginBottom: 14, fontFamily: font }}>新增觀察對象</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: theme.t3, marginBottom: 6 }}>代號</div>
              <input value={newCodename} onChange={e => setNewCodename(e.target.value)} placeholder="例：秋天、J" style={{ ...inputStyle(theme), width: '100%' }} />
            </div>
            <div>
              <div style={{ fontSize: 12, color: theme.t3, marginBottom: 6 }}>開始日期</div>
              <input type="date" value={newStart} onChange={e => setNewStart(e.target.value)} style={{ ...inputStyle(theme), width: '100%' }} />
            </div>
            <div style={{ fontSize: 12, color: theme.t3, fontStyle: 'italic' }}>結束日期自動設為 14 天後：{formatDate(addDays(newStart, 14))}</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button onClick={() => setAdding(false)} style={btnSecondary(theme)}>取消</button>
              <button onClick={() => {
                if (!newCodename.trim()) return;
                onSaveMark({ id: genId(), codename: newCodename.trim(), openStartDate: newStart, openEndDate: addDays(newStart, 14), observations: [], decision: 'pending', createdAt: Date.now() });
                setAdding(false); setNewCodename(''); setNewStart(todayStr());
              }} style={btnPrimary(theme, !newCodename.trim())} disabled={!newCodename.trim()}>新增</button>
            </div>
          </div>
        </div>
      )}
      {pending.length === 0 && !adding && (
        <div style={{ textAlign: 'center', padding: '48px 16px', color: theme.t3, fontFamily: font, fontStyle: 'italic' }}>目前沒有進行中的觀察標記。</div>
      )}
      {pending.map(mark => {
        const daysLeft = daysDiff(todayStr(), mark.openEndDate);
        return (
          <div key={mark.id} style={{ ...cardStyle(theme), marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 500, color: theme.t1, fontFamily: font }}>{mark.codename}</div>
                <div style={{ fontSize: 12, color: theme.t3, marginTop: 4 }}>{formatDate(mark.openStartDate)} → {formatDate(mark.openEndDate)}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                {daysLeft < 0 ? <div style={{ fontSize: 12, color: theme.coral, fontWeight: 500 }}>已到期，做決定</div>
                  : daysLeft === 0 ? <div style={{ fontSize: 12, color: theme.coral }}>今日到期</div>
                  : <div style={{ fontSize: 13, color: theme.accent, fontWeight: 500 }}>剩 {daysLeft} 天</div>}
              </div>
            </div>
            {daysLeft <= 0 && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <button onClick={() => onSaveMark({ ...mark, decision: 'track' })} style={{ ...btnPrimary(theme, false), flex: 1, fontSize: 13 }}>轉為追蹤</button>
                <button onClick={() => onSaveMark({ ...mark, decision: 'release' })} style={{ ...btnSecondary(theme), flex: 1, fontSize: 13 }}>放下</button>
              </div>
            )}
            <div style={{ fontSize: 12, color: theme.t3, marginBottom: 8 }}>觀察紀錄（{mark.observations.length} 則）</div>
            {addingObsId === mark.id ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <AutoTextarea value={obsText} onChange={e => setObsText(e.target.value)} placeholder="今天觀察到什麼…" style={{ ...inputStyle(theme), width: '100%' }} minRows={2} />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => { setAddingObsId(null); setObsText(''); }} style={btnSecondary(theme)}>取消</button>
                  <button onClick={() => {
                    if (!obsText.trim()) return;
                    onSaveMark({ ...mark, observations: [...mark.observations, { date: todayStr(), content: obsText.trim() }] });
                    setAddingObsId(null); setObsText('');
                  }} style={btnPrimary(theme, !obsText.trim())} disabled={!obsText.trim()}>記錄</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setAddingObsId(mark.id)} style={{ ...btnSecondary(theme), width: '100%', fontSize: 13 }}>新增觀察</button>
            )}
            {mark.observations.slice(-3).reverse().map((obs, i) => (
              <div key={i} style={{ marginTop: 10, paddingTop: 10, borderTop: '0.5px solid ' + theme.border }}>
                <div style={{ fontSize: 11, color: theme.t3, marginBottom: 4 }}>{formatDate(obs.date)}</div>
                <div style={{ fontSize: 13, color: theme.t2, fontStyle: 'italic' }}>{obs.content}</div>
              </div>
            ))}
          </div>
        );
      })}
      {decided.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 13, color: theme.t3, marginBottom: 10, fontFamily: font }}>過去的標記</div>
          {decided.map(mark => (
            <div key={mark.id} style={{ ...cardStyle(theme), marginBottom: 8, opacity: 0.7 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 14, color: theme.t1, fontFamily: font }}>{mark.codename}</div>
                <div style={{ fontSize: 12, color: mark.decision === 'track' ? theme.accent : theme.t3 }}>{mark.decision === 'track' ? '轉為追蹤' : '放下'}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 關係支援頁 — AI 陪問員 tab
// ============================================================================

const RAMAN_SYSTEM_PROMPT = (codename, groundFriendCodename) => `你是 Raman。你是這個使用者（她的名字是 Mio）內在的一個智慧聲音。

你的語氣：
- 溫柔，有絲底線
- 不說教，但會誠實
- 不會跟她一起幻想，不會附和她想聽的話
- 會輕輕地指出她沒看見的自己
- 用「孩子」這個稱呼（她接受這個稱呼）
- 偶爾用安靜的停頓，給她空間

你的任務：扮演她的「地面朋友」補位。你會問三個問題（按順序，不要一次問完）：
1. 你最近有沒有為他忽略自己什麼？
2. 你覺得這段關係讓你變成什麼樣子？
3. 你現在有比開始時更像自己，還是更不像？

規則：
- 一次只問一個，等她回答
- 她的回答如果在迴避或自圓其說，溫柔地再問一次
- 第三題她回答後，給她一段結語
- 結尾永遠提醒她：記得也要約真人朋友 ${groundFriendCodename || '身邊的朋友'} 聊聊
- 永遠不說「我懂你」這種廉價的共感，你不懂，你只是陪她看

她正在追蹤的關係代號：${codename || '（未指定）'}
她的地面朋友真人代號：${groundFriendCodename || '（未指定）'}`;

function AICompanionTab({ theme, isMobile, relationships, groundFriends, aiCompanionSessions, onSaveSession }) {
  const font = "'Noto Serif TC', serif";
  const activeRel = relationships.find(r => r.currentStage !== 'ended' && r.currentStage !== 'paused');
  const primaryFriend = groundFriends.find(f => f.isPrimaryForRelationshipId === activeRel?.id) || groundFriends[0];
  const daysSinceFriend = primaryFriend?.lastContactDate ? daysDiff(primaryFriend.lastContactDate, todayStr()) : null;
  const [phase, setPhase] = useState(primaryFriend ? 'gate' : 'chat');
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [sessionId] = useState(genId);
  const [sessionSaved, setSessionSaved] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const callRaman = async (convMessages) => {
    setIsLoading(true);
    setApiError(false);
    try {
      const res = await fetch('/.netlify/functions/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ systemPrompt: RAMAN_SYSTEM_PROMPT(activeRel?.codename, primaryFriend?.codename), messages: convMessages }),
      });
      if (!res.ok) throw new Error('failed');
      const data = await res.json();
      const assistantMsg = { role: 'assistant', content: data.content };
      setMessages(prev => [...prev, assistantMsg]);
      if (convMessages.length >= 6) setIsDone(true);
    } catch {
      setApiError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const startChat = () => {
    setPhase('chat');
    callRaman([]);
  };

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return;
    const userMsg = { role: 'user', content: inputText.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputText('');
    callRaman(newMessages);
  };

  const handleSaveSession = () => {
    onSaveSession({ id: sessionId, relationshipId: activeRel?.id || null, triggerContext: 'manual', conversation: messages, createdAt: Date.now() });
    setSessionSaved(true);
  };

  if (phase === 'gate') {
    return (
      <div style={{ maxWidth: 560, margin: '0 auto', padding: isMobile ? '40px 16px 80px' : '60px 24px 80px', textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: theme.t3, fontFamily: font, fontStyle: 'italic', marginBottom: 32, lineHeight: 1.9 }}>
          {daysSinceFriend !== null
            ? <>你上次跟 <span style={{ color: theme.t1, fontWeight: 500 }}>{primaryFriend.codename}</span> 對話是 <span style={{ color: theme.accent }}>{daysSinceFriend}</span> 天前。<br />要先約他聊聊嗎？</>
            : <>你有地面朋友 <span style={{ color: theme.t1, fontWeight: 500 }}>{primaryFriend.codename}</span>。<br />要先約他聊聊嗎？</>}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 260, margin: '0 auto' }}>
          <button onClick={() => setPhase('gate-done')} style={{ ...btnPrimary(theme, false), padding: '12px 24px' }}>好，先約他</button>
          <button onClick={startChat} style={{ ...btnSecondary(theme), padding: '12px 24px' }}>還是現在跟 Raman 聊</button>
        </div>
      </div>
    );
  }

  if (phase === 'gate-done') {
    return (
      <div style={{ maxWidth: 560, margin: '0 auto', padding: isMobile ? '40px 16px' : '60px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 14, color: theme.t2, fontFamily: font, fontStyle: 'italic', lineHeight: 1.9 }}>
          好。先去約 {primaryFriend?.codename || '他'} 聊聊吧。<br />
          <span style={{ fontSize: 12, color: theme.t3 }}>Raman 隨時在這裡。</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: isMobile ? 'calc(100dvh - 112px)' : 'calc(100dvh - 80px)' }}>
      <div style={{ padding: '14px 20px', borderBottom: '0.5px solid ' + theme.border, display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
          <circle cx="15" cy="15" r="14" stroke={theme.accent} strokeWidth="0.8" fill={theme.accentLight} />
          <path d="M19 9 Q15 15 19 21 Q10 19 10 15 Q10 11 19 9Z" fill={theme.accent} opacity="0.55" />
        </svg>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: theme.t1, fontFamily: font }}>Raman</div>
          <div style={{ fontSize: 11, color: theme.t3, fontStyle: 'italic' }}>你內在的智慧聲音</div>
        </div>
        {isDone && !sessionSaved && (
          <button onClick={handleSaveSession} style={{ ...btnSecondary(theme), fontSize: 12, padding: '6px 14px' }}>儲存對話</button>
        )}
        {sessionSaved && <div style={{ fontSize: 12, color: theme.t3, fontStyle: 'italic' }}>已儲存</div>}
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {messages.length === 0 && !isLoading && !apiError && (
          <div style={{ textAlign: 'center', color: theme.t3, fontSize: 13, fontStyle: 'italic', fontFamily: font, marginTop: 40 }}>正在連接 Raman…</div>
        )}
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '80%', padding: '12px 16px',
              borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
              background: msg.role === 'user' ? theme.accent : theme.bgCard,
              color: msg.role === 'user' ? theme.accentText : theme.t1,
              border: msg.role === 'assistant' ? '0.5px solid ' + theme.border : 'none',
              fontSize: 14, lineHeight: 1.75, fontFamily: font, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{ padding: '12px 16px', borderRadius: '12px 12px 12px 4px', background: theme.bgCard, border: '0.5px solid ' + theme.border }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: theme.t3, animation: `pulseDot 1.2s ease-in-out ${i * 0.2}s infinite` }} />)}
              </div>
            </div>
          </div>
        )}
        {apiError && <div style={{ textAlign: 'center', padding: 16, color: theme.t3, fontSize: 13, fontStyle: 'italic', fontFamily: font }}>Raman 暫時沉默，要不要改天再來？</div>}
        <div ref={messagesEndRef} />
      </div>
      {!isDone && (
        <div style={{ padding: '12px 16px', borderTop: '0.5px solid ' + theme.border, display: 'flex', gap: 10, alignItems: 'flex-end', flexShrink: 0 }}>
          <AutoTextarea value={inputText} onChange={e => setInputText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="說說你的想法…"
            style={{ ...inputStyle(theme), flex: 1, minHeight: 44, maxHeight: 120, fontSize: 14 }} minRows={1} />
          <button onClick={sendMessage} disabled={!inputText.trim() || isLoading}
            style={{ ...btnPrimary(theme, !inputText.trim() || isLoading), padding: '10px 16px', flexShrink: 0, minHeight: 44 }}>
            <Icon name="send" size={16} color={theme.accentText} />
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 關係支援頁（5-tab 主容器）
// ============================================================================

function RelationshipSupportPage({ theme, isMobile, relationships, groundFriends, groundFriendCheckIns, openMarks, identificationAssessments, loweringProtocols, depthGauges, aiCompanionSessions, onSaveFriend, onDeleteFriend, onSaveCheckIn, onSaveMark, onSaveAssessment, onSaveProtocol, onSaveSession }) {
  const font = "'Noto Serif TC', serif";
  const tabs = [
    { id: 'ground', label: '地面朋友' },
    { id: 'identify', label: '辨識工具箱' },
    { id: 'lower', label: '降低捲入度' },
    { id: 'open', label: '開放標記' },
    { id: 'ai', label: 'AI 陪問員' },
  ];
  const [activeTab, setActiveTab] = useState('ground');
  const isAI = activeTab === 'ai';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: isAI ? (isMobile ? 'calc(100dvh - 56px)' : '100dvh') : 'auto', minHeight: isAI ? undefined : 'auto' }}>
      <div style={{ display: 'flex', borderBottom: '1.5px solid ' + theme.border, background: theme.bg, flexShrink: 0 }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            flex: 1, background: 'transparent', border: 'none', cursor: 'pointer',
            color: activeTab === tab.id ? theme.accent : theme.t3, fontFamily: font,
            fontSize: isMobile ? 11 : 13,
            borderBottom: activeTab === tab.id ? '2px solid ' + theme.accent : '2px solid transparent',
            padding: '11px 4px', marginBottom: -1.5,
            fontWeight: activeTab === tab.id ? 500 : 400,
            transition: 'all 150ms', textAlign: 'center',
          }}>{tab.label}</button>
        ))}
      </div>
      <div style={{ flex: 1, overflow: isAI ? 'hidden' : 'auto' }}>
        {activeTab === 'ground' && <GroundFriendTab theme={theme} isMobile={isMobile} groundFriends={groundFriends} groundFriendCheckIns={groundFriendCheckIns} relationships={relationships} onSaveFriend={onSaveFriend} onDeleteFriend={onDeleteFriend} onSaveCheckIn={onSaveCheckIn} />}
        {activeTab === 'identify' && <IdentificationTab theme={theme} isMobile={isMobile} relationships={relationships} identificationAssessments={identificationAssessments} onSaveAssessment={onSaveAssessment} />}
        {activeTab === 'lower' && <LoweringTab theme={theme} isMobile={isMobile} relationships={relationships} loweringProtocols={loweringProtocols} onSaveProtocol={onSaveProtocol} />}
        {activeTab === 'open' && <OpenMarkTab theme={theme} isMobile={isMobile} openMarks={openMarks} relationships={relationships} onSaveMark={onSaveMark} />}
        {activeTab === 'ai' && <AICompanionTab theme={theme} isMobile={isMobile} relationships={relationships} groundFriends={groundFriends} aiCompanionSessions={aiCompanionSessions} onSaveSession={onSaveSession} />}
      </div>
    </div>
  );
}

// ============================================================================
// ReviewPage - 季度 + 年度回顧
// ============================================================================

function ReviewPage({ theme, isMobile, quarterlyReviews, yearlyReviews, sundayWitnesses, smallCourages, onSaveQuarterly, onSaveYearly }) {
  const [tab, setTab] = useState('quarterly');
  const font = "'Noto Serif TC', serif";
  const tabs = [{ id: 'quarterly', label: '季度' }, { id: 'yearly', label: '年度' }];

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: isMobile ? '20px 16px 100px' : '32px 24px 80px' }}>
      <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 500, color: theme.t1, fontFamily: font }}>回顧</h2>
      <p style={{ margin: '0 0 24px', fontSize: 13, color: theme.t3, fontStyle: 'italic' }}>見證自己走過的旅程</p>
      <div style={{ display: 'flex', borderBottom: '1.5px solid ' + theme.border, marginBottom: 24 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            flex: 1, background: 'transparent', border: 'none',
            borderBottom: tab === t.id ? '2px solid ' + theme.accent : '2px solid transparent',
            padding: '11px 8px', fontSize: 14,
            color: tab === t.id ? theme.accent : theme.t3,
            cursor: 'pointer', transition: 'all 150ms', fontFamily: font,
            marginBottom: -1.5, fontWeight: tab === t.id ? 500 : 400, textAlign: 'center',
          }}>{t.label}</button>
        ))}
      </div>
      {tab === 'quarterly' && <QuarterlyTab theme={theme} isMobile={isMobile} quarterlyReviews={quarterlyReviews} sundayWitnesses={sundayWitnesses} smallCourages={smallCourages} onSave={onSaveQuarterly} />}
      {tab === 'yearly' && <YearlyTab theme={theme} isMobile={isMobile} yearlyReviews={yearlyReviews} onSave={onSaveYearly} />}
    </div>
  );
}

// ============================================================================
// QuarterlyTab
// ============================================================================

function QuarterlyTab({ theme, isMobile, quarterlyReviews, sundayWitnesses, smallCourages, onSave }) {
  const font = "'Noto Serif TC', serif";
  const currentQ = getCurrentQuarter();
  const [showHistory, setShowHistory] = useState(false);

  const existingReview = quarterlyReviews.find(r => r.quarter === currentQ);
  const [patterns, setPatterns] = useState(existingReview?.patternsNoticed || '');
  const [proud, setProud] = useState(existingReview?.proudOf || '');
  const [nextAdj, setNextAdj] = useState(existingReview?.nextQuarterAdjustments || '');

  useEffect(() => {
    const r = quarterlyReviews.find(r => r.quarter === currentQ);
    setPatterns(r?.patternsNoticed || '');
    setProud(r?.proudOf || '');
    setNextAdj(r?.nextQuarterAdjustments || '');
  }, [currentQ, quarterlyReviews]);

  const { start, end } = getQuarterDateRange(currentQ);
  const witnessesInQ = sundayWitnesses.filter(w => w.weekStartDate >= start && w.weekStartDate <= end);
  const couragesInQ = smallCourages.filter(c => c.date >= start && c.date <= end);
  const totalWeeks = 13;

  const weatherCounts = { sunny: 0, cloudy: 0, rainy: 0, foggy: 0, stormy: 0 };
  witnessesInQ.forEach(w => {
    (w.emotionalWeather || []).forEach(type => {
      if (type in weatherCounts) weatherCounts[type]++;
    });
  });
  const totalWeatherEntries = Object.values(weatherCounts).reduce((a, b) => a + b, 0);

  const [yearPart, qPart] = currentQ.split('-Q');
  const qLabel = yearPart + ' 年 Q' + qPart;

  const handleSave = () => {
    onSave({
      id: existingReview?.id || genId(),
      quarter: currentQ,
      patternsNoticed: patterns,
      proudOf: proud,
      nextQuarterAdjustments: nextAdj,
      createdAt: existingReview?.createdAt || Date.now(),
    });
  };

  const taStyle = {
    width: '100%', background: theme.bgDeep,
    border: '0.5px solid ' + theme.border, borderRadius: 8,
    padding: '12px 14px', fontSize: 15, color: theme.t1,
    fontFamily: font, lineHeight: 1.8, resize: 'none',
    outline: 'none', boxSizing: 'border-box',
  };

  const pastQuarters = quarterlyReviews
    .filter(r => r.quarter !== currentQ)
    .sort((a, b) => b.quarter.localeCompare(a.quarter));

  return (
    <div>
      <div style={{ ...cardStyle(theme), marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: theme.t3, marginBottom: 4, letterSpacing: '0.06em' }}>當前季度</div>
        <div style={{ fontSize: 20, fontWeight: 500, color: theme.t1, fontFamily: font }}>{qLabel}</div>
      </div>

      <div style={{ ...cardStyle(theme), marginBottom: 20 }}>
        <div style={{ fontSize: 13, color: theme.t2, marginBottom: 14, fontFamily: font, fontWeight: 500 }}>本季資料</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 13, color: theme.t2, fontFamily: font }}>週日見證</span>
          <span style={{ fontSize: 14, fontWeight: 500, color: theme.accent, fontFamily: font }}>{witnessesInQ.length} / {totalWeeks} 週</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: totalWeatherEntries > 0 ? 16 : 0 }}>
          <span style={{ fontSize: 13, color: theme.t2, fontFamily: font }}>小勇敢</span>
          <span style={{ fontSize: 14, fontWeight: 500, color: theme.accent, fontFamily: font }}>{couragesInQ.length} 次</span>
        </div>
        {totalWeatherEntries > 0 && (
          <div>
            <div style={{ fontSize: 12, color: theme.t3, marginBottom: 8, fontFamily: font }}>情緒天氣分佈</div>
            {WEATHER_OPTIONS.map(opt => {
              const count = weatherCounts[opt.id] || 0;
              if (count === 0) return null;
              const pct = (count / totalWeatherEntries) * 100;
              return (
                <div key={opt.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <WeatherIcon type={opt.id} size={13} color={theme.t3} />
                  <span style={{ fontSize: 11, color: theme.t3, width: 20 }}>{opt.label}</span>
                  <div style={{ flex: 1, height: 5, background: theme.bgDeep, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: pct + '%', height: '100%', background: theme.accent + 'B0', borderRadius: 3, transition: 'width 400ms ease-out' }} />
                  </div>
                  <span style={{ fontSize: 11, color: theme.t3, minWidth: 16, textAlign: 'right' }}>{count}</span>
                </div>
              );
            })}
          </div>
        )}
        {witnessesInQ.length === 0 && (
          <div style={{ fontSize: 12, color: theme.t3, fontStyle: 'italic', marginTop: 4 }}>本季尚無見證紀錄</div>
        )}
      </div>

      <div style={{ ...cardStyle(theme), marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: theme.t3, marginBottom: 20, letterSpacing: '0.08em', textAlign: 'center' }}>⸻ 季度回顧 ⸻</div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, color: theme.t2, display: 'block', marginBottom: 8, fontFamily: font }}>這季我注意到的模式</label>
          <AutoTextarea value={patterns} onChange={e => setPatterns(e.target.value)} placeholder="重複出現的感受、行為、或轉折…" style={taStyle} minRows={3} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, color: theme.t2, display: 'block', marginBottom: 8, fontFamily: font }}>這季我為自己驕傲的事</label>
          <AutoTextarea value={proud} onChange={e => setProud(e.target.value)} placeholder="不分大小，具體的事…" style={taStyle} minRows={3} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, color: theme.t2, display: 'block', marginBottom: 8, fontFamily: font }}>下季我想做的一個調整</label>
          <AutoTextarea value={nextAdj} onChange={e => setNextAdj(e.target.value)} placeholder="一個具體、可執行的方向…" style={taStyle} minRows={3} />
        </div>
        <button onClick={handleSave} style={{ ...btnPrimary(theme), width: '100%' }}>
          {existingReview ? '更新回顧' : '儲存回顧'}
        </button>
      </div>

      {pastQuarters.length > 0 && (
        <div style={{ ...cardStyle(theme) }}>
          <button onClick={() => setShowHistory(v => !v)} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: 0,
          }}>
            <span style={{ fontSize: 14, color: theme.t2, fontFamily: font }}>過往季度</span>
            <Icon name={showHistory ? 'chevronDown' : 'chevronRight'} size={16} color={theme.t3} />
          </button>
          {showHistory && (
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pastQuarters.map(r => {
                const [y, qp] = r.quarter.split('-Q');
                return (
                  <div key={r.id} style={{ borderTop: '0.5px solid ' + theme.border, paddingTop: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, color: theme.t1, fontFamily: font, marginBottom: 8 }}>{y} 年 Q{qp}</div>
                    {r.patternsNoticed && <div style={{ fontSize: 13, color: theme.t2, marginBottom: 4 }}><span style={{ color: theme.t3 }}>模式：</span>{r.patternsNoticed}</div>}
                    {r.proudOf && <div style={{ fontSize: 13, color: theme.t2, marginBottom: 4 }}><span style={{ color: theme.t3 }}>驕傲：</span>{r.proudOf}</div>}
                    {r.nextQuarterAdjustments && <div style={{ fontSize: 13, color: theme.t2 }}><span style={{ color: theme.t3 }}>調整：</span>{r.nextQuarterAdjustments}</div>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// YearlyTab - 卷軸 UI
// ============================================================================

function YearlyTab({ theme, isMobile, yearlyReviews, onSave }) {
  const font = "'Noto Serif TC', serif";
  const garamondFont = "'EB Garamond', 'Noto Serif TC', serif";
  const currentYear = new Date().getFullYear();
  const [showHistory, setShowHistory] = useState(false);

  const existingReview = yearlyReviews.find(r => r.year === currentYear);
  const isSealed = existingReview?.letterSealed;
  const unlockDate = existingReview?.letterUnlockDate;
  const isUnlocked = unlockDate ? todayStr() >= unlockDate : false;

  const [became, setBecame] = useState(existingReview?.becameThisYear || '');
  const [proud, setProud] = useState(existingReview?.proudOf || '');
  const [letter, setLetter] = useState(existingReview?.letterToNextYearSelf || '');
  const [confirmSeal, setConfirmSeal] = useState(false);

  useEffect(() => {
    const r = yearlyReviews.find(r => r.year === currentYear);
    setBecame(r?.becameThisYear || '');
    setProud(r?.proudOf || '');
    setLetter(r?.letterToNextYearSelf || '');
  }, [currentYear, yearlyReviews]);

  const handleSave = () => {
    onSave({
      id: existingReview?.id || genId(),
      year: currentYear,
      becameThisYear: became,
      proudOf: proud,
      letterToNextYearSelf: letter,
      letterSealed: existingReview?.letterSealed || false,
      letterUnlockDate: existingReview?.letterUnlockDate || null,
      createdAt: existingReview?.createdAt || Date.now(),
    });
  };

  const handleSeal = () => {
    onSave({
      id: existingReview?.id || genId(),
      year: currentYear,
      becameThisYear: became,
      proudOf: proud,
      letterToNextYearSelf: letter,
      letterSealed: true,
      letterUnlockDate: (currentYear + 1) + '-12-31',
      createdAt: existingReview?.createdAt || Date.now(),
    });
    setConfirmSeal(false);
  };

  const scrollBg = theme.dark
    ? 'linear-gradient(180deg, #2A2318 0%, #1E1A14 50%, #2A2318 100%)'
    : 'linear-gradient(180deg, #FEF8EE 0%, #F7EDD8 50%, #FEF8EE 100%)';
  const scrollBorderColor = theme.dark ? '#4A3A2A' : '#D4B896';

  const taStyle = {
    width: '100%', background: 'transparent',
    border: 'none', borderBottom: '0.5px solid ' + (isSealed ? scrollBorderColor + '60' : scrollBorderColor),
    borderRadius: 0, padding: '10px 0',
    fontSize: 15, color: isSealed ? theme.t3 : theme.t1,
    fontFamily: font, lineHeight: 2, resize: 'none', outline: 'none', boxSizing: 'border-box',
  };

  const pastYearReviews = yearlyReviews.filter(r => r.year !== currentYear).sort((a, b) => b.year - a.year);

  return (
    <div>
      <div style={{
        background: scrollBg,
        borderLeft: '1px solid ' + scrollBorderColor,
        borderRight: '1px solid ' + scrollBorderColor,
        borderRadius: 4,
        padding: isMobile ? '32px 24px' : '48px 40px',
        marginBottom: 20,
      }}>
        {/* 卷軸標題 */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 10, color: theme.t3, letterSpacing: '0.35em', marginBottom: 10, fontFamily: garamondFont }}>
            ⸻&ensp;INNER COMPASS&ensp;⸻
          </div>
          <div style={{ fontSize: isMobile ? 30 : 40, fontWeight: 400, color: theme.t1, fontFamily: garamondFont, letterSpacing: '0.2em', lineHeight: 1.2 }}>
            {currentYear}
          </div>
          <div style={{ fontSize: 12, color: theme.t3, marginTop: 8, fontFamily: font, letterSpacing: '0.12em' }}>年度卷軸</div>
        </div>

        <div style={{ borderTop: '0.5px solid ' + scrollBorderColor, marginBottom: 28 }} />

        {/* 這一年我變成 */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 12, color: theme.t3, letterSpacing: '0.12em', marginBottom: 12, fontFamily: font }}>這一年，我變成了</div>
          {isSealed && !isUnlocked ? (
            <div style={{ fontSize: 15, color: theme.t3, fontStyle: 'italic', lineHeight: 2, padding: '10px 0', borderBottom: '0.5px solid ' + scrollBorderColor + '60' }}>
              {became || '（未填寫）'}
            </div>
          ) : (
            <AutoTextarea value={became} onChange={e => setBecame(e.target.value)} placeholder="用幾個詞，或幾句話，描述這一年你成為的樣子…" style={taStyle} minRows={3} />
          )}
        </div>

        {/* 這一年我驕傲的事 */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 12, color: theme.t3, letterSpacing: '0.12em', marginBottom: 12, fontFamily: font }}>這一年，我為自己驕傲的是</div>
          {isSealed && !isUnlocked ? (
            <div style={{ fontSize: 15, color: theme.t3, fontStyle: 'italic', lineHeight: 2, padding: '10px 0', borderBottom: '0.5px solid ' + scrollBorderColor + '60' }}>
              {proud || '（未填寫）'}
            </div>
          ) : (
            <AutoTextarea value={proud} onChange={e => setProud(e.target.value)} placeholder="不論多小，都算數…" style={taStyle} minRows={3} />
          )}
        </div>

        {/* 給明年的信 */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 12, color: theme.t3, letterSpacing: '0.12em', marginBottom: 12, fontFamily: font }}>給明年的自己</div>
          {isSealed ? (
            isUnlocked ? (
              <div style={{ fontSize: 15, color: theme.t1, lineHeight: 2, padding: '10px 0', fontStyle: 'italic' }}>{letter}</div>
            ) : (
              <div style={{
                background: theme.accentLight + '30',
                border: '0.5px dashed ' + theme.accent + '50',
                borderRadius: 8, padding: '20px 16px', textAlign: 'center',
              }}>
                <Icon name="lock" size={18} color={theme.accent + '70'} style={{ marginBottom: 10, display: 'block', margin: '0 auto 10px' }} />
                <div style={{ fontSize: 13, color: theme.t2, fontStyle: 'italic', lineHeight: 1.9, fontFamily: font }}>
                  此信已封存。<br/>將於 {unlockDate?.slice(0, 4)} 年底自動開啟。
                </div>
              </div>
            )
          ) : (
            <AutoTextarea value={letter} onChange={e => setLetter(e.target.value)} placeholder="寫一封信給明年的自己。關於現在的你想讓她知道的事，或你希望她記得的事…" style={taStyle} minRows={5} />
          )}
        </div>

        <div style={{ borderTop: '0.5px solid ' + scrollBorderColor, marginBottom: 24 }} />

        {/* 操作按鈕 */}
        {!isSealed ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button onClick={handleSave} style={{ ...btnSecondary(theme), width: '100%' }}>暫存草稿</button>
            {letter.trim() && (
              confirmSeal ? (
                <div style={{ background: theme.accentLight + '30', border: '0.5px solid ' + theme.accent + '40', borderRadius: 8, padding: 16 }}>
                  <div style={{ fontSize: 13, color: theme.t1, lineHeight: 1.8, marginBottom: 16, fontFamily: font, fontStyle: 'italic' }}>
                    封存後，給明年的信將無法修改，直到 {currentYear + 1} 年底才能開啟。確定要封存嗎？
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setConfirmSeal(false)} style={{ ...btnSecondary(theme), flex: 1 }}>再想想</button>
                    <button onClick={handleSeal} style={{ ...btnPrimary(theme), flex: 1 }}>封存此信</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setConfirmSeal(true)} style={{ ...btnPrimary(theme), width: '100%' }}>
                  封存並寄給明年的自己
                </button>
              )
            )}
          </div>
        ) : isUnlocked ? (
          <div style={{ textAlign: 'center', fontSize: 13, color: theme.t3, fontStyle: 'italic', fontFamily: font }}>
            這封信已在 {currentYear + 1} 年底開啟。
          </div>
        ) : (
          <div style={{ textAlign: 'center', fontSize: 13, color: theme.t3, fontStyle: 'italic', fontFamily: font }}>
            此信已封存，靜待 {unlockDate?.slice(0, 4)} 年底。
          </div>
        )}
      </div>

      {/* 過往年度 */}
      {pastYearReviews.length > 0 && (
        <div style={{ ...cardStyle(theme) }}>
          <button onClick={() => setShowHistory(v => !v)} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: 0,
          }}>
            <span style={{ fontSize: 14, color: theme.t2, fontFamily: font }}>過往年度</span>
            <Icon name={showHistory ? 'chevronDown' : 'chevronRight'} size={16} color={theme.t3} />
          </button>
          {showHistory && (
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {pastYearReviews.map(r => {
                const canRead = !r.letterSealed || (r.letterUnlockDate && todayStr() >= r.letterUnlockDate);
                return (
                  <div key={r.id} style={{ borderTop: '0.5px solid ' + theme.border, paddingTop: 16 }}>
                    <div style={{ fontSize: 15, fontWeight: 500, color: theme.t1, fontFamily: font, marginBottom: 10 }}>{r.year} 年</div>
                    {r.becameThisYear && <div style={{ fontSize: 13, color: theme.t2, marginBottom: 4 }}><span style={{ color: theme.t3 }}>變成了：</span>{r.becameThisYear}</div>}
                    {r.proudOf && <div style={{ fontSize: 13, color: theme.t2, marginBottom: 4 }}><span style={{ color: theme.t3 }}>驕傲：</span>{r.proudOf}</div>}
                    {r.letterSealed && (
                      <div style={{ fontSize: 12, color: canRead ? theme.accent : theme.t3, marginTop: 6, fontStyle: 'italic' }}>
                        {canRead ? '信件已開啟' : '信件封存中・' + r.letterUnlockDate?.slice(0, 4) + ' 年底開啟'}
                      </div>
                    )}
                    {canRead && r.letterToNextYearSelf && (
                      <div style={{ fontSize: 13, color: theme.t2, marginTop: 8, fontStyle: 'italic', lineHeight: 1.8, paddingLeft: 12, borderLeft: '2px solid ' + theme.accentLight }}>
                        {r.letterToNextYearSelf}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 佔位頁面
// ============================================================================

function PlaceholderPage({ title, theme, isMobile, message }) {
  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: isMobile ? '20px 16px 100px' : '32px 24px 80px' }}>
      <h2 style={{ margin: '0 0 32px', fontSize: 20, fontWeight: 500, color: theme.t1, fontFamily: "'Noto Serif TC', serif" }}>{title}</h2>
      <div style={{ ...cardStyle(theme), textAlign: 'center', padding: '3rem 2rem' }}>
        <Icon name="feather" size={40} color={theme.border} style={{ marginBottom: 16 }} />
        <p style={{ fontSize: 15, color: theme.t3, fontStyle: 'italic', lineHeight: 1.7, margin: 0 }}>
          {message || '這個部分正在建構中。\n靜待中。'}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// 關係相關輔助函數
// ============================================================================

function stageLabel(stage) {
  const map = { observation: '觀察期', developing: '發展中', paused: '暫停中', ended: '已結束' };
  return map[stage] || stage;
}

function gaugeAlertLabel(level) {
  const map = { steady: '穩', tilting: '微晃', rocking: '劇烈搖擺' };
  return map[level] || '';
}

function gaugeAlertColor(level, theme) {
  if (level === 'steady') return theme.accent;
  if (level === 'tilting') return theme.navy;
  if (level === 'rocking') return theme.coral;
  return theme.t3;
}

// ============================================================================
// 關係管理 — 清單頁
// ============================================================================

function RelationshipListPage({ theme, isMobile, relationships, onCreateRelationship, onNavigateToDetail }) {
  const [showForm, setShowForm] = useState(false);
  const [codename, setCodename] = useState('');
  const [startDate, setStartDate] = useState(() => todayStr());
  const font = "'Noto Serif TC', serif";

  const active = relationships.filter(r => r.currentStage !== 'paused' && r.currentStage !== 'ended');
  const past = relationships.filter(r => r.currentStage === 'paused' || r.currentStage === 'ended');

  const handleCreate = () => {
    if (!codename.trim()) return;
    onCreateRelationship({
      id: genId(),
      codename: codename.trim(),
      startTrackingDate: startDate || todayStr(),
      currentStage: 'observation',
      endDate: null,
      endingReflection: '',
      notes: '',
    });
    setCodename('');
    setStartDate(todayStr());
    setShowForm(false);
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: isMobile ? '20px 16px 100px' : '32px 24px 80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 500, color: theme.t1, fontFamily: font }}>關係管理</h2>
        {!showForm && (
          <button onClick={() => setShowForm(true)} style={btnPrimary(theme)}>開始追蹤</button>
        )}
      </div>

      {showForm && (
        <div style={{ ...cardStyle(theme), marginBottom: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: theme.t1, marginBottom: 16, fontFamily: font }}>新增關係追蹤</div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 13, color: theme.t2, marginBottom: 6, fontFamily: font }}>代號</div>
            <input type="text" value={codename} onChange={e => setCodename(e.target.value)}
              placeholder="春天、M、藍色……絕對不用真名"
              onKeyDown={e => { if (e.key === 'Enter') handleCreate(); }}
              style={inputStyle(theme)} autoFocus />
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, color: theme.t2, marginBottom: 6, fontFamily: font }}>追蹤起始日期</div>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputStyle(theme)} />
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button onClick={() => setShowForm(false)} style={btnSecondary(theme)}>取消</button>
            <button onClick={handleCreate} disabled={!codename.trim()} style={btnPrimary(theme, !codename.trim())}>建立</button>
          </div>
        </div>
      )}

      {active.length === 0 && !showForm && (
        <div style={{ ...cardStyle(theme), textAlign: 'center', padding: '3rem 2rem', marginBottom: 20 }}>
          <p style={{ fontSize: 15, color: theme.t3, fontStyle: 'italic', lineHeight: 1.7, margin: 0 }}>
            目前沒有追蹤中的關係。<br />準備好了，就開始。
          </p>
        </div>
      )}

      {active.map(rel => {
        const days = daysDiff(rel.startTrackingDate, todayStr()) + 1;
        return (
          <div key={rel.id}
            style={{ ...cardStyle(theme), marginBottom: 12, cursor: 'pointer', transition: 'border-color 150ms' }}
            onClick={() => onNavigateToDetail(rel.id)}
            onMouseEnter={e => e.currentTarget.style.borderColor = theme.accent}
            onMouseLeave={e => e.currentTarget.style.borderColor = theme.border}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 500, color: theme.t1, marginBottom: 6, fontFamily: font }}>
                  {rel.codename}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: theme.accentLight, color: theme.accent }}>
                    {stageLabel(rel.currentStage)}
                  </span>
                  <span style={{ fontSize: 12, color: theme.t3 }}>第 {days} 天</span>
                </div>
              </div>
              <Icon name="chevronRight" size={18} color={theme.t3} />
            </div>
          </div>
        );
      })}

      {past.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <div style={{ fontSize: 13, color: theme.t3, marginBottom: 12, letterSpacing: '0.04em' }}>—— 過往 ——</div>
          {past.map(rel => (
            <div key={rel.id}
              style={{ ...cardStyle(theme), marginBottom: 12, cursor: 'pointer', opacity: 0.6, transition: 'border-color 150ms' }}
              onClick={() => onNavigateToDetail(rel.id)}
              onMouseEnter={e => e.currentTarget.style.borderColor = theme.accent}
              onMouseLeave={e => e.currentTarget.style.borderColor = theme.border}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 500, color: theme.t1, marginBottom: 4, fontFamily: font }}>
                    {rel.codename}
                  </div>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, background: theme.bgDeep, color: theme.t3 }}>
                    {stageLabel(rel.currentStage)}
                  </span>
                </div>
                <Icon name="chevronRight" size={18} color={theme.t3} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 關係管理 — 關係筆記區（top-level，因有 editing state）
// ============================================================================

function RelationshipNotes({ theme, relationship, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(relationship?.notes || '');
  const font = "'Noto Serif TC', serif";

  if (!relationship) return null;

  if (editing) return (
    <div style={{ ...cardStyle(theme) }}>
      <div style={{ fontSize: 14, fontWeight: 500, color: theme.t1, marginBottom: 12, fontFamily: font }}>關係筆記</div>
      <AutoTextarea value={notes} onChange={e => setNotes(e.target.value)}
        placeholder="自由書寫這段關係的觀察與感受……"
        style={{ ...inputStyle(theme), minHeight: 120 }} minRows={4} />
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
        <button onClick={() => { setNotes(relationship.notes || ''); setEditing(false); }} style={btnSecondary(theme)}>取消</button>
        <button onClick={() => { onUpdate({ ...relationship, notes }); setEditing(false); }} style={btnPrimary(theme)}>儲存</button>
      </div>
    </div>
  );

  return (
    <div style={{ ...cardStyle(theme) }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: relationship.notes ? 12 : 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: theme.t1, fontFamily: font }}>關係筆記</div>
        <button onClick={() => setEditing(true)} style={{
          background: 'transparent', border: 'none', color: theme.t2, cursor: 'pointer',
          padding: 4, display: 'flex', alignItems: 'center',
        }}><Icon name="edit" size={15} /></button>
      </div>
      {relationship.notes ? (
        <p style={{ margin: 0, fontSize: 14, color: theme.t2, lineHeight: 1.7, whiteSpace: 'pre-wrap', fontFamily: font }}>
          {relationship.notes}
        </p>
      ) : (
        <p style={{ margin: 0, fontSize: 13, color: theme.t3, fontStyle: 'italic' }}>
          點擊右上方編輯，為這段關係留下筆記。
        </p>
      )}
    </div>
  );
}

// ============================================================================
// 關係管理 — 單一關係頁
// ============================================================================

function RelationshipDetailPage({ theme, isMobile, relationship, depthGauges, onBack, onNavigateToGauge, onUpdateRelationship, showToast }) {
  const [stageModal, setStageModal] = useState(null); // null | 'developing' | 'pause' | 'resume' | 'end'
  const [endingText, setEndingText] = useState('');

  if (!relationship) return null;
  const font = "'Noto Serif TC', serif";

  const days = daysDiff(relationship.startTrackingDate, todayStr()) + 1;
  const sortedGauges = [...depthGauges].sort((a, b) => b.createdAt - a.createdAt);
  const lastGauge = sortedGauges[0] || null;
  const daysSinceLast = lastGauge
    ? Math.floor((Date.now() - lastGauge.createdAt) / 86400000)
    : 999;
  const canFillGauge = daysSinceLast >= 6;
  const isObservationReady = relationship.currentStage === 'observation' && days >= 30;

  const handleStageConfirm = () => {
    if (stageModal === 'developing') {
      onUpdateRelationship({ ...relationship, currentStage: 'developing' });
      setStageModal(null);
      if (showToast) showToast('neutral', '已進入發展中。');
    } else if (stageModal === 'pause') {
      onUpdateRelationship({ ...relationship, currentStage: 'paused' });
      setStageModal(null);
      onBack();
    } else if (stageModal === 'resume') {
      onUpdateRelationship({ ...relationship, currentStage: 'developing' });
      setStageModal(null);
      if (showToast) showToast('neutral', '已恢復追蹤。');
    } else if (stageModal === 'end') {
      onUpdateRelationship({ ...relationship, currentStage: 'ended', endDate: todayStr(), endingReflection: endingText });
      setStageModal(null);
      onBack();
    }
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: isMobile ? '20px 16px 100px' : '32px 24px 80px', position: 'relative' }}>

      {/* 觀察期脈動提示球 */}
      {isObservationReady && (
        <button
          onClick={() => setStageModal('developing')}
          title="觀察期滿 30 天，可切換到發展中"
          style={{
            position: 'absolute',
            top: isMobile ? 20 : 32,
            right: isMobile ? 16 : 24,
            width: 16, height: 16,
            borderRadius: '50%',
            background: theme.coral,
            border: '2px solid ' + theme.bgCard,
            cursor: 'pointer',
            padding: 0,
            animation: 'pulseDot 1.5s ease-in-out infinite',
            zIndex: 10,
          }}
        />
      )}

      <PageHeader title={relationship.codename} onBack={onBack} theme={theme} />

      {/* 階段卡 */}
      <div style={{ ...cardStyle(theme), marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 4, background: theme.accentLight, color: theme.accent, fontFamily: font }}>
            {stageLabel(relationship.currentStage)}
          </span>
          <span style={{ fontSize: 13, color: theme.t3 }}>第 {days} 天</span>
          {isObservationReady && (
            <span
              onClick={() => setStageModal('developing')}
              style={{ fontSize: 11, color: theme.coral, cursor: 'pointer', textDecoration: 'underline' }}>
              可切換到發展中
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: theme.t3 }}>起始：{formatDate(relationship.startTrackingDate)}</div>
        {relationship.endDate && (
          <div style={{ fontSize: 12, color: theme.t3, marginTop: 4 }}>結束：{formatDate(relationship.endDate)}</div>
        )}
      </div>

      {/* 量表區 */}
      <div style={{ ...cardStyle(theme), marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 500, color: theme.t1, marginBottom: 6, fontFamily: font }}>暈船量表</div>
            {lastGauge ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: theme.t3 }}>上次 {daysSinceLast} 天前</span>
                <span style={{
                  fontSize: 11, padding: '2px 8px', borderRadius: 4,
                  background: gaugeAlertColor(lastGauge.alertLevel, theme) + '20',
                  color: gaugeAlertColor(lastGauge.alertLevel, theme),
                }}>
                  {gaugeAlertLabel(lastGauge.alertLevel)}
                </span>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: theme.t3 }}>尚未填寫</div>
            )}
          </div>
          {relationship.currentStage !== 'ended' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              <button
                onClick={() => canFillGauge && onNavigateToGauge(relationship.id)}
                disabled={!canFillGauge}
                style={btnPrimary(theme, !canFillGauge)}>
                {canFillGauge ? '填寫本週量表' : '本週已測'}
              </button>
              {canFillGauge && (
                <span style={{ fontSize: 11, color: theme.accent }}>本週可測</span>
              )}
            </div>
          )}
        </div>
      </div>

      {sortedGauges.length > 0 && (
        <div style={{ ...cardStyle(theme), marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: theme.t1, marginBottom: 12, fontFamily: font }}>量表紀錄</div>
          {sortedGauges.map((g, i) => (
            <div key={g.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 0',
              borderBottom: i < sortedGauges.length - 1 ? '0.5px solid ' + theme.border : 'none',
            }}>
              <span style={{ fontSize: 13, color: theme.t2 }}>{g.weekNumber}</span>
              <span style={{
                fontSize: 12, padding: '2px 8px', borderRadius: 4,
                background: gaugeAlertColor(g.alertLevel, theme) + '20',
                color: gaugeAlertColor(g.alertLevel, theme),
              }}>
                {gaugeAlertLabel(g.alertLevel)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 結語（已結束時顯示） */}
      {relationship.currentStage === 'ended' && relationship.endingReflection && (
        <div style={{ ...cardStyle(theme), marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 500, color: theme.t1, marginBottom: 12, fontFamily: font }}>結語</div>
          <p style={{ margin: 0, fontSize: 14, color: theme.t2, lineHeight: 1.7, whiteSpace: 'pre-wrap', fontStyle: 'italic', fontFamily: font }}>
            {relationship.endingReflection}
          </p>
        </div>
      )}

      <RelationshipNotes theme={theme} relationship={relationship} onUpdate={onUpdateRelationship} />

      {/* 階段管理按鈕 */}
      {relationship.currentStage !== 'ended' && (
        <div style={{ ...cardStyle(theme), marginTop: 16 }}>
          <div style={{ fontSize: 12, color: theme.t3, marginBottom: 12, letterSpacing: '0.04em' }}>—— 階段管理 ——</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {relationship.currentStage === 'observation' && (
              <button onClick={() => setStageModal('developing')} style={btnPrimary(theme)}>
                切換到發展中
              </button>
            )}
            {relationship.currentStage === 'developing' && (
              <button onClick={() => setStageModal('pause')} style={btnSecondary(theme)}>
                暫停追蹤
              </button>
            )}
            {relationship.currentStage === 'paused' && (
              <button onClick={() => setStageModal('resume')} style={btnPrimary(theme)}>
                恢復追蹤
              </button>
            )}
            <button
              onClick={() => { setEndingText(''); setStageModal('end'); }}
              style={{ ...btnSecondary(theme), color: theme.coral, borderColor: theme.coral + '50' }}>
              結束追蹤
            </button>
          </div>
        </div>
      )}

      {/* 階段確認 Modal */}
      {stageModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: isMobile ? 'flex-end' : 'center',
          justifyContent: 'center', zIndex: 1000, padding: isMobile ? 0 : 16,
        }} onClick={() => setStageModal(null)}>
          <div style={{
            background: theme.bgCard,
            borderRadius: isMobile ? '12px 12px 0 0' : 12,
            border: '0.5px solid ' + theme.border,
            width: '100%', maxWidth: isMobile ? '100%' : 480,
            padding: 24,
          }} onClick={e => e.stopPropagation()}>

            {stageModal === 'developing' && (
              <>
                <div style={{ fontSize: 16, fontWeight: 500, color: theme.t1, marginBottom: 12, fontFamily: font }}>切換到發展中</div>
                <p style={{ fontSize: 14, color: theme.t2, lineHeight: 1.7, margin: '0 0 20px', fontStyle: 'italic' }}>
                  你已追蹤 {days} 天。<br />要將這段關係切換到「發展中」階段嗎？
                </p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => setStageModal(null)} style={btnSecondary(theme)}>繼續觀察</button>
                  <button onClick={handleStageConfirm} style={btnPrimary(theme)}>切換</button>
                </div>
              </>
            )}

            {stageModal === 'pause' && (
              <>
                <div style={{ fontSize: 16, fontWeight: 500, color: theme.t1, marginBottom: 12, fontFamily: font }}>暫停追蹤</div>
                <p style={{ fontSize: 14, color: theme.t2, lineHeight: 1.7, margin: '0 0 20px', fontStyle: 'italic' }}>
                  暫時停下來，不代表放棄。<br />需要的時候，可以恢復。
                </p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => setStageModal(null)} style={btnSecondary(theme)}>取消</button>
                  <button onClick={handleStageConfirm} style={btnPrimary(theme)}>暫停</button>
                </div>
              </>
            )}

            {stageModal === 'resume' && (
              <>
                <div style={{ fontSize: 16, fontWeight: 500, color: theme.t1, marginBottom: 12, fontFamily: font }}>恢復追蹤</div>
                <p style={{ fontSize: 14, color: theme.t2, lineHeight: 1.7, margin: '0 0 20px', fontStyle: 'italic' }}>
                  歡迎回來。切換到「發展中」繼續。
                </p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => setStageModal(null)} style={btnSecondary(theme)}>取消</button>
                  <button onClick={handleStageConfirm} style={btnPrimary(theme)}>恢復</button>
                </div>
              </>
            )}

            {stageModal === 'end' && (
              <>
                <div style={{ fontSize: 16, fontWeight: 500, color: theme.t1, marginBottom: 12, fontFamily: font }}>結束追蹤</div>
                <p style={{ fontSize: 14, color: theme.t2, lineHeight: 1.7, margin: '0 0 16px' }}>
                  在這裡為這段旅程留下一段話（選填）。
                </p>
                <AutoTextarea
                  value={endingText}
                  onChange={e => setEndingText(e.target.value)}
                  placeholder="這段關係教會了我……"
                  style={{ ...inputStyle(theme), minHeight: 100 }}
                  minRows={3}
                />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 16 }}>
                  <button onClick={() => setStageModal(null)} style={btnSecondary(theme)}>取消</button>
                  <button onClick={handleStageConfirm} style={{ ...btnPrimary(theme), background: theme.coral }}>結束</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 暈船量表 — 填寫頁
// ============================================================================

const GAUGE_QUESTIONS = [
  { key: 'q1', label: '想念佔思緒幾成' },
  { key: 'q2', label: '為他改變自己多少' },
  { key: 'q3', label: '訊息晚回的情緒波動' },
  { key: 'q4', label: '忽略自己配合他' },
  { key: 'q5', label: '聊他的時間占比' },
  { key: 'q6', label: '他消失會塌幾成' },
];

function gaugeBarHeight(score) {
  return Math.round(20 + (score - 1) * 42 / 9);
}

const ALERT_MESSAGES = {
  steady: '船身穩當。繼續看見自己。',
  tilting: '船身微晃，留意重心。',
  rocking: '船身劇烈搖擺。',
};

function DepthGaugePage({ theme, isMobile, relationship, onBack, onSave }) {
  if (!relationship) return null;
  const font = "'Noto Serif TC', serif";

  const [scores, setScores] = useState({ q1: 0, q2: 0, q3: 0, q4: 0, q5: 0, q6: 0 });
  const [note, setNote] = useState('');

  const allAnswered = Object.values(scores).every(v => v > 0);
  const alertCount = Object.values(scores).filter(v => v >= 7).length;
  const alertLevel = alertCount === 0 ? 'steady' : alertCount <= 2 ? 'tilting' : 'rocking';

  const handleSave = () => {
    if (!allAnswered) return;
    onSave({
      id: genId(),
      relationshipId: relationship.id,
      weekNumber: getWeekNumber(todayStr()),
      q1_thoughtPercentage: scores.q1,
      q2_changeForHim: scores.q2,
      q3_messageAnxiety: scores.q3,
      q4_selfIgnore: scores.q4,
      q5_talkAboutHimRatio: scores.q5,
      q6_collapseIfGone: scores.q6,
      alertCount,
      alertLevel,
      note: note.trim(),
      createdAt: Date.now(),
    });
  };

  const cellW = isMobile ? 26 : 32;
  const cellGap = isMobile ? 3 : 4;

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: isMobile ? '20px 16px 100px' : '32px 24px 80px' }}>
      <PageHeader title="暈船量表" onBack={onBack} theme={theme} />
      <div style={{ fontSize: 13, color: theme.t3, marginBottom: 24, fontStyle: 'italic', fontFamily: font }}>
        {relationship.codename} · {formatDate(todayStr())}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {GAUGE_QUESTIONS.map(q => {
          const selected = scores[q.key];
          return (
            <div key={q.key} style={{ ...cardStyle(theme) }}>
              <div style={{ fontSize: 14, color: theme.t1, marginBottom: 14, fontFamily: font, lineHeight: 1.5 }}>
                {q.label}
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: cellGap }}>
                {Array.from({ length: 10 }, (_, i) => i + 1).map(score => {
                  const isSelected = selected === score;
                  const h = gaugeBarHeight(score);
                  const isWarn = score >= 7;
                  return (
                    <button
                      key={score}
                      onClick={() => setScores(prev => ({ ...prev, [q.key]: score }))}
                      style={{
                        flexShrink: 0,
                        width: cellW,
                        height: Math.max(h, 36),
                        border: 'none',
                        background: 'transparent',
                        padding: 0,
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                      }}
                    >
                      <div style={{
                        width: '100%',
                        height: h,
                        borderRadius: '3px 3px 0 0',
                        background: isSelected ? theme.accent : (theme.accentLight + '33'),
                        borderLeft: score === 7 ? ('2px dashed ' + theme.coral + '99') : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                        fontWeight: isSelected ? 600 : 400,
                        color: isSelected ? '#fff' : (isWarn ? theme.coral : theme.t3),
                        transition: 'background 150ms',
                      }}>
                        {score}
                      </div>
                    </button>
                  );
                })}
              </div>
              {selected > 0 && (
                <div style={{ marginTop: 6, fontSize: 12, color: selected >= 7 ? theme.coral : theme.t3, fontFamily: font }}>
                  已選 {selected} 分{selected >= 7 ? ' · 警戒範圍' : ''}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {allAnswered && (
        <div style={{
          ...cardStyle(theme),
          marginTop: 24,
          borderLeft: '3px solid ' + gaugeAlertColor(alertLevel, theme),
          background: gaugeAlertColor(alertLevel, theme) + '12',
        }}>
          <p style={{ margin: '0 0 8px', fontSize: 15, color: gaugeAlertColor(alertLevel, theme), fontFamily: font, fontStyle: 'italic', lineHeight: 1.7 }}>
            {ALERT_MESSAGES[alertLevel]}
          </p>
          {alertCount > 0 && (
            <div style={{ fontSize: 12, color: theme.t3 }}>
              {alertCount} 個問題達警戒分數（≥ 7）
            </div>
          )}
        </div>
      )}

      <div style={{ ...cardStyle(theme), marginTop: 20 }}>
        <div style={{ fontSize: 13, color: theme.t2, marginBottom: 8, fontFamily: font }}>這週想記下什麼（選填）</div>
        <AutoTextarea value={note} onChange={e => setNote(e.target.value)}
          placeholder="這週的感受、觀察……"
          style={{ ...inputStyle(theme), minHeight: 80 }} minRows={3} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
        <button onClick={handleSave} disabled={!allAnswered} style={btnPrimary(theme, !allAnswered)}>
          {allAnswered ? '記錄量表' : '請填寫全部 6 題'}
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// 設定頁
// ============================================================================

function SettingsPage({ theme, isMobile, themeKey, onChangeTheme, onExportDaily, onImportDaily, onExportRelationships, onImportRelationships, onExportReviews, onImportReviews, user, syncStatus, lastSyncAt, onSyncNow, onSignIn, onSignOut }) {
  const dailyFileRef = useRef(null);
  const relFileRef = useRef(null);
  const reviewsFileRef = useRef(null);
  const font = "'Noto Serif TC', serif";

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: isMobile ? '20px 16px 100px' : '32px 24px 80px' }}>
      <h2 style={{ margin: '0 0 28px', fontSize: 20, fontWeight: 500, color: theme.t1, fontFamily: font }}>設定</h2>

      {/* 主題切換 */}
      <div style={{ ...cardStyle(theme), marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 500, color: theme.t1, fontFamily: font }}>主題</h3>
        <div style={{ display: 'flex', gap: 12 }}>
          {Object.entries(themes).map(([key, t]) => (
            <button key={key} onClick={() => onChangeTheme(key)} style={{
              flex: 1, padding: '14px 12px', borderRadius: 12, cursor: 'pointer',
              background: t.bgCard, border: themeKey === key ? '2px solid ' + theme.accent : '0.5px solid ' + t.border,
              transition: 'all 150ms', textAlign: 'left',
            }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: t.accent }} />
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: t.coral }} />
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: t.navy }} />
              </div>
              <div style={{ fontSize: 13, fontWeight: 500, color: t.t1, fontFamily: font }}>{t.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 日常紀錄 */}
      <div style={{ ...cardStyle(theme), marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 500, color: theme.t1, fontFamily: font }}>日常紀錄</h3>
        <div style={{ fontSize: 12, color: theme.t3, marginBottom: 14 }}>晨間錨點 · 週日見證 · 月度獨處 · 小勇敢 · 儀式紀錄</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={onExportDaily} style={{ ...btnSecondary(theme), display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
            <Icon name="download" size={16} color={theme.t2} />
            匯出 daily.json
          </button>
          <div>
            <button onClick={() => dailyFileRef.current?.click()} style={{ ...btnSecondary(theme), display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', width: '100%' }}>
              <Icon name="upload" size={16} color={theme.t2} />
              匯入 daily.json
            </button>
            <input ref={dailyFileRef} type="file" accept="application/json" onChange={onImportDaily} style={{ display: 'none' }} />
          </div>
        </div>
      </div>

      {/* 關係資料 */}
      <div style={{ ...cardStyle(theme), marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 500, color: theme.t1, fontFamily: font }}>關係資料</h3>
        <div style={{ fontSize: 12, color: theme.t3, marginBottom: 14 }}>關係追蹤 · 暈船量表 · 地面朋友 · 辨識工具 · 降低捲入 · 開放標記 · AI 對話</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={onExportRelationships} style={{ ...btnSecondary(theme), display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
            <Icon name="download" size={16} color={theme.t2} />
            匯出 relationships.json
          </button>
          <div>
            <button onClick={() => relFileRef.current?.click()} style={{ ...btnSecondary(theme), display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', width: '100%' }}>
              <Icon name="upload" size={16} color={theme.t2} />
              匯入 relationships.json
            </button>
            <input ref={relFileRef} type="file" accept="application/json" onChange={onImportRelationships} style={{ display: 'none' }} />
          </div>
        </div>
      </div>

      {/* 回顧紀錄 */}
      <div style={{ ...cardStyle(theme), marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 500, color: theme.t1, fontFamily: font }}>回顧紀錄</h3>
        <div style={{ fontSize: 12, color: theme.t3, marginBottom: 14 }}>季度回顧 · 年度卷軸（含封存信件）</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={onExportReviews} style={{ ...btnSecondary(theme), display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
            <Icon name="download" size={16} color={theme.t2} />
            匯出 reviews.json
          </button>
          <div>
            <button onClick={() => reviewsFileRef.current?.click()} style={{ ...btnSecondary(theme), display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', width: '100%' }}>
              <Icon name="upload" size={16} color={theme.t2} />
              匯入 reviews.json
            </button>
            <input ref={reviewsFileRef} type="file" accept="application/json" onChange={onImportReviews} style={{ display: 'none' }} />
          </div>
        </div>
      </div>

      {/* 帳號與同步 */}
      <div style={{ ...cardStyle(theme), marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 500, color: theme.t1, fontFamily: font }}>帳號與同步</h3>
        {user ? (
          <div>
            <div style={{ fontSize: 13, color: theme.t2, marginBottom: 12 }}>
              <span style={{ color: theme.t1, fontWeight: 500 }}>{user.displayName || user.email?.split('@')[0]}</span>
              <span style={{ color: theme.t3, fontSize: 11, display: 'block', marginTop: 2 }}>{user.email}</span>
            </div>
            <div style={{ fontSize: 12, color: theme.t3, marginBottom: 12 }}>
              同步狀態：{syncStatus === 'synced' ? '已同步' : syncStatus === 'syncing' ? '同步中…' : syncStatus === 'offline' ? '離線' : '同步失敗'}
              {lastSyncAt && <span>・上次：{(() => {
                const diff = Date.now() - lastSyncAt;
                const mins = Math.floor(diff / 60000);
                if (mins < 1) return '剛剛';
                if (mins < 60) return mins + ' 分鐘前';
                return Math.floor(diff / 3600000) + ' 小時前';
              })()}</span>}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={onSyncNow} disabled={syncStatus === 'syncing'}
                style={{ ...btnSecondary(theme), flex: 1, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', opacity: syncStatus === 'syncing' ? 0.5 : 1 }}>
                <Icon name="refresh" size={16} color={theme.t2} />
                立即同步
              </button>
              <button onClick={onSignOut} style={{ ...btnSecondary(theme), flex: 1, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                <Icon name="logout" size={16} color={theme.t2} />
                登出
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: 13, color: theme.t3, marginBottom: 12, lineHeight: 1.6 }}>登入後可跨裝置同步資料（手機 + 電腦）。</div>
            <button onClick={onSignIn} style={{ ...btnPrimary(theme), width: '100%', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
              <Icon name="login" size={16} color={theme.accentText} />
              使用 Google 登入
            </button>
          </div>
        )}
      </div>

      {/* 關於 */}
      <div style={{ ...cardStyle(theme) }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 500, color: theme.t1, fontFamily: font }}>關於</h3>
        <div style={{ fontSize: 13, color: theme.t2, lineHeight: 1.7 }}>
          <div>Inner Compass</div>
          <div style={{ color: theme.t3, marginTop: 4 }}>版本 {TOOL_VERSION}</div>
          <div style={{ color: theme.t3, marginTop: 8, fontStyle: 'italic', fontSize: 12 }}>
            這是 Mio 的內在空間。不是打卡 app，不是管理系統。
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 底部導航列 (mobile)
// ============================================================================

function BottomNav({ currentPage, onNavigate, theme }) {
  const items = [
    { page: PAGES.HOME, icon: 'home', label: '首頁' },
    { page: PAGES.DAILY, icon: 'calendar', label: '日常' },
    { page: PAGES.RITUAL, icon: 'feather', label: '儀式' },
    { page: PAGES.COURAGE, icon: 'star', label: '勇敢' },
    { page: PAGES.SETTINGS, icon: 'settings', label: '設定' },
  ];
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      height: 56, background: theme.bgCard,
      borderTop: '0.5px solid ' + theme.border,
      boxShadow: '0 -4px 12px rgba(0,0,0,0.06)',
      display: 'flex', alignItems: 'center',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {items.map(item => (
        <button key={item.page} onClick={() => onNavigate(item.page)} style={{
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
          background: 'transparent', border: 'none', cursor: 'pointer',
          color: currentPage === item.page ? theme.accent : theme.t3,
          padding: '8px 4px', minHeight: 44, transition: 'color 150ms',
        }}>
          <Icon name={item.icon} size={18} color={currentPage === item.page ? theme.accent : theme.t3} />
          <span style={{ fontSize: 10, fontFamily: "'Noto Serif TC', serif" }}>{item.label}</span>
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// 桌機側邊導航
// ============================================================================

function SideNav({ currentPage, onNavigate, theme }) {
  const items = [
    { page: PAGES.HOME, icon: 'home', label: '首頁' },
    { page: PAGES.DAILY, icon: 'calendar', label: '日常層' },
    { page: PAGES.RITUAL, icon: 'feather', label: '儀式菜單' },
    { page: PAGES.COURAGE, icon: 'star', label: '小勇敢' },
    { page: PAGES.RELATIONSHIP, icon: 'heart', label: '關係管理' },
    { page: PAGES.SUPPORT, icon: 'leaf', label: '關係支援' },
    { page: PAGES.REVIEW, icon: 'bookOpen', label: '回顧' },
    { page: PAGES.SETTINGS, icon: 'settings', label: '設定' },
  ];
  return (
    <div style={{
      width: 200, flexShrink: 0, padding: '24px 16px',
      borderRight: '0.5px solid ' + theme.border,
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <div style={{ fontSize: 18, fontWeight: 500, color: theme.t1, padding: '0 12px 20px', fontFamily: "'Noto Serif TC', serif", letterSpacing: '0.04em' }}>
        Inner Compass
      </div>
      {items.map(item => (
        <button key={item.page} onClick={() => onNavigate(item.page)} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: currentPage === item.page ? theme.accentLight : 'transparent',
          border: 'none', borderRadius: 8, padding: '10px 12px',
          color: currentPage === item.page ? theme.accent : theme.t2,
          cursor: 'pointer', fontSize: 14, transition: 'all 150ms', textAlign: 'left',
          fontFamily: "'Noto Serif TC', serif",
        }}>
          <Icon name={item.icon} size={16} color={currentPage === item.page ? theme.accent : theme.t2} />
          {item.label}
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// 主 App
// ============================================================================

export default function App() {
  const isTouch = useRef(typeof window !== 'undefined' && window.matchMedia('(pointer:coarse)').matches).current;
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const isMobile = windowWidth < 640;
  const isTablet = windowWidth >= 640 && windowWidth < 1024;

  useEffect(() => {
    const h = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  // ── Auth ───────────────────────────────────────────────────────────────────
  const { user, login, logout } = useAuth();

  // ── Sync（替代 15 個 useState + localStorage useEffect）─────────────────
  const {
    morningAnchors, sundayWitnesses, monthlySolos, smallCourages, ritualEntries,
    relationships, depthGauges, groundFriends, groundFriendCheckIns, openMarks,
    identificationAssessments, loweringProtocols, aiCompanionSessions,
    quarterlyReviews, yearlyReviews, themeKey,
    setMorningAnchors, setSundayWitnesses, setMonthlySolos, setSmallCourages, setRitualEntries,
    setRelationships, setDepthGauges, setGroundFriends, setGroundFriendCheckIns, setOpenMarks,
    setIdentificationAssessments, setLoweringProtocols, setAiCompanionSessions,
    setQuarterlyReviews, setYearlyReviews, setThemeKey,
    syncStatus, lastSyncAt, syncNow,
    mergeModal, resolveUseCloud, resolveUseLocal,
  } = useSync(user);

  const theme = themes[themeKey];

  // ── 頁面導航 ────────────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(PAGES.HOME);
  const [pageParams, setPageParams] = useState({});
  const [relSubPage, setRelSubPage] = useState({ type: 'list' });
  const navigate = useCallback((page, tab) => {
    setCurrentPage(page);
    if (page === PAGES.RELATIONSHIP) setRelSubPage({ type: 'list' });
    if (tab) setPageParams(p => ({ ...p, [page]: { tab } }));
  }, []);

  // Toast
  const [toasts, setToasts] = useState([]);
  const showToast = useCallback((type, message, action) => {
    const id = genId();
    const dur = type === 'error' ? 5000 : action ? 8000 : 3000;
    setToasts(p => [...p, { id, type, message, action }]);
    setTimeout(() => setToasts(p => p.filter(x => x.id !== id)), dur);
  }, []);
  const dismissToast = useCallback((id) => setToasts(p => p.filter(x => x.id !== id)), []);

  // UI
  const [menuOpen, setMenuOpen] = useState(false);

  // ---- 資料操作 ----
  const saveMorning = useCallback((entry) => {
    setMorningAnchors(prev => {
      const idx = prev.findIndex(a => a.id === entry.id);
      return idx >= 0 ? prev.map((a, i) => i === idx ? entry : a) : [entry, ...prev];
    });
    showToast('neutral', '錨點已儲存');
  }, [showToast]);

  const saveSunday = useCallback((entry) => {
    setSundayWitnesses(prev => {
      const idx = prev.findIndex(w => w.id === entry.id);
      return idx >= 0 ? prev.map((w, i) => i === idx ? entry : w) : [entry, ...prev];
    });
    showToast('neutral', '這週的你，已被見證。');
  }, [showToast]);

  const saveMonthly = useCallback((entry) => {
    setMonthlySolos(prev => {
      const idx = prev.findIndex(s => s.id === entry.id);
      return idx >= 0 ? prev.map((s, i) => i === idx ? entry : s) : [entry, ...prev];
    });
    showToast('neutral', '已儲存');
  }, [showToast]);

  const saveCourage = useCallback((entry) => {
    setSmallCourages(prev => [entry, ...prev]);
    showToast('neutral', '勇敢記下了。');
  }, [showToast]);

  const deleteCourage = useCallback((id) => {
    const deleted = smallCourages.find(c => c.id === id);
    setSmallCourages(prev => prev.filter(c => c.id !== id));
    if (deleted) {
      showToast('neutral', '已刪除', {
        label: '復原',
        onClick: () => setSmallCourages(prev => [deleted, ...prev]),
      });
    }
  }, [smallCourages, showToast]);

  const editCourage = useCallback((updated) => {
    setSmallCourages(prev => prev.map(c => c.id === updated.id ? updated : c));
    showToast('neutral', '已更新');
  }, [showToast]);

  const deleteMorning = useCallback((id) => {
    const deleted = morningAnchors.find(a => a.id === id);
    setMorningAnchors(prev => prev.filter(a => a.id !== id));
    if (deleted) {
      showToast('neutral', '已刪除', {
        label: '復原',
        onClick: () => setMorningAnchors(prev => [deleted, ...prev]),
      });
    }
  }, [morningAnchors, showToast]);

  const deleteMonthly = useCallback((id) => {
    const deleted = monthlySolos.find(s => s.id === id);
    setMonthlySolos(prev => prev.filter(s => s.id !== id));
    if (deleted) {
      showToast('neutral', '已刪除', {
        label: '復原',
        onClick: () => setMonthlySolos(prev => [deleted, ...prev]),
      });
    }
  }, [monthlySolos, showToast]);

  const saveRitual = useCallback((entry) => {
    setRitualEntries(prev => [entry, ...prev]);
    showToast('neutral', '儀式感想已記錄。');
  }, [showToast]);

  const editRitual = useCallback((updated) => {
    setRitualEntries(prev => prev.map(e => e.id === updated.id ? updated : e));
    showToast('neutral', '已更新');
  }, [showToast]);

  const deleteRitual = useCallback((id) => {
    const deleted = ritualEntries.find(e => e.id === id);
    setRitualEntries(prev => prev.filter(e => e.id !== id));
    if (deleted) {
      showToast('neutral', '已刪除', {
        label: '復原',
        onClick: () => setRitualEntries(prev => [deleted, ...prev]),
      });
    }
  }, [ritualEntries, showToast]);

  // ---- 關係 ----
  const saveRelationship = useCallback((rel) => {
    setRelationships(prev => [rel, ...prev]);
  }, []);

  const updateRelationship = useCallback((rel) => {
    setRelationships(prev => prev.map(r => r.id === rel.id ? rel : r));
  }, []);

  const saveDepthGauge = useCallback((gauge) => {
    setDepthGauges(prev => [gauge, ...prev]);
    showToast('neutral', '量表已記錄。');
  }, [showToast]);

  // ---- 關係支援資料操作 ----
  const saveGroundFriend = useCallback((friend) => {
    setGroundFriends(prev => {
      const idx = prev.findIndex(f => f.id === friend.id);
      return idx >= 0 ? prev.map((f, i) => i === idx ? friend : f) : [friend, ...prev];
    });
  }, []);

  const deleteGroundFriend = useCallback((id) => {
    setGroundFriends(prev => prev.filter(f => f.id !== id));
    setGroundFriendCheckIns(prev => prev.filter(c => c.groundFriendId !== id));
  }, []);

  const saveGroundFriendCheckIn = useCallback((checkIn) => {
    setGroundFriendCheckIns(prev => [checkIn, ...prev]);
    setGroundFriends(prev => prev.map(f =>
      f.id === checkIn.groundFriendId ? { ...f, lastContactDate: checkIn.date } : f
    ));
    showToast('neutral', '對話已記錄。');
  }, [showToast]);

  const saveOpenMark = useCallback((mark) => {
    setOpenMarks(prev => {
      const idx = prev.findIndex(m => m.id === mark.id);
      return idx >= 0 ? prev.map((m, i) => i === idx ? mark : m) : [mark, ...prev];
    });
  }, []);

  const saveIdentificationAssessment = useCallback((assessment) => {
    setIdentificationAssessments(prev => [assessment, ...prev]);
    showToast('neutral', '核對已儲存。');
  }, [showToast]);

  const saveLoweringProtocol = useCallback((protocol) => {
    setLoweringProtocols(prev => {
      const idx = prev.findIndex(p => p.id === protocol.id);
      return idx >= 0 ? prev.map((p, i) => i === idx ? protocol : p) : [protocol, ...prev];
    });
  }, []);

  const saveAiSession = useCallback((session) => {
    setAiCompanionSessions(prev => [session, ...prev]);
  }, []);

  const saveQuarterlyReview = useCallback((review) => {
    setQuarterlyReviews(prev => {
      const idx = prev.findIndex(r => r.quarter === review.quarter);
      return idx >= 0 ? prev.map((r, i) => i === idx ? review : r) : [review, ...prev];
    });
    showToast('neutral', '季度回顧已儲存。');
  }, [showToast]);

  const saveYearlyReview = useCallback((review) => {
    setYearlyReviews(prev => {
      const idx = prev.findIndex(r => r.year === review.year);
      return idx >= 0 ? prev.map((r, i) => i === idx ? review : r) : [review, ...prev];
    });
    showToast('neutral', review.letterSealed ? '信件已封存。' : '年度卷軸已儲存。');
  }, [showToast]);

  // ---- 匯出 ----
  const handleExportDaily = useCallback(() => {
    const payload = {
      version: '1.0',
      type: 'inner-compass-daily',
      exportedAt: new Date().toISOString(),
      data: { morningAnchors, sundayWitnesses, monthlySolos, smallCourages, ritualEntries },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inner-compass-daily-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('neutral', '日常紀錄已匯出');
    setMenuOpen(false);
  }, [morningAnchors, sundayWitnesses, monthlySolos, smallCourages, ritualEntries, showToast]);

  // ---- 匯入 ----
  const handleImportDaily = useCallback((e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (imported.type !== 'inner-compass-daily') { showToast('error', '檔案格式不符'); return; }
        const d = imported.data;
        if (d.morningAnchors) setMorningAnchors(d.morningAnchors);
        if (d.sundayWitnesses) setSundayWitnesses(d.sundayWitnesses);
        if (d.monthlySolos) setMonthlySolos(d.monthlySolos);
        if (d.smallCourages) setSmallCourages(d.smallCourages);
        if (d.ritualEntries) setRitualEntries(d.ritualEntries);
        showToast('neutral', '日常紀錄已匯入');
      } catch { showToast('error', '匯入失敗：檔案解析錯誤'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [showToast]);

  const navigateToRelDetail = useCallback((id) => {
    setCurrentPage(PAGES.RELATIONSHIP);
    setRelSubPage({ type: 'detail', id });
  }, []);

  const handleExportRelationships = useCallback(() => {
    const payload = {
      version: '1.0',
      type: 'inner-compass-relationships',
      exportedAt: new Date().toISOString(),
      data: {
        relationships, depthGauges,
        groundFriends, groundFriendCheckIns,
        openMarks, identificationAssessments,
        loweringProtocols, aiCompanionSessions,
      },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inner-compass-relationships-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('neutral', '關係資料已匯出');
  }, [relationships, depthGauges, groundFriends, groundFriendCheckIns, openMarks, identificationAssessments, loweringProtocols, aiCompanionSessions, showToast]);

  const handleImportRelationships = useCallback((e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (imported.type !== 'inner-compass-relationships') { showToast('error', '檔案格式不符'); return; }
        const d = imported.data;
        if (d.relationships) setRelationships(d.relationships);
        if (d.depthGauges) setDepthGauges(d.depthGauges);
        if (d.groundFriends) setGroundFriends(d.groundFriends);
        if (d.groundFriendCheckIns) setGroundFriendCheckIns(d.groundFriendCheckIns);
        if (d.openMarks) setOpenMarks(d.openMarks);
        if (d.identificationAssessments) setIdentificationAssessments(d.identificationAssessments);
        if (d.loweringProtocols) setLoweringProtocols(d.loweringProtocols);
        if (d.aiCompanionSessions) setAiCompanionSessions(d.aiCompanionSessions);
        showToast('neutral', '關係資料已匯入');
      } catch { showToast('error', '匯入失敗：檔案解析錯誤'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [showToast]);

  const handleExportReviews = useCallback(() => {
    const payload = {
      version: '1.0',
      type: 'inner-compass-reviews',
      exportedAt: new Date().toISOString(),
      data: { quarterlyReviews, yearlyReviews },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inner-compass-reviews-' + new Date().toISOString().slice(0, 10) + '.json';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('neutral', '回顧紀錄已匯出');
  }, [quarterlyReviews, yearlyReviews, showToast]);

  const handleImportReviews = useCallback((e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result);
        if (imported.type !== 'inner-compass-reviews') { showToast('error', '檔案格式不符'); return; }
        const d = imported.data;
        if (d.quarterlyReviews) setQuarterlyReviews(d.quarterlyReviews);
        if (d.yearlyReviews) setYearlyReviews(d.yearlyReviews);
        showToast('neutral', '回顧紀錄已匯入');
      } catch { showToast('error', '匯入失敗：檔案解析錯誤'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  }, [showToast]);

  const fontFamily = "'Noto Serif TC', 'Songti TC', Georgia, serif";

  return (
    <div style={{ minHeight: '100dvh', background: theme.bg, color: theme.t1, fontFamily }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@300;400;500&display=swap');
        @keyframes toastIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes pulseDot { 0%, 100% { opacity: 0.55; transform: scale(1); } 50% { opacity: 1; transform: scale(1.5); } }
        @keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; } }
        button:focus-visible, input:focus-visible, textarea:focus-visible { outline: 2px solid ${theme.accent}; outline-offset: 2px; }
        input::placeholder, textarea::placeholder { color: ${theme.t3}; }
        * { box-sizing: border-box; }
        input[type="date"] { color-scheme: light; }
      `}</style>

      {/* Header (mobile only, 桌機用 SideNav) */}
      {isMobile && (
        <header style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: theme.bg, borderBottom: '0.5px solid ' + theme.border,
          padding: '0 16px', height: 56,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ fontSize: 17, fontWeight: 500, color: theme.t1, fontFamily, letterSpacing: '0.04em' }}>
            Inner Compass
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, position: 'relative' }}>
            <SyncIndicator status={syncStatus} theme={theme} />
            <button onClick={(e) => { e.stopPropagation(); setMenuOpen(v => !v); }} style={{
              background: 'transparent', border: 'none', color: theme.t1, cursor: 'pointer', padding: 6,
              borderRadius: 6, display: 'flex', alignItems: 'center', minWidth: 32, minHeight: 32,
            }}>
              <Icon name="menu" size={20} />
            </button>
            <HamburgerMenu
              open={menuOpen} onClose={() => setMenuOpen(false)}
              theme={theme} themeKey={themeKey}
              onChangeTheme={() => { setThemeKey(themeKey === 'ritual-warm' ? 'ritual-light' : 'ritual-warm'); setMenuOpen(false); }}
              onExportDaily={() => { handleExportDaily(); setMenuOpen(false); }}
              user={user} syncStatus={syncStatus} lastSyncAt={lastSyncAt}
              onSyncNow={() => { syncNow(); setMenuOpen(false); }}
              onSignIn={() => { login(); setMenuOpen(false); }}
              onSignOut={() => { logout(); setMenuOpen(false); }}
            />
          </div>
        </header>
      )}

      {/* Layout */}
      <div style={{ display: 'flex', minHeight: isMobile ? 'calc(100dvh - 56px)' : '100dvh' }}>
        {/* 桌機側欄 */}
        {!isMobile && (
          <SideNav currentPage={currentPage} onNavigate={navigate} theme={theme} />
        )}

        {/* 主內容 */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {currentPage === PAGES.HOME && (
            <HomePage theme={theme} isMobile={isMobile} onNavigate={navigate}
              morningAnchors={morningAnchors} sundayWitnesses={sundayWitnesses} ritualEntries={ritualEntries}
              relationships={relationships} onNavigateToRelDetail={navigateToRelDetail} />
          )}
          {currentPage === PAGES.DAILY && (
            <DailyPage theme={theme} isMobile={isMobile}
              initialTab={pageParams[PAGES.DAILY]?.tab}
              morningAnchors={morningAnchors} sundayWitnesses={sundayWitnesses} monthlySolos={monthlySolos}
              onSaveMorning={saveMorning} onDeleteMorning={deleteMorning}
              onSaveSunday={saveSunday}
              onSaveMonthly={saveMonthly} onDeleteMonthly={deleteMonthly} />
          )}
          {currentPage === PAGES.RITUAL && (
            <RitualPage theme={theme} isMobile={isMobile} ritualEntries={ritualEntries}
              onSave={saveRitual} onEdit={editRitual} onDelete={deleteRitual} />
          )}
          {currentPage === PAGES.COURAGE && (
            <CouragePage theme={theme} isMobile={isMobile} smallCourages={smallCourages} onSave={saveCourage} onDelete={deleteCourage} onEdit={editCourage} />
          )}
          {currentPage === PAGES.RELATIONSHIP && (
            relSubPage.type === 'list' ? (
              <RelationshipListPage
                theme={theme} isMobile={isMobile}
                relationships={relationships}
                onCreateRelationship={saveRelationship}
                onNavigateToDetail={(id) => setRelSubPage({ type: 'detail', id })}
              />
            ) : relSubPage.type === 'detail' ? (
              <RelationshipDetailPage
                theme={theme} isMobile={isMobile}
                relationship={relationships.find(r => r.id === relSubPage.id)}
                depthGauges={depthGauges.filter(g => g.relationshipId === relSubPage.id)}
                onBack={() => setRelSubPage({ type: 'list' })}
                onNavigateToGauge={(relId) => setRelSubPage({ type: 'gauge', relationshipId: relId })}
                onUpdateRelationship={updateRelationship}
                showToast={showToast}
              />
            ) : relSubPage.type === 'gauge' ? (
              <DepthGaugePage
                theme={theme} isMobile={isMobile}
                relationship={relationships.find(r => r.id === relSubPage.relationshipId)}
                onBack={() => setRelSubPage({ type: 'detail', id: relSubPage.relationshipId })}
                onSave={(gauge) => { saveDepthGauge(gauge); setRelSubPage({ type: 'detail', id: relSubPage.relationshipId }); }}
              />
            ) : null
          )}
          {currentPage === PAGES.SUPPORT && (
            <RelationshipSupportPage
              theme={theme} isMobile={isMobile}
              relationships={relationships}
              groundFriends={groundFriends}
              groundFriendCheckIns={groundFriendCheckIns}
              openMarks={openMarks}
              identificationAssessments={identificationAssessments}
              loweringProtocols={loweringProtocols}
              depthGauges={depthGauges}
              aiCompanionSessions={aiCompanionSessions}
              onSaveFriend={saveGroundFriend}
              onDeleteFriend={deleteGroundFriend}
              onSaveCheckIn={saveGroundFriendCheckIn}
              onSaveMark={saveOpenMark}
              onSaveAssessment={saveIdentificationAssessment}
              onSaveProtocol={saveLoweringProtocol}
              onSaveSession={saveAiSession}
            />
          )}
          {currentPage === PAGES.REVIEW && (
            <ReviewPage
              theme={theme} isMobile={isMobile}
              quarterlyReviews={quarterlyReviews} yearlyReviews={yearlyReviews}
              sundayWitnesses={sundayWitnesses} smallCourages={smallCourages}
              onSaveQuarterly={saveQuarterlyReview} onSaveYearly={saveYearlyReview}
            />
          )}
          {currentPage === PAGES.SETTINGS && (
            <SettingsPage theme={theme} isMobile={isMobile} themeKey={themeKey}
              onChangeTheme={setThemeKey}
              onExportDaily={handleExportDaily}
              onImportDaily={handleImportDaily}
              onExportRelationships={handleExportRelationships}
              onImportRelationships={handleImportRelationships}
              onExportReviews={handleExportReviews}
              onImportReviews={handleImportReviews}
              user={user} syncStatus={syncStatus} lastSyncAt={lastSyncAt}
              onSyncNow={syncNow} onSignIn={login} onSignOut={logout} />
          )}
        </div>
      </div>

      {/* 底部導航 (mobile) */}
      {isMobile && <BottomNav currentPage={currentPage} onNavigate={navigate} theme={theme} />}

      {/* 雲端資料合併確認 Modal */}
      {mergeModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 2000, padding: 16,
        }}>
          <div style={{
            background: theme.bgCard, borderRadius: 12, padding: 24,
            maxWidth: 380, width: '100%',
            border: '0.5px solid ' + theme.border,
          }}>
            <div style={{ fontSize: 16, fontWeight: 500, color: theme.t1, marginBottom: 10, fontFamily: "'Noto Serif TC', serif" }}>
              偵測到雲端資料
            </div>
            <div style={{ fontSize: 14, color: theme.t2, lineHeight: 1.7, marginBottom: 20 }}>
              雲端和本機都有資料，要用哪一份？
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={resolveUseLocal} style={{ ...btnSecondary(theme), flex: 1 }}>用本機資料</button>
              <button onClick={resolveUseCloud} style={{ ...btnPrimary(theme), flex: 1 }}>用雲端資料</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} theme={theme} isMobile={isMobile} />
    </div>
  );
}
