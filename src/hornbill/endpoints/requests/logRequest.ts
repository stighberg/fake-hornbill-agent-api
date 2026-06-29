import type { Context } from 'hono';
import {
  LOG_REQUEST_METHOD,
  REQUESTS_SERVICE,
  type LogRequestRequest,
  type LogRequestResponse,
} from '../../types/requests';
import type { XmlmcParamDefinition } from '../../types/xmlmc';
import { formatValidationErrors, validateXmlmcEnvelope } from '../../validation/validateXmlmcEnvelope';

const logRequestParams = {
  summary: { type: 'xs:string', required: false },
  description: { type: 'xs:string', required: false },
  requestType: { type: 'xs:string', required: true },
  customerId: { type: 'xs:string', required: false },
  customerType: { type: 'xs:int', required: false },
  ownerId: { type: 'xs:string', required: false },
  teamId: { type: 'xs:string', required: false },
  status: { type: 'xs:string', required: false },
  priorityId: { type: 'xs:string', required: false },
  categoryId: { type: 'xs:string', required: false },
  categoryName: { type: 'xs:string', required: false },
  image: { type: 'xs:string', required: false },
  sourceType: { type: 'xs:string', required: false },
  sourceId: { type: 'xs:string', required: false },
  impactId: { type: 'xs:string', required: false },
  impact: { type: 'xs:string', required: false },
  urgencyId: { type: 'xs:string', required: false },
  urgency: { type: 'xs:string', required: false },
  serviceId: { type: 'xs:string', required: false },
  questions: { type: 'xs:string', required: false },
  resolutionDetails: { type: 'xs:string', required: false },
  siteId: { type: 'xs:int', required: false },
  siteName: { type: 'xs:string', required: false },
  catalogId: { type: 'xs:string', required: false },
  catalogName: { type: 'xs:string', required: false },
  externalRefNumber: { type: 'xs:string', required: false },
  questionFieldMap: { type: 'xs:string', required: false },
  senderDetails: { type: 'xs:string', required: false },
  ccDetails: { type: 'xs:string', required: false },
} satisfies Record<string, XmlmcParamDefinition>;

export function logRequest(c: Context, body: unknown): Response {
  const validation = validateXmlmcEnvelope<LogRequestRequest>(
    body,
    REQUESTS_SERVICE,
    LOG_REQUEST_METHOD,
    logRequestParams,
  );

  if (!validation.ok) {
    return c.json(
      {
        requestId: '',
        bpmProcessId: '',
        exceptionName: 'validationError',
        exceptionDescription: formatValidationErrors(validation.errors),
        summary: '',
      } satisfies LogRequestResponse,
      400,
    );
  }

  const requestId = createRequestId(resolveRequestIdPrefix(validation.value.params.requestType));
  const response: LogRequestResponse = {
    requestId,
    bpmProcessId: '',
    exceptionName: '',
    exceptionDescription: '',
    summary: validation.value.params.summary ?? '',
  };

  return c.json(response);
}

function resolveRequestIdPrefix(requestType: string): string {
  switch (requestType) {
    case 'Incident':
      return 'INC';

    case 'Service Request':
      return 'SR';

    case 'Problem':
      return 'PRB';

    case 'Known Error':
      return 'KE';

    case 'Change Request':
      return 'CHG';

    case 'Release':
      return 'REL';

    default:
      return 'REQ';
  }
}

function createRequestId(prefix: string): string {
  return `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
}
