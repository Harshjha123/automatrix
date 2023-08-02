const mongoose = require('mongoose')

let schema = new mongoose.Schema({
    id: String,
    wallets: {
        type: Array,
        default: []
    }
})

module.exports = mongoose.model('wallets', schema)