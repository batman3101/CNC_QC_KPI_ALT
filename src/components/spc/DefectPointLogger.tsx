import { useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box, Paper, Typography, TextField, Button, Chip,
  Autocomplete, Alert, Divider,
} from '@mui/material'
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material'
import type { Database } from '@/types/database'
import type { DefectPart, DefectPointEntry } from '@/types/spc'

type InspectionItem = Database['public']['Tables']['inspection_items']['Row']

interface DefectPointLoggerProps {
  /** 선택 모델·공정의 numeric 검사 항목 목록 */
  items: InspectionItem[]
  /** 부품별 불량 포인트 묶음 (제어 상태) */
  parts: DefectPart[]
  onChange: (parts: DefectPart[]) => void
}

export function DefectPointLogger({ items, parts, onChange }: DefectPointLoggerProps) {
  const { t } = useTranslation()
  const [activePart, setActivePart] = useState(0)
  const [selectedItem, setSelectedItem] = useState<InspectionItem | null>(null)
  const [measured, setMeasured] = useState('')
  const [warn, setWarn] = useState<string | null>(null)
  const valueRef = useRef<HTMLInputElement>(null)

  const specOf = (it: InspectionItem) => ({
    // tolerance_min/max는 절대 규격한계(LSL/USL)로 저장됨 (offset 아님)
    usl: it.tolerance_max,
    lsl: it.tolerance_min,
  })

  const optionLabel = (it: InspectionItem) => {
    const { usl, lsl } = specOf(it)
    return `${it.name}  (${lsl} ~ ${usl}${it.unit ? ' ' + it.unit : ''})`
  }

  const currentPart: DefectPart = parts[activePart] ?? []

  const addPoint = () => {
    if (!selectedItem) return
    if (currentPart.some((p) => p.item_id === selectedItem.id)) {
      setWarn(t('spc.defectPoint.duplicatePoint'))
      return
    }
    const value = measured.trim() === '' ? null : Number(measured)
    if (value !== null && !Number.isNaN(value)) {
      const { usl, lsl } = specOf(selectedItem)
      if (value >= lsl && value <= usl) {
        setWarn(t('spc.defectPoint.withinSpecWarning'))
      } else {
        setWarn(null)
      }
    }
    const entry: DefectPointEntry = {
      item_id: selectedItem.id,
      item_name: selectedItem.name,
      measured_value: value !== null && !Number.isNaN(value) ? value : null,
    }
    const next = parts.slice()
    next[activePart] = [...currentPart, entry]
    onChange(next)
    setSelectedItem(null)
    setMeasured('')
  }

  const removePoint = (partIdx: number, itemId: string) => {
    const stripped = parts.map((p, i) =>
      i === partIdx ? p.filter((e) => e.item_id !== itemId) : p
    )

    // Keep the part the user is currently filling even when it is empty. The
    // old code pruned every empty part, so deleting the last point of part 1
    // also deleted the blank part 2 that "add part" had just created - all the
    // part chips vanished and the auto-synced defect quantity snapped to 0.
    const kept = stripped
      .map((points, index) => ({ points, index }))
      .filter(({ points, index }) => points.length > 0 || index === activePart)

    const next = kept.map(({ points }) => points)
    const nextActive = kept.findIndex(({ index }) => index === activePart)

    onChange(next)
    setActivePart(next.length === 0 ? 0 : Math.max(0, Math.min(nextActive, next.length - 1)))
  }

  const addPart = () => {
    const next = [...parts, []]
    onChange(next)
    setActivePart(next.length - 1)
  }

  const totalPoints = useMemo(() => parts.reduce((s, p) => s + p.length, 0), [parts])

  if (items.length === 0) {
    return <Alert severity="info">{t('spc.defectPoint.noNumericItems')}</Alert>
  }

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 2 }}>
      <Typography variant="subtitle1" fontWeight={700}>{t('spc.defectPoint.panelTitle')}</Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        {t('spc.defectPoint.panelHelper')}
      </Typography>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
        {parts.map((_, i) => (
          <Chip
            key={i}
            label={`${t('spc.defectPoint.part')} ${i + 1}`}
            color={i === activePart ? 'primary' : 'default'}
            onClick={() => setActivePart(i)}
            variant={i === activePart ? 'filled' : 'outlined'}
          />
        ))}
        <Button size="small" startIcon={<AddIcon />} onClick={addPart}>
          {t('spc.defectPoint.addPart')}
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, flexDirection: { xs: 'column', sm: 'row' }, alignItems: { sm: 'center' } }}>
        <Autocomplete
          sx={{ flex: 2, minWidth: 200 }}
          options={items}
          value={selectedItem}
          onChange={(_e, v) => { setSelectedItem(v); setWarn(null); valueRef.current?.focus() }}
          getOptionLabel={optionLabel}
          isOptionEqualToValue={(o, v) => o.id === v.id}
          renderInput={(params) => (
            <TextField {...params} label={t('spc.defectPoint.searchPlaceholder')} size="small" />
          )}
        />
        <TextField
          inputRef={valueRef}
          sx={{ flex: 1, minWidth: 120 }}
          type="number"
          size="small"
          label={t('spc.defectPoint.measuredValue')}
          value={measured}
          onChange={(e) => setMeasured(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addPoint() } }}
        />
        <Button variant="contained" startIcon={<AddIcon />} onClick={addPoint} disabled={!selectedItem}>
          {t('spc.defectPoint.add')}
        </Button>
      </Box>
      {warn && <Alert severity="warning" sx={{ mt: 1 }}>{warn}</Alert>}

      <Divider sx={{ my: 2 }} />

      {totalPoints === 0 ? (
        <Typography variant="body2" color="text.secondary">{t('spc.defectPoint.noPoints')}</Typography>
      ) : (
        parts.map((part, pi) => (
          <Box key={pi} sx={{ mb: 1.5 }}>
            <Typography variant="subtitle2" fontWeight={600}>{t('spc.defectPoint.part')} {pi + 1}</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
              {part.map((e) => (
                <Chip
                  key={e.item_id}
                  label={`${e.item_name}${e.measured_value !== null ? ' = ' + e.measured_value : ''}`}
                  color="error"
                  variant="outlined"
                  onDelete={() => removePoint(pi, e.item_id)}
                  deleteIcon={<DeleteIcon />}
                />
              ))}
            </Box>
          </Box>
        ))
      )}

      <Box sx={{ mt: 2 }}>
        <Typography variant="body2" fontWeight={600}>
          {t('spc.defectPoint.defectiveParts')}: {parts.filter((p) => p.length > 0).length}
        </Typography>
      </Box>
    </Paper>
  )
}
