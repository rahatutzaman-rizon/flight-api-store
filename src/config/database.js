const { MongoClient } = require('mongodb');
const { mongoUri } = require('./env');

const client = new MongoClient(mongoUri);

let db;

const connectDB = async () => {
    try {
        await client.connect();
        db = client.db();
        console.log('Connected to MongoDB');
        return db;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

const getDB = () => db;

module.exports = { connectDB, getDB };
