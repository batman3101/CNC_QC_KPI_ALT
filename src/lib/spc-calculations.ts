/**
 * SPC 통계 계산 유틸리티
 * Statistical Process Control calculations
 */

import type {
  CapabilityRating,
  ProcessCapability,
  SPCStatistics,
  SPCViolation,
  PChartLimits,
} from '@/types/spc'

// ============================================
// 1. 기본 통계 함수
// ============================================

/**
 * 평균 계산
 */
export function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, v) => sum + v, 0) / values.length
}

/**
 * 표준편차 계산 (모집단)
 */
export function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0
  const avg = mean(values)
  const squaredDiffs = values.map(v => Math.pow(v - avg, 2))
  return Math.sqrt(mean(squaredDiffs))
}

/**
 * 표준편차 계산 (표본) - n-1
 */
export function sampleStandardDeviation(values: number[]): number {
  if (values.length <= 1) return 0
  const avg = mean(values)
  const squaredDiffs = values.map(v => Math.pow(v - avg, 2))
  return Math.sqrt(squaredDiffs.reduce((sum, v) => sum + v, 0) / (values.length - 1))
}

/**
 * 이동 범위 계산
 */
export function movingRanges(values: number[]): number[] {
  if (values.length <= 1) return []
  const ranges: number[] = []
  for (let i = 1; i < values.length; i++) {
    ranges.push(Math.abs(values[i] - values[i - 1]))
  }
  return ranges
}

/**
 * 이동 범위 평균 (MR-bar)
 */
export function movingRangeAverage(values: number[]): number {
  const ranges = movingRanges(values)
  return mean(ranges)
}

/**
 * 범위 (R) 계산
 */
export function range(values: number[]): number {
  if (values.length === 0) return 0
  return Math.max(...values) - Math.min(...values)
}

/**
 * 중앙값 계산
 */
export function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

// ============================================
// 2. SPC 상수
// ============================================

/**
 * d2 상수 (서브그룹 크기별) - 이동범위 기반 시그마 추정
 */
export function getD2Constant(subgroupSize: number): number {
  const d2Table: Record<number, number> = {
    2: 1.128,
    3: 1.693,
    4: 2.059,
    5: 2.326,
    6: 2.534,
    7: 2.704,
    8: 2.847,
    9: 2.970,
    10: 3.078,
  }
  return d2Table[subgroupSize] || 1.128
}

/**
 * d3 상수
 */
export function getD3Constant(subgroupSize: number): number {
  const d3Table: Record<number, number> = {
    2: 0.853,
    3: 0.888,
    4: 0.880,
    5: 0.864,
    6: 0.848,
    7: 0.833,
    8: 0.820,
    9: 0.808,
    10: 0.797,
  }
  return d3Table[subgroupSize] || 0.853
}

/**
 * A2 상수 (X-bar R용)
 */
export function getA2Constant(subgroupSize: number): number {
  const a2Table: Record<number, number> = {
    2: 1.880,
    3: 1.023,
    4: 0.729,
    5: 0.577,
    6: 0.483,
    7: 0.419,
    8: 0.373,
    9: 0.337,
    10: 0.308,
  }
  return a2Table[subgroupSize] || 1.880
}

/**
 * D3, D4 상수 (R 차트용)
 */
export function getD3D4Constants(subgroupSize: number): { D3: number; D4: number } {
  const d3d4Table: Record<number, { D3: number; D4: number }> = {
    2: { D3: 0, D4: 3.267 },
    3: { D3: 0, D4: 2.574 },
    4: { D3: 0, D4: 2.282 },
    5: { D3: 0, D4: 2.114 },
    6: { D3: 0, D4: 2.004 },
    7: { D3: 0.076, D4: 1.924 },
    8: { D3: 0.136, D4: 1.864 },
    9: { D3: 0.184, D4: 1.816 },
    10: { D3: 0.223, D4: 1.777 },
  }
  return d3d4Table[subgroupSize] || { D3: 0, D4: 3.267 }
}

