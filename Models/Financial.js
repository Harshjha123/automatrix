const mongoose = require('mongoose')

let schema = new mongoose.Schema({
    id: String,
    date: {
        type: Number,
        default: Date.now()
    },
    type: Boolean,
    amount: Number,
    title: String
})

module.exports = mongoose.model('financial', schema)