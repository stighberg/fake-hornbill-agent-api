import type { XmlmcEnvelope } from './xmlmc';

export const INCIDENTS_SERVICE = 'apps/com.hornbill.servicemanager/Incidents' as const;
export const LOG_INCIDENT_METHOD = 'logIncident' as const;

export type LogIncidentParams = {
  summary?: string;
  description?: string;
  requestType?: string;
  customerId?: string;
  customerType?: string;
  ownerId?: string;
  teamId?: string;
  employeeAssignmentId?: string;
  status?: string;
  priorityId?: string;
  categoryId?: string;
  categoryName?: string;
  image?: string;
  sourceType?: string;
  sourceId?: string;
  assetId?: string;
  impact?: string;
  urgencyId?: string;
  serviceId?: string;
  questions?: string;
  resolutionDetails?: string;
  fileName?: string;
  siteId?: string;
  siteName?: string;
  catalogId?: string;
  catalogName?: string;
  externalRefNumber?: string;
  bpmName?: string;
  questionFieldMap?: string;
  senderDetails?: string;
  ccDetails?: string;
  connectionMap?: string;
  connectionUpdateTimeline?: boolean;
  connectionTimelineVisibility?: string;
};

export type LogIncidentRequest = XmlmcEnvelope<
  typeof INCIDENTS_SERVICE,
  typeof LOG_INCIDENT_METHOD,
  LogIncidentParams
>;

export type LogIncidentResponse = {
  requestId: string;
  bpmProcessId: string;
  exceptionName: string;
  exceptionDescription: string;
  summary: string;
  warnings: string;
};