// ============================================
// 3. 관리한계 계산
// ============================================

/**
 * p-chart 관리한계 계산 (불량률)
 */
export function calculatePChartLimits(data: {
  defect_count: number
  sample_size: number
}[]): PChartLimits {
  if (data.length === 0) {
    return { p_bar: 0, ucl: 0, lcl: 0, centerLine: 0 }
  }

  // 전체 불량률 계산
  const totalDefects = data.reduce((sum, d) => sum + d.defect_count, 0)
  const totalSamples = data.reduce((sum, d) => sum + d.sample_size, 0)
  const p_bar = totalSamples > 0 ? totalDefects / totalSamples : 0

  // 평균 샘플 크기
  const avgSampleSize = totalSamples / data.length

  // 관리한계 계산 (3-시그마)
  const sigma = Math.sqrt((p_bar * (1 - p_bar)) / avgSampleSize)
  const ucl = p_bar + 3 * sigma
  const lcl = Math.max(0, p_bar - 3 * sigma) // 음수 방지

  return {
    p_bar,
    ucl,
    lcl,
    centerLine: p_bar,
  }
}

/**
 * np-chart 관리한계 계산 (불량 개수)
 */
export function calculateNPChartLimits(data: {
  defect_count: number
  sample_size: number
}[]): {
  np_bar: number
  ucl: number
  lcl: number
  centerLine: number
} {
  if (data.length === 0) {
    return { np_bar: 0, ucl: 0, lcl: 0, centerLine: 0 }
  }

  // 평균 샘플 크기 (일정해야 함)
  const n = mean(data.map(d => d.sample_size))

  // 평균 불량 개수
  const np_bar = mean(data.map(d => d.defect_count))

  // p-bar 계산
  const p_bar = np_bar / n

  // 관리한계
  const sigma = Math.sqrt(np_bar * (1 - p_bar))
  const ucl = np_bar + 3 * sigma
  const lcl = Math.max(0, np_bar - 3 * sigma)

  return {
    np_bar,
    ucl,
    lcl,
    centerLine: np_bar,
  }
}

/**
 * X-MR 관리한계 계산 (개별값 + 이동범위)
 */
export function calculateXMRLimits(values: number[]): {
  x: { ucl: number; cl: number; lcl: number }
  mr: { ucl: number; cl: number; lcl: number }
  mean: number
  mrBar: number
  sigmaEstimate: number
} {
  if (values.length < 2) {
    return {
      x: { ucl: 0, cl: 0, lcl: 0 },
      mr: { ucl: 0, cl: 0, lcl: 0 },
      mean: 0,
      mrBar: 0,
      sigmaEstimate: 0,
    }
  }

  const xBar = mean(values)
  const mrBar = movingRangeAverage(values)
  const d2 = getD2Constant(2) // 이동범위는 항상 n=2

  // 시그마 추정
  const sigmaEstimate = mrBar / d2

  // X 차트 관리한계
  const xUcl = xBar + 3 * sigmaEstimate
  const xLcl = xBar - 3 * sigmaEstimate

  // MR 차트 관리한계
  const { D3, D4 } = getD3D4Constants(2)
  const mrUcl = D4 * mrBar
  const mrLcl = D3 * mrBar

  return {
    x: { ucl: xUcl, cl: xBar, lcl: xLcl },
    mr: { ucl: mrUcl, cl: mrBar, lcl: mrLcl },
    mean: xBar,
    mrBar,
    sigmaEstimate,
  }
}

/**
 * X-bar R 관리한계 계산 (서브그룹)
 */
