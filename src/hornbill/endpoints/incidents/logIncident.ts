import type { Context } from 'hono';
import {
  INCIDENTS_SERVICE,
  LOG_INCIDENT_METHOD,
  type LogIncidentRequest,
  type LogIncidentResponse,
} from '../../types/incidents';
import type { XmlmcParamDefinition } from '../../types/xmlmc';
import { formatValidationErrors, validateXmlmcEnvelope } from '../../validation/validateXmlmcEnvelope';

const logIncidentParams = {
  summary: { type: 'xs:string', required: false },
  description: { type: 'xs:string', required: false },
  requestType: { type: 'xs:string', required: false },
  customerId: { type: 'xs:string', required: false },
  customerType: { type: 'xs:string', required: false },
  ownerId: { type: 'xs:string', required: false },
  teamId: { type: 'xs:string', required: false },
  employeeAssignmentId: { type: 'xs:string', required: false },
  status: { type: 'xs:string', required: false },
  priorityId: { type: 'xs:string', required: false },
  categoryId: { type: 'xs:string', required: false },
  categoryName: { type: 'xs:string', required: false },
  image: { type: 'xs:string', required: false },
  sourceType: { type: 'xs:string', required: false },
  sourceId: { type: 'xs:string', required: false },
  assetId: { type: 'xs:string', required: false },
  impact: { type: 'xs:string', required: false },
  urgencyId: { type: 'xs:string', required: false },
  serviceId: { type: 'xs:string', required: false },
  questions: { type: 'xs:string', required: false },
  resolutionDetails: { type: 'xs:string', required: false },
  fileName: { type: 'xs:string', required: false },
  siteId: { type: 'xs:string', required: false },
  siteName: { type: 'xs:string', required: false },
  catalogId: { type: 'xs:string', required: false },
  catalogName: { type: 'xs:string', required: false },
  externalRefNumber: { type: 'xs:string', required: false },
  bpmName: { type: 'xs:string', required: false },
  questionFieldMap: { type: 'xs:string', required: false },
  senderDetails: { type: 'xs:string', required: false },
  ccDetails: { type: 'xs:string', required: false },
  connectionMap: { type: 'xs:string', required: false },
  connectionUpdateTimeline: { type: 'xs:boolean', required: false },
  connectionTimelineVisibility: { type: 'xs:string', required: false },
} satisfies Record<string, XmlmcParamDefinition>;

export async function logIncident(c: Context): Promise<Response> {
  const body = await c.req.json<unknown>();
  const validation = validateXmlmcEnvelope<LogIncidentRequest>(
    body,
    INCIDENTS_SERVICE,
    LOG_INCIDENT_METHOD,
    logIncidentParams,
  );

  if (!validation.ok) {
    return c.json(
      {
        requestId: '',
        bpmProcessId: '',
        exceptionName: 'validationError',
        exceptionDescription: formatValidationErrors(validation.errors),
        summary: '',
        warnings: '',
      } satisfies LogIncidentResponse,
      400,
    );
  }

  const requestId = createRequestId('INC');
  const response: LogIncidentResponse = {
    requestId,
    bpmProcessId: validation.value.params.serviceId ? createBpmProcessId(requestId) : '',
    exceptionName: '',
    exceptionDescription: '',
    summary: validation.value.params.summary ?? '',
    warnings: '',
  };

  return c.json(response);
}

function createRequestId(prefix: string): string {
  return `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
}

function createBpmProcessId(requestId: string): string {
  return `BPM-${requestId.replace(/^[A-Z]+-/, '')}`;
}
