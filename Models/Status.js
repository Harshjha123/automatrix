const mongoose = require('mongoose')

const schema = new mongoose.Schema({
    id: String,
    withdrawals: {
        type: Number,
        default: 0,
    },
    deposits: {
        type: Number,
        default: 0,
    },
    users: {
        type: Number,
        default: 0,
    },
    investments: {
        type: Number,
        default: 0
    },
    daily: {
        type: Array,
        default: []
    }
})

module.exports = mongoose.model('status', schema)