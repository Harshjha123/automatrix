const mongoose = require('mongoose')

const schema = new mongoose.Schema({
    id: String,
    order_id: String,
    date: {
        type: Number,
        default: Date.now()
    },
    type: Boolean,
    crypto: Number,
    amount: Number,
    address: String,
    status: {
        type: String,
        default: "Pending"
    }
})

module.exports = mongoose.model('withdraw', schema)