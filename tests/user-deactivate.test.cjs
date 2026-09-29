const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const code = ts.transpileModule(fs.readFileSync('src/services/userService.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText

// Removing a user must go through the Edge Function (which bans the login and
// keeps the profile), never a direct delete on public.users - that erased the
// inspector from their inspections via ON DELETE SET NULL.
function service(result) {
  const exports = {}
  const calls = []
  const supabase = {
    from: () => { throw new Error('users must not be written directly') },
    functions: {
      invoke: async (name, options) => { calls.push(JSON.parse(JSON.stringify({ name, body: options.body }))); return result },
    },
  }
  vm.runInNewContext(code, { exports, console: { error() {} }, Response,
    require: () => ({ supabase, paginatedFetch: async () => [] }),
  })
  return { exports, calls }
}

test('deactivation goes through the Edge Function', async () => {
  const { exports, calls } = service({ data: { user: { id: 'target' } }, error: null })
  await exports.deactivateUser('target')
  assert.deepEqual(calls, [{ name: 'admin-manage-user', body: { action: 'deactivate', user_id: 'target' } }])
})

test('a refused deactivation must not report success', async () => {
  const { exports } = service({ data: null, error: { message: 'forbidden' } })
  await assert.rejects(exports.deactivateUser('target'))
})

test('update sends the password along instead of dropping it', async () => {
  const { exports, calls } = service({ data: { user: { id: 'target' } }, error: null })
  await exports.updateUser('target', { name: 'N', password: 'new-password' })
  assert.deepEqual(calls[0].body, { action: 'update', user_id: 'target', name: 'N', password: 'new-password' })
})
