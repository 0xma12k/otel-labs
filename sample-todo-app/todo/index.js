// Remove all manual instrumentation if auto-instrumentation has enabled

const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json());

const opentelemetry = require('@opentelemetry/api');
const { context, propagation, trace } = require('@opentelemetry/api');

const meter = opentelemetry.metrics.getMeter('training-01-todo-service');
const counter = meter.createCounter('todo.request',{
    description: 'Counts incoming todo requests',
});

const tracer = opentelemetry.trace.getTracer("training-01-todo-service");
// Connect to MongoDB
console.log("MONGO_URI:" + process.env.MONGO_URI)
mongoose
    .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

const todoSchema = new mongoose.Schema({
    title: { type: String, required: true },
    completed: { type: Boolean, default: false },
});

const Todo = mongoose.model('Todo', todoSchema);

// Get all To-Do items
app.get('/todos', async (req, res) => {
        counter.add(1, { 'path': '/todos', 'method': 'GET' });
        const todos = await Todo.find();
        res.json(todos);
    });

// Create a new To-Do item
app.post('/todos', async (req, res) => {
    const funcSpan = tracer.startSpan('create-todos');
    funcSpan.setAttribute("training", "01");
    counter.add(1, { 'path': '/todos', 'method': 'POST' });
    const { title, completed } = req.body;
    const todo = new Todo({ title, completed });
    await todo.save();

    // Notify the Notification Service
    try {
        await context.with(trace.setSpan(context.active(), funcSpan), async () => {
            const headers = {};
            propagation.inject(context.active(), headers); // Inject trace context into headers
              await axios.post(`http://${process.env.NOTIFY_SERVICE_ENDPOINT}/notify`, {
                message: `New To-Do created: "${title}"`
              } , { headers });
        });

        await axios.post(`http://${process.env.NOTIFY_SERVICE_ENDPOINT}/notify`, {
            message: `New To-Do created: "${title}"`,
        });
    } catch (err) {
        console.error('Notification Service Error:', err.message);
    }

    res.status(201).json(todo);
    funcSpan.end()
});

// Update a To-Do item
app.put('/todos/:id', async (req, res) => {
    const { title, completed } = req.body;
    const todo = await Todo.findByIdAndUpdate(
        req.params.id,
        { title, completed },
        { new: true }
    );

    if (!todo) return res.status(404).send('To-Do not found.');

    // Notify the Notification Service
    try {
        await axios.post(`http://${process.env.NOTIFY_SERVICE_ENDPOINT}/notify`, {
            message: `To-Do updated: "${todo.title}"`,
        });
    } catch (err) {
        console.error('Notification Service Error:', err.message);
    }

    res.json(todo);
});

app.listen(process.env.SERVICE_PORT, () => {
    console.log(`To-Do Service running on port ${process.env.SERVICE_PORT}`);
});
