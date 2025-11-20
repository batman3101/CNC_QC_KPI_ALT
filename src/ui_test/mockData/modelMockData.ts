import type { Database } from '@/types/database'
import { PRODUCT_MODELS as GENERATED_MODELS } from './mockDataGenerator'

type ProductModel = Database['public']['Tables']['product_models']['Row']

// Mock Product Models (15개)
export const mockProductModels: ProductModel[] = GENERATED_MODELS.map((model) => ({
  id: model.id,
  code: model.code,
  name: model.name,
  created_at: '2024-01-01T00:00:00Z',
}))

// 콘솔에 데이터 생성 정보 출력
if (import.meta.env.DEV) {
  console.log('📦 Mock Product Models Generated:')
  console.log(`  - Total Models: ${mockProductModels.length}`)
  console.log(`  - Model Codes: ${mockProductModels.map((m) => m.code).join(', ')}`)
}
