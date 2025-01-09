const express = require('express');
const app = express();
app.use(express.json());
require('dotenv').config();

// Mock notification endpoint
app.post('/notify', (req, res) => {
    const { message } = req.body;
    console.log('Notification:', message);
    res.status(200).send('Notification sent.');
});

app.listen(process.env.SERVICE_PORT, () => {
    console.log(`Notification Service running on port ${process.env.SERVICE_PORT}`);
});
