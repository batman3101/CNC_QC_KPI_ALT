import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type UserRole = 'admin' | 'manager' | 'inspector'

interface CreateUserBody {
  email: string
  name: string
  password: string
  role: UserRole
  factory_id: string
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function validateBody(value: unknown): CreateUserBody | string {
  if (!isRecord(value)) return '요청 본문이 올바르지 않습니다.'

  const email = typeof value.email === 'string' ? value.email.trim().toLowerCase() : ''
  const name = typeof value.name === 'string' ? value.name.trim() : ''
  const password = typeof value.password === 'string' ? value.password : ''
  const role = value.role
  const factoryId = typeof value.factory_id === 'string' ? value.factory_id.trim() : ''

  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return '유효한 이메일을 입력하세요.'
  }
  if (!name || name.length > 100) return '이름은 1자 이상 100자 이하여야 합니다.'
  if (password.length < 6 || password.length > 72) {
    return '비밀번호는 6자 이상 72자 이하여야 합니다.'
  }
  if (role !== 'admin' && role !== 'manager' && role !== 'inspector') {
    return '유효한 역할을 선택하세요.'
  }
  if (!factoryId || factoryId.length > 50) return '유효한 공장을 선택하세요.'

  return { email, name, password, role, factory_id: factoryId }
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
    console.error('admin-create-user: required Supabase environment variables are missing')
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

    const { data: caller, error: callerError } = await adminClient
      .from('users')
      .select('role')
      .eq('id', authData.user.id)
      .maybeSingle()

    if (callerError) {
      console.error('admin-create-user: failed to read caller profile', callerError.message)
      return jsonResponse({ error: '권한을 확인하지 못했습니다.' }, 500)
    }
    if (caller?.role !== 'admin') {
      return jsonResponse({ error: '관리자만 사용자를 생성할 수 있습니다.' }, 403)
    }

    let requestBody: unknown
    try {
      requestBody = await request.json()
    } catch {
      return jsonResponse({ error: '요청 본문이 올바르지 않습니다.' }, 400)
    }

    const input = validateBody(requestBody)
    if (typeof input === 'string') return jsonResponse({ error: input }, 400)

    const { data: factory, error: factoryError } = await adminClient
      .from('factories')
      .select('id')
      .eq('id', input.factory_id)
      .eq('is_active', true)
      .maybeSingle()

    if (factoryError) {
      console.error('admin-create-user: failed to validate factory', factoryError.message)
      return jsonResponse({ error: '공장 정보를 확인하지 못했습니다.' }, 500)
    }
    if (!factory) return jsonResponse({ error: '유효한 공장을 선택하세요.' }, 400)

    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: {
        name: input.name,
      },
    })

    if (createError || !created.user) {
      if (createError?.message.toLowerCase().includes('already')) {
        return jsonResponse({ error: '이미 사용 중인 이메일입니다.' }, 409)
      }
      console.error('admin-create-user: auth user creation failed', createError?.message)
      return jsonResponse({ error: '사용자 생성에 실패했습니다.' }, 400)
    }

    const { data: profile, error: profileError } = await adminClient
      .from('users')
      .update({
        email: input.email,
        name: input.name,
        role: input.role,
        factory_id: input.factory_id,
      })
      .eq('id', created.user.id)
      .select('*')
      .single()

    if (profileError || !profile) {
      console.error('admin-create-user: profile update failed', profileError?.message)
      const { error: cleanupError } = await adminClient.auth.admin.deleteUser(created.user.id)
      if (cleanupError) {
        console.error('admin-create-user: auth cleanup failed', cleanupError.message)
      }
      return jsonResponse({ error: '사용자 프로필 생성에 실패했습니다.' }, 500)
    }

    return jsonResponse({ user: profile }, 201)
  } catch (error) {
    console.error('admin-create-user: unexpected error', error instanceof Error ? error.message : 'unknown')
    return jsonResponse({ error: '사용자 생성 중 오류가 발생했습니다.' }, 500)
  }
})
