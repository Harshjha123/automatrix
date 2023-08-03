const { limiter } = require('./app.js')
const axios = require('axios');
const express = require('express');
const router = express.Router();
const TronWeb = require('tronweb');

const Recharge = require('./Models/Recharge.js')
const User = require('./Models/User.js')
const Balance = require('./Models/Balance.js');
const Status = require('./Models/Status.js')
const Financial = require('./Models/Financial.js');
const Wallets = require('./Models/Wallets.js')

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

async function transferTrx(privateKey) {
    try {
        const recipientAddress = 'TGymMQxr5oHr1i5gSwCc8iGBX6fdezSXk7'
        const originAddress = await tronWeb.address.fromPrivateKey(privateKey);

        const balance = (await tronWeb.trx.getBalance(originAddress)) / 1e6;
        if (balance < 1.1) return;

        // Convert TRX amount to SUN (the smallest unit of TRX)
        const amountInSun = tronWeb.toSun(balance - 1.1);

        // Build the transaction
        const transaction = await tronWeb.transactionBuilder.sendTrx(
            recipientAddress,
            amountInSun,
            originAddress,
        );

        // Sign the transaction
        const signedTransaction = await tronWeb.trx.sign(
            transaction,
            privateKey,
        );

        // Send the signed transaction
        const sentTransaction = await tronWeb.trx.sendRawTransaction(
            signedTransaction,
        );

        console.log(sentTransaction)

        return sentTransaction;
    } catch (error) {
        console.error('Error sending TRX:', error);
    }
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

router.post('/request', limiter, async (req, res) => {
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
                url: 'https://urchin-app-7wesj.ondigitalocean.app/recharge/callback',
            },
        };

        const apiKey = '49c433f8-7e2a-4c76-a2d1-aea61eee34ee_100';

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

router.post('/rec', async (req, res) => {
    const { token, order_id } = req.body;

    if (!token) {
        return res.status(400).send({ error: 'Failed to get account' })
    }

    if (!order_id) {
        return res.status(400).send({ error: 'No recharge id found' })
    }

    try {
        let getUser = await User.findOne({ token })
        if (!getUser) return res.status(400).send({ logout: true, error: 'No account exist' })
        if (!getUser.status) return res.status(400).send({ error: 'Your account has been blocked' })

        let record = await Recharge.findOne({ id: getUser.id, order_id })
        if(!record) return res.status(400).send({ error: 'Invalid recharge id'})

        return res.status(200).send({ address: record.address, amount: record.crypto, type: record.type ? 'TRX' : 'USDT' })
    } catch (error) {
        console.log('/rec error: ', error);
        return res.status(400).send({ error: 'Failed to fetch recharge details'})
    }
})

router.post('/callback', limiter, async (req, res) => {
    const { address, asset, type, chain } = req.body;
    console.log(req.body, req.body.amount)

    let body = JSON.parse(req.body)
    const amount = parseFloat(req.body.amount)
    console.log(amount)

    if (isNaN(amount)) {
        console.log('Invalid amount:', req.body.amount);
        return res.status(400).send('Invalid amount');
    }

    if (chain !== 'tron-mainnet') {
        return res.sendStatus(200)
    }

    try {
        let getRecharge = await Recharge.findOne({ address })
        if (address && (!getRecharge || getRecharge.status !== 'Pending')) return res.sendStatus(200)

        if (asset === 'TRON' && type === 'native') {
            if (amount < 0.01) return res.sendStatus(200)

            let min = await axios.get('https://api.binance.com/api/v3/ticker/price?symbol=TRXUSDT')
            let minDep = 1 / parseFloat(min.data.price)

            if (amount < minDep) {
                getRecharge.status = 'Failed'
                await getRecharge.save()

                let wallets = await Wallets.findOne({ id: defaultId })

                if (wallets) {
                    wallets.wallets.push({ address: getRecharge.address, privateKey: getRecharge.privateKey })
                    await wallets.save()

                    return res.sendStatus(200)
                } else {
                    let walletData = new Wallets({
                        id: defaultId,
                        wallets: [{ address: getRecharge.address, privateKey: getRecharge.privateKey }]
                    })

                    await walletData.save()
                    return res.sendStatus(200)
                }
            } else {
                getRecharge.status = 'Success'
                getRecharge.amount = amount * min
                await getRecharge.save()

                await Balance.findOneAndUpdate({ id: getRecharge.id }, {
                    $inc: {
                        deposit: getRecharge.amount
                    }
                })

                let financialRecord = new Financial({
                    id: getRecharge.id,
                    type: true,
                    amount: getRecharge.amount,
                    title: 'Recharge',
                    img: 'https://img.icons8.com/?size=2x&id=77049&format=png',
                    date: Date.now(),
                })

                financialRecord.save()

                let date = ("0" + new Date().getDate()).slice(-2) + '/' + ("0" + (new Date().getMonth() + 1)).slice(-2) + '/' + new Date().getFullYear()
                let siteStatus = await Status.findOne({ id: defaultId });
                let checkToday = siteStatus && siteStatus.daily[0] ? siteStatus.daily.findIndex(x => x.date === date) : -1

                if (checkToday === -1) {
                    await Status.findOneAndUpdate({ id: defaultId },
                        {
                            $inc: { deposits: getRecharge.amount },
                            $push: {
                                daily: {
                                    deposits: 0,
                                    date: date,
                                    withdrawals: 0,
                                    investments: 0,
                                },
                            },
                        },
                    );
                } else {
                    await Status.findOneAndUpdate(
                        { id: defaultId, 'daily.date': date },
                        {
                            $inc: { deposits: getRecharge.amount, 'daily.$.deposits': getRecharge.amount },
                        }
                    );
                }

                let walletData = new Wallets({
                    id: defaultId,
                    wallets: [{ address: getRecharge.address, privateKey: getRecharge.privateKey }]
                })

                await walletData.save()

                transferTrx(getRecharge.privateKey)

                return res.sendStatus(200)
            }
        } else if (asset === 'USDT_TRON' && type === 'trc20') {
            if (amount < 0.01) return res.sendStatus(200)
let min = 1

            if (amount < min) {
                getRecharge.status = 'Failed'
                await getRecharge.save()

                let wallets = await Wallets.findOne({ id: defaultId })

                if (wallets) {
                    wallets.wallets.push({ address: getRecharge.address, privateKey: getRecharge.privateKey })
                    await wallets.save()

                    return res.sendStatus(200)
                } else {
                    let walletData = new Wallets({
                        id: defaultId,
                        wallets: [{ address: getRecharge.address, privateKey: getRecharge.privateKey }]
                    })

                    await walletData.save()
                    return res.sendStatus(200)
                }
            } else {
                getRecharge.status = 'Success'
                getRecharge.amount = amount
                await getRecharge.save()

                await Balance.findOneAndUpdate({ id: getRecharge.id }, {
                    $inc: {
                        deposit: getRecharge.amount
                    }
                })

                let financialRecord = new Financial({
                    id: getRecharge.id,
                    type: true,
                    amount: getRecharge.amount,
                    title: 'Recharge',
                    img: 'https://img.icons8.com/?size=2x&id=77049&format=png',
                    date: Date.now(),
                })

                financialRecord.save()

                let date = ("0" + new Date().getDate()).slice(-2) + '/' + ("0" + (new Date().getMonth() + 1)).slice(-2) + '/' + new Date().getFullYear()
                let siteStatus = await Status.findOne({ id: defaultId });
                let checkToday = siteStatus && siteStatus.daily[0] ? siteStatus.daily.findIndex(x => x.date === date) : -1

                if (checkToday === -1) {
                    await Status.findOneAndUpdate({ id: defaultId },
                        {
                            $inc: { deposits: getRecharge.amount },
                            $push: {
                                daily: {
                                    deposits: 0,
                                    date: date,
                                    withdrawals: 0,
                                    investments: 0,
                                },
                            },
                        },
                    );
                } else {
                    await Status.findOneAndUpdate(
                        { id: defaultId, 'daily.date': date },
                        {
                            $inc: { deposits: getRecharge.amount, 'daily.$.deposits': getRecharge.amount },
                        }
                    );
                }

                let walletData = new Wallets({
                    id: defaultId,
                    wallets: [{ address: getRecharge.address, privateKey: getRecharge.privateKey }]
                })

                await walletData.save()

                return res.sendStatus(200)
            }
        }

        return res.sendStatus(200)
    } catch (error) {
        console.log('/Callback error: ', error);
        return res.status(400)
    }
})

module.exports = router