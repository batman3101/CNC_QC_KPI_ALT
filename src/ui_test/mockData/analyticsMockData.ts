import type {
  DefectRateTrend,
  ModelDefectDistribution,
  MachinePerformance,
  DefectTypeDistribution,
  HourlyDistribution,
  InspectorPerformance,
  KPISummary,
} from '@/types/analytics'

// KPI Summary Mock Data
export const mockKPISummary: KPISummary = {
  totalInspections: 1247,
  totalDefects: 42,
  overallDefectRate: 3.37,
  fpy: 96.63,
  avgInspectionTime: 4.2,
  activeInspectors: 8,
}

// Defect Rate Trend Mock Data (Last 30 days)
export const mockDefectRateTrend: DefectRateTrend[] = [
  {
    date: '2025-01-01',
    totalInspections: 45,
    defectCount: 2,
    defectRate: 4.44,
    passRate: 95.56,
  },
  {
    date: '2025-01-02',
    totalInspections: 52,
    defectCount: 1,
    defectRate: 1.92,
    passRate: 98.08,
  },
  {
    date: '2025-01-03',
    totalInspections: 48,
    defectCount: 3,
    defectRate: 6.25,
    passRate: 93.75,
  },
  {
    date: '2025-01-04',
    totalInspections: 41,
    defectCount: 1,
    defectRate: 2.44,
    passRate: 97.56,
  },
  {
    date: '2025-01-05',
    totalInspections: 39,
    defectCount: 2,
    defectRate: 5.13,
    passRate: 94.87,
  },
  {
    date: '2025-01-06',
    totalInspections: 55,
    defectCount: 2,
    defectRate: 3.64,
    passRate: 96.36,
  },
  {
    date: '2025-01-07',
    totalInspections: 50,
    defectCount: 1,
    defectRate: 2.0,
    passRate: 98.0,
  },
  {
    date: '2025-01-08',
    totalInspections: 47,
    defectCount: 3,
    defectRate: 6.38,
    passRate: 93.62,
  },
  {
    date: '2025-01-09',
    totalInspections: 53,
    defectCount: 2,
    defectRate: 3.77,
    passRate: 96.23,
  },
  {
    date: '2025-01-10',
    totalInspections: 44,
    defectCount: 1,
    defectRate: 2.27,
    passRate: 97.73,
  },
  {
    date: '2025-01-11',
    totalInspections: 49,
    defectCount: 2,
    defectRate: 4.08,
    passRate: 95.92,
  },
  {
    date: '2025-01-12',
    totalInspections: 42,
    defectCount: 1,
    defectRate: 2.38,
    passRate: 97.62,
  },
  {
    date: '2025-01-13',
    totalInspections: 51,
    defectCount: 3,
    defectRate: 5.88,
    passRate: 94.12,
  },
  {
    date: '2025-01-14',
    totalInspections: 46,
    defectCount: 1,
    defectRate: 2.17,
    passRate: 97.83,
  },
  {
    date: '2025-01-15',
    totalInspections: 54,
    defectCount: 2,
    defectRate: 3.70,
    passRate: 96.30,
  },
]

// Model Defect Distribution Mock Data
export const mockModelDefectDistribution: ModelDefectDistribution[] = [
  {
    modelName: 'Shaft Type A',
    modelCode: 'SHA-001',
    totalInspections: 342,
    defectCount: 12,
    defectRate: 3.51,
  },
  {
    modelName: 'Bearing Housing B',
    modelCode: 'BHB-002',
    totalInspections: 298,
    defectCount: 15,
    defectRate: 5.03,
  },
  {
    modelName: 'Flange C',
    modelCode: 'FLC-003',
    totalInspections: 267,
    defectCount: 8,
    defectRate: 3.00,
  },
  {
    modelName: 'Gear Assembly D',
    modelCode: 'GAD-004',
    totalInspections: 189,
    defectCount: 5,
    defectRate: 2.65,
  },
  {
    modelName: 'Connector E',
    modelCode: 'CNE-005',
    totalInspections: 151,
    defectCount: 2,
    defectRate: 1.32,
  },
]

// Machine Performance Mock Data
export const mockMachinePerformance: MachinePerformance[] = [
  {
    machineName: 'CNC-001',
    machineModel: 'Haas VF-2',
    totalInspections: 423,
    defectCount: 18,
    defectRate: 4.26,
    avgInspectionTime: 4.5,
  },
  {
    machineName: 'CNC-002',
    machineModel: 'DMG Mori NLX 2500',
    totalInspections: 387,
    defectCount: 14,
    defectRate: 3.62,
    avgInspectionTime: 3.8,
  },
  {
    machineName: 'CNC-003',
    machineModel: 'Mazak Integrex i-200',
    totalInspections: 312,
    defectCount: 7,
    defectRate: 2.24,
    avgInspectionTime: 4.1,
  },
  {
    machineName: 'CNC-004',
    machineModel: 'Okuma LB3000',
    totalInspections: 125,
    defectCount: 3,
    defectRate: 2.40,
    avgInspectionTime: 4.7,
  },
]

// Defect Type Distribution Mock Data
export const mockDefectTypeDistribution: DefectTypeDistribution[] = [
  {
    defectType: '치수 불량',
    count: 18,
    percentage: 42.86,
  },
  {
    defectType: '표면 결함',
    count: 12,
    percentage: 28.57,
  },
  {
    defectType: '균열',
    count: 7,
    percentage: 16.67,
  },
  {
    defectType: '기공',
    count: 3,
    percentage: 7.14,
  },
  {
    defectType: '변형',
    count: 2,
    percentage: 4.76,
  },
]

// Hourly Distribution Mock Data
export const mockHourlyDistribution: HourlyDistribution[] = [
  { hour: 0, inspectionCount: 0, defectCount: 0 },
  { hour: 1, inspectionCount: 0, defectCount: 0 },
  { hour: 2, inspectionCount: 0, defectCount: 0 },
  { hour: 3, inspectionCount: 0, defectCount: 0 },
  { hour: 4, inspectionCount: 0, defectCount: 0 },
  { hour: 5, inspectionCount: 0, defectCount: 0 },
  { hour: 6, inspectionCount: 0, defectCount: 0 },
  { hour: 7, inspectionCount: 2, defectCount: 0 },
  { hour: 8, inspectionCount: 45, defectCount: 2 },
  { hour: 9, inspectionCount: 67, defectCount: 3 },
  { hour: 10, inspectionCount: 82, defectCount: 4 },
  { hour: 11, inspectionCount: 75, defectCount: 2 },
  { hour: 12, inspectionCount: 12, defectCount: 0 },
  { hour: 13, inspectionCount: 68, defectCount: 3 },
  { hour: 14, inspectionCount: 91, defectCount: 5 },
  { hour: 15, inspectionCount: 88, defectCount: 4 },
  { hour: 16, inspectionCount: 76, defectCount: 3 },
  { hour: 17, inspectionCount: 41, defectCount: 1 },
  { hour: 18, inspectionCount: 5, defectCount: 0 },
  { hour: 19, inspectionCount: 0, defectCount: 0 },
  { hour: 20, inspectionCount: 0, defectCount: 0 },
  { hour: 21, inspectionCount: 0, defectCount: 0 },
  { hour: 22, inspectionCount: 0, defectCount: 0 },
  { hour: 23, inspectionCount: 0, defectCount: 0 },
]

// Inspector Performance Mock Data
export const mockInspectorPerformance: InspectorPerformance[] = [
  {
    inspectorName: '김철수',
    totalInspections: 287,
    defectCount: 9,
    defectRate: 3.14,
    avgInspectionTime: 4.1,
  },
  {
    inspectorName: '이영희',
    totalInspections: 312,
    defectCount: 12,
    defectRate: 3.85,
    avgInspectionTime: 3.8,
  },
  {
    inspectorName: '박민수',
    totalInspections: 245,
    defectCount: 8,
    defectRate: 3.27,
    avgInspectionTime: 4.5,
  },
  {
    inspectorName: '정수연',
    totalInspections: 198,
    defectCount: 6,
    defectRate: 3.03,
    avgInspectionTime: 4.2,
  },
  {
    inspectorName: '최동욱',
    totalInspections: 205,
    defectCount: 7,
    defectRate: 3.41,
    avgInspectionTime: 4.3,
  },
]

// Machines for filters
export const mockMachines = [
  { id: 'machine-1', name: 'CNC-001' },
  { id: 'machine-2', name: 'CNC-002' },
  { id: 'machine-3', name: 'CNC-003' },
  { id: 'machine-4', name: 'CNC-004' },
]

// Product Models for filters
export const mockProductModels = [
  { id: 'model-1', name: 'Shaft Type A' },
  { id: 'model-2', name: 'Bearing Housing B' },
  { id: 'model-3', name: 'Flange C' },
  { id: 'model-4', name: 'Gear Assembly D' },
  { id: 'model-5', name: 'Connector E' },
]

// Inspection Processes for filters
export const mockInspectionProcesses = [
  { id: 'process-1', name: 'IQC' },
  { id: 'process-2', name: 'PQC' },
  { id: 'process-3', name: 'OQC' },
  { id: 'process-4', name: 'FQC' },
]
