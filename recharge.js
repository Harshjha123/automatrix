const axios = require('axios');
const express = require('express');
const router = express.Router();
const TronWeb = require('tronweb');

const Recharge = require('./Models/Recharge.js')
const User = require('./Models/User.js')
const Balance = require('./Models/Balance.js');
const Status = require('./Models/Status.js')
const Financial = require('./Models/Financial.js');

const tronWeb = new TronWeb({
    fullHost: 'https://api.trongrid.io', // Replace with your desired full node URL
});

const wallet = {
    privateKey: 'F8846D74D5E6C3A80A0BA32124BFEA6B53EE3CE6CAAD5F14F48C497A31005235',
    address: 'TGymMQxr5oHr1i5gSwCc8iGBX6fdezSXk7'
}

function orderId() {
    const length = 20;
    const characters = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const charactersLength = characters.length;
    let randomString = '';
    for (let i = 0; i < length; i++) {
        randomString += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return randomString;
}

router.post('/records', async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).send({ error: 'Failed to get account' })
    }

    try {
        let getUser = await User.findOne({ token })
        if (!getUser) return res.status(400).send({ logout: true, error: 'No account exist' })
        if (!getUser.status) return res.status(400).send({ error: 'Your account has been blocked' })

        let records = await Recharge.find({ id: getUser.id }).sort({ _id: -1 }).limit(30)
        return res.status(200).send({ records })
    } catch (error) {
        console.log('/recharge/records error: ', error);
        return res.status(400).send({ error: 'Failed to fetch records' })
    }
})

router.post('/request', async (req, res) => {
    const { token, type } = req.body;
    let amount = parseFloat(req.body.amount)

    if (!token) {
        return res.status(400).send({ error: 'Failed to get account' })
    }

    if (!amount || isNaN(amount) || amount < 5) {
        return res.status(400).send({ error: 'Minimum deposit amount is 5$' })
    }

    try {
        let getUser = await User.findOne({ token })
        if (!getUser) return res.status(400).send({ logout: true, error: 'No account exist' })
        if (!getUser.status) return res.status(400).send({ error: 'Your account has been blocked' })

        let coin = type ? 'tron' : 'tether'
        let priceData = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${coin}&vs_currencies=usd`)
        let con = amount / priceData.data[coin]['usd']

        const newAccount = await tronWeb.createAccount();
        const address = newAccount.address.base58;
        const privateKey = newAccount.privateKey;

        const subscriptionData = {
            type: 'ADDRESS_TRANSACTION',
            attr: {
                address: address,
                chain: 'TRON',
                url: 'https://asset-avenue-c65zs.ondigitalocean.app/recharge/callback',
            },
        };

        const apiKey = '0e010614-b6a9-4de5-8fcf-de755025003a_100';

        const order_id = orderId()

        let data = new Recharge({
            id: getUser.id,
            type: type ? true : false,
            order_id,
            amount,
            crypto: con,
            address,
            privateKey,
            status: 'Pending',
            date: Date.now()
        })

        axios
            .post('https://api.tatum.io/v3/subscription', subscriptionData, {
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                },
            })
            .then((response) => {
                data.save()
                return res.status(200).send({ order_id })
            })
            .catch((error) => {
                console.log('Subscription Error: ', error)
                return res.status(400).send({ error: 'Failed to make deposit request' })
            });
    } catch (error) {
        console.log('/recharge/request error: ', error);
        return res.status(400).send({ error: 'Failed to make deposit request' })
    }
})

router.post('/callback', async (req, res) => {
    console.log(req.body)

    try {
        return res.sendStatus(200)
    } catch (error) {
        console.log('/Callback error: ', error);
        return res.status(400)
    }
})

module.exports = router