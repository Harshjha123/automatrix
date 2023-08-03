const { app, limiter } = require('./app.js');
const crypto = require("crypto");

const User = require('./Models/User.js');
const Balance = require('./Models/Balance.js');
const Referral = require('./Models/Referral.js');
const Invest = require('./Models/Invest.js');
const Hexes = require('./Models/Investments.js')
const Financial = require('./Models/Financial.js');
const Status = require('./Models/Status.js')

const rechargeRoute = require('./recharge.js')
const withdrawalRoute  = require('./withdraw.js')
const panelRoute = require('./panel.js')
app.use('/panel', panelRoute)
app.use('/withdraw', withdrawalRoute)
app.use('/recharge', rechargeRoute)

var mailFormat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/

function randomString(length, chars) {
    var result = '';
    for (var i = length; i > 0; --i) result += chars[Math.floor(Math.random() * chars.length)];
    return result;
}

const plans2 = []

const plans = [
    {
        name: 'Mechatron',
        income: 0.16,
        cost: 8,
        period: 25,
        image: 'https://cdna.artstation.com/p/assets/images/images/029/800/282/20200828231051/smaller_square/jarlan-perez-mohs-31-print-web.jpg?1598674251'
    },
    {
        name: 'Nanotron',
        income: 0.1819,
        cost: 30,
        period: 22,
        image: 'https://cdnb.artstation.com/p/assets/images/images/029/517/735/20200818213315/smaller_square/jarlan-perez-mohs-39-print-web.jpg?1597804395'
    },
    {
        name: 'Cybertron',
        income: 0.2,
        cost: 80,
        period: 15,
        image: 'https://cdna.artstation.com/p/assets/images/images/029/800/232/20200828230614/smaller_square/jarlan-perez-mohs-27-v2-print-web.jpg?1598673975'
    },
    {
        name: 'Synthron',
        income: 0.21,
        cost: 150,
        period: 15,
        image: 'https://cdnb.artstation.com/p/assets/images/images/029/572/389/20200820194653/smaller_square/jarlan-perez-mohs-21-print-web.jpg?1597970813'
    },
    {
        name: 'Sparktron',
        income: 0.215,
        cost: 220,
        period: 12,
        image: 'https://cdna.artstation.com/p/assets/images/images/029/617/064/20200822123955/smaller_square/jarlan-perez-mohs-44-print-web-soft.jpg?1598117995'
    },
    {
        name: 'Automatron',
        income: 0.22,
        cost: 350,
        period: 10,
        image: 'https://cdnb.artstation.com/p/assets/images/images/029/491/511/20200817234803/smaller_square/jarlan-perez-mohs-50-print-web.jpg?1597726083'
    },
    {
        name: 'Dynatron',
        income: 0.225,
        cost: 500,
        period: 8,
        image: 'https://cdnb.artstation.com/p/assets/images/images/030/655/713/20200928003128/smaller_square/jarlan-perez-mohs-52-print-web.jpg?1601271088'
    },
    {
        name: 'Voltatron',
        income: 0.23,
        cost: 850,
        period: 7,
        image: 'https://cdna.artstation.com/p/assets/images/images/022/925/690/20191225143755/smaller_square/jarlan-perez-asset.jpg?1577306276'
    },
    {
        name: 'Circuitron',
        income: 0.235,
        cost: 1200,
        period: 7,
        image: 'https://cdnb.artstation.com/p/assets/images/images/011/153/103/20180604095533/smaller_square/jarlan-perez-mohs-32-color.jpg?1528124133'
    },
    {
        name: 'Blitztron',
        income: 0.275,
        cost: 2500,
        period: 5,
        image: 'https://cdnb.artstation.com/p/assets/images/images/030/655/539/20200928002008/smaller_square/jarlan-perez-mohs-28-print-web.jpg?1601270408'
    }
]

let defaultId = '9cbe16a0-d238-4212-907e-ebfe7cb94db4'

async function checkStatus() {
    let siteStatus = await Status.findOne({ id: defaultId })
    if (siteStatus) return;

    let record = new Status({
        id: defaultId
    })

    record.save()
}

checkStatus()

