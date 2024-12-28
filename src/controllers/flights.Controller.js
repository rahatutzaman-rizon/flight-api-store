const axios = require('axios');
const createError = require('http-errors');
const { StatusCodes } = require('http-status-codes');
const Flight = require('../model/flight.model');
const { formatFlightData, formatToISOString } = require('../utils/dateUtils');

async function searchFlights(req, res, next) {
    try {
        const { from, to, whenDate } = req.body;

        if (!from || !to || !whenDate) {
            throw createError(StatusCodes.BAD_REQUEST, 'Missing required parameters: from, to, or whenDate.');
        }

        const searchDate = formatToISOString(whenDate);
        if (!searchDate) {
            throw createError(StatusCodes.BAD_REQUEST, 'Invalid date format. Use "DD MMM, YYYY".');
        }

        // Check cache
        const cachedFlights = await Flight.find({
            flyFrom: from.toUpperCase(),
            flyTo: to.toUpperCase(),
            local_departure: { $regex: searchDate },
        });

        if (cachedFlights.length > 0) {
            return res.status(StatusCodes.OK).json(cachedFlights);
        }

        // Fetch from external API
        const apiResponse = await axios.post(process.env.EXTERNAL_API_URL, {
            end: whenDate,
            from: from.toUpperCase(),
            isRoundTrip: false,
            start: whenDate,
            to: to.toUpperCase(),
        });

        const flights = Array.isArray(apiResponse.data) ? apiResponse.data : [apiResponse.data];
        const formattedFlights = flights.map(formatFlightData);

        if (formattedFlights.length > 0) {
            await Flight.insertMany(formattedFlights);
        }

        res.status(StatusCodes.OK).json(formattedFlights);
    } catch (error) {
        next(error);
    }
}

async function getFlightById(req, res, next) {
    try {
        const { id } = req.params;
        const flight = await Flight.findById(id);

        if (!flight) {
            throw createError(StatusCodes.NOT_FOUND, 'Flight not found.');
        }

        res.status(StatusCodes.OK).json(flight);
    } catch (error) {
        next(error);
    }
}

async function clearCache(req, res, next) {
    try {
        await Flight.deleteMany({});
        res.status(StatusCodes.OK).json({ message: 'Cache cleared successfully.' });
    } catch (error) {
        next(error);
    }
}

module.exports = { searchFlights, getFlightById, clearCache };
