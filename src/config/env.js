require('dotenv').config();

module.exports = {
    port: process.env.PORT || 5000,
    mongoUri: process.env.MONGO_URI,
    flightApiUrl: process.env.FLIGHT_API_URL,
    nodeEnv: process.env.NODE_ENV || 'production',
};
