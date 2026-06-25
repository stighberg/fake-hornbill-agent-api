export type TicketPriority = 'Low' | 'Medium' | 'High';

export type TicketStatus = 'New' | 'Created' | 'InProgress' | 'Resolved' | 'Closed';

export type CreateTicketRequest = {
  requesterEmail?: string;
  requesterUserId?: string;
  title?: string;
  description?: string;
  category?: string;
  priority?: TicketPriority;
  conversationSummary?: string;
  source?: string;
  correlationId?: string;
};

export type CreateTicketResponse = {
  ticketId: string;
  externalTicketId: string;
  status: TicketStatus;
  title: string;
  priority: TicketPriority;
  createdAt: string;
  url: string;
  message: string;
  correlationId?: string;
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