// Status Checking { --main route }
app.get('/', async (req, res) => {
    try {
        return res.json({ ip: req.ip })
    } catch (error) {
        return res.json({ error })
    }
})

// Registration
app.post('/register', limiter, async (req, res) => {
    const { email, password, confirm_password, inviter } = req.body

    if (!email) return res.status(400).send({ error: 'Please enter your email address' })
    if (!mailFormat.test(email)) return res.status(400).send({ error: 'Please enter a valid email' })
    if (!password) return res.status(400).send({ error: 'Please enter a password' })
    if (password.length < 6) return res.status(400).send({ error: 'Password must be at least 6 digits' })
    if (!confirm_password || confirm_password !== password) return res.status(400).send({ error: `Confirm password didn't matched` })

    try {
        let isEmail = await User.findOne({ email })
        if (isEmail) return res.status(400).send({ error: 'Email exists already' })

        let lv1, lv2, lv3;
        if(inviter) {
            let isInviter = await User.findOne({ id: inviter.toUpperCase()})

            if (!isInviter) {
                return res.status(400).send({ error: 'Invalid invitation code'})
            } else {
                lv1 = isInviter.id
                lv2 = isInviter.lv1 ? isInviter.lv1 : null
                lv3 = isInviter.lv2 ? isInviter.lv2 : null
            }
        }

        const id = randomString(8, '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ')
        const token = crypto.randomBytes(64).toString('hex')

        let createUser = {
    id,
    token,
    email,
    password,
    status: true,
    date: Date.now(),
}
  
        if(lv1) {
            createUser.lv1 = lv1;

            if(lv2) {
                createUser.lv2 = lv2;

                if (lv3) {
                    createUser.lv3 = lv3
                }
            }
        }

        let userRecord = new User(createUser)
        let balanceRecord = new Balance({ id })
        let referralRecord = new Referral({ id })

        userRecord.save()
        balanceRecord.save()
        referralRecord.save()

        await Status.findOneAndUpdate({ id: defaultId }, {
            $inc: {
                users: 1
            }
        })

        if (lv1) {
            await Referral.findOneAndUpdate({ id: lv1 }, {
                $push: {
                    lv1: {
                        user: id,
                        email,
                        deposits: 0,
                        income: 0,
                        date: Date.now()
                    }
                }
            })
        }

        if (lv2) {
            await Referral.findOneAndUpdate({ id: lv2 }, {
                $push: {
                    lv2: {
                        user: id,
                        email,
                        deposits: 0,
                        income: 0,
                        date: Date.now()
                    }
                }
            })
        }

        if (lv3) {
            await Referral.findOneAndUpdate({ id: lv3 }, {
                $push: {
                    lv3: {
                        user: id,
                        email,
                        deposits: 0,
                        income: 0,
                        date: Date.now()
                    }
                }
            })
        }

        return res.sendStatus(200)
    } catch (error) {
        console.log('/register error: ', error)
        return res.status(400).send({ error: 'Failed to register account'})
    }
})

//Login
app.post('/login', limiter, async (req, res) => {
    const { email, password } = req.body;

    if (!email) return res.status(400).send({ error: 'Please enter your email address' })
    if (!mailFormat.test(email)) return res.status(400).send({ error: 'Please enter a valid email' })
    if (!password) return res.status(400).send({ error: 'Please enter a password' })
    if (password.length < 6) return res.status(400).send({ error: 'Password must be at least 6 digits' })
 
    try {
        let getUser = await User.findOne({ email, password })
        if(!getUser) {
            return res.status(400).send({ error: 'Invalid login details'})
        }

        return res.status(200).send({ token: getUser.token })
    } catch (error) {
        console.log('/login error: ', error);
        return res.status(400).send({ error: 'Failed to login account' })
    }
})

// Forgot Password

// Reset Password

// User Data
app.post('/get/user', async (req, res) => {
    const { token } = req.body;
    if(!token) return res.status(400).send({ logout: true, error: 'Please re-login your account'})

    try {
        let getUser = await User.findOne({ token })
        if (!getUser) return res.status(400).send({ logout: true, error: 'No account exist' })
        if (!getUser.status) return res.status(400).send({ error: 'Your account has been blocked' })

        let balance = await Balance.findOne({ id: getUser.id })
        //let products = await productModel.find({ id: getUser.id })

        return res.status(200).send({ id: getUser.id, email: getUser.email, balance: { withdraw: balance.withdraw, deposit: balance.deposit, product: balance.product, referral: balance.referral } })
    } catch (error) {
        console.log('/get/user Error: ', error);
        return res.status(400).send({ error: 'Failed to fetch account' })
    }
})

