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
const sendCoin = new (require("persistencejs/transaction/bank/sendCoin"))(url);

async function sender() {
    try {
        const fileContent = await fs.readFile(readFileName);
        const records = parse(fileContent, {columns: false});
        const output = [];
        for (let i = 0; i < records.length; i++) {
            let result = records[i]
            if (records[i][3] !== "") {
                console.log("To: ", records[i][2], "Amount atom: ", records[i][3])
                let response = await sendCoin.sendCoin(chainID, mnemonic, records[i][2], denom, String(multiplier * records[i][3]), 0, denom, 200000, "sync", records[i][0])
                let queryHashResponse = await poll(url, response.txhash)
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
            output.push(result.join())
        }
        fsWrite.writeFileSync(outputFileName, output.join(os.EOL));
    } catch (error) {
        console.log("ERROR")
    }
}

sender();

async function queryTxHash(lcd, txHash) {
    return new Promise((resolve, reject) => {
        request(lcd + "/txs/" + txHash, (error, response, body) => {
            if (error) reject(error);
            if (response.statusCode !== 200) {
                reject('Invalid status code <' + response.statusCode + '>'+ " response: " + body);
            }
            resolve(body);
        });
    });
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function poll(lcd, txHash) {
    // maximum of 10 requests
    await delay(8000);

    for (let i = 0; i < 10; i++) {

        try {
            const result = await queryTxHash(lcd, txHash)
            return result
        } catch (error) {
            console.log(error)
            console.log("retrying in 8000ms: ", i, "th time")
            await delay(8000);

        }

    }
    return 'Server unresponsive';
}
