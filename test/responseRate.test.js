const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateGuestResponseRates } = require('../src/responseRate');

test('calculates response rate by guest using conversation-level replies', () => {
  const conversations = [{ id: 'c1', guestId: 'g1' }, { id: 'c2', guestId: 'g2' }];
  const messages = [
    { conversationId: 'c1', senderType: 'guest', createdAt: '2026-01-01T00:00:00Z' },
    { conversationId: 'c1', senderType: 'host', createdAt: '2026-01-01T00:02:00Z' },
    { conversationId: 'c1', senderType: 'guest', createdAt: '2026-01-01T00:03:00Z' },
    { conversationId: 'c2', senderType: 'guest', createdAt: '2026-01-01T00:01:00Z' },
  ];

  const result = calculateGuestResponseRates(conversations, messages);

  assert.deepEqual(result, [
    {
      guestId: 'g1',
      guestMessages: 2,
      respondedMessages: 1,
      responseRate: 0.5,
    },
    {
      guestId: 'g2',
      guestMessages: 1,
      respondedMessages: 0,
      responseRate: 0,
    },
  ]);
});

test('supports message-level guest identification when conversation guest id is absent', () => {
  const conversations = [{ id: 'c1' }];
  const messages = [
    {
      conversationId: 'c1',
      senderRole: 'guest',
      guestId: 'guest-77',
      createdAt: '2026-01-01T00:00:00Z',
    },
    {
      conversationId: 'c1',
      senderRole: 'manager',
      createdAt: '2026-01-01T00:01:00Z',
    },
  ];

  const result = calculateGuestResponseRates(conversations, messages);

  assert.equal(result.length, 1);
  assert.equal(result[0].guestId, 'guest-77');
  assert.equal(result[0].responseRate, 1);
});
