import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(new URL('../frontend/package.json', import.meta.url));
const Ajv = require('@redocly/ajv/dist/2020').default;
const { spec, cases } = JSON.parse(readFileSync(process.argv[2], 'utf8'));
const ajv = new Ajv({ strict: false, allErrors: true, validateFormats: false });
for (const { path, method, status, body } of cases) {
  const schema = spec.paths[path]?.[method]?.responses[status]?.content?.['application/json']?.schema;
  if (!schema) throw new Error(`Missing contract: ${method} ${path} ${status}`);
  const validate = ajv.compile({ ...schema, components: spec.components });
  if (!validate(body)) throw new Error(`${method} ${path} ${status}: ${JSON.stringify(validate.errors)}`);
}
console.log(`Validated ${cases.length} actual API responses against OpenAPI.`);
