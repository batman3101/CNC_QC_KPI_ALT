import { createClient } from 'npm:@supabase/supabase-js@2'

// Edits and deactivates users. Both need the service role: a password or login
// email lives in Auth, which the browser cannot change for someone else, and a
// deactivation has to ban the Auth login as well as mark the profile.
//
// Users are deactivated, never deleted: inspections.user_id is ON DELETE SET
// NULL, so deleting a profile erased the inspector from that person's history.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type UserRole = 'admin' | 'manager' | 'inspector'

interface UpdateBody {
  action: 'update'
  user_id: string
  email?: string
  name?: string
  password?: string
  role?: UserRole
  factory_id?: string
}

interface DeactivateBody {
  action: 'deactivate'
  user_id: string
}

type Body = UpdateBody | DeactivateBody

// Long enough to mean "until someone lifts it"; Auth has no permanent ban.
const BAN_DURATION = '876000h'

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function validateBody(value: unknown): Body | string {
  if (!isRecord(value)) return '요청 본문이 올바르지 않습니다.'

  const userId = typeof value.user_id === 'string' ? value.user_id.trim() : ''
  if (!/^[0-9a-f-]{36}$/i.test(userId)) return '대상 사용자가 올바르지 않습니다.'

  if (value.action === 'deactivate') return { action: 'deactivate', user_id: userId }
  if (value.action !== 'update') return '지원하지 않는 요청입니다.'

  const body: UpdateBody = { action: 'update', user_id: userId }

  if (value.email !== undefined) {
    const email = typeof value.email === 'string' ? value.email.trim().toLowerCase() : ''
    if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return '유효한 이메일을 입력하세요.'
    }
    body.email = email
  }
  if (value.name !== undefined) {
    const name = typeof value.name === 'string' ? value.name.trim() : ''
    if (!name || name.length > 100) return '이름은 1자 이상 100자 이하여야 합니다.'
    body.name = name
  }
  // An empty password means "leave it unchanged", which is what the edit form
  // sends when the field is left blank.
  if (value.password !== undefined && value.password !== '') {
    const password = typeof value.password === 'string' ? value.password : ''
    if (password.length < 6 || password.length > 72) {
      return '비밀번호는 6자 이상 72자 이하여야 합니다.'
    }
    body.password = password
  }
  if (value.role !== undefined) {
    if (value.role !== 'admin' && value.role !== 'manager' && value.role !== 'inspector') {
      return '유효한 역할을 선택하세요.'
    }
    body.role = value.role
  }
  if (value.factory_id !== undefined) {
    const factoryId = typeof value.factory_id === 'string' ? value.factory_id.trim() : ''
    if (!factoryId || factoryId.length > 50) return '유효한 공장을 선택하세요.'
    body.factory_id = factoryId
  }

  return body
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (request.method !== 'POST') {
    return jsonResponse({ error: '허용되지 않은 요청 방식입니다.' }, 405)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !serviceRoleKey) {
    console.error('admin-manage-user: required Supabase environment variables are missing')
    return jsonResponse({ error: '서버 설정 오류가 발생했습니다.' }, 500)
  }

  const authorization = request.headers.get('Authorization')
  const tokenMatch = authorization?.match(/^Bearer\s+(.+)$/i)
  if (!tokenMatch) return jsonResponse({ error: '인증이 필요합니다.' }, 401)

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  try {
    const { data: authData, error: authError } = await adminClient.auth.getUser(tokenMatch[1])
    if (authError || !authData.user) {
      return jsonResponse({ error: '유효하지 않은 인증 정보입니다.' }, 401)
    }
    const callerId = authData.user.id

    const { data: caller, error: callerError } = await adminClient
      .from('users')
      .select('role, factory_id, deactivated_at')
      .eq('id', callerId)
      .maybeSingle()

    if (callerError) {
      console.error('admin-manage-user: failed to read caller profile', callerError.message)
      return jsonResponse({ error: '권한을 확인하지 못했습니다.' }, 500)
    }
    if (!caller || caller.deactivated_at || (caller.role !== 'admin' && caller.role !== 'manager')) {
      return jsonResponse({ error: '사용자 관리 권한이 없습니다.' }, 403)
    }

    let requestBody: unknown
    try {
      requestBody = await request.json()
    } catch {
      return jsonResponse({ error: '요청 본문이 올바르지 않습니다.' }, 400)
    }

    const input = validateBody(requestBody)
    if (typeof input === 'string') return jsonResponse({ error: input }, 400)

    const { data: target, error: targetError } = await adminClient
      .from('users')
      .select('id, email, role, factory_id, deactivated_at')
      .eq('id', input.user_id)
      .maybeSingle()

    if (targetError) {
      console.error('admin-manage-user: failed to read target profile', targetError.message)
      return jsonResponse({ error: '사용자 정보를 확인하지 못했습니다.' }, 500)
    }
    if (!target) return jsonResponse({ error: '사용자를 찾을 수 없습니다.' }, 404)
    if (target.deactivated_at) {
      return jsonResponse({ error: '이미 비활성화된 사용자입니다.' }, 409)
    }

    // Same scope as the users_update RLS policy: a manager handles only the
    // inspectors of their own factory, and only while the configurable
    // userManagement permission is on. This client bypasses RLS, so the check
    // has to be made here.
    if (caller.role === 'manager') {
      const ownInspector =
        !!caller.factory_id &&
        target.role === 'inspector' &&
        target.factory_id === caller.factory_id
      const staysOwnInspector =
        input.action === 'deactivate' ||
        ((input.role === undefined || input.role === 'inspector') &&
          (input.factory_id === undefined || input.factory_id === caller.factory_id))
      if (!ownInspector || !staysOwnInspector) {
        return jsonResponse({ error: '자기 공장의 검사자만 관리할 수 있습니다.' }, 403)
      }
      const { data: permission, error: permissionError } = await adminClient
        .from('role_feature_permissions')
        .select('allowed')
        .eq('factory_id', caller.factory_id)
        .eq('role', 'manager')
        .eq('feature_key', 'userManagement')
        .maybeSingle()
      if (permissionError) return jsonResponse({ error: '권한을 확인하지 못했습니다.' }, 500)
      if (!permission?.allowed) return jsonResponse({ error: '사용자 관리 권한이 없습니다.' }, 403)
    }

    if (input.action === 'deactivate') {
      if (target.id === callerId) {
        return jsonResponse({ error: '자기 자신은 비활성화할 수 없습니다.' }, 400)
      }

      // Ban first: if marking the profile then fails, the login is already
      // closed, which is the safer half to have finished.
      const { error: banError } = await adminClient.auth.admin.updateUserById(target.id, {
        ban_duration: BAN_DURATION,
      })
      if (banError) {
        console.error('admin-manage-user: auth ban failed', banError.message)
        return jsonResponse({ error: '로그인 차단에 실패했습니다.' }, 500)
      }

      const { data: profile, error: profileError } = await adminClient
        .from('users')
        .update({ deactivated_at: new Date().toISOString() })
        .eq('id', target.id)
        .select('*')
        .single()

      if (profileError || !profile) {
        console.error('admin-manage-user: deactivation update failed', profileError?.message)
        return jsonResponse({ error: '사용자 비활성화에 실패했습니다.' }, 500)
      }
      return jsonResponse({ user: profile }, 200)
    }

    if (input.factory_id !== undefined && input.factory_id !== target.factory_id) {
      const { data: factory, error: factoryError } = await adminClient
        .from('factories')
        .select('id')
        .eq('id', input.factory_id)
        .eq('is_active', true)
        .maybeSingle()
      if (factoryError) {
        console.error('admin-manage-user: failed to validate factory', factoryError.message)
        return jsonResponse({ error: '공장 정보를 확인하지 못했습니다.' }, 500)
      }
      if (!factory) return jsonResponse({ error: '유효한 공장을 선택하세요.' }, 400)
    }

    // The login email and password live in Auth. Before this function the edit
    // form changed only public.users, so a new email never reached the login
    // and a new password was dropped.
    const emailChanged = input.email !== undefined && input.email !== target.email
    const authChanges: { email?: string; email_confirm?: boolean; password?: string } = {}
    if (emailChanged) {
      authChanges.email = input.email
      authChanges.email_confirm = true
    }
    if (input.password) authChanges.password = input.password

    if (Object.keys(authChanges).length > 0) {
      const { error: authUpdateError } = await adminClient.auth.admin.updateUserById(
        target.id,
        authChanges
      )
      if (authUpdateError) {
        const message = authUpdateError.message.toLowerCase()
        if (message.includes('already') || message.includes('exists')) {
          return jsonResponse({ error: '이미 사용 중인 이메일입니다.' }, 409)
        }
        console.error('admin-manage-user: auth update failed', authUpdateError.message)
        return jsonResponse({ error: '로그인 정보 변경에 실패했습니다.' }, 400)
      }
    }

    const profileChanges: Record<string, string> = {}
    if (emailChanged && input.email) profileChanges.email = input.email
    if (input.name !== undefined) profileChanges.name = input.name
    if (input.role !== undefined) profileChanges.role = input.role
    if (input.factory_id !== undefined) profileChanges.factory_id = input.factory_id

    const { data: profile, error: profileError } =
      Object.keys(profileChanges).length > 0
        ? await adminClient.from('users').update(profileChanges).eq('id', target.id).select('*').single()
        : await adminClient.from('users').select('*').eq('id', target.id).single()

    if (profileError || !profile) {
      console.error('admin-manage-user: profile update failed', profileError?.message)
      // Put the login email back so it keeps matching the profile.
      if (emailChanged) {
        const { error: revertError } = await adminClient.auth.admin.updateUserById(target.id, {
          email: target.email,
          email_confirm: true,
        })
        if (revertError) {
          console.error('admin-manage-user: auth email revert failed', revertError.message)
        }
      }
      return jsonResponse({ error: '사용자 수정에 실패했습니다.' }, 500)
    }

    return jsonResponse({ user: profile }, 200)
  } catch (error) {
    console.error('admin-manage-user: unexpected error', error instanceof Error ? error.message : 'unknown')
    return jsonResponse({ error: '사용자 처리 중 오류가 발생했습니다.' }, 500)
  }
})
