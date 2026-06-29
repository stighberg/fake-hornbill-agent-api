import type {
  XmlmcParamDefinition,
  XmlmcValidationError,
  XmlmcValidationResult,
} from '../types/xmlmc';

export function validateXmlmcEnvelope<
  TEnvelope extends {
    '@service': string;
    '@method': string;
    params: Record<string, unknown>;
  },
>(
  body: unknown,
  expectedService: string,
  expectedMethod: string,
  params: Record<string, XmlmcParamDefinition>,
): XmlmcValidationResult<TEnvelope> {
  const errors: XmlmcValidationError[] = [];

  if (!isRecord(body)) {
    return {
      ok: false,
      errors: [
        {
          field: '$',
          message: 'JSON payload must be an object.',
        },
      ],
    };
  }

  const allowedEnvelopeFields = new Set(['@service', '@method', 'params']);
  for (const field of Object.keys(body)) {
    if (!allowedEnvelopeFields.has(field)) {
      errors.push({
        field,
        message: `Unsupported top-level field '${field}'.`,
      });
    }
  }

  if (body['@service'] !== expectedService) {
    errors.push({
      field: '@service',
      message: `Expected @service to be '${expectedService}'.`,
    });
  }

  if (body['@method'] !== expectedMethod) {
    errors.push({
      field: '@method',
      message: `Expected @method to be '${expectedMethod}'.`,
    });
  }

  if (!isRecord(body.params)) {
    errors.push({
      field: 'params',
      message: 'params must be an object.',
    });

    return {
      ok: false,
      errors,
    };
  }

  const allowedParamFields = new Set(Object.keys(params));
  for (const field of Object.keys(body.params)) {
    if (!allowedParamFields.has(field)) {
      errors.push({
        field: `params.${field}`,
        message: `Unsupported parameter '${field}' for ${expectedMethod}.`,
      });
    }
  }

  for (const [field, definition] of Object.entries(params)) {
    const value = body.params[field];

    if (definition.required && value === undefined) {
      errors.push({
        field: `params.${field}`,
        message: `Required parameter '${field}' is missing.`,
      });
      continue;
    }

    if (value !== undefined && !matchesType(value, definition.type)) {
      errors.push({
        field: `params.${field}`,
        message: `Expected ${definition.type}.`,
      });
    }
  }

  if (errors.length > 0) {
    return {
      ok: false,
      errors,
    };
  }

  return {
    ok: true,
    value: body as TEnvelope,
  };
}

export function formatValidationErrors(errors: XmlmcValidationError[]): string {
  return errors.map((error) => `${error.field}: ${error.message}`).join(' ');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function matchesType(value: unknown, type: XmlmcParamDefinition['type']): boolean {
  switch (type) {
    case 'xs:string':
    case 'xs:dateTime':
      return typeof value === 'string';

    case 'xs:int':
      return typeof value === 'number' && Number.isInteger(value);

    case 'xs:boolean':
      return typeof value === 'boolean';
  }
}
