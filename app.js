const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const { Telegraf } = require('telegraf');
require('dotenv').config();

const app = express();

const whitelist = ['http://192.168.126.227:3000', 'https://automatrix-zalim.web.app'];
let corsOptions = {
    origin: function (origin, callback) {
        if (whitelist.indexOf(origin) !== -1 || !origin) {
            //console.log("✅ CORS: origin allowed");
            callback(null, true);
        } else {
            callback(new Error(`${origin} not allowed by CORS`));
        }
    },
};

const limiter = rateLimit({
    windowMs: 1000,
    max: 1
})

app.use(express.json());
app.use(cors(corsOptions));

const bot = new Telegraf('6420664426:AAGY864gWztBfg7746wURNUoyk9zADtLZ0U');
bot.launch()

mongoose.connect(process.env.MONGODB_URI)
    .then(response => {
        app.listen('8080', () => {
            console.log('App is running on port: ', 8080)
        })
    })
    .catch(error => {
        console.log('Mongoose Connection Error: ', error)
    })

module.exports = { app, limiter, bot }