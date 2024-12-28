const express = require('express');
const cors = require('cors');
const flightsRoutes = require('./routes/flight.routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/flights', flightsRoutes);

// Fallback route for unhandled requests
app.use((req, res, next) => {
    res.status(404).json({ error: 'Route not found.' });
});

// Error handler
app.use(errorHandler);

module.exports = app;
