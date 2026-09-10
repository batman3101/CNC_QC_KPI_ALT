const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')

// Execute the actual Edge handler with network/Auth replaced; never create users.
const source = fs.readFileSync('supabase/functions/admin-create-user/index.ts', 'utf8')
const code = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText

async function request({ role = 'manager', factory = 'ALT', targetFactory = factory,
  targetRole = 'inspector', allowed = true, permissionError = false, authenticated = true } = {}) {
  let handler
  let creations = 0
  const filters = []
  const client = {
    auth: {
      getUser: async () => ({ data: { user: authenticated ? { id: 'caller' } : null } }),
      admin: {
        createUser: async () => { creations++; return { data: { user: { id: 'created' } } } },
        deleteUser: async () => ({ error: null }),
      },
    },
    from(table) {
      let update = false
      const q = {
        select() { return q },
        eq(key, value) { filters.push([table, key, value]); return q },
        update() { update = true; return q },
        async maybeSingle() {
          if (table === 'users') return { data: { role, factory_id: factory } }
          if (table === 'role_feature_permissions') return { data: { allowed }, error: permissionError ? {} : null }
          return { data: { id: targetFactory } }
        },
        async single() { assert.equal(update, true); return { data: { id: 'created' } } },
      }
      return q
    },
  }
  vm.runInNewContext(code, {
    exports: {}, require: () => ({ createClient: () => client }), Response, console,
    Deno: { env: { get: () => 'test-only' }, serve: fn => { handler = fn } },
  })
  const response = await handler(new Request('https://example.invalid', {
    method: 'POST', headers: { Authorization: 'Bearer test-only', 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@example.invalid', name: 'Test', password: 'test-only-password',
      role: targetRole, factory_id: targetFactory }),
  }))
  return { status: response.status, creations, filters }
}

for (const factory of ['ALT', 'ALV']) {
  test(`manager creates own ${factory} inspector with permission`, async () => {
    const result = await request({ factory })
    assert.equal(result.status, 201)
    assert.equal(result.creations, 1)
    assert.ok(result.filters.some(([table, key, value]) => table === 'role_feature_permissions' && key === 'factory_id' && value === factory))
    assert.ok(result.filters.some(([table, key, value]) => table === 'role_feature_permissions' && key === 'feature_key' && value === 'userManagement'))
  })
}
for (const [name, options, status] of [
  ['permission disabled', { allowed: false }, 403],
  ['permission lookup fails closed', { permissionError: true }, 500],
  ['other factory', { targetFactory: 'ALV' }, 403],
  ['admin escalation', { targetRole: 'admin' }, 403],
  ['manager escalation', { targetRole: 'manager' }, 403],
  ['inspector caller', { role: 'inspector' }, 403],
  ['missing authentication', { authenticated: false }, 401],
]) {
  test(name, async () => {
    const result = await request(options)
    assert.equal(result.status, status)
    assert.equal(result.creations, 0)
  })
}
test('admin retains cross-factory role creation', async () => {
  const result = await request({ role: 'admin', targetFactory: 'ALV', targetRole: 'manager', allowed: false })
  assert.equal(result.status, 201)
  assert.equal(result.creations, 1)
})
