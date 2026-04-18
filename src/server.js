const http = require('node:http');
const { fetchHostawayData } = require('./hostaway');
const { calculateGuestResponseRates } = require('./responseRate');

function writeJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
  });
  response.end(JSON.stringify(payload));
}

function createServer() {
  return http.createServer(async (request, response) => {
    if (request.method === 'GET' && request.url === '/health') {
      writeJson(response, 200, { status: 'ok' });
      return;
    }

    if (request.method === 'GET' && request.url === '/api/guest-response-rates') {
      try {
        const { conversations, messages } = await fetchHostawayData();
        const guestResponseRates = calculateGuestResponseRates(conversations, messages);

        writeJson(response, 200, {
          generatedAt: new Date().toISOString(),
          guestResponseRates,
        });
      } catch (error) {
        writeJson(response, 500, {
          error: 'Failed to fetch Hostaway data',
          details: error.message,
        });
      }
      return;
    }

    writeJson(response, 404, { error: 'Not found' });
  });
}

module.exports = {
  createServer,
};