export function calculateXBarRLimits(subgroups: number[][]): {
  xBar: { ucl: number; cl: number; lcl: number }
  r: { ucl: number; cl: number; lcl: number }
  xDoubleBar: number
  rBar: number
  sigmaEstimate: number
} {
  if (subgroups.length === 0 || subgroups[0].length === 0) {
    return {
      xBar: { ucl: 0, cl: 0, lcl: 0 },
      r: { ucl: 0, cl: 0, lcl: 0 },
      xDoubleBar: 0,
      rBar: 0,
      sigmaEstimate: 0,
    }
  }

  const n = subgroups[0].length // 서브그룹 크기
  const subgroupMeans = subgroups.map(sg => mean(sg))
  const subgroupRanges = subgroups.map(sg => range(sg))

  const xDoubleBar = mean(subgroupMeans)
  const rBar = mean(subgroupRanges)

  // 상수
  const A2 = getA2Constant(n)
  const { D3, D4 } = getD3D4Constants(n)
  const d2 = getD2Constant(n)

  // 시그마 추정
  const sigmaEstimate = rBar / d2

  // X-bar 차트 관리한계
  const xBarUcl = xDoubleBar + A2 * rBar
  const xBarLcl = xDoubleBar - A2 * rBar

  // R 차트 관리한계
  const rUcl = D4 * rBar
  const rLcl = D3 * rBar

  return {
    xBar: { ucl: xBarUcl, cl: xDoubleBar, lcl: xBarLcl },
    r: { ucl: rUcl, cl: rBar, lcl: rLcl },
    xDoubleBar,
    rBar,
    sigmaEstimate,
  }
}

// ============================================
// 4. 공정능력지수 계산
// ============================================

/**
 * Cp 계산
 */
export function calculateCp(usl: number, lsl: number, sigma: number): number {
  if (sigma === 0) return 0
  return (usl - lsl) / (6 * sigma)
}

/**
 * Cpk 계산
 */
export function calculateCpk(
  usl: number,
  lsl: number,
  mean: number,
  sigma: number
): { cpk: number; cpl: number; cpu: number } {
  if (sigma === 0) return { cpk: 0, cpl: 0, cpu: 0 }

  const cpu = (usl - mean) / (3 * sigma)
  const cpl = (mean - lsl) / (3 * sigma)
  const cpk = Math.min(cpu, cpl)

  return { cpk, cpl, cpu }
}

/**
 * Pp/Ppk 계산 (장기 공정능력)
 */
export function calculatePpk(
  usl: number,
  lsl: number,
  dataMean: number,
  overallSigma: number
): { pp: number; ppk: number } {
  if (overallSigma === 0) return { pp: 0, ppk: 0 }

  const pp = (usl - lsl) / (6 * overallSigma)
  const ppu = (usl - dataMean) / (3 * overallSigma)
  const ppl = (dataMean - lsl) / (3 * overallSigma)
  const ppk = Math.min(ppu, ppl)

  return { pp, ppk }
}

/**
 * 공정능력 등급 판정
 */
export function getCapabilityRating(cpk: number): {
  rating: CapabilityRating
  description: string
  color: string
} {
  if (cpk >= 1.67) {
    return { rating: 'excellent', description: 'Excellent (Cpk >= 1.67)', color: '#22c55e' }
  } else if (cpk >= 1.33) {
    return { rating: 'good', description: 'Good (1.33 <= Cpk < 1.67)', color: '#3b82f6' }
  } else if (cpk >= 1.0) {
    return { rating: 'adequate', description: 'Adequate (1.0 <= Cpk < 1.33)', color: '#eab308' }
  } else if (cpk >= 0.67) {
    return { rating: 'poor', description: 'Poor (0.67 <= Cpk < 1.0)', color: '#f97316' }
  } else {
    return { rating: 'inadequate', description: 'Inadequate (Cpk < 0.67)', color: '#ef4444' }
  }
}

/**
 * 예상 불량률 계산 (PPM)
 * Z-score 기반 정규분포 누적확률 근사
 */
