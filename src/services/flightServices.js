const axios = require('axios');
const { getDB } = require('../config/db');
const { flightApiUrl } = require('../config/env');

const flightsCollection = () => getDB().collection('flights');

const searchFlights = async (params) => {
    const { from, to, searchDate } = params;

    // Check cache
    const cachedFlights = await flightsCollection().find({
        flyFrom: from.toUpperCase(),
        flyTo: to.toUpperCase(),
        local_departure: { $regex: searchDate },
    }).toArray();

    if (cachedFlights.length > 0) return cachedFlights;

    // Fetch from external API
    const response = await axios.post(flightApiUrl, {
        end: searchDate,
        from: from.toUpperCase(),
        isRoundTrip: false,
        start: searchDate,
        to: to.toUpperCase(),
    });

    const flights = Array.isArray(response.data) ? response.data : [response.data];
    const formattedFlights = flights.map((flight) => ({ ...flight, createdAt: new Date() }));

    if (formattedFlights.length > 0) {
        await flightsCollection().insertMany(formattedFlights);
    }

    return formattedFlights;
};

const clearCache = async () => flightsCollection().deleteMany({});

module.exports = { searchFlights, clearCache };
