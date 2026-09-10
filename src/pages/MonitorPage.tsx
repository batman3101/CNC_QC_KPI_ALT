/**
 * MonitorPage - TV Monitor Dashboard (1920x1080)
 * Full viewport, no scrolling, dark theme
 * Auto language switch + data refresh every 2 minutes
 */

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LabelList,
} from 'recharts'

import { EMPTY_PUBLIC_MONITOR_SUMMARY, getPublicMonitorSummary } from '@/services/monitorService'
import {
  getBusinessDayEnd,
  getBusinessDayStart,
  getTodayBusinessDate,
} from '@/lib/dateUtils'
import { defectTypeLabel } from '@/lib/defectTypeLabel'
import { useFactoryStore } from '@/stores/factoryStore'

const AUTO_REFRESH_INTERVAL = 2 * 60 * 1000

const PIE_COLORS = ['#ef4444', '#22c55e', '#3b82f6', '#f97316', '#a855f7', '#eab308', '#06b6d4', '#ec4899']

const RANK_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6']

export function MonitorPage() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const { activeFactoryId, setActiveFactory } = useFactoryStore()
  const monitorFactoryId = activeFactoryId ?? 'ALT'

  const [currentTime, setCurrentTime] = useState(new Date())

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Auto language switch + data refresh
  //
  // The board alternates ko/vi so both shifts can read it. i18n.changeLanguage
  // is app-wide and the detector caches the result in localStorage, so leaving
  // this page used to leave the whole app - and every future session - stuck in
  // whichever language the board happened to be showing. Restore the language
  // the user actually chose when the board unmounts.
  useEffect(() => {
    const userLanguage = i18n.language

    const interval = setInterval(() => {
      const newLang = i18n.language === 'ko' ? 'vi' : 'ko'
      i18n.changeLanguage(newLang)
      queryClient.invalidateQueries({ queryKey: ['public-monitor-data', monitorFactoryId] })
    }, AUTO_REFRESH_INTERVAL)

    return () => {
      clearInterval(interval)
      if (i18n.language !== userLanguage) {
        i18n.changeLanguage(userLanguage)
      }
    }
  }, [i18n, queryClient, monitorFactoryId])

  const timeStr = currentTime.toLocaleTimeString('ko-KR', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false })
  const dateStr = currentTime.toLocaleDateString('ko-KR', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })
  const todayBusinessDate = getTodayBusinessDate()
  const currentBusinessMonth = todayBusinessDate.slice(0, 7)
  const businessMonthStartDate = `${currentBusinessMonth}-01`
  const businessMonthEndDay = new Date(
    Number(currentBusinessMonth.slice(0, 4)),
    Number(currentBusinessMonth.slice(5, 7)),
    0
  ).getDate()
  const businessMonthEndDate = `${currentBusinessMonth}-${String(businessMonthEndDay).padStart(2, '0')}`
  const businessMonthRange = useMemo(() => ({
    startDate: getBusinessDayStart(businessMonthStartDate).toISOString(),
    endDate: getBusinessDayEnd(businessMonthEndDate).toISOString(),
  }), [businessMonthStartDate, businessMonthEndDate])

  // Queries
  //
  // Every number on this board is rejected *pieces* (sum of
  // inspections.defect_quantity), aggregated on the server so it matches the
  // analytics KPI card. It used to count defect records instead, which read
  // 272 for a day the app reported as 996.
  const { data: summary = EMPTY_PUBLIC_MONITOR_SUMMARY, isLoading: defectsLoading, isError } = useQuery({
    queryKey: ['public-monitor-data', monitorFactoryId, currentBusinessMonth],
    queryFn: () => getPublicMonitorSummary(
      monitorFactoryId,
      businessMonthRange.startDate,
      businessMonthRange.endDate
    ),
  })

  // Helpers
  const getDefectTypeName = useCallback((name: string): string => defectTypeLabel(name, t), [t])

  const getMachineName = useCallback((machineName: string | null): string => {
    return machineName || t('common.unassigned', '미지정')
  }, [t])

  const getModelCode = useCallback((modelCode: string | null): string => {
    return modelCode || t('common.notAvailable')
  }, [t])

  // Computed data
  const totalDefects = summary.total_defect_qty

  const todayDefectQty = useMemo(() =>
    summary.daily.find(d => d.business_day === todayBusinessDate)?.defect_qty ?? 0,
    [summary.daily, todayBusinessDate]
  )

  const worstMachine = summary.machines[0] ?? null

  const topIssue = summary.defect_types[0] ?? null

  const dailyDefectTrend = useMemo(() => {
    const days: { date: string; count: number }[] = []
    const [year, month, todayDay] = todayBusinessDate.split('-').map(Number)
    const byDay = new Map(summary.daily.map(d => [d.business_day, d.defect_qty]))

    for (let day = 1; day <= todayDay; day++) {
      const bd = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const label = `${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')}.`
      days.push({ date: label, count: byDay.get(bd) ?? 0 })
    }
    return days
  }, [summary.daily, todayBusinessDate])

  // The server already returns the top 5 machines and top 8 models. Shares are
  // computed against the month total, not against the truncated list.
  const topMachines = summary.machines

  const defectTypeDistribution = useMemo(() => {
    const total = summary.total_defect_qty || 1
    return summary.defect_types.map(d => ({
      type: d.defect_type_name,
      name: getDefectTypeName(d.defect_type_name),
      count: d.defect_qty,
      percent: Math.round((d.defect_qty / total) * 100),
    }))
  }, [summary.defect_types, summary.total_defect_qty, getDefectTypeName])

  const modelDefectShare = useMemo(() => {
    const total = summary.total_defect_qty || 1
    return summary.models.map(m => ({
      modelId: m.model_id ?? 'unknown',
      name: getModelCode(m.model_code),
      count: m.defect_qty,
      percent: Math.round((m.defect_qty / total) * 100),
    }))
  }, [summary.models, summary.total_defect_qty, getModelCode])

  const recentDefects = summary.recent


  // Skeleton block helper
  const Skeleton = ({ className = '' }: { className?: string }) => (
    <div className={`animate-pulse bg-slate-700 rounded ${className}`} />
  )

  // Section title with red left border
  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-center gap-2.5 mb-3">
      <div className="w-1 h-6 bg-red-500 rounded-full" />
      <h3 className="text-xl font-bold text-slate-100">{children}</h3>
    </div>
  )

  const maxMachineCount = topMachines.length > 0 ? topMachines[0].defect_qty : 1

  if (isError) {
    return (
      <div className="h-screen w-screen bg-[#0f172a] overflow-hidden flex items-center justify-center">
        <div className="text-red-500 text-center py-4">{t('monitor.loadingFailed')}</div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen bg-[#0f172a] overflow-hidden flex flex-col p-3 gap-2">
      {/* HEADER ~8vh */}
      <header className="flex items-center justify-between" style={{ height: '8vh' }}>
        <div className="flex items-center gap-3">
          <img src="/A symbol BLUE-02.png" className="w-12 h-12" alt="logo" />
          <div>
            <h1 className="text-2xl font-bold text-white">{monitorFactoryId === 'ALV' ? 'ALMUS VINA' : 'ALMUS TECH'} {t('monitor.title')}</h1>
            <p className="text-base text-slate-400">{t('monitor.teamName').replace('ALMUS TECH', monitorFactoryId === 'ALV' ? 'ALMUS VINA' : 'ALMUS TECH')}</p>
          </div>
          <div className="flex gap-1 ml-2">
            <button
              onClick={() => setActiveFactory('ALT')}
              className={`px-3 py-1 rounded text-sm font-bold ${monitorFactoryId === 'ALT' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}
            >ALT</button>
            <button
              onClick={() => setActiveFactory('ALV')}
              className={`px-3 py-1 rounded text-sm font-bold ${monitorFactoryId === 'ALV' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}
            >ALV</button>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-mono font-bold text-white">{timeStr}</div>
          <div className="text-base text-slate-400">{dateStr}</div>
        </div>
      </header>

      {/* KPI CARDS ~12vh */}
      <section className="grid grid-cols-4 gap-3" style={{ height: '12vh' }}>
        {/* Total Defects */}
        <div className="bg-[#1e293b] rounded-xl p-4 border border-[#334155] flex items-center gap-4">
          <div className="text-4xl">&#128293;</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-300 truncate">{t('monitor.totalDefects')}</p>
            {defectsLoading ? <Skeleton className="h-10 w-20 mt-1" /> : (
              <p className="text-5xl font-bold text-red-500 leading-none">{totalDefects.toLocaleString()}</p>
            )}
            <p className="text-sm text-slate-400 mt-1">{t('monitor.totalDefectsDesc')}</p>
          </div>
        </div>
        {/* Today Defects */}
        <div className="bg-[#1e293b] rounded-xl p-4 border border-[#334155] flex items-center gap-4">
          <div className="text-4xl">&#128197;</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-300 truncate">{t('monitor.todayDefects')}</p>
            {defectsLoading ? <Skeleton className="h-10 w-20 mt-1" /> : (
              <p className="text-5xl font-bold text-green-500 leading-none">{todayDefectQty.toLocaleString()}</p>
            )}
            <p className="text-sm text-slate-400 mt-1">{t('monitor.todayDefectsDesc')}</p>
          </div>
        </div>
        {/* Worst Machine */}
        <div className="bg-[#1e293b] rounded-xl p-4 border border-[#334155] flex items-center gap-4">
          <div className="text-4xl">&#127981;</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-300 truncate">{t('monitor.worstMachine')}</p>
            {defectsLoading ? <Skeleton className="h-10 w-20 mt-1" /> : (
              <>
                <p className="text-4xl font-bold text-white leading-none truncate">{worstMachine ? getMachineName(worstMachine.machine_name) : '-'}</p>
                <p className="text-sm text-slate-400 mt-1">{worstMachine?.defect_qty ?? 0} {t('monitor.pieces')} - {t('monitor.worstMachineDesc')}</p>
              </>
            )}
          </div>
        </div>
        {/* Top Issue */}
        <div className="bg-[#1e293b] rounded-xl p-4 border border-[#334155] flex items-center gap-4">
          <div className="text-4xl">&#128203;</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-300 truncate">{t('monitor.topIssue')}</p>
            {defectsLoading ? <Skeleton className="h-10 w-20 mt-1" /> : (
              <p className="text-3xl font-bold text-purple-500 leading-tight truncate">{topIssue ? getDefectTypeName(topIssue.defect_type_name) : '-'}</p>
            )}
            <p className="text-sm text-slate-400 mt-1">{t('monitor.topIssueDesc')}</p>
          </div>
        </div>
      </section>

      {/* MIDDLE + BOTTOM: 2-column grid */}
      <section className="grid gap-3 flex-1 min-h-0" style={{ gridTemplateColumns: '2fr 1fr', gridTemplateRows: '1.1fr 1fr' }}>
        {/* Daily Defect Trend */}
        <div className="bg-[#1e293b] rounded-xl p-4 border border-[#334155] flex flex-col">
          <SectionTitle>{t('monitor.dailyDefectTrend')}</SectionTitle>
          <div className="flex-1 min-h-0">
            {defectsLoading ? <Skeleton className="w-full h-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyDefectTrend} margin={{ top: 20, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 13 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 13 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                    labelStyle={{ color: '#e2e8f0' }}
                    itemStyle={{ color: '#f97316' }}
                  />
                  <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="count" position="top" fill="#e2e8f0" fontSize={13} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top 5 Machines */}
        <div className="bg-[#1e293b] rounded-xl p-4 border border-[#334155] flex flex-col">
          <SectionTitle>{t('monitor.topMachines')}</SectionTitle>
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col gap-2 mt-1">
            {defectsLoading ? (
              Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
            ) : topMachines.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-base">{t('monitor.noData')}</div>
            ) : (
              topMachines.map((m, i) => (
                <div key={m.machine_id ?? 'unassigned'} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                      style={{ backgroundColor: RANK_COLORS[i] }}
                    >
                      {i + 1}
                    </div>
                    <span className="font-bold text-white text-base truncate flex-1">{getMachineName(m.machine_name)}</span>
                    <span className="text-slate-300 text-base font-mono shrink-0">{m.defect_qty} {t('monitor.pieces')}</span>
                  </div>
                  <div className="ml-8">
                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${(m.defect_qty / maxMachineCount) * 100}%`, backgroundColor: RANK_COLORS[i] }}
                      />
                    </div>
                    <p className="text-sm text-slate-400 mt-1">{t('monitor.recentIssue')}: {getDefectTypeName(m.recent_defect_type_name)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        {/* Bottom Left: Defect Type + Model Share side by side */}
        <div className="flex gap-3">
        <div className="bg-[#1e293b] rounded-xl p-4 border border-[#334155] flex flex-col flex-1">
          <SectionTitle>{t('monitor.defectTypeAnalysis')}</SectionTitle>
          <div className="flex-1 min-h-0 flex">
            {defectsLoading ? <Skeleton className="w-full h-full" /> : defectTypeDistribution.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-base">{t('monitor.noData')}</div>
            ) : (
              <>
                <div className="w-1/2 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={defectTypeDistribution}
                        dataKey="count"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius="80%"
                        label={({ percent }) => `${percent}%`}
                        labelLine={false}
                        fontSize={13}
                        fill="#8884d8"
                      >
                        {defectTypeDistribution.map((_, idx) => (
                          <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                        labelStyle={{ color: '#e2e8f0' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-1/2 flex flex-col justify-center gap-1 pl-2 overflow-hidden">
                  {defectTypeDistribution.slice(0, 7).map((d, idx) => (
                    <div key={d.type} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                      <span className="text-slate-300 truncate flex-1">{d.name}</span>
                      <span className="text-slate-300 font-medium shrink-0">{d.percent}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Model Defect Share */}
        <div className="bg-[#1e293b] rounded-xl p-4 border border-[#334155] flex flex-col flex-1">
          <SectionTitle>{t('monitor.modelDefectShare')}</SectionTitle>
          <div className="flex-1 min-h-0">
            {defectsLoading ? <Skeleton className="w-full h-full" /> : modelDefectShare.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-base">{t('monitor.noData')}</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={modelDefectShare} layout="vertical" margin={{ top: 5, right: 40, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 13 }} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 13 }} width={95} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                    labelStyle={{ color: '#e2e8f0' }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {modelDefectShare.map((_, idx) => (
                      <Cell key={idx} fill={idx % 2 === 0 ? '#a855f7' : '#3b82f6'} />
                    ))}
                    <LabelList dataKey="percent" position="right" fill="#e2e8f0" fontSize={13} formatter={(v: number) => `${v}%`} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        </div>

        {/* Recent Defects */}
        <div className="bg-[#1e293b] rounded-xl p-4 border border-[#334155] flex flex-col overflow-hidden">
          <SectionTitle>{t('monitor.recentDefects')}</SectionTitle>
          <div className="flex-1 min-h-0 overflow-auto">
            {defectsLoading ? (
              <div className="flex flex-col gap-2">
                {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : recentDefects.length === 0 ? (
              <p className="text-slate-500 text-base text-center py-4">{t('monitor.noData')}</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-700">
                    <th className="text-left py-2 font-medium">{t('monitor.defectTime')}</th>
                    <th className="text-left py-2 font-medium">{t('monitor.defectMachine')}</th>
                    <th className="text-left py-2 font-medium">{t('monitor.defectModel')}</th>
                    <th className="text-left py-2 font-medium">{t('monitor.defectType')}</th>
                    <th className="text-right py-2 font-medium">{t('monitor.defectQty')}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDefects.map((defect, idx) => (
                    <tr key={defect.id} className={`border-b border-slate-700/50 ${idx === 0 ? 'text-orange-300' : 'text-slate-300'}`}>
                      <td className="py-2 font-mono whitespace-nowrap">
                        {new Date(defect.created_at).toLocaleString('ko-KR', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false, month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-2 truncate max-w-[120px]">{getMachineName(defect.machine_name)}</td>
                      <td className="py-2 truncate max-w-[100px]">{getModelCode(defect.model_code)}</td>
                      <td className="py-2 truncate max-w-[160px]">{getDefectTypeName(defect.defect_type_name)}</td>
                      <td className="py-2 text-right font-mono whitespace-nowrap">{defect.defect_qty.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