export function calculateExpectedDefectRate(cpk: number): { ppm: number; percent: number } {
  // Cpk to Z-score: Z = 3 * Cpk
  const z = 3 * cpk

  // 정규분포 누적확률 근사 (Zelen & Severo)
  function normalCDF(x: number): number {
    const a1 = 0.254829592
    const a2 = -0.284496736
    const a3 = 1.421413741
    const a4 = -1.453152027
    const a5 = 1.061405429
    const p = 0.3275911

    const sign = x < 0 ? -1 : 1
    x = Math.abs(x) / Math.sqrt(2)

    const t = 1.0 / (1.0 + p * x)
    const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)

    return 0.5 * (1.0 + sign * y)
  }

  // 한쪽 꼬리 불량률 (양쪽 고려)
  const tailProbability = 1 - normalCDF(z)
  const defectRate = 2 * tailProbability // 양쪽 꼬리

  const ppm = defectRate * 1000000
  const percent = defectRate * 100

  return { ppm, percent }
}

/**
 * 전체 공정능력 계산
 */
export function calculateProcessCapability(
  values: number[],
  usl: number,
  lsl: number,
  sigmaEstimate?: number
): ProcessCapability {
  const dataMean = mean(values)
  const sigma = sigmaEstimate ?? sampleStandardDeviation(values)

  const cp = calculateCp(usl, lsl, sigma)
  const { cpk, cpl, cpu } = calculateCpk(usl, lsl, dataMean, sigma)
  const { pp, ppk } = calculatePpk(usl, lsl, dataMean, standardDeviation(values))

  const { rating, description } = getCapabilityRating(cpk)
  const { ppm, percent } = calculateExpectedDefectRate(cpk)

  return {
    cp,
    cpk,
    cpl,
    cpu,
    pp,
    ppk,
    rating,
    rating_description: description,
    expected_defect_ppm: ppm,
    expected_defect_percent: percent,
  }
}

// ============================================
// 5. 통계 요약
// ============================================

/**
 * SPC 통계 요약 계산
 */
export function calculateSPCStatistics(
  values: number[],
  usl?: number,
  lsl?: number,
  ucl?: number,
  lcl?: number
): SPCStatistics {
  if (values.length === 0) {
    return {
      count: 0,
      mean: 0,
      std_dev: 0,
      min: 0,
      max: 0,
      range: 0,
      median: 0,
      within_spec_count: 0,
      within_spec_percent: 0,
      within_control_count: 0,
      within_control_percent: 0,
    }
  }

  const count = values.length
  const avg = mean(values)
  const stdDev = sampleStandardDeviation(values)
  const minVal = Math.min(...values)
  const maxVal = Math.max(...values)
  const rangeVal = maxVal - minVal
  const medianVal = median(values)

  // 규격 내 개수
  let withinSpecCount = count
  if (usl !== undefined && lsl !== undefined) {
    withinSpecCount = values.filter(v => v >= lsl && v <= usl).length
  }

  // 관리한계 내 개수
  let withinControlCount = count
  if (ucl !== undefined && lcl !== undefined) {
    withinControlCount = values.filter(v => v >= lcl && v <= ucl).length
  }

  return {
    count,
    mean: avg,
    std_dev: stdDev,
    min: minVal,
    max: maxVal,
    range: rangeVal,
    median: medianVal,
    within_spec_count: withinSpecCount,
    within_spec_percent: (withinSpecCount / count) * 100,
    within_control_count: withinControlCount,
    within_control_percent: (withinControlCount / count) * 100,
  }
}

// ============================================
// 6. Nelson Rules 위반 감지
// ============================================

/**
 * Rule 1: 한 점이 관리한계 밖
 */
