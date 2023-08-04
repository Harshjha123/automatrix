const mongoose = require('mongoose')

const schema = new mongoose.Schema({
    id: String,
    date: Number
})

module.exports = mongoose.model('cron', schema)