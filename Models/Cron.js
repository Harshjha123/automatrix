const mongoose = require('mongoose')

const schema = new mongoose.Schema({
    id: String,
    date: String
})

module.exports = mongoose.model('cron', schema)