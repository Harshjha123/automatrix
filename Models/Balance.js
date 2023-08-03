const mongoose = require('mongoose')

const schema = new mongoose.Schema({
    id: String,
    deposit: {
        type: Number,
        default: 0,
    },
    withdraw: {
        type: Number,
        default: 1,
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