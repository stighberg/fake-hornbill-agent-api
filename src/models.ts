export type TicketPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export type TicketStatus = 'New' | 'Created' | 'InProgress' | 'Resolved' | 'Closed';

export type HornbillStatusKey =
  | 'status.new'
  | 'status.open'
  | 'status.onHold'
  | 'status.resolved'
  | 'status.closed'
  | 'status.cancelled'
  | 'status.reopened';

export type HornbillStatusLabel =
  | 'New'
  | 'Open'
  | 'On Hold'
  | 'Resolved'
  | 'Closed'
  | 'Cancelled'
  | 'Reopened';

export type HornbillStatus = {
  key: HornbillStatusKey;
  label: HornbillStatusLabel;
};

export type HornbillMetadata = {
  bpmProcessId?: string;
  exceptionName?: string;
  exceptionDescription?: string;
};

export type CreateTicketRequest = {
  requesterEmail?: string;
  requesterUserId?: string;
  requesterId?: string;
  title?: string;
  summary?: string;
  description?: string;
  category?: string;
  priority?: TicketPriority;
  conversationSummary?: string;
  source?: string;
  sourceConversationId?: string;
  correlationId?: string;
};

export type CreateTicketResponse = {
  success: true;
  ticketId: string;
  externalTicketId: string;
  requestId: string;
  status: HornbillStatus;
  title: string;
  summary: string;
  priority: TicketPriority;
  createdAt: string;
  url: string;
  message: string;
  warnings: string[];
  hornbill: HornbillMetadata;
  correlationId?: string;
  sourceConversationId?: string;
};

export type TicketDto = {
  ticketId: string;
  externalTicketId: string;
  status: TicketStatus;
  title: string;
  description: string;
  category: string;
  priority: TicketPriority;
  requesterEmail: string;
  createdAt: string;
  updatedAt: string;
  url: string;
};

export type AddTicketCommentRequest = {
  comment?: string;
  authorEmail?: string;
  visibility?: 'public' | 'internal';
  correlationId?: string;
};

export type AddTicketCommentResponse = {
  ticketId: string;
  commentId: string;
  status: 'Added';
  message: string;
  correlationId?: string;
};

export type UpdateTicketStatusRequest = {
  status?: TicketStatus;
  correlationId?: string;
};

export type ValidationError = {
  errorCode: 'VALIDATION_ERROR';
  message: string;
  details: Array<{
    field: string;
    message: string;
  }>;
};

export type NotFoundError = {
  errorCode: 'TICKET_NOT_FOUND' | 'REQUESTER_NOT_FOUND';
  message: string;
};
