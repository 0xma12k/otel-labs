// Remove all manual instrumentation if auto-instrumentation has enabled
const express = require('express');
const app = express();
app.use(express.json());
require('dotenv').config();
const { context, propagation, trace } = require('@opentelemetry/api');
const opentelemetry = require('@opentelemetry/api');
const tracer = opentelemetry.trace.getTracer("training-01-notify-service");

// Mock notification endpoint
app.post('/notify', async (req, res) => {
    const extractedContext = propagation.extract(context.active(), req.headers);

    await context.with(extractedContext, async () => {
        const span = tracer.startSpan('notify');
        res.status(200).send('Notification sent.');
        span.end();

    });
});

app.listen(process.env.SERVICE_PORT, () => {
    console.log(`Notification Service running on port ${process.env.SERVICE_PORT}`);
});
