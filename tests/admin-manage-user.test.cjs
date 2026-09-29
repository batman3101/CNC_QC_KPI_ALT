const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')

// Execute the actual Edge handler with network/Auth replaced; never touches real users.
const source = fs.readFileSync('supabase/functions/admin-manage-user/index.ts', 'utf8')
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText

const TARGET = '11111111-1111-1111-1111-111111111111'
const CALLER = '22222222-2222-2222-2222-222222222222'

async function request(body, {
  role = 'manager', factory = 'ALT', callerDeactivated = null,
  targetRole = 'inspector', targetFactory = 'ALT', targetDeactivated = null,
  allowed = true, authUpdateError = null, profileError = null,
} = {}) {
  let handler
  const authUpdates = []
  const profileUpdates = []
  const client = {
    auth: {
      getUser: async () => ({ data: { user: { id: CALLER } } }),
      admin: {
        updateUserById: async (id, changes) => {
          authUpdates.push({ id, changes })
          return { error: authUpdates.length === 1 ? authUpdateError : null }
        },
      },
    },
    from(table) {
      let id
      let update
      const q = {
        select() { return q },
        is() { return q },
        eq(key, value) { if (key === 'id') id = value; return q },
        update(changes) { update = changes; profileUpdates.push(changes); return q },
        async maybeSingle() {
          if (table === 'users' && id === CALLER) {
            return { data: { role, factory_id: factory, deactivated_at: callerDeactivated } }
          }
          if (table === 'users') {
            return { data: { id: TARGET, email: 'old@example.invalid', role: targetRole,
              factory_id: targetFactory, deactivated_at: targetDeactivated } }
          }
          if (table === 'role_feature_permissions') return { data: { allowed } }
          return { data: { id: 'ALV' } }
        },
        async single() {
          if (update && profileError) return { data: null, error: profileError }
          return { data: { id: TARGET, ...update }, error: null }
        },
      }
      return q
    },
  }
  vm.runInNewContext(code, {
    exports: {}, require: () => ({ createClient: () => client }), Response, console: { error() {} },
    Deno: { env: { get: () => 'test-only' }, serve: fn => { handler = fn } },
  })
  const response = await handler(new Request('https://example.invalid', {
    method: 'POST', headers: { Authorization: 'Bearer test-only', 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: TARGET, ...body }),
  }))
  // Objects built inside the vm context have a different Object prototype, so
  // round-trip them before deepStrictEqual compares against plain literals.
  const plain = (value) => JSON.parse(JSON.stringify(value))
  return { status: response.status, authUpdates: plain(authUpdates), profileUpdates: plain(profileUpdates) }
}

test('manager sets own inspector password through Auth', async () => {
  const result = await request({ action: 'update', name: 'New', password: 'new-password' })
  assert.equal(result.status, 200)
  assert.deepEqual(result.authUpdates, [{ id: TARGET, changes: { password: 'new-password' } }])
  assert.deepEqual(result.profileUpdates, [{ name: 'New' }])
})

test('email change reaches the login as well as the profile', async () => {
  const result = await request({ action: 'update', email: 'New@Example.invalid' })
  assert.equal(result.status, 200)
  assert.deepEqual(result.authUpdates[0].changes, { email: 'new@example.invalid', email_confirm: true })
  assert.deepEqual(result.profileUpdates, [{ email: 'new@example.invalid' }])
})

test('blank password leaves Auth untouched', async () => {
  const result = await request({ action: 'update', name: 'Only name', password: '' })
  assert.equal(result.status, 200)
  assert.equal(result.authUpdates.length, 0)
})

test('failed profile update puts the login email back', async () => {
  const result = await request({ action: 'update', email: 'new@example.invalid' }, { profileError: { message: 'x' } })
  assert.equal(result.status, 500)
  assert.equal(result.authUpdates.length, 2)
  assert.equal(result.authUpdates[1].changes.email, 'old@example.invalid')
})

test('duplicate email is reported as a conflict', async () => {
  const result = await request({ action: 'update', email: 'taken@example.invalid' },
    { authUpdateError: { message: 'A user with this email address has already been registered' } })
  assert.equal(result.status, 409)
  assert.equal(result.profileUpdates.length, 0)
})

test('deactivate bans the login and marks the profile, without deleting', async () => {
  const result = await request({ action: 'deactivate' })
  assert.equal(result.status, 200)
  assert.equal(result.authUpdates.length, 1)
  assert.ok(result.authUpdates[0].changes.ban_duration)
  assert.equal(result.profileUpdates.length, 1)
  assert.ok(result.profileUpdates[0].deactivated_at)
})

for (const [name, body, options, status] of [
  ['manager cannot touch another factory', { action: 'deactivate' }, { targetFactory: 'ALV' }, 403],
  ['manager cannot touch a manager', { action: 'update', name: 'X' }, { targetRole: 'manager' }, 403],
  ['manager cannot promote an inspector', { action: 'update', role: 'manager' }, {}, 403],
  ['manager cannot move an inspector to another factory', { action: 'update', factory_id: 'ALV' }, {}, 403],
  ['manager without permission', { action: 'deactivate' }, { allowed: false }, 403],
  ['inspector caller', { action: 'deactivate' }, { role: 'inspector' }, 403],
  ['deactivated caller', { action: 'deactivate' }, { role: 'admin', callerDeactivated: '2026-09-29' }, 403],
  ['already deactivated target', { action: 'deactivate' }, { targetDeactivated: '2026-09-29' }, 409],
  ['short password', { action: 'update', password: '123' }, {}, 400],
  ['unknown action', { action: 'delete' }, {}, 400],
]) {
  test(name, async () => {
    const result = await request(body, options)
    assert.equal(result.status, status)
    assert.equal(result.authUpdates.length, 0)
    assert.equal(result.profileUpdates.length, 0)
  })
}

test('admin may promote and move across factories', async () => {
  const result = await request({ action: 'update', role: 'manager', factory_id: 'ALV' },
    { role: 'admin', targetFactory: 'ALT', allowed: false })
  assert.equal(result.status, 200)
  assert.deepEqual(result.profileUpdates, [{ role: 'manager', factory_id: 'ALV' }])
})
