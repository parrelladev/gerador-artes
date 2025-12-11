const { z } = require('zod');
const { GeneratorError } = require('./errors');

function normalizeString(value) {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

function sanitizePayload(obj) {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    acc[key] = typeof value === 'string' ? value.trim() : value;
    return acc;
  }, {});
}

function buildArteSchema(manifest) {
  const logoField = manifest.logoField || 'logo';
  const logoSchema = manifest.defaultLogo
    ? z.string().min(1, `${logoField} é obrigatório`).optional()
    : z.string().min(1, `${logoField} é obrigatório`);

  return z
    .object({
      template: z.string().min(1, 'template é obrigatório'),
      page: z.string().min(1, 'page é obrigatório'),
      h1: z.string().optional(),
      h2: z.string().optional(),
      tag: z.string().optional(),
      chapeu: z.string().nullable().optional(),
      text: z.string().optional(),
      bg: z.string().min(1, 'bg é obrigatório'),
      parameters: z.record(z.any()).optional(),
      logoAlt: z.string().optional(),
      [logoField]: logoSchema,
    })
    .passthrough();
}

function validateArte(arte, manifest) {
  const schema = buildArteSchema(manifest);
  const parsed = schema.parse(arte);
  const sanitized = sanitizePayload(parsed);
  const logoField = manifest.logoField || 'logo';
  const bg = normalizeString(sanitized.bg);
  const logoValue = normalizeString(sanitized[logoField]) || normalizeString(manifest.defaultLogo);

  if (!bg) {
    throw new GeneratorError('O campo "bg" é obrigatório e não pode estar vazio', 'VALIDATION');
  }

  if (!logoValue) {
    throw new GeneratorError(`O campo "${logoField}" é obrigatório para este template`, 'VALIDATION');
  }

  return {
    ...sanitized,
    bg,
    [logoField]: logoValue,
  };
}

module.exports = {
  buildArteSchema,
  validateArte,
};

