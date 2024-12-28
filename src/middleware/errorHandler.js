const { StatusCodes } = require('http-status-codes');

const errorHandler = (err, req, res, next) => {
    console.error('Unhandled Error:', err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    });
};

module.exports = errorHandler;
