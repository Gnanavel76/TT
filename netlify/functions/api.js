import axios from 'axios';
import express, {Router} from 'express';
import serverless from "serverless-http";


const api = express();
const TRADETRON_URL = 'https://api.tradetron.tech/api';

// Entry and Exit signal from TradingView
const MY_STGY_AUTH_TOKEN = '6c074f02-0d74-447e-ba06-6a4859a01fad'

// Entry signal from TradingView and Exit from TradeTron
const STGY2_AUTH_TOKEN = 'c1140b16-ee9f-44b3-b1d5-8d3a36609158'

const expectedFromAddress = "kashipara007@gmail.com";

const getActionValues = (action) => {
    switch (action) {
        case "buy":
            return { key: "nifty_buy", value: "1" }
        case "closebuy":
            return { key: "nifty_buy", value: "0" }
        case "sell":
            return { key: "nifty_sell", value: "1" }
        case "closesell":
            return { key: "nifty_sell", value: "0" }
        default:
            return null
    }
}

api.use(express.json());

const router = Router();

router.get('/health', (req, res) => {
    res.send("OK")
});

router.post('/webhook', (req, res) => {
    let alertMessage = req.body.content.html
    let fromAddress = req.body.content.fromAddress

    if (fromAddress !== expectedFromAddress) {
        console.log("Email mismatch")
        return
    }
    if (alertMessage === null || alertMessage === undefined) {
        console.log("Alert message is null")
        return
    }

    const match = alertMessage.match(/nifty_action=([^ ]+)/);
    let action = null
    if (match) {
        action = match[1] ? match[1].trim() : null
    }

    if (action === null || action === undefined) {
        console.log("Action is null")
        return
    }
    stopLoss = action.split("=")?.[1]
    action = action.split("=")[0]

    const actionValues = getActionValues(action)
    if (actionValues === null) {
        console.log("Action values is null")
        return
    }

    axios.post(TRADETRON_URL, {
        "auth-token": MY_STGY_AUTH_TOKEN,
        key: actionValues.key,
        value: actionValues.value
    }, {
        headers: {
            "Content-Type": 'application/json'
        }
    })
        .then((response) => {
            res.send("OK")
            console.log(response)
        })
        .catch((error) => console.error(error));

    if (stopLoss) {
        axios.post(TRADETRON_URL, {
            "auth-token": STGY2_AUTH_TOKEN,
            key: actionValues.key,
            value: actionValues.value,
            key1: "stop_loss",
            value1: parseFloat(stopLoss)
        }, {
            headers: {
                "Content-Type": 'application/json'
            }
        })
            .then((response) => {
                res.send("OK")
                console.log(response)
            })
            .catch((error) => console.error(error));
    }

});

api.use("/api/", router);

export const handler = serverless(api);
