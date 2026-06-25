import type { CreateTicketRequest, AddTicketCommentRequest, UpdateTicketStatusRequest, ValidationError } from './models';

export function validateCreateTicketRequest(request: CreateTicketRequest): ValidationError | null {
  const details: ValidationError['details'] = [];

  if (!hasValue(request.requesterEmail) && !hasValue(request.requesterUserId)) {
    details.push({
      field: 'requesterEmail',
      message: 'Requester email or requester user id is required.',
    });
  }

  if (!hasValue(request.title)) {
    details.push({
      field: 'title',
      message: 'Title is required.',
    });
  }

  if (!hasValue(request.description)) {
    details.push({
      field: 'description',
      message: 'Description is required.',
    });
  }

  if (details.length === 0) {
    return null;
  }

  return {
    errorCode: 'VALIDATION_ERROR',
    message: 'Ticket request is missing required fields.',
    details,
  };
}

export function validateAddCommentRequest(request: AddTicketCommentRequest): ValidationError | null {
  if (hasValue(request.comment)) {
    return null;
  }

  return {
    errorCode: 'VALIDATION_ERROR',
    message: 'Comment request is missing required fields.',
    details: [
      {
        field: 'comment',
        message: 'Comment is required.',
      },
    ],
  };
}

export function validateUpdateTicketStatusRequest(request: UpdateTicketStatusRequest): ValidationError | null {
  if (hasValue(request.status)) {
    return null;
  }

  return {
    errorCode: 'VALIDATION_ERROR',
    message: 'Status request is missing required fields.',
    details: [
      {
        field: 'status',
        message: 'Status is required.',
      },
    ],
  };
}

function hasValue(value: string | undefined | null): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}
