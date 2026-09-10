// Bundled by `npm run test:sync`. tsconfig.json in this folder swaps the
// IndexedDB and Supabase modules for the in-memory stubs; everything else is
// the real source.
export * as svc from '../../src/services/offlineSyncService'
export * as db from './stubs/offlineDb'
export * as api from './stubs/inspectionService'
