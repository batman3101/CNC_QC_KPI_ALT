import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useTranslation } from 'react-i18next'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from '@mui/material'
import { useSnackbar } from 'notistack'
import type { Database } from '@/types/database'
import * as userService from '@/ui_test/mockServices/mockUserService'

type User = Database['public']['Tables']['users']['Row']

interface UserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: User | null
  existingEmails?: string[]
}

function createFormSchema(
  t: (key: string) => string,
  isEditing: boolean,
  existingEmails: string[],
  currentEmail?: string
) {
  return z.object({
    name: z
      .string()
      .min(1, t('validation.required'))
      .max(100, t('validation.required')),
    email: z
      .string()
      .min(1, t('validation.required'))
      .email(t('validation.email'))
      .refine(
        (email) => {
          // 수정 모드에서 자기 자신의 이메일은 허용
          if (isEditing && email === currentEmail) return true
          return !existingEmails.includes(email)
        },
        { message: t('userManagement.emailDuplicate') }
      ),
    role: z.enum(['admin', 'manager', 'inspector'], {
      required_error: t('validation.required'),
    }),
    password: isEditing
      ? z
          .string()
          .optional()
          .refine(
            (val) => !val || val.length >= 6,
            { message: t('validation.passwordMin') }
          )
      : z.string().min(6, t('validation.passwordMin')),
  })
}

type FormValues = {
  name: string
  email: string
  role: 'admin' | 'manager' | 'inspector'
  password: string
}

export function UserDialog({
  open,
  onOpenChange,
  user,
  existingEmails = [],
}: UserDialogProps) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const { enqueueSnackbar } = useSnackbar()
  const isEditing = !!user

  const formSchema = createFormSchema(t, isEditing, existingEmails, user?.email)

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'inspector',
      password: '',
    },
  })

  // Reset form when dialog opens/closes or user changes
  useEffect(() => {
    if (open) {
      if (user) {
        reset({
          name: user.name,
          email: user.email,
          role: user.role as 'admin' | 'manager' | 'inspector',
          password: '',
        })
      } else {
        reset({
          name: '',
          email: '',
          role: 'inspector',
          password: '',
        })
      }
    }
  }, [open, user, reset])

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: userService.CreateUserInput) =>
      userService.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      enqueueSnackbar(t('userManagement.userCreated'), { variant: 'success' })
      onOpenChange(false)
      reset()
    },
    onError: (error: Error) => {
      enqueueSnackbar(error.message, { variant: 'error' })
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: userService.UpdateUserInput }) =>
      userService.updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      enqueueSnackbar(t('userManagement.userUpdated'), { variant: 'success' })
      onOpenChange(false)
      reset()
    },
    onError: (error: Error) => {
      enqueueSnackbar(error.message, { variant: 'error' })
    },
  })

  const onSubmit = (values: FormValues) => {
    if (isEditing && user) {
      const updateData: userService.UpdateUserInput = {
        name: values.name,
        email: values.email,
        role: values.role,
      }
      // 비밀번호가 입력된 경우만 업데이트
      if (values.password) {
        updateData.password = values.password
      }
      updateMutation.mutate({
        id: user.id,
        data: updateData,
      })
    } else {
      createMutation.mutate({
        name: values.name,
        email: values.email,
        role: values.role,
        password: values.password,
      })
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog
      open={open}
      onClose={() => onOpenChange(false)}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        {isEditing ? t('userManagement.editUser') : t('userManagement.addUser')}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {t('userManagement.description')}
        </Typography>
      </DialogTitle>

      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label={`${t('userManagement.name')} *`}
                  disabled={isLoading}
                  error={!!errors.name}
                  helperText={errors.name?.message}
                  fullWidth
                />
              )}
            />

            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="email"
                  label={`${t('userManagement.email')} *`}
                  disabled={isLoading}
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  fullWidth
                />
              )}
            />

            <Controller
              name="role"
              control={control}
              render={({ field }) => (
                <FormControl fullWidth error={!!errors.role}>
                  <InputLabel>{`${t('userManagement.role')} *`}</InputLabel>
                  <Select
                    {...field}
                    label={`${t('userManagement.role')} *`}
                    disabled={isLoading}
                  >
                    <MenuItem value="admin">{t('userManagement.roleAdmin')}</MenuItem>
                    <MenuItem value="manager">{t('userManagement.roleManager')}</MenuItem>
                    <MenuItem value="inspector">{t('userManagement.roleInspector')}</MenuItem>
                  </Select>
                  {errors.role && (
                    <FormHelperText>{errors.role.message}</FormHelperText>
                  )}
                </FormControl>
              )}
            />

            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="password"
                  label={isEditing ? t('userManagement.password') : `${t('userManagement.password')} *`}
                  disabled={isLoading}
                  error={!!errors.password}
                  helperText={
                    errors.password?.message ||
                    (isEditing ? t('userManagement.passwordHint') : undefined)
                  }
                  fullWidth
                />
              )}
            />
          </Box>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading}
          >
            {isLoading ? t('common.loading') : isEditing ? t('common.edit') : t('common.add')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  )
}
