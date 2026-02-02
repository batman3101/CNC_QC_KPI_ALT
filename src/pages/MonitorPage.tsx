/**
 * MonitorPage - TV Monitor Dashboard (1920x1080)
 * Full viewport, no scrolling, dark theme
 * Auto language switch + data refresh every 2 minutes
 */

import { useEffect, useState, useMemo } from 'react'
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

import * as inspectionService from '@/services/inspectionService'
import { getMachines, getProductModels, getDefectTypes } from '@/services/managementService'
import { getBusinessDate, getTodayBusinessDate } from '@/lib/dateUtils'
import { useFactoryStore } from '@/stores/factoryStore'

const AUTO_REFRESH_INTERVAL = 2 * 60 * 1000

const PIE_COLORS = ['#ef4444', '#22c55e', '#3b82f6', '#f97316', '#a855f7', '#eab308', '#06b6d4', '#ec4899']

const RANK_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6']

export function MonitorPage() {
  const { t, i18n } = useTranslation()
  const queryClient = useQueryClient()
  const { activeFactoryId, setActiveFactory } = useFactoryStore()

  const [currentTime, setCurrentTime] = useState(new Date())
  const [lastUpdated, setLastUpdated] = useState(new Date())

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // Auto language switch + data refresh
  useEffect(() => {
    const interval = setInterval(() => {
      const newLang = i18n.language === 'ko' ? 'vi' : 'ko'
      i18n.changeLanguage(newLang)
      queryClient.invalidateQueries({ queryKey: ['monitor-defects', activeFactoryId] })
      queryClient.invalidateQueries({ queryKey: ['monitor-inspections', activeFactoryId] })
      queryClient.invalidateQueries({ queryKey: ['machines', activeFactoryId] })
      setLastUpdated(new Date())
    }, AUTO_REFRESH_INTERVAL)
    return () => clearInterval(interval)
  }, [i18n, queryClient, activeFactoryId])

  const timeStr = currentTime.toLocaleTimeString('ko-KR', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false })
  const dateStr = currentTime.toLocaleDateString('ko-KR', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })

  // Queries
  const { data: allDefects = [], isLoading: defectsLoading, isError } = useQuery({
    queryKey: ['monitor-defects', activeFactoryId],
    queryFn: () => inspectionService.getDefects({ factoryId: activeFactoryId || undefined }),
  })
  const { data: machines = [] } = useQuery({
    queryKey: ['machines', activeFactoryId],
    queryFn: () => getMachines(activeFactoryId || undefined),
  })
  const { data: models = [] } = useQuery({
    queryKey: ['product-models'],
    queryFn: getProductModels,
  })
  const { data: defectTypes = [] } = useQuery({
    queryKey: ['defect-types'],
    queryFn: getDefectTypes,
  })
  const { data: inspections = [] } = useQuery({
    queryKey: ['monitor-inspections', activeFactoryId],
    queryFn: () => inspectionService.getInspections({ factoryId: activeFactoryId || undefined }),
  })

  // Build inspection_id -> machine_id map
  const inspectionMachineMap = useMemo(() => {
    const map: Record<string, string | null> = {}
    inspections.forEach(ins => { map[ins.id] = ins.machine_id ?? null })
    return map
  }, [inspections])

  const getDefectMachineId = (defect: { inspection_id: string }): string | null => {
    return inspectionMachineMap[defect.inspection_id] ?? null
  }

  // Helpers
  const getDefectTypeName = (defectTypeId: string): string => {
    const dt = defectTypes.find(d => d.id === defectTypeId || d.code === defectTypeId)
    return dt ? dt.name : defectTypeId
  }
  const getMachineName = (machineId: string | null): string => {
    if (!machineId) return 'N/A'
    const m = machines.find(mc => mc.id === machineId)
    return m?.name || machineId
  }
  const getModelCode = (modelId: string | null): string => {
    if (!modelId) return 'N/A'
    const m = models.find(md => md.id === modelId)
    return m?.code || modelId
  }

  // Computed data
  const totalDefects = allDefects.length
  const todayBusinessDate = getTodayBusinessDate()

  const todayDefects = useMemo(() =>
    allDefects.filter(d => getBusinessDate(new Date(d.created_at)) === todayBusinessDate),
    [allDefects, todayBusinessDate]
  )

  const worstMachine = useMemo(() => {
    const map: Record<string, number> = {}
    allDefects.forEach(d => {
      const key = getDefectMachineId(d) || 'unknown'
      map[key] = (map[key] || 0) + 1
    })
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1])
    return sorted.length > 0 ? { machineId: sorted[0][0], count: sorted[0][1] } : { machineId: '', count: 0 }
  }, [allDefects, inspectionMachineMap])

  const topIssue = useMemo(() => {
    const map: Record<string, number> = {}
    allDefects.forEach(d => {
      const key = d.defect_type || 'unknown'
      map[key] = (map[key] || 0) + 1
    })
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1])
    return sorted.length > 0 ? sorted[0][0] : ''
  }, [allDefects])

  const dailyDefectTrend = useMemo(() => {
    const days: { date: string; count: number }[] = []
    for (let i = 13; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const bd = getBusinessDate(d)
      const count = allDefects.filter(def => getBusinessDate(new Date(def.created_at)) === bd).length
      const label = `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}.`
      days.push({ date: label, count })
    }
    return days
  }, [allDefects])

  const topMachines = useMemo(() => {
    const map: Record<string, { count: number; recentDefectType: string }> = {}
    // Sort by created_at desc to find recent defect type
    const sorted = [...allDefects].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    sorted.forEach(d => {
      const key = getDefectMachineId(d) || 'unknown'
      if (!map[key]) {
        map[key] = { count: 0, recentDefectType: d.defect_type || '' }
      }
      map[key].count++
    })
    return Object.entries(map)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 5)
      .map(([machineId, val]) => ({ machineId, ...val }))
  }, [allDefects, inspectionMachineMap])

  const defectTypeDistribution = useMemo(() => {
    const map: Record<string, number> = {}
    allDefects.forEach(d => {
      const key = d.defect_type || 'unknown'
      map[key] = (map[key] || 0) + 1
    })
    const total = allDefects.length || 1
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => ({ type, name: getDefectTypeName(type), count, percent: Math.round((count / total) * 100) }))
  }, [allDefects, defectTypes])

  const modelDefectShare = useMemo(() => {
    const map: Record<string, number> = {}
    allDefects.forEach(d => {
      const key = d.model_id || 'unknown'
      map[key] = (map[key] || 0) + 1
    })
    const total = allDefects.length || 1
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([modelId, count]) => ({ modelId, name: getModelCode(modelId), count, percent: Math.round((count / total) * 100) }))
  }, [allDefects, models])

  const handleManualRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['monitor-defects', activeFactoryId] })
    queryClient.invalidateQueries({ queryKey: ['monitor-inspections', activeFactoryId] })
    queryClient.invalidateQueries({ queryKey: ['machines', activeFactoryId] })
    setLastUpdated(new Date())
  }

  const latestDefect = allDefects.length > 0
    ? [...allDefects].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]
    : null

  // Skeleton block helper
  const Skeleton = ({ className = '' }: { className?: string }) => (
    <div className={`animate-pulse bg-slate-700 rounded ${className}`} />
  )

  // Section title with red left border
  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <div className="flex items-center gap-2 mb-2">
      <div className="w-1 h-5 bg-red-500 rounded-full" />
      <h3 className="text-lg font-bold text-slate-200">{children}</h3>
    </div>
  )

  const maxMachineCount = topMachines.length > 0 ? topMachines[0].count : 1

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
          <img src="/A symbol BLUE-02.png" className="w-10 h-10" alt="logo" />
          <div>
            <h1 className="text-xl font-bold text-white">{activeFactoryId === 'ALV' ? 'ALMUS VINA' : 'ALMUS TECH'} {t('monitor.title')}</h1>
            <p className="text-sm text-slate-400">{t('monitor.teamName').replace('ALMUS TECH', activeFactoryId === 'ALV' ? 'ALMUS VINA' : 'ALMUS TECH')}</p>
          </div>
          <div className="flex gap-1 ml-2">
            <button
              onClick={() => setActiveFactory('ALT')}
              className={`px-2 py-0.5 rounded text-xs font-bold ${activeFactoryId === 'ALT' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}
            >ALT</button>
            <button
              onClick={() => setActiveFactory('ALV')}
              className={`px-2 py-0.5 rounded text-xs font-bold ${activeFactoryId === 'ALV' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'}`}
            >ALV</button>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-mono font-bold text-white">{timeStr}</div>
          <div className="text-sm text-slate-400">{dateStr}</div>
        </div>
      </header>

      {/* KPI CARDS ~12vh */}
      <section className="grid grid-cols-4 gap-3" style={{ height: '12vh' }}>
        {/* Total Defects */}
        <div className="bg-[#1e293b] rounded-xl p-4 border border-[#334155] flex items-center gap-3">
          <div className="text-3xl">&#128293;</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 truncate">{t('monitor.totalDefects')}</p>
            {defectsLoading ? <Skeleton className="h-10 w-20 mt-1" /> : (
              <p className="text-4xl font-bold text-red-500 leading-tight">{totalDefects.toLocaleString()}</p>
            )}
            <p className="text-xs text-slate-500 mt-0.5">{t('monitor.totalDefectsDesc')}</p>
          </div>
        </div>
        {/* Today Defects */}
        <div className="bg-[#1e293b] rounded-xl p-4 border border-[#334155] flex items-center gap-3">
          <div className="text-3xl">&#128197;</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 truncate">{t('monitor.todayDefects')}</p>
            {defectsLoading ? <Skeleton className="h-10 w-20 mt-1" /> : (
              <p className="text-4xl font-bold text-green-500 leading-tight">{todayDefects.length.toLocaleString()}</p>
            )}
            <p className="text-xs text-slate-500 mt-0.5">{t('monitor.todayDefectsDesc')}</p>
          </div>
        </div>
        {/* Worst Machine */}
        <div className="bg-[#1e293b] rounded-xl p-4 border border-[#334155] flex items-center gap-3">
          <div className="text-3xl">&#127981;</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 truncate">{t('monitor.worstMachine')}</p>
            {defectsLoading ? <Skeleton className="h-10 w-20 mt-1" /> : (
              <>
                <p className="text-3xl font-bold text-white leading-tight truncate">{getMachineName(worstMachine.machineId)}</p>
                <p className="text-xs text-slate-500 mt-0.5">{worstMachine.count} {t('monitor.count')} - {t('monitor.worstMachineDesc')}</p>
              </>
            )}
          </div>
        </div>
        {/* Top Issue */}
        <div className="bg-[#1e293b] rounded-xl p-4 border border-[#334155] flex items-center gap-3">
          <div className="text-3xl">&#128203;</div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 truncate">{t('monitor.topIssue')}</p>
            {defectsLoading ? <Skeleton className="h-10 w-20 mt-1" /> : (
              <p className="text-2xl font-bold text-purple-500 leading-tight truncate">{topIssue ? getDefectTypeName(topIssue) : '-'}</p>
            )}
            <p className="text-xs text-slate-500 mt-0.5">{t('monitor.topIssueDesc')}</p>
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
                  <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                    labelStyle={{ color: '#e2e8f0' }}
                    itemStyle={{ color: '#f97316' }}
                  />
                  <Bar dataKey="count" fill="#f97316" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="count" position="top" fill="#e2e8f0" fontSize={11} />
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
              <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">{t('monitor.noData')}</div>
            ) : (
              topMachines.map((m, i) => (
                <div key={m.machineId} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                      style={{ backgroundColor: RANK_COLORS[i] }}
                    >
                      {i + 1}
                    </div>
                    <span className="font-bold text-white text-sm truncate flex-1">{getMachineName(m.machineId)}</span>
                    <span className="text-slate-300 text-sm font-mono shrink-0">{m.count} {t('monitor.count')}</span>
                  </div>
                  <div className="ml-8">
                    <div className="w-full h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${(m.count / maxMachineCount) * 100}%`, backgroundColor: RANK_COLORS[i] }}
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{t('monitor.recentIssue')}: {getDefectTypeName(m.recentDefectType)}</p>
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
              <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">{t('monitor.noData')}</div>
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
                        label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                        fontSize={10}
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
                    <div key={d.type} className="flex items-center gap-2 text-xs">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                      <span className="text-slate-300 truncate flex-1">{d.name}</span>
                      <span className="text-slate-400 shrink-0">{d.percent}%</span>
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
              <div className="flex-1 flex items-center justify-center text-slate-500 text-sm">{t('monitor.noData')}</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={modelDefectShare} layout="vertical" margin={{ top: 5, right: 40, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} allowDecimals={false} />
                  <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 10 }} width={70} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                    labelStyle={{ color: '#e2e8f0' }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {modelDefectShare.map((_, idx) => (
                      <Cell key={idx} fill={idx % 2 === 0 ? '#a855f7' : '#3b82f6'} />
                    ))}
                    <LabelList dataKey="percent" position="right" fill="#e2e8f0" fontSize={10} formatter={(v: number) => `${v}%`} />
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
            ) : allDefects.length === 0 ? (
              <p className="text-slate-500 text-xs text-center py-4">{t('monitor.noData')}</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-700">
                    <th className="text-left py-1.5 font-medium">{t('monitor.defectTime')}</th>
                    <th className="text-left py-1.5 font-medium">{t('monitor.defectMachine')}</th>
                    <th className="text-left py-1.5 font-medium">{t('monitor.defectModel')}</th>
                    <th className="text-left py-1.5 font-medium">{t('monitor.defectType')}</th>
                  </tr>
                </thead>
                <tbody>
                  {allDefects.slice(0, 5).map((defect, idx) => (
                    <tr key={defect.id} className={`border-b border-slate-700/50 ${idx === 0 ? 'text-orange-300' : 'text-slate-300'}`}>
                      <td className="py-1.5 font-mono whitespace-nowrap">
                        {new Date(defect.created_at).toLocaleString('ko-KR', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false, month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-1.5 truncate max-w-[100px]">{getMachineName(getDefectMachineId(defect))}</td>
                      <td className="py-1.5 truncate max-w-[80px]">{getModelCode(defect.model_id)}</td>
                      <td className="py-1.5 truncate max-w-[120px]">{getDefectTypeName(defect.defect_type || '')}</td>
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
