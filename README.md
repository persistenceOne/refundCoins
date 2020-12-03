config is
```
{
  "lcdURL": "http://localhost:1317", //lcd port for rest api
  "mnemonic": "", //24word mnemonic
  "chain_id": "testing", //chain id of the chain
  "denom": "uatom", // micro denom eg- uatom, ulune
  "multiplier": 1000000, // converter to atom, luna
  "readFileName": "/path/to/readFile.csv", //csv file of addresses to send to
  "outputFileName": "/path/to/output.csv", // output report csv.
  "initialTxHashQueryDelay": 20000, //await time before querying hash 
  "scheduledTxHashQueryDelay": 8000, //await for retrying query txHash
  "numberOfRetries": 20, //number of times to retry for querying txHash
  "sendTxDelay": 5000 //await for sending txAgain, in case of tx fail.
}
```

readFileName CSV is a list of magic transaction received during stakedrop has columns as 

`TxHash, Memo, SenderAddress, amount, errorTxAmount`

outputFileName CSV is a list of all resend transactions done to return the transactions, it has columns as

`MagicTxHash, MagicTxMemo, MagicTxSenderAddress, MagicTxAmount, errorTxAmount, ResendTxHash, ResendTxHeight, ResendTxSuccess/Failure`


