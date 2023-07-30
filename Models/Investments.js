const mongoose = require('mongoose')

const schema = new mongoose.Schema({
    id: String,
    hex: {
        type: Array,
        default: []
    }
})

module.exports = mongoose.model('hex', schema)