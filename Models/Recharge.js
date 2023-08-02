const mongoose = require('mongoose')

let schema = new mongoose.Schema({
    id: String,
    order_id: String,
    amount: Number,
    crypto: Number,
    type: Boolean,
    address: String,
    privateKey: String,
    date: {
        type: Number,
        default: Date.now()
    },
    status: {
        type: String,
        default: 'Pending'
    }
})

module.exports = mongoose.model('recharge', schema)