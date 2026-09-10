const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const code = ts.transpileModule(fs.readFileSync('src/services/userService.ts', 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText

function service(error) {
  const exports = {}
  const query = {
    delete() { return this },
    eq(key, value) { assert.equal(key, 'id'); assert.equal(value, 'target'); return this },
    select(key) { assert.equal(key, 'id'); return this },
    async single() { return { data: error ? null : { id: 'target' }, error } },
  }
  vm.runInNewContext(code, { exports, console: { error() {} },
    require: () => ({ supabase: { from: table => { assert.equal(table, 'users'); return query } } }),
  })
  return exports
}
test('successful deletion confirms the affected row', async () => {
  await service(null).deleteUser('target')
})
test('RLS-filtered or missing deletion must not report success', async () => {
  await assert.rejects(service({ code: 'PGRST116' }).deleteUser('target'))
})
