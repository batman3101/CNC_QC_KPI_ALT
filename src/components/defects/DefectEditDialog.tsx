import { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  CircularProgress,
} from '@mui/material'
import { CloudUpload as CloudUploadIcon } from '@mui/icons-material'
import type { Database } from '@/types/database'
import { getProductModels, getDefectTypes } from '@/services/managementService'
import { compressAndUploadPhoto } from '@/services/inspectionService'

type Defect = Database['public']['Tables']['defects']['Row']

interface DefectEditDialogProps {
  defect: Defect | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (id: string, data: Record<string, string>) => void
}

function createFormSchema(t: (key: string) => string) {
  return z.object({
    defect_type: z.string().min(1, t('validation.selectDefectType')),
    description: z.string().min(1, t('validation.required')),
    model_id: z.string().min(1, t('validation.selectModel')),
    status: z.enum(['pending', 'in_progress', 'resolved']),
  })
}

type FormValues = z.infer<ReturnType<typeof createFormSchema>>

export function DefectEditDialog({
  defect,
  open,
  onOpenChange,
  onSave,
}: DefectEditDialogProps) {
  const { t } = useTranslation()
  const schema = createFormSchema(t)

  const { data: productModels = [] } = useQuery({
    queryKey: ['product-models'],
    queryFn: getProductModels,
  })

  const { data: defectTypes = [] } = useQuery({
    queryKey: ['defect-types'],
    queryFn: getDefectTypes,
  })

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      defect_type: '',
      description: '',
      model_id: '',
      status: 'pending',
    },
  })

  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [photoUploading, setPhotoUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (defect && open) {
      reset({
        defect_type: defect.defect_type,
        description: defect.description || '',
        model_id: defect.model_id,
        status: defect.status,
      })
      setPhotoUrl(defect.photo_url || null)
    }
  }, [defect, open, reset])

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) return
    if (!file.type.startsWith('image/')) return

    setPhotoUploading(true)
    try {
      const url = await compressAndUploadPhoto(file)
      setPhotoUrl(url)
    } catch (error) {
      console.error('Photo upload failed:', error)
    } finally {
      setPhotoUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const onSubmit = (data: FormValues) => {
    if (!defect) return
    const saveData: Record<string, string> = { ...data }
    if (photoUrl) saveData.photo_url = photoUrl
    onSave(defect.id, saveData)
    onOpenChange(false)
  }

  if (!defect) return null

  return (
    <Dialog
      open={open}
      onClose={() => onOpenChange(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        <Typography variant="h6">{t('defects.editTitle')}</Typography>
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <Controller
              name="defect_type"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.defect_type}>
                  <InputLabel>{t('defects.defectType')}</InputLabel>
                  <Select {...field} label={t('defects.defectType')}>
                    {defectTypes.map((dt) => (
                      <MenuItem key={dt.id} value={dt.id}>
                        {dt.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.defect_type && (
                    <FormHelperText>{errors.defect_type.message}</FormHelperText>
                  )}
                </FormControl>
              )}
            />

            <Controller
              name="model_id"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.model_id}>
                  <InputLabel>{t('management.modelCode')}</InputLabel>
                  <Select {...field} label={t('management.modelCode')}>
                    {productModels.map((m) => (
                      <MenuItem key={m.id} value={m.id}>
                        {m.code} - {m.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.model_id && (
                    <FormHelperText>{errors.model_id.message}</FormHelperText>
                  )}
                </FormControl>
              )}
            />

            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={t('defects.description')}
                  multiline
                  rows={3}
                  fullWidth
                  error={!!errors.description}
                  helperText={errors.description?.message}
                />
              )}
            />

            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth>
                  <InputLabel>{t('defects.status')}</InputLabel>
                  <Select {...field} label={t('defects.status')}>
                    <MenuItem value="pending">{t('defects.statusPending')}</MenuItem>
                    <MenuItem value="in_progress">{t('defects.statusInProgress')}</MenuItem>
                    <MenuItem value="resolved">{t('defects.statusResolved')}</MenuItem>
                  </Select>
                </FormControl>
              )}
            />

            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={500} display="block" gutterBottom>
                {t('defects.photo')}
              </Typography>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handlePhotoChange}
              />
              {photoUrl ? (
                <Box>
                  <Box
                    component="img"
                    src={photoUrl}
                    alt={t('defects.photo')}
                    sx={{
                      width: '100%',
                      maxHeight: 200,
                      objectFit: 'contain',
                      borderRadius: 1,
                      border: 1,
                      borderColor: 'divider',
                      mb: 1,
                    }}
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={photoUploading ? <CircularProgress size={16} /> : <CloudUploadIcon />}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={photoUploading}
                  >
                    {t('defects.changePhoto')}
                  </Button>
                </Box>
              ) : (
                <Button
                  variant="outlined"
                  startIcon={photoUploading ? <CircularProgress size={16} /> : <CloudUploadIcon />}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={photoUploading}
                >
                  {t('defects.uploadPhoto')}
                </Button>
              )}
            </Box>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => onOpenChange(false)}>{t('common.cancel')}</Button>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {t('common.save')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
