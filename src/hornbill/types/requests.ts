import type { XmlmcEnvelope } from './xmlmc';

export const REQUESTS_SERVICE = 'apps/com.hornbill.servicemanager/Requests' as const;
export const LOG_REQUEST_METHOD = 'logRequest' as const;
export const SM_UPDATE_STATUS_METHOD = 'smUpdateStatus' as const;

export type LogRequestParams = {
  summary?: string;
  description?: string;
  requestType: string;
  customerId?: string;
  customerType?: number;
  ownerId?: string;
  teamId?: string;
  status?: string;
  priorityId?: string;
  categoryId?: string;
  categoryName?: string;
  image?: string;
  sourceType?: string;
  sourceId?: string;
  impactId?: string;
  impact?: string;
  urgencyId?: string;
  urgency?: string;
  serviceId?: string;
  questions?: string;
  resolutionDetails?: string;
  siteId?: number;
  siteName?: string;
  catalogId?: string;
  catalogName?: string;
  externalRefNumber?: string;
  questionFieldMap?: string;
  senderDetails?: string;
  ccDetails?: string;
};

export type LogRequestRequest = XmlmcEnvelope<
  typeof REQUESTS_SERVICE,
  typeof LOG_REQUEST_METHOD,
  LogRequestParams
>;

export type LogRequestResponse = {
  requestId: string;
  bpmProcessId: string;
  exceptionName: string;
  exceptionDescription: string;
  summary: string;
};

export type SmUpdateStatusParams = {
  requestId: string;
  status: string;
  subStatus?: string;
  updateTimeline?: string;
  manualUpdateTimeline?: string;
  visibility?: string;
  onHoldUntilDate?: string;
  statusActionReason?: string;
  isEmailCustomerChecked?: boolean;
};

export type SmUpdateStatusRequest = XmlmcEnvelope<
  typeof REQUESTS_SERVICE,
  typeof SM_UPDATE_STATUS_METHOD,
  SmUpdateStatusParams
>;

export type SmUpdateStatusResponse = {
  activityId: string;
  exceptionName: string;
  exceptionDescription: string;
};
