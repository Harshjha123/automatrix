const mongoose = require('mongoose')

const schema = new mongoose.Schema({
    id: String,
    deposit: {
        type: Number,
        default: 15000,
    },
    withdraw: {
        type: Number,
        default: 15000,
    },
    referral: {
        type: Number,
        default: 0,
    },
    product: {
        type: Number,
        default: 0,
    }
})

module.exports = mongoose.model('balance', schema)