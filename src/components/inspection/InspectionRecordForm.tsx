import { useState, useRef } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import {
  Card,
  CardContent,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  TextField,
  Paper,
  Divider,
  Alert,
  IconButton,
  Autocomplete,
  CircularProgress,
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Assessment,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  PhotoLibrary as GalleryIcon,
  CameraAlt as CameraIcon,
} from '@mui/icons-material'

import type { InspectionProcess, InspectionRecordInput } from '@/types/inspection'
import { useAuth } from '@/hooks/useAuth'
import * as managementService from '@/services/managementService'
import type { Database } from '@/types/database'

type Machine = Database['public']['Tables']['machines']['Row']

interface InspectionRecordFormProps {
  modelId: string
  modelName: string
  modelCode: string
  inspectionProcess: InspectionProcess
  onSubmit: (data: InspectionRecordInput) => Promise<void>
  onCancel: () => void
}

type FormValues = z.infer<ReturnType<typeof createFormSchema>>

function createFormSchema(t: (key: string) => string) {
  return z.object({
    defectTypeId: z.string().min(1, t('validation.selectDefectType')),
    machineId: z.string().nullable().optional(),
    inspectorId: z.string().min(1, t('validation.selectInspector')),
    inspectionQuantity: z
      .number({ invalid_type_error: t('validation.enterQuantity') })
      .min(1, t('validation.quantityMin')),
    defectQuantity: z
      .number({ invalid_type_error: t('validation.enterQuantity') })
      .min(0, t('validation.quantityMin')),
  }).refine((data) => data.defectQuantity <= data.inspectionQuantity, {
    message: t('validation.defectQuantityExceeds'),
    path: ['defectQuantity'],
  })
}

export function InspectionRecordForm({
  modelId,
  modelName,
  modelCode,
  inspectionProcess,
  onSubmit,
  onCancel,
}: InspectionRecordFormProps) {
  const { t } = useTranslation()
  const { profile } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null)
  const [machineInputValue, setMachineInputValue] = useState('')
  const [photoMenuAnchor, setPhotoMenuAnchor] = useState<null | HTMLElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createFormSchema(t)),
    defaultValues: {
      defectTypeId: '',
      machineId: null,
      inspectorId: profile?.id || '',
      inspectionQuantity: 0,
      defectQuantity: 0,
    },
  })

  // Fetch defect types
  const { data: defectTypes = [], isLoading: defectTypesLoading } = useQuery({
    queryKey: ['defect-types'],
    queryFn: managementService.getDefectTypes,
  })

  // Fetch users (for admin to select inspector)
  const { data: users = [], isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: managementService.getUsers,
    enabled: profile?.role === 'admin' || profile?.role === 'manager',
  })

  // Fetch machines based on search input
  const { data: machines = [], isLoading: machinesLoading } = useQuery({
    queryKey: ['machines-search', machineInputValue],
    queryFn: () => managementService.searchMachines(machineInputValue),
    staleTime: 1000 * 60, // 1분간 캐시
  })

  const watchedValues = watch()
  const inspectionQuantity = watchedValues.inspectionQuantity || 0
  const defectQuantity = watchedValues.defectQuantity || 0
  const passQuantity = inspectionQuantity - defectQuantity
  const defectRate =
    inspectionQuantity > 0 ? (defectQuantity / inspectionQuantity) * 100 : 0

  const selectedDefectType = defectTypes.find((dt) => dt.id === watchedValues.defectTypeId)
  const selectedInspector = users.find((u) => u.id === watchedValues.inspectorId)

  // 사진 업로드 핸들러
  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // 파일 크기 제한 (10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB in bytes
    if (file.size > maxSize) {
      setPhotoError('사진 크기는 10MB를 초과할 수 없습니다')
      return
    }

    // 이미지 파일 타입 체크
    if (!file.type.startsWith('image/')) {
      setPhotoError('이미지 파일만 업로드 가능합니다')
      return
    }

    setPhotoError(null)
    setPhotoFile(file)

    // 미리보기 생성
    const reader = new FileReader()
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handlePhotoDelete = () => {
    setPhotoFile(null)
    setPhotoPreview(null)
    setPhotoError(null)
  }

  // 사진 메뉴 핸들러
  const handlePhotoMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setPhotoMenuAnchor(event.currentTarget)
  }

  const handlePhotoMenuClose = () => {
    setPhotoMenuAnchor(null)
  }

  const handleGallerySelect = () => {
    handlePhotoMenuClose()
    galleryInputRef.current?.click()
  }

  const handleCameraCapture = () => {
    handlePhotoMenuClose()
    cameraInputRef.current?.click()
  }

  const handleFormSubmit = async (values: FormValues) => {
    setIsSubmitting(true)
    try {
      await onSubmit({
        model_id: modelId,
        inspection_process: inspectionProcess,
        defect_type_id: values.defectTypeId || null,
        machine_number: selectedMachine?.name || null,
        inspector_id: values.inspectorId,
        inspection_quantity: values.inspectionQuantity,
        defect_quantity: values.defectQuantity,
        photo_url: photoPreview, // Base64 이미지 데이터
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const isLoading = defectTypesLoading || usersLoading
  const canSelectInspector = profile?.role === 'admin' || profile?.role === 'manager'

  return (
    <Card>
      <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <Assessment color="primary" />
          <Typography variant="h6" fontWeight={600}>
            {t('inspection.recordInput')}
          </Typography>
        </Box>

        {/* Read-only Info */}
        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'action.hover', mb: 3 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                {t('dashboard.model')}
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {modelCode} ({modelName})
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                {t('inspection.process')}
              </Typography>
              <Typography variant="body1" fontWeight={500}>
                {inspectionProcess.code} ({inspectionProcess.name})
              </Typography>
            </Box>
          </Box>
        </Paper>

        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Defect Type Selection */}
            <Controller
              name="defectTypeId"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.defectTypeId} disabled={isLoading}>
                  <InputLabel>{t('inspection.defectType')} *</InputLabel>
                  <Select
                    {...field}
                    value={field.value || ''}
                    label={`${t('inspection.defectType')} *`}
                  >
                    {defectTypes.map((type) => (
                      <MenuItem key={type.id} value={type.id}>
                        {type.name}
                      </MenuItem>
                    ))}
                  </Select>
                  <FormHelperText error={!!errors.defectTypeId}>
                    {errors.defectTypeId?.message || t('inspection.defectTypeHelper')}
                  </FormHelperText>
                </FormControl>
              )}
            />

            {/* Machine Number - Searchable Dropdown */}
            <Box>
              <Autocomplete
                options={machines}
                getOptionLabel={(option) => option.name}
                value={selectedMachine}
                onChange={(_event, newValue) => {
                  setSelectedMachine(newValue)
                  setValue('machineId', newValue?.id || null)
                }}
                inputValue={machineInputValue}
                onInputChange={(_event, newInputValue) => {
                  setMachineInputValue(newInputValue)
                }}
                loading={machinesLoading}
                filterOptions={(x) => x} // 서버에서 필터링하므로 클라이언트 필터 비활성화
                isOptionEqualToValue={(option, value) => option.id === value.id}
                noOptionsText={t('common.noData')}
                loadingText={t('common.loading')}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label={`${t('inspection.machineNumber')} (${t('common.optional')})`}
                    placeholder={t('inspection.machineNumberPlaceholder')}
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {machinesLoading ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {t('inspection.machineNumberHelper')}
              </Typography>
            </Box>

            {/* Inspector Selection */}
            {canSelectInspector ? (
              <Controller
                name="inspectorId"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth error={!!errors.inspectorId} disabled={isLoading}>
                    <InputLabel>{t('inspection.inspector')} *</InputLabel>
                    <Select {...field} label={`${t('inspection.inspector')} *`}>
                      {users
                        .filter((u) => u.role === 'inspector')
                        .map((inspector) => (
                          <MenuItem key={inspector.id} value={inspector.id}>
                            {inspector.name}
                          </MenuItem>
                        ))}
                    </Select>
                    <FormHelperText error={!!errors.inspectorId}>
                      {errors.inspectorId?.message || t('inspection.inspectorHelper')}
                    </FormHelperText>
                  </FormControl>
                )}
              />
            ) : (
              <Box>
                <TextField
                  label={t('inspection.inspector')}
                  value={profile?.name || ''}
                  disabled
                  fullWidth
                />
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  {t('inspection.inspectorHelper')}
                </Typography>
              </Box>
            )}

            {/* Quantity Input Guide */}
            <Alert severity="info" sx={{ py: 1 }}>
              <Typography variant="caption" fontWeight={500}>
                {t('inspection.quantityInputGuide')}
              </Typography>
            </Alert>

            {/* Inspection Quantity */}
            <Controller
              name="inspectionQuantity"
              control={control}
              render={({ field }) => (
                <Box>
                  <TextField
                    {...field}
                    type="number"
                    label={`${t('inspection.inspectionQuantity')} *`}
                    fullWidth
                    error={!!errors.inspectionQuantity}
                    inputProps={{ min: 1 }}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                  <Typography
                    variant="caption"
                    color={errors.inspectionQuantity ? 'error' : 'text.secondary'}
                    sx={{ mt: 0.5, display: 'block' }}
                  >
                    {errors.inspectionQuantity?.message || t('inspection.inspectionQuantityHelper')}
                  </Typography>
                </Box>
              )}
            />

            {/* Defect Quantity */}
            <Controller
              name="defectQuantity"
              control={control}
              render={({ field }) => (
                <Box>
                  <TextField
                    {...field}
                    type="number"
                    label={`${t('inspection.defectQuantity')} *`}
                    fullWidth
                    error={!!errors.defectQuantity}
                    inputProps={{ min: 0 }}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                  <Typography
                    variant="caption"
                    color={errors.defectQuantity ? 'error' : 'text.secondary'}
                    sx={{ mt: 0.5, display: 'block' }}
                  >
                    {errors.defectQuantity?.message || t('inspection.defectQuantityHelper')}
                  </Typography>
                </Box>
              )}
            />

            {/* Photo Upload */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                {t('inspection.photo')} ({t('common.optional')})
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                {t('inspection.photoHelper')}
              </Typography>

              {/* Hidden file inputs */}
              <input
                type="file"
                ref={galleryInputRef}
                hidden
                accept="image/*"
                onChange={handlePhotoChange}
              />
              <input
                type="file"
                ref={cameraInputRef}
                hidden
                accept="image/*"
                capture="environment"
                onChange={handlePhotoChange}
              />

              {!photoPreview ? (
                <>
                  <Button
                    variant="outlined"
                    startIcon={<CloudUploadIcon />}
                    fullWidth
                    sx={{ py: 2 }}
                    onClick={handlePhotoMenuOpen}
                  >
                    {t('inspection.uploadPhoto')}
                  </Button>
                  <Menu
                    anchorEl={photoMenuAnchor}
                    open={Boolean(photoMenuAnchor)}
                    onClose={handlePhotoMenuClose}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'center',
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'center',
                    }}
                    PaperProps={{
                      sx: { minWidth: 200 }
                    }}
                  >
                    <MenuItem onClick={handleGallerySelect}>
                      <ListItemIcon>
                        <GalleryIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>{t('inspection.selectFromGallery')}</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={handleCameraCapture}>
                      <ListItemIcon>
                        <CameraIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText>{t('inspection.takePhoto')}</ListItemText>
                    </MenuItem>
                  </Menu>
                </>
              ) : (
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: 'flex-start', gap: 2 }}>
                    <Box
                      component="img"
                      src={photoPreview}
                      alt="Preview"
                      sx={{
                        width: { xs: '100%', sm: 200 },
                        height: { xs: 'auto', sm: 150 },
                        maxHeight: { xs: 200, sm: 150 },
                        objectFit: 'cover',
                        borderRadius: 1,
                      }}
                    />
                    <Box sx={{ flex: 1, width: '100%' }}>
                      <Typography variant="body2" gutterBottom noWrap>
                        {photoFile?.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {((photoFile?.size || 0) / 1024 / 1024).toFixed(2)} MB
                      </Typography>
                      <Box sx={{ mt: 1 }}>
                        <IconButton
                          color="error"
                          size="small"
                          onClick={handlePhotoDelete}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>
                  </Box>
                </Paper>
              )}

              {photoError && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  {photoError}
                </Alert>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Summary Card */}
            {inspectionQuantity > 0 && (
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
                  bgcolor: defectRate > 0 ? 'error.50' : 'success.50',
                  borderColor: defectRate > 0 ? 'error.main' : 'success.main',
                }}
              >
                <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ mb: 2 }}>
                  {t('inspection.summary')}
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
                  <Box sx={{ p: 1.5, bgcolor: 'background.paper', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                      {t('dashboard.model')}
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {modelName}
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5, bgcolor: 'background.paper', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                      {t('inspection.process')}
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {inspectionProcess.name}
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5, bgcolor: 'background.paper', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                      {t('inspection.defectType')}
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {selectedDefectType?.name || t('common.none')}
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5, bgcolor: 'background.paper', borderRadius: 1 }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                      {t('inspection.inspector')}
                    </Typography>
                    <Typography variant="body2" fontWeight={500}>
                      {canSelectInspector ? selectedInspector?.name : profile?.name}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 3, mt: 3 }}>
                  <Box sx={{ p: 1.5, bgcolor: 'background.paper', borderRadius: 1, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                      {t('inspection.inspectionQuantity')}
                    </Typography>
                    <Typography variant="h6" fontWeight={600}>
                      {inspectionQuantity}
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5, bgcolor: 'background.paper', borderRadius: 1, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                      {t('inspection.defectQuantity')}
                    </Typography>
                    <Typography variant="h6" fontWeight={600} color="error">
                      {defectQuantity}
                    </Typography>
                  </Box>
                  <Box sx={{ p: 1.5, bgcolor: 'background.paper', borderRadius: 1, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                      {t('inspection.passQuantity')}
                    </Typography>
                    <Typography variant="h6" fontWeight={600} color="success.main">
                      {passQuantity}
                    </Typography>
                  </Box>
                </Box>
                <Box>
                  <Divider sx={{ my: 1 }} />
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 2,
                        bgcolor: defectRate > 0 ? 'error.50' : 'success.50',
                        borderRadius: 1,
                      }}
                    >
                      <Typography variant="subtitle2" fontWeight={600}>
                        {t('inspection.defectRate')}
                      </Typography>
                      <Typography
                        variant="h5"
                        fontWeight={700}
                        color={defectRate > 0 ? 'error.main' : 'success.main'}
                      >
                        {defectRate.toFixed(2)}%
                      </Typography>
                    </Box>
                  </Box>
              </Paper>
            )}

            {/* Validation Alert */}
            {defectQuantity > inspectionQuantity && (
              <Alert severity="error">
                {t('validation.defectQuantityExceeds')}
              </Alert>
            )}

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                size="large"
                fullWidth
                onClick={onCancel}
                disabled={isSubmitting}
                startIcon={<CancelIcon />}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={isSubmitting || inspectionQuantity === 0 || defectQuantity > inspectionQuantity}
                startIcon={<SaveIcon />}
              >
                {t('inspection.submit')}
              </Button>
            </Box>
          </Box>
        </form>
      </CardContent>
    </Card>
  )
}
