import { Hono } from 'hono';
import type {
  AddTicketCommentRequest,
  CreateTicketRequest,
  TicketDto,
  TicketPriority,
  TicketStatus,
  UpdateTicketStatusRequest,
} from './models';
import {
  validateAddCommentRequest,
  validateCreateTicketRequest,
  validateUpdateTicketStatusRequest,
} from './validation';

const app = new Hono();

app.get('/health', (c) => {
  return c.json({
    status: 'Healthy',
    service: 'Fake Hornbill Agent API',
    timestamp: new Date().toISOString(),
  });
});

app.post('/tickets', async (c) => {
  const body = await c.req.json<CreateTicketRequest>();
  const validationError = validateCreateTicketRequest(body);

  if (validationError !== null) {
    return c.json(validationError, 400);
  }

  const ticketId = createTicketId(body.priority);
  const createdAt = new Date().toISOString();
  const priority = body.priority ?? 'Medium';

  return c.json(
    {
      ticketId,
      externalTicketId: ticketId.replace('FAKE-', ''),
      status: 'Created' satisfies TicketStatus,
      title: body.title?.trim() ?? 'Untitled support ticket',
      priority,
      createdAt,
      url: createTicketUrl(ticketId),
      message: 'Support ticket created successfully.',
      correlationId: body.correlationId,
    },
    201,
  );
});

app.get('/tickets/:ticketId', (c) => {
  const ticketId = c.req.param('ticketId');

  if (!isKnownDemoTicket(ticketId)) {
    return c.json(
      {
        errorCode: 'TICKET_NOT_FOUND',
        message: `Ticket '${ticketId}' was not found.`,
      },
      404,
    );
  }

  const now = new Date().toISOString();
  const ticket: TicketDto = {
    ticketId,
    externalTicketId: ticketId.replace('FAKE-', ''),
    status: 'New',
    title: 'Demo ticket from Copilot Studio',
    description: 'This is a fake ticket returned by the Fake Hornbill Agent API.',
    category: 'Access',
    priority: resolvePriorityFromTicketId(ticketId),
    requesterEmail: 'demo.user@example.com',
    createdAt: now,
    updatedAt: now,
    url: createTicketUrl(ticketId),
  };

  return c.json(ticket);
});

app.post('/tickets/:ticketId/comments', async (c) => {
  const ticketId = c.req.param('ticketId');

  if (!isKnownDemoTicket(ticketId)) {
    return c.json(
      {
        errorCode: 'TICKET_NOT_FOUND',
        message: `Ticket '${ticketId}' was not found.`,
      },
      404,
    );
  }

  const body = await c.req.json<AddTicketCommentRequest>();
  const validationError = validateAddCommentRequest(body);

  if (validationError !== null) {
    return c.json(validationError, 400);
  }

  return c.json(
    {
      ticketId,
      commentId: `COMMENT-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'Added',
      message: 'Comment added successfully.',
      correlationId: body.correlationId,
    },
    201,
  );
});

app.patch('/tickets/:ticketId/status', async (c) => {
  const ticketId = c.req.param('ticketId');

  if (!isKnownDemoTicket(ticketId)) {
    return c.json(
      {
        errorCode: 'TICKET_NOT_FOUND',
        message: `Ticket '${ticketId}' was not found.`,
      },
      404,
    );
  }

  const body = await c.req.json<UpdateTicketStatusRequest>();
  const validationError = validateUpdateTicketStatusRequest(body);

  if (validationError !== null) {
    return c.json(validationError, 400);
  }

  return c.json({
    ticketId,
    status: body.status,
    updatedAt: new Date().toISOString(),
    message: 'Ticket status updated successfully.',
    correlationId: body.correlationId,
  });
});

app.get('/users/resolve', (c) => {
  const email = c.req.query('email');
  const userId = c.req.query('userId');

  if (!email && !userId) {
    return c.json(
      {
        errorCode: 'VALIDATION_ERROR',
        message: 'Requester lookup requires email or userId.',
        details: [
          {
            field: 'email',
            message: 'Email or userId is required.',
          },
        ],
      },
      400,
    );
  }

  if (email === 'unknown@example.com' || userId === 'unknown') {
    return c.json(
      {
        errorCode: 'REQUESTER_NOT_FOUND',
        message: 'Requester was not found.',
      },
      404,
    );
  }

  return c.json({
    requesterUserId: userId ?? 'demo.user',
    requesterEmail: email ?? 'demo.user@example.com',
    displayName: 'Demo User',
    organization: 'Demo Organization',
    hornbillCustomerId: userId ?? email ?? 'demo.user',
  });
});

function createTicketId(priority: TicketPriority | undefined): string {
  const prefix = priority === 'High' ? 'FAKE-HIGH' : 'FAKE-INC';
  return `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
}

function createTicketUrl(ticketId: string): string {
  return `https://fakehornbill.example/tickets/${ticketId}`;
}

function isKnownDemoTicket(ticketId: string): boolean {
  return ticketId.startsWith('FAKE-INC-') || ticketId.startsWith('FAKE-HIGH-');
}

function resolvePriorityFromTicketId(ticketId: string): TicketPriority {
  return ticketId.startsWith('FAKE-HIGH-') ? 'High' : 'Medium';
}

export default app;
