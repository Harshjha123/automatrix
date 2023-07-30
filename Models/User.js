const mongoose = require('mongoose')

const schema = new mongoose.Schema({
    id: String,
    token: String,
    name: String,
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    verified: Boolean,
    status: {
        type: Boolean,
        default: true
    },
    date: Number,
    lv1: String,
    lv2: String,
    lv3: String
})

module.exports = mongoose.model('user', schema)