import type { Hono } from 'hono';
import { logIncident } from '../endpoints/incidents/logIncident';
import { logRequest } from '../endpoints/requests/logRequest';
import { smUpdateStatus } from '../endpoints/requests/smUpdateStatus';

export function registerHornbillRoutes(app: Hono): void {
  app.post('/xmlmc/apps/com.hornbill.servicemanager/Incidents', logIncident);

  app.post('/xmlmc/apps/com.hornbill.servicemanager/Requests', async (c) => {
    const body = await c.req.json<unknown>();
    const method = getXmlmcMethod(body);

    if (method === 'logRequest') {
      return logRequest(c, body);
    }

    if (method === 'smUpdateStatus') {
      return smUpdateStatus(c, body);
    }

    return c.json(
      {
        exceptionName: 'unsupportedMethod',
        exceptionDescription:
          'Unsupported @method for apps/com.hornbill.servicemanager/Requests. Supported methods: logRequest, smUpdateStatus.',
      },
      400,
    );
  });
}

function getXmlmcMethod(body: unknown): unknown {
  if (typeof body !== 'object' || body === null) {
    return undefined;
  }

  return (body as { '@method'?: unknown })['@method'];
}
