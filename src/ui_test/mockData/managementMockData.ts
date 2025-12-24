import type { Database } from '@/types/database'

type ProductModel = Database['public']['Tables']['product_models']['Row']
type InspectionItem = Database['public']['Tables']['inspection_items']['Row']

// Mock Product Models
export const mockProductModels: ProductModel[] = []

// Mock Inspection Items
export const mockInspectionItems: InspectionItem[] = []

// Helper function to get items by model ID
export function getItemsByModelId(modelId: string): InspectionItem[] {
  return mockInspectionItems.filter((item) => item.model_id === modelId)
}
