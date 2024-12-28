const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const axios = require('axios');
const { format, parse } = require('date-fns');

const app = express();
const port = 5000;
const mongoUri = 'mongodb+srv://rizonrahat199:AheXI006z6v9OQzl@cluster0.yuht9.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const dbName = 'flightdb';
const client = new MongoClient(mongoUri);

app.use(cors());
app.use(express.json());

let db;
let flightsCollection;

// Utility function to parse date in "DD MMM, YYYY" format
function parseDateString(dateString) {
    try {
        return parse(dateString, 'dd MMM, yyyy', new Date());
    } catch (error) {
        console.error('Date parsing error:', error);
        return null;
    }
}

// Format date to ISO string
function formatToISOString(dateString) {
    const date = parseDateString(dateString);
    return date ? format(date, 'yyyy-MM-dd') : null;
}

async function connectDB() {
    try {
        await client.connect();
        db = client.db(dbName);
        flightsCollection = db.collection('flights');
        console.log('Connected to MongoDB');

        // Create indexes
        await flightsCollection.createIndex({ 
            flyFrom: 1, 
            flyTo: 1, 
            local_departure: 1 
        });
        await flightsCollection.createIndex(
            { createdAt: 1 }, 
            { expireAfterSeconds: 86400 }
        );
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
}

function formatFlightData(flightData) {
    return {
        ...flightData,
        createdAt: new Date(),
    };
}

function validateSearchParams(params) {
    const { from, to, whenDate } = params;
    if (!from || !to || !whenDate) {
        return false;
    }
    const parsedDate = parseDateString(whenDate);
    return parsedDate !== null;
}

app.post('/api/flights/search', async (req, res) => {
    try {
        if (!validateSearchParams(req.body)) {
            return res.status(400).json({ 
                error: 'Invalid search parameters',
                message: 'Please provide valid from, to, and date values. Date should be in format "DD MMM, YYYY"'
            });
        }

        const { from, to, whenDate } = req.body;
        const searchDate = formatToISOString(whenDate);

        if (!searchDate) {
            return res.status(400).json({ 
                error: 'Invalid date format',
                message: 'Date should be in format "DD MMM, YYYY"'
            });
        }

        // Check cache
        const cachedFlights = await flightsCollection.find({
            flyFrom: from.toUpperCase(),
            flyTo: to.toUpperCase(),
            local_departure: { $regex: searchDate }
        }).toArray();

        if (cachedFlights.length > 0) {
            console.log('Returning cached flights');
            return res.json(cachedFlights);
        }

        // Fetch from external API
        console.log('Fetching from external API');
        const apiResponse = await axios.post('https://api.fakeflighttickets.com/ticket/flights', {
            end: whenDate,
            from: from.toUpperCase(),
            isRoundTrip: false,
            returnDepartureDateTimeRange: null,
            start: whenDate,
            to: to.toUpperCase(),
            whenDate
        });

        let flights = apiResponse.data;
        if (!Array.isArray(flights)) {
            flights = [flights];
        }

        const formattedFlights = flights.map(formatFlightData);
        if (formattedFlights.length > 0) {
            await flightsCollection.insertMany(formattedFlights);
        }

        res.json(formattedFlights);

    } catch (error) {
        console.error('Flight search error:', error);
        res.status(500).json({
            error: 'Error searching flights',
            message: error.message
        });
    }
});

app.get('/api/flights/:id', async (req, res) => {
    try {
        const flight = await flightsCollection.findOne({
            id: req.params.id
        });

        if (!flight) {
            return res.status(404).json({ error: 'Flight not found' });
        }

        res.json(flight);
    } catch (error) {
        console.error('Error fetching flight:', error);
        res.status(500).json({ error: 'Error fetching flight details' });
    }
});

app.get('/api/flights', async (req, res) => {
    try {
        const flights = await flightsCollection.find({}).toArray();
        res.json(flights);
    } catch (error) {
        console.error('Error fetching flights:', error);
        res.status(500).json({ error: 'Error fetching flights' });
    }
});

app.post('/api/flights/clear-cache', async (req, res) => {
    try {
        await flightsCollection.deleteMany({});
        res.json({ message: 'Cache cleared successfully' });
    } catch (error) {
        console.error('Error clearing cache:', error);
        res.status(500).json({ error: 'Error clearing cache' });
    }
});

app.use((err, req, res, next) => {
    console.error('Unhandled Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

async function startServer() {
    try {
        await connectDB();
        app.listen(port, () => {
            console.log(`Server running on http://localhost:${port}`);
            console.log('Connected to MongoDB');
        });
    } catch (error) {
        console.error('Server startup error:', error);
        process.exit(1);
    }
}

process.on('SIGINT', async () => {
    try {
        await client.close();
        console.log('MongoDB connection closed');
        process.exit(0);
    } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
});

startServer();