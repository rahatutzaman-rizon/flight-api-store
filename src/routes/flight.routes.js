const express = require('express');
const { StatusCodes } = require('http-status-codes');
const { parseDateString, formatToISOString } = require('../utils/dateUtils');
const { searchFlights, clearCache } = require('../services/flightService');

const router = express.Router();

router.post('/search', async (req, res) => {
    const { from, to, whenDate } = req.body;

    if (!from || !to || !whenDate || !parseDateString(whenDate)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            error: 'Invalid search parameters',
            message: 'Please provide valid from, to, and date values in the format "DD MMM, YYYY".',
        });
    }

    const searchDate = formatToISOString(whenDate);
    try {
        const flights = await searchFlights({ from, to, searchDate });
        res.json(flights);
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            error: 'Error searching flights',
            message: error.message,
        });
    }
});

router.post('/clear-cache', async (req, res) => {
    try {
        await clearCache();
        res.json({ message: 'Cache cleared successfully' });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            error: 'Error clearing cache',
        });
    }
});

module.exports = router;