export function checkRule1OutOfLimits(
  points: number[],
  ucl: number,
  lcl: number
): SPCViolation[] {
  const violations: SPCViolation[] = []

  points.forEach((value, index) => {
    if (value > ucl) {
      violations.push({
        index,
        point_value: value,
        type: 'ucl_exceeded',
        severity: 'critical',
        description: `Point ${index + 1}: Value ${value.toFixed(4)} exceeds UCL (${ucl.toFixed(4)})`,
        rule_code: 'R1',
      })
    } else if (value < lcl) {
      violations.push({
        index,
        point_value: value,
        type: 'lcl_exceeded',
        severity: 'critical',
        description: `Point ${index + 1}: Value ${value.toFixed(4)} below LCL (${lcl.toFixed(4)})`,
        rule_code: 'R1',
      })
    }
  })

  return violations
}

/**
 * Rule 2: 연속 N점이 중심선 한쪽 (기본 7점)
 */
export function checkRule2Run(
  points: number[],
  cl: number,
  consecutiveCount: number = 7
): SPCViolation[] {
  const violations: SPCViolation[] = []

  if (points.length < consecutiveCount) return violations

  for (let i = consecutiveCount - 1; i < points.length; i++) {
    const segment = points.slice(i - consecutiveCount + 1, i + 1)
    const allAbove = segment.every(p => p > cl)
    const allBelow = segment.every(p => p < cl)

    if (allAbove) {
      violations.push({
        index: i,
        point_value: points[i],
        type: 'run_above',
        severity: 'warning',
        description: `Points ${i - consecutiveCount + 2} to ${i + 1}: ${consecutiveCount} consecutive points above center line`,
        rule_code: 'R2',
      })
    } else if (allBelow) {
      violations.push({
        index: i,
        point_value: points[i],
        type: 'run_below',
        severity: 'warning',
        description: `Points ${i - consecutiveCount + 2} to ${i + 1}: ${consecutiveCount} consecutive points below center line`,
        rule_code: 'R2',
      })
    }
  }

  return violations
}

/**
 * Rule 3: 연속 N점 증가 또는 감소 (기본 6점)
 */
export function checkRule3Trend(
  points: number[],
  consecutiveCount: number = 6
): SPCViolation[] {
  const violations: SPCViolation[] = []

  if (points.length < consecutiveCount) return violations

  for (let i = consecutiveCount - 1; i < points.length; i++) {
    const segment = points.slice(i - consecutiveCount + 1, i + 1)

    let allIncreasing = true
    let allDecreasing = true

    for (let j = 1; j < segment.length; j++) {
      if (segment[j] <= segment[j - 1]) allIncreasing = false
      if (segment[j] >= segment[j - 1]) allDecreasing = false
    }

    if (allIncreasing) {
      violations.push({
        index: i,
        point_value: points[i],
        type: 'trend_up',
        severity: 'warning',
        description: `Points ${i - consecutiveCount + 2} to ${i + 1}: ${consecutiveCount} consecutive points increasing`,
        rule_code: 'R3',
      })
    } else if (allDecreasing) {
      violations.push({
        index: i,
        point_value: points[i],
        type: 'trend_down',
        severity: 'warning',
        description: `Points ${i - consecutiveCount + 2} to ${i + 1}: ${consecutiveCount} consecutive points decreasing`,
        rule_code: 'R3',
      })
    }
  }

  return violations
}

/**
 * Rule 4: 연속 14점 교대로 증감
 */
export function checkRule4Alternating(
  points: number[]
): SPCViolation[] {
  const violations: SPCViolation[] = []
  const consecutiveCount = 14

  if (points.length < consecutiveCount) return violations

  for (let i = consecutiveCount - 1; i < points.length; i++) {
    const segment = points.slice(i - consecutiveCount + 1, i + 1)

    let isAlternating = true
    for (let j = 1; j < segment.length; j++) {
      const prevDirection = j >= 2 ? (segment[j - 1] > segment[j - 2] ? 1 : -1) : 0
      const currDirection = segment[j] > segment[j - 1] ? 1 : -1

      if (j >= 2 && prevDirection === currDirection) {
        isAlternating = false
        break
      }
    }

    if (isAlternating) {
      violations.push({
        index: i,
        point_value: points[i],
        type: 'mixture',
        severity: 'warning',
        description: `Points ${i - consecutiveCount + 2} to ${i + 1}: 14 consecutive alternating points`,
        rule_code: 'R4',
      })
    }
  }

  return violations
}

