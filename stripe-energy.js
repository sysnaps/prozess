// stripe-energy.js — handles energy purchase flow
// ₰10000 energy packs for $5
//
// SETUP:
//   1. Get your Stripe SECRET key from https://dashboard.stripe.com/test/apikeys
//   2. Get your Price ID from the product you created (starts with price_)
//   3. Set environment variables:
//      set STRIPE_SECRET_KEY=sk_test_xxxxx
//      set STRIPE_PRICE_ID=price_xxxxx
//   4. Or create a .env file in D:\prozess with those values
//
// The flow:
//   Browser → irl.energy.buy → server creates Stripe Checkout session → returns URL
//   Browser opens URL → user pays → Stripe redirects back
//   Webhook (later) or manual check confirms payment → energy added

var https = require('https')
var querystring = require('querystring')

// try loading .env file
try {
    var fs = require('fs')
    var path = require('path')
    var envPath = path.join(__dirname, '.env')
    if (fs.existsSync(envPath)) {
        var lines = fs.readFileSync(envPath, 'utf-8').split('\n')
        lines.forEach(function (line) {
            line = line.trim()
            if (!line || line.startsWith('#')) return
            var eq = line.indexOf('=')
            if (eq > 0) {
                var key = line.slice(0, eq).trim()
                var val = line.slice(eq + 1).trim()
                if (!process.env[key]) process.env[key] = val
            }
        })
        console.log('stripe-energy: loaded .env')
    }
} catch (e) {}

var STRIPE_SECRET = process.env.STRIPE_SECRET_KEY || ''
var STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID || ''

function createCheckoutSession(characterName, callback) {
    if (!STRIPE_SECRET) {
        callback(new Error('stripe not configured — create D:\\prozess\\.env with STRIPE_SECRET_KEY and STRIPE_PRICE_ID'))
        return
    }
    if (!STRIPE_PRICE_ID) {
        callback(new Error('no STRIPE_PRICE_ID set — find it in your Stripe dashboard under the product'))
        return
    }

    // since we run locally, success/cancel URLs go to localhost
    // when we have a domain later, these change
    var successUrl = 'http://localhost:3001?energy=success&character=' + encodeURIComponent(characterName)
    var cancelUrl = 'http://localhost:3001?energy=cancel'

    var postData = querystring.stringify({
        'line_items[0][price]': STRIPE_PRICE_ID,
        'line_items[0][quantity]': 1,
        'mode': 'payment',
        'success_url': successUrl,
        'cancel_url': cancelUrl,
        'metadata[character]': characterName,
        'metadata[product]': 'energy-10000',
        'metadata[amount]': '10000'
    })

    var options = {
        hostname: 'api.stripe.com',
        path: '/v1/checkout/sessions',
        method: 'POST',
        headers: {
            'Authorization': 'Basic ' + Buffer.from(STRIPE_SECRET + ':').toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData)
        }
    }

    var req = https.request(options, function (res) {
        var body = ''
        res.on('data', function (chunk) { body += chunk })
        res.on('end', function () {
            try {
                var data = JSON.parse(body)
                if (data.error) {
                    console.log('stripe error:', data.error.message)
                    callback(new Error(data.error.message))
                } else {
                    console.log('stripe: checkout session created for ' + characterName)
                    callback(null, { url: data.url, sessionId: data.id })
                }
            } catch (e) {
                callback(new Error('stripe response parse error'))
            }
        })
    })

    req.on('error', function (e) { callback(e) })
    req.write(postData)
    req.end()
}

// check if a session was paid (manual verification)
function checkSession(sessionId, callback) {
    if (!STRIPE_SECRET) {
        callback(new Error('stripe not configured'))
        return
    }

    var options = {
        hostname: 'api.stripe.com',
        path: '/v1/checkout/sessions/' + sessionId,
        method: 'GET',
        headers: {
            'Authorization': 'Basic ' + Buffer.from(STRIPE_SECRET + ':').toString('base64')
        }
    }

    var req = https.request(options, function (res) {
        var body = ''
        res.on('data', function (chunk) { body += chunk })
        res.on('end', function () {
            try {
                var data = JSON.parse(body)
                callback(null, {
                    paid: data.payment_status === 'paid',
                    character: data.metadata ? data.metadata.character : null,
                    amount: data.metadata ? parseInt(data.metadata.amount || '10000') : 10000
                })
            } catch (e) {
                callback(new Error('stripe parse error'))
            }
        })
    })

    req.on('error', function (e) { callback(e) })
    req.end()
}

module.exports = {
    createCheckoutSession: createCheckoutSession,
    checkSession: checkSession
}