// Get Products
app.get('/get/products/:type', async (req, res) => {
    try {
        const { type } = req.params;
        return res.status(200).send({ plans: type && type === 'Advanced' ? plans2 : plans })
    } catch (error) {
        console.log('/get/products Error: ', error);
        return res.status(400).send({ error: 'Failed to fetch product list' })
    }
})

// Purchase Purchase
app.post('/product/purchase', limiter, async (req, res) => {
    const { token, type } = req.body;
    let index = parseFloat(req.body.index)

    if (!token) {
        return res.status(400).send({ error: 'Failed to get account' })
    }

    if (type !== 'Normal' && type !== 'Advance' || index === null) {
        return res.status(400).send({ error: 'Failed to get product'})
    }

    let plan = type === 'Normal' ? plans[index] : plans2[index]
    if(!plan) {
        return res.status(400).send({ error: 'Failed to get product'})
    }

    try {
        let getUser = await User.findOne({ token })
        if (!getUser) return res.status(400).send({ logout: true, error: 'No account exist' })
        if (!getUser.status) return res.status(400).send({ error: 'Your account has been blocked' })

        const { cost, name, image, period, income } = plan;

        let balance = await Balance.findOne({ id: getUser.id })
        let TB = parseFloat(balance.withdraw) + parseFloat(balance.deposit)

        if (cost > 0 && TB < cost) {
            return res.status(400).send({ error: 'Insufficient balance' })
        }

        const hex = crypto.randomBytes(64).toString('hex');

        let record = new Invest({
            id: getUser.id,
            name,
            exp: Date.now() + (1000 * 60 * 60 * 24 * period),
            image,
            daily: income,
            total: 0,
            hex
        })

        await record.save()

        let fi = await Hexes.findOne({ id: defaultId })
        
        if(!fi) {
            let dat = new Hexes({
                id: defaultId,
                hex: [hex]
            })

            await dat.save()
        } else {
            await Hexes.findOneAndUpdate({ id: defaultId }, {
                $push: {
                    hex
                }
            })
        }

        if (cost > 0) {
            await Balance.findOneAndUpdate({ id: getUser.id }, {
                $inc: {
                    deposit: balance.deposit < cost ? -balance.deposit : -cost,
                    withdraw: balance.deposit < cost ? -(cost - balance.deposit) : 0
                }
            })

            let financialRecord = new Financial({
                id: getUser.id,
                type: false,
                amount: cost,
                title: 'Purchased ' + name,
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
                        $inc: { investments: cost },
                        $push: {
                            daily: {
                                deposits: 0,
                                date: date,
                                withdrawals: 0,
                                investments: cost,
                            },
                        },
                    },
                );
            } else {
                await Status.findOneAndUpdate(
                    { id: defaultId, 'daily.date': date },
                    {
                        $inc: { investments: cost, 'daily.$.investments': cost },
                    }
                );
            }

            if (getUser.lv1) {
                await Referral.updateOne({ id: getUser.lv1, 'lv1.user': getUser.id }, {
                    $inc: {
                        "lv1.$.deposits": cost,
                        "lv1.$.income": cost * 0.15,
                        "income.lv1": cost * 0.15
                    }
                })

                await Balance.findOneAndUpdate({ id: getUser.lv1 }, {
                    $inc: {
                        withdraw: cost * 0.15,
                        referral: cost * 0.15
                    }
                })

                let lvlFinancialRecord1 = new Financial({
                    id: getUser.lv1,
                    type: true,
                    amount: cost * 0.15,
                    title: 'Referral Commission',
                    img: 'https://img.icons8.com/?size=2x&id=Z3Ag07iFGqba&format=png',
                    date: Date.now(),
                })

                lvlFinancialRecord1.save()
            }

            if (getUser.lv2) {
                await Referral.updateOne({ id: getUser.lv2, 'lv2.user': getUser.id }, {
                    $inc: {
                        "lv2.$.deposits": cost,
                        "lv2.$.income": cost * 0.07,
                        "income.lv2": cost * 0.07
                    }
                })

                await Balance.findOneAndUpdate({ id: getUser.lv2 }, {
                    $inc: {
                        withdraw: cost * 0.07,
                        referral: cost * 0.07
                    }
                })

                let lvlFinancialRecord2 = new Financial({
                    id: getUser.lv2,
                    type: true,
                    amount: cost * 0.07,
                    title: 'Referral Commission',
                    img: 'https://img.icons8.com/?size=2x&id=Z3Ag07iFGqba&format=png',
                    date: Date.now()
                })

                lvlFinancialRecord2.save()
            }

            if (getUser.lv3) {
                await Referral.updateOne({ id: getUser.lv3, 'lv3.user': getUser.id }, {
                    $inc: {
                        "lv3.$.deposits": cost,
                        "lv3.$.income": cost * 0.03,
                        "income.lv3": cost * 0.03
                    }
                })

                await Balance.findOneAndUpdate({ id: getUser.lv3 }, {
                    $inc: {
                        withdraw: cost * 0.03,
                        referral: cost * 0.03
                    }
                })

                let lvlFinancialRecord3 = new Financial({
                    id: getUser.lv3,
                    type: true,
                    amount: cost * 0.03,
                    title: 'Referral Commission',
                    img: 'https://img.icons8.com/?size=2x&id=Z3Ag07iFGqba&format=png',
                    date: Date.now(),
                })

                lvlFinancialRecord3.save()
            }
        }

        let b = await Balance.findOne({ id: getUser.id })
        return res.status(200).send({ balance: { withdraw: b.withdraw, deposit: b.deposit}})
    } catch (error) {
        console.log('/purchase/products Error: ', error);
        return res.status(400).send({ error: 'Failed to purchase product' })
    }
})

// My Product
app.post('/my/investments', async (req, res) => {
    const { token } = req.body;
    if (!token) return res.status(400).send({ logout: true, error: 'Please re-login your account' })

    try {
        let getUser = await User.findOne({ token })
        if (!getUser) return res.status(400).send({ logout: true, error: 'No account exist' })
        if (!getUser.status) return res.status(400).send({ error: 'Your account has been blocked' })

        let products = await Invest.find({ id: getUser.id })

        return res.status(200).send({ products })
    } catch (error) {
        console.log('/get/user Error: ', error);
        return res.status(400).send({ error: 'Failed to fetch account' })
    }
})

// Team Record
app.post('/my/team', async (req, res) => {
    const { token } = req.body
    const level = parseFloat(req.body.level)

    if (!token) {
        return res.status(400).send({ error: 'Failed to get account' })
    }

    if(level !== 1 && level !==2 && level !== 3) {
        return res.status(400).send({ error: 'Please mention team level' })
    }

    try {
        let getUser = await User.findOne({ token })
        if (!getUser) return res.status(400).send({ logout: true, error: 'No account exist' })
        if (!getUser.status) return res.status(400).send({ error: 'Your account has been blocked' })

        let referral = await Referral.findOne({ id: getUser.id })
        return res.status(200).send({ income: referral.income, referral: { lv1: referral.lv1.length, lv2: referral.lv2.length, lv3: referral.lv3.length }, record: referral[level === 1 ? 'lv1' : level === 2 ? 'lv2' : 'lv3'] })
    } catch (error) {
        console.log('/my/team error: ', error);
        return res.status(400).send({ error: 'Failed to fetch records' })
    }
})

// Account Record
app.post('/account/records', async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).send({ error: 'Failed to get account' })
    }

    try {
        let getUser = await User.findOne({ token })
        if (!getUser) return res.status(400).send({ logout: true, error: 'No account exist' })
        if (!getUser.status) return res.status(400).send({ error: 'Your account has been blocked' })

        let records = await Financial.find({ id: getUser.id }).sort({ _id: -1 }).limit(30)
        return res.status(200).send({ records })
    } catch (error) {
        console.log('/account/records error: ', error);
        return res.status(400).send({ error: 'Failed to fetch records' })
    }
})
