// Mock Analytics Service
// 이 파일은 UI 테스트용입니다. Supabase 연결 시 삭제하세요.

import type {
  AnalyticsFilters,
  DefectRateTrend,
  ModelDefectDistribution,
  MachinePerformance,
  DefectTypeDistribution,
  HourlyDistribution,
  InspectorPerformance,
  KPISummary,
} from '@/types/analytics'

import {
  mockKPISummary,
  mockDefectRateTrend,
  mockModelDefectDistribution,
  mockMachinePerformance,
  mockDefectTypeDistribution,
  mockHourlyDistribution,
  mockInspectorPerformance,
} from '../mockData/analyticsMockData'

// Simulate async delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function getKPISummary(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _filters: AnalyticsFilters
): Promise<KPISummary> {
  await delay(300)
  return mockKPISummary
}

export async function getDefectRateTrend(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _filters: AnalyticsFilters
): Promise<DefectRateTrend[]> {
  await delay(400)
  return mockDefectRateTrend
}

export async function getModelDefectDistribution(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _filters: AnalyticsFilters
): Promise<ModelDefectDistribution[]> {
  await delay(350)
  return mockModelDefectDistribution
}

export async function getMachinePerformance(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _filters: AnalyticsFilters
): Promise<MachinePerformance[]> {
  await delay(380)
  return mockMachinePerformance
}

export async function getDefectTypeDistribution(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _filters: AnalyticsFilters
): Promise<DefectTypeDistribution[]> {
  await delay(320)
  return mockDefectTypeDistribution
}

export async function getHourlyDistribution(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _filters: AnalyticsFilters
): Promise<HourlyDistribution[]> {
  await delay(360)
  return mockHourlyDistribution
}

export async function getInspectorPerformance(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _filters: AnalyticsFilters
): Promise<InspectorPerformance[]> {
  await delay(370)
  return mockInspectorPerformance
}
