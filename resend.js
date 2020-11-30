const fsWrite = require('fs');
const request = require('request');
const fs = require('fs').promises;
const config = require("./config.json")
const parse = require('csv-parse/lib/sync')
const os = require('os');

const mnemonic = config.mnemonic;
const outputFileName = config.outputFileName;
const readFileName = config.readFileName;
const url = config.lcdURL;
const chainID = config.chain_id;
const denom = config.denom;
const multiplier = config.multiplier
const initialTxHashQueryDelay = config.initialTxHashQueryDelay
const scheduledTxHashQueryDelay = config.scheduledTxHashQueryDelay
const numberOfRetries = config.numberOfRetries
const sendTxDelay = config.sendTxDelay
const sendCoin = new (require("persistencejs/transaction/bank/sendCoin"))(url);
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function sender() {
    try {
        const fileContent = await fs.readFile(readFileName);
        const records = parse(fileContent, {columns: false});
        for (let i = 0; i < records.length; i++) {
            let result = records[i]
            if (records[i][3] !== "") {
                console.log("\nTo: ", records[i][2], "Amount atom: ", records[i][3])
                let response = await pollTx(chainID, mnemonic, records[i][2], denom, String(multiplier * records[i][3]), 0, denom, 200000, "sync", records[i][0])
                let queryHashResponse = await pollTxHash(url, response.txhash)
                queryHashResponse = JSON.parse(queryHashResponse)
                result.push(queryHashResponse.txhash)
                result.push(queryHashResponse.height)
                if (queryHashResponse.code === undefined) {
                    console.log("Sending to: ", records[i][2], "**TX HASH for Send Coin** :" + queryHashResponse.txhash);
                    result.push("SUCCESS")
                } else {
                    console.log("Sending to: ", records[i][2], "**TX failed for Send Coin** :" + queryHashResponse.raw_log);
                    result.push("FAILURE")
                }

            } else {
                result.push("This row had error: not processed")
            }
            fsWrite.appendFileSync(outputFileName, result.join() + os.EOL);
        }
    } catch (error) {
        console.log("ERROR: ", error)
    }
}

sender();

async function queryTxHash(lcd, txHash) {
    return new Promise((resolve, reject) => {
        request(lcd + "/txs/" + txHash, (error, response, body) => {
            if (error) reject(error);
            if (response.statusCode !== 200) {
                reject('Invalid status code <' + response.statusCode + '>' + " response: " + body);
            }
            resolve(body);
        });
    });
}


async function pollTxHash(lcd, txHash) {
    await delay(initialTxHashQueryDelay);

    for (let i = 0; i < numberOfRetries; i++) {

        try {
            const result = await queryTxHash(lcd, txHash)
            return result
        } catch (error) {
            console.log(error)
            console.log("retrying in "+ scheduledTxHashQueryDelay +": ", i, "th time")
            await delay(scheduledTxHashQueryDelay);

        }

    }
    return JSON.stringify({
        "txhash": txHash,
        "height": 0,
        "code": 111,
        "raw_log": "failed all retries"
    })
}


async function pollTx(chainID, mnemonic, toAddress, denom, amount, feesAmount, feesDenom, gas, mode, memo) {
    try {
        while (true) {
            const result = await await sendCoin.sendCoin(chainID, mnemonic, toAddress, denom, amount, feesAmount, feesDenom, gas, mode, memo)
            if (result.txhash !== undefined) {
                return result
            }
            console.log("Polling tx for address: ", toAddress)
            await delay(sendTxDelay)
        }
    } catch (error) {
        throw error
    }
}