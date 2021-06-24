import pandas as pd
import argparse
import json
import os

from web3 import Web3


# tesnet provider
PROVIDER = os.environ.get("PROVIDER", "https://data-seed-prebsc-1-s1.binance.org:8545/")
# mainnet provider
# PROVIDER = "https://bsc-dataseed.binance.org/"
PRESALE_ADDRESS = os.environ.get("PRESALE_ADDR", '0xF772e5889E1E141b9e14e16443a2A76dF7188779') #testnet
with open("./presale_abi.json", "r") as f:
    ABI = json.load(f)['abi']


def main(args: dict):
    addresses = pd.read_csv(args["file"])["address"].tolist()

    web3 = Web3(Web3.HTTPProvider(PROVIDER))

    nonce = web3.eth.get_transaction_count(os.environ.get("CALLER", '0xEbEC1c6317dC6fD6130DA4E9ce4FaFb84e698401'))

    contract = web3.eth.contract(address=PRESALE_ADDRESS, abi=ABI)

    for i in range(0, len(addresses), 20):
        addr = addresses[i:i+20]
        tx = contract.functions.addWhitelist(addr).buildTransaction({
            'chainId': os.environ.get("CHAIN_ID", 97),
            'gasPrice': Web3.toWei('10', 'gwei'),
            'nonce': nonce,
            'from': os.environ.get("CALLER", '0xEbEC1c6317dC6fD6130DA4E9ce4FaFb84e698401')
        })

        private_key = os.environ.get("PRIVATE_KEY")

        signed_tx = web3.eth.account.sign_transaction(tx, private_key=private_key)
        web3.eth.send_raw_transaction(signed_tx.rawTransaction)


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument("file", type=str, help="file path to csv file contains addresses that need to whitelist")

    args = vars(ap.parse_args())
    main(args)
