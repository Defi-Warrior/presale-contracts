import pandas as pd
import argparse
import json
import os
from web3 import Web3

# tesnet provider
PROVIDER = "https://data-seed-prebsc-1-s1.binance.org:8545/"
# mainnet provider
# PROVIDER = "https://bsc-dataseed.binance.org/"
CONTRACT_ADDRESS = '0xB84D8C3B56804A0eFC7a36C3C8ee03Aca53583F1' #testnet
with open("./presale_abi.json", "r") as f:
    ABI = json.load(f)['abi']


def main(args: dict):
    addresses = pd.read_csv(args["file"])["address"].tolist()
    web3 = Web3(Web3.HTTPProvider(PROVIDER))
    web3.geth.personal.import_raw_key(os.environ.get("PRIVATE_KEY"))
    print(web3.eth.accounts)

    print("Is connected: ", web3.isConnected())

    contract = web3.eth.contract(address=CONTRACT_ADDRESS, abi=ABI)

    for i in range(0, len(addresses), 20):
        addr = addresses[i:i+20]
        contract.functions.addWhitelist(addr).transact()



if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument("file", type=str, help="file path to csv file contains addresses that need to whitelist")

    args = vars(ap.parse_args())
    main(args)