/**
 * Rule 5: 3점 중 2점이 2시그마 밖 (같은 방향)
 */
export function checkRule5TwoOfThree(
  points: number[],
  cl: number,
  sigma: number
): SPCViolation[] {
  const violations: SPCViolation[] = []

  if (points.length < 3) return violations

  const twoSigmaAbove = cl + 2 * sigma
  const twoSigmaBelow = cl - 2 * sigma

  for (let i = 2; i < points.length; i++) {
    const segment = points.slice(i - 2, i + 1)

    const aboveCount = segment.filter(p => p > twoSigmaAbove).length
    const belowCount = segment.filter(p => p < twoSigmaBelow).length

    if (aboveCount >= 2) {
      violations.push({
        index: i,
        point_value: points[i],
        type: 'two_thirds',
        severity: 'warning',
        description: `Points ${i - 1} to ${i + 1}: 2 of 3 points beyond 2-sigma (above)`,
        rule_code: 'R5',
      })
    } else if (belowCount >= 2) {
      violations.push({
        index: i,
        point_value: points[i],
        type: 'two_thirds',
        severity: 'warning',
        description: `Points ${i - 1} to ${i + 1}: 2 of 3 points beyond 2-sigma (below)`,
        rule_code: 'R5',
      })
    }
  }

  return violations
}

/**
 * Rule 6: 5점 중 4점이 1시그마 밖 (같은 방향)
 */
export function checkRule6FourOfFive(
  points: number[],
  cl: number,
  sigma: number
): SPCViolation[] {
  const violations: SPCViolation[] = []

  if (points.length < 5) return violations

  const oneSigmaAbove = cl + sigma
  const oneSigmaBelow = cl - sigma

  for (let i = 4; i < points.length; i++) {
    const segment = points.slice(i - 4, i + 1)

    const aboveCount = segment.filter(p => p > oneSigmaAbove).length
    const belowCount = segment.filter(p => p < oneSigmaBelow).length

    if (aboveCount >= 4) {
      violations.push({
        index: i,
        point_value: points[i],
        type: 'run_above',
        severity: 'warning',
        description: `Points ${i - 3} to ${i + 1}: 4 of 5 points beyond 1-sigma (above)`,
        rule_code: 'R6',
      })
    } else if (belowCount >= 4) {
      violations.push({
        index: i,
        point_value: points[i],
        type: 'run_below',
        severity: 'warning',
        description: `Points ${i - 3} to ${i + 1}: 4 of 5 points beyond 1-sigma (below)`,
        rule_code: 'R6',
      })
    }
  }

  return violations
}

/**
 * Rule 7: 연속 15점이 1시그마 내 (Stratification)
 */
export function checkRule7Stratification(
  points: number[],
  cl: number,
  sigma: number
): SPCViolation[] {
  const violations: SPCViolation[] = []
  const consecutiveCount = 15

  if (points.length < consecutiveCount) return violations

  const oneSigmaAbove = cl + sigma
  const oneSigmaBelow = cl - sigma

  for (let i = consecutiveCount - 1; i < points.length; i++) {
    const segment = points.slice(i - consecutiveCount + 1, i + 1)

    const allWithinOneSigma = segment.every(p => p >= oneSigmaBelow && p <= oneSigmaAbove)

    if (allWithinOneSigma) {
      violations.push({
        index: i,
        point_value: points[i],
        type: 'stratification',
        severity: 'info',
        description: `Points ${i - consecutiveCount + 2} to ${i + 1}: 15 consecutive points within 1-sigma (stratification)`,
        rule_code: 'R7',
      })
    }
  }

  return violations
}

