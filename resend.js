const fsWrite = require('fs');
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
    const fileContent = await fs.readFile(readFileName);
    const records = parse(fileContent, {columns: false});
    const output = [];
    for (let i = 0; i < records.length; i++) {
        let result = records[i]
        if (records[i][3] !== "") {
            let response = await sendCoin.sendCoin(chainID, mnemonic, records[i][2], denom, String(multiplier * records[i][3]), 25000, denom, 200000, "block", records[i][0])

            if (response.code == undefined) {
                console.log("Sending to: ", records[i][2], "**TX HASH for Send Coin** :" + response.txhash);
            } else {
                console.log("Sending to: ", records[i][2], "**TX failed for Send Coin** :" + response.raw_log);
            }
            result.push(response.txhash)
            result.push(response.height)
        } else {
            result.push("This row had error, not processed")
        }
        output.push(result.join())
    }
    fsWrite.writeFileSync(outputFileName, output.join(os.EOL));
}

sender();

