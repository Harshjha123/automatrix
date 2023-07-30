const mongoose = require('mongoose')

const schema = new mongoose.Schema({
    id: String,
    name: String,
    exp: Number,
    image: String,
    daily: Number,
    total: Number,
    hex: String
})

module.exports = mongoose.model('invest', schema)