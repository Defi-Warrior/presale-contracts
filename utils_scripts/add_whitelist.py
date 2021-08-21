import pandas as pd
import argparse
import json
import os

from web3 import Web3


# tesnet provider
# PROVIDER = os.environ.get("PROVIDER", "https://data-seed-prebsc-1-s1.binance.org:8545/")
# mainnet provider
PROVIDER = "https://bsc-dataseed.binance.org/"
AIRDROP_ADDRESS = os.environ.get("AIR_DROP_ADDRESS", '0x9A39059b8FF6efEAC97Df9a189C4106E539c48f1')
with open("data/air_drop_abi.json", "r") as f:
    ABI = json.load(f)


def main(args: dict):
    addresses = pd.read_csv(args["file"])["Your MetaMask Wallet address "].tolist()

    web3 = Web3(Web3.HTTPProvider(PROVIDER))

    caller = os.environ.get("CALLER", '0x6148Ce093DCbd629cFbC4203C18210567d186C66')

    nonce = web3.eth.get_transaction_count(caller)

    contract = web3.eth.contract(address=AIRDROP_ADDRESS, abi=ABI)

    private_key = os.environ.get("PRIVATE_KEY")

    input_addr = []
    for i, addr in enumerate(addresses):
        addr = addr.strip()
        if Web3.isAddress(addr):
            if Web3.isChecksumAddress(addr):
                input_addr.append(addr)
            else:
                addr = Web3.toChecksumAddress(addr)
                input_addr.append(addr)
        else:
            print("Invalid address: ", addr)
            continue
        if len(input_addr) == 100 or i == len(addresses) - 1:
            print(input_addr)
            permission = [True] * len(input_addr)
            tx = contract.functions.updateWhitelist(input_addr, permission).buildTransaction({
                'chainId': os.environ.get("CHAIN_ID", 56),
                'gasPrice': Web3.toWei('5', 'gwei'),
                'nonce': nonce,
                'from': caller
            })
            signed_tx = web3.eth.account.sign_transaction(tx, private_key=private_key)
            web3.eth.send_raw_transaction(signed_tx.rawTransaction)
            input_addr.clear()
            nonce += 1


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument("file", type=str, help="file path to csv file contains addresses that need to whitelist")

    args = vars(ap.parse_args())
    main(args)