/**
 * Rule 8: 연속 8점이 1시그마 밖 (양쪽, Mixture)
 */
export function checkRule8Mixture(
  points: number[],
  cl: number,
  sigma: number
): SPCViolation[] {
  const violations: SPCViolation[] = []
  const consecutiveCount = 8

  if (points.length < consecutiveCount) return violations

  const oneSigmaAbove = cl + sigma
  const oneSigmaBelow = cl - sigma

  for (let i = consecutiveCount - 1; i < points.length; i++) {
    const segment = points.slice(i - consecutiveCount + 1, i + 1)

    // 모든 점이 1시그마 밖에 있고, 중심선을 넘나드는지 확인
    const allOutsideOneSigma = segment.every(p => p > oneSigmaAbove || p < oneSigmaBelow)

    if (allOutsideOneSigma) {
      // 양쪽 모두에 점이 있는지 확인 (mixture)
      const hasAbove = segment.some(p => p > oneSigmaAbove)
      const hasBelow = segment.some(p => p < oneSigmaBelow)

      if (hasAbove && hasBelow) {
        violations.push({
          index: i,
          point_value: points[i],
          type: 'mixture',
          severity: 'warning',
          description: `Points ${i - consecutiveCount + 2} to ${i + 1}: 8 consecutive points outside 1-sigma (mixture)`,
          rule_code: 'R8',
        })
      }
    }
  }

  return violations
}

/**
 * 모든 Nelson Rules 위반 감지 (Rules 1-8)
 */
export function detectNelsonRuleViolations(
  points: number[],
  cl: number,
  ucl: number,
  lcl: number,
  sigma?: number
): SPCViolation[] {
  const calculatedSigma = sigma ?? (ucl - cl) / 3

  const violations: SPCViolation[] = [
    ...checkRule1OutOfLimits(points, ucl, lcl),
    ...checkRule2Run(points, cl, 7),
    ...checkRule3Trend(points, 6),
    ...checkRule4Alternating(points),
    ...checkRule5TwoOfThree(points, cl, calculatedSigma),
    ...checkRule6FourOfFive(points, cl, calculatedSigma),
    ...checkRule7Stratification(points, cl, calculatedSigma),
    ...checkRule8Mixture(points, cl, calculatedSigma),
  ]

  // 중복 제거 (같은 인덱스의 같은 타입)
  const seen = new Set<string>()
  return violations.filter(v => {
    const key = `${v.index}-${v.type}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// ============================================
// 7. 히스토그램
// ============================================

/**
 * Sturges 공식으로 빈 개수 결정
 */
export function calculateOptimalBinCount(n: number): number {
  if (n <= 0) return 1
  return Math.ceil(Math.log2(n) + 1)
}

/**
 * 히스토그램 빈 계산
 */
export function calculateHistogramBins(
  values: number[],
  binCount?: number
): { bin: number; count: number; binStart: number; binEnd: number }[] {
  if (values.length === 0) return []

  const count = binCount ?? calculateOptimalBinCount(values.length)
  const minVal = Math.min(...values)
  const maxVal = Math.max(...values)
  const binWidth = (maxVal - minVal) / count

  const bins = Array.from({ length: count }, (_, i) => ({
    bin: i,
    count: 0,
    binStart: minVal + i * binWidth,
    binEnd: minVal + (i + 1) * binWidth,
  }))

  values.forEach(value => {
    let binIndex = Math.floor((value - minVal) / binWidth)
    if (binIndex >= count) binIndex = count - 1 // 최대값 처리
    if (binIndex < 0) binIndex = 0
    bins[binIndex].count++
  })

  return bins
}

/**
 * 히스토그램 빈 중심값 계산
 */
export function getHistogramBinCenters(
  bins: { binStart: number; binEnd: number }[]
): number[] {
  return bins.map(bin => (bin.binStart + bin.binEnd) / 2)
}
