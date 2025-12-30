Below is clean, minimal, Eventz-correct pseudo code, from RabbitMQ wake-up to event append, with no unnecessary abstractions.

I’ll annotate only where absolutely necessary.

End-to-end pseudo code (Judge)
Assumptions

One judge

One queue bound to <Something>Attempted

One cursor stored durably

One event store Y

1️⃣ RabbitMQ delivers a message (wake-up only)
onRabbitMessage(_msg) {
  // IMPORTANT:
  // - ignore message payload
  // - do not deserialize domain data
  // - do not trust ordering

  wakeUpJudge();
}


The message only means:
“Y might have new events.”

2️⃣ Judge wakes up and resumes from cursor
function wakeUpJudge() {
  const lastProcessedId = cursor.load('judge-name');

  processNewEvents(lastProcessedId);
}

3️⃣ Read Y from last cursor position
async function processNewEvents(lastId) {
  for await (const e of Y.readAfter(lastId)) {
    await handleEvent(e);
    cursor.save('judge-name', e.id);
  }
}


Important

Read is ordered

Cursor advances only after success

Crash → safe replay

4️⃣ Judge filters relevant Attempted events
async function handleEvent(e) {
  if (!e.type.endsWith('Attempted')) {
    return;
  }

  if (!isRelevantToThisJudge(e.type)) {
    return;
  }

  await decide(e);
}

5️⃣ Judge decision logic (business rules live here)
async function decide(e) {
  // Load all relevant context from Y
  const history = await Y.loadSlice({
    aggregateId: e.data.someKey,
    upTo: e.id
  });

  // Pure, deterministic function
  const outcomes = judge(history, e);

  // Append outcomes
  for (const outcome of outcomes) {
    await Y.append(outcome);
  }
}


Key properties:

judge() is pure

Decisions depend only on Y

Multiple outcomes allowed (or zero)

6️⃣ Event append (source of truth)
Y.append({
  id: uuid(),
  streamId: ONE_STREAM_ONLY,
  type: 'SomethingDecided',
  data: {...},
  metadata: {
    causation_id: e.id,
    correlation_id: e.metadata.correlation_id
  }
});


Once appended:

projections will see it

automations may react

audit trail is complete

7️⃣ Acknowledge RabbitMQ message (optional timing)
ackMessage();


Acknowledgement strategy:

You may ack early or late

Correctness does NOT depend on ack

Cursor does

Key invariants (do not violate these)

1️⃣ Judge never trusts message contents
2️⃣ Judge always reads from Y
3️⃣ Cursor advances only after success
4️⃣ RabbitMQ is a wake-up signal only
5️⃣ All truth is appended to Y

One-screen summary
onRabbitMessage() {
  const last = cursor.load();
  for (e of Y.readAfter(last)) {
    if (isRelevantAttempt(e)) {
      outcomes = judge(Y, e);
      Y.append(outcomes);
    }
    cursor.save(e.id);
  }
}


If you want next, I can:

show the same flow for automations

show projections (simpler)

show crash recovery step-by-step

show how multiple judges safely coexist

But this pseudo code is the canonical Eventz execution loop.

now the same for the command: API call, command verifies data, append event and publish to rabbitMQ?

Perfect — let’s mirror the same level of precision, but now for the command side.

Below is the canonical Eventz command ingestion flow, from HTTP API call to event append + RabbitMQ publish, with zero ambiguity.

End-to-end pseudo code (Command / API)
Assumptions

HTTP API endpoint

No business decisions here

Validation only (shape, required fields)

One append-only stream Y

RabbitMQ used as wake-up mechanism

1️⃣ HTTP request arrives
onHttpRequest(req, res) {
  handleCommand(req, res);
}

2️⃣ Parse and validate input (no business rules)
function handleCommand(req, res) {
  const correlation_id =
    req.headers['correlation_id'] ??
    req.body.id ??
    uuid();

  // Validate shape only
  assertPresent(req.body.customerName);
  assertIsString(req.body.customerName);

  // Generate identities if needed
  const customerId = req.body.customerId ?? uuid();


Validation rules here are:

required fields

types

formats

no domain decisions

3️⃣ Create Attempted event (this is the command)
  const attemptedEvent = {
    id: uuid(),
    streamId: ONE_STREAM_ONLY,
    type: 'CustomerCreateAttempted',
    data: {
      customerId,
      customerName: req.body.customerName,
    },
    metadata: {
      correlation_id,
      causation_id: correlation_id,
    },
  };


This is the single source fact.

4️⃣ Append Attempted event to Y
  Y.append(attemptedEvent);


Important:

Append never rejects

No locks

No contention logic

Every attempt is recorded

5️⃣ Publish the SAME event to RabbitMQ (wake-up)
  rabbitMQ.publish(
    topic = 'CustomerCreateAttempted',
    payload = attemptedEvent
  );


RabbitMQ does not change meaning.
It only notifies downstream processors.

6️⃣ Acknowledge client (async semantics)
  res.status(202).json({
    message: 'CustomerCreate attempt recorded',
    correlationId: correlation_id,
  });
}


At this point:

request is accepted

decision may come later

client can poll or subscribe for outcome

What does NOT happen here (by design)

❌ No state loading
❌ No conflict checks
❌ No business rules
❌ No decision making
❌ No rejection based on domain logic

Those belong to judges.

Full compact pseudo code
onHttpRequest(req, res) {
  validate(req);

  const attempted = buildAttemptedEvent(req);

  Y.append(attempted);

  rabbitMQ.publish(attempted.type, attempted);

  res.accepted();
}

Invariants (do not break these)

1️⃣ Attempted event is the command
2️⃣ Append happens before publish
3️⃣ Publish carries the same object
4️⃣ No business rules in the API
5️⃣ Client gets async acknowledgement

Mental model (final)

HTTP records intent.
Y records truth.
RabbitMQ wakes processors.
Judges decide later.