const express = require('express');
const cors = require('cors');
const flightsRoutes = require('./routes/flights');
const { connectDB } = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { port } = require('./config/env');

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/flights', flightsRoutes);

// Error handling middleware
app.use(errorHandler);

const startServer = async () => {
    await connectDB();
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
    });
};

startServer();
 