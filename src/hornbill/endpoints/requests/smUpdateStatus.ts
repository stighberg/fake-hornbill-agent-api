import type { Context } from 'hono';
import {
  REQUESTS_SERVICE,
  SM_UPDATE_STATUS_METHOD,
  type SmUpdateStatusRequest,
  type SmUpdateStatusResponse,
} from '../../types/requests';
import type { XmlmcParamDefinition } from '../../types/xmlmc';
import { formatValidationErrors, validateXmlmcEnvelope } from '../../validation/validateXmlmcEnvelope';

const smUpdateStatusParams = {
  requestId: { type: 'xs:string', required: true },
  status: { type: 'xs:string', required: true },
  subStatus: { type: 'xs:string', required: false },
  updateTimeline: { type: 'xs:string', required: false },
  manualUpdateTimeline: { type: 'xs:string', required: false },
  visibility: { type: 'xs:string', required: false },
  onHoldUntilDate: { type: 'xs:dateTime', required: false },
  statusActionReason: { type: 'xs:string', required: false },
  isEmailCustomerChecked: { type: 'xs:boolean', required: false },
} satisfies Record<string, XmlmcParamDefinition>;

export function smUpdateStatus(c: Context, body: unknown): Response {
  const validation = validateXmlmcEnvelope<SmUpdateStatusRequest>(
    body,
    REQUESTS_SERVICE,
    SM_UPDATE_STATUS_METHOD,
    smUpdateStatusParams,
  );

  if (!validation.ok) {
    return c.json(
      {
        activityId: '',
        exceptionName: 'validationError',
        exceptionDescription: formatValidationErrors(validation.errors),
      } satisfies SmUpdateStatusResponse,
      400,
    );
  }

  const response: SmUpdateStatusResponse = {
    activityId: createActivityId(),
    exceptionName: '',
    exceptionDescription: '',
  };

  return c.json(response);
}

function createActivityId(): string {
  return `ACT-${Math.floor(100000 + Math.random() * 900000)}`;
}
