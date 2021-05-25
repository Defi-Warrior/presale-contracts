Deploy step to step:
- Deploy PresaleSetting.sol (each of them is for one invest round)
- Deploy locker.sol: 0x2Fb64249724cFf396D61f868FE926dF2eEb84F89
- Deploy CORI token at: 0xb826fBD3BD6ed888eEcAFF6B4dcD42bd6b930971 (call setLocker() if you deploy new locker.sol file to the blockchain)
- Deploy USDT token at: 0x40d60E0282356D82358B0De9e5F437401a12f0ab
- Deploy BUSD token at: 0x68b55C4c19Ee274a68080b156b1e10CdAF34E63E
- Deploy DAI token at: 0xc85279aC8a24Ed7D3Fb7d4dC188AFf0c21010F0A
- Put cori, usdt, busd, dai address to PresaleContract.sol
- Deploy PresaleContract.sol with locker address
- Call update() of PresaleContract
- Call addWhitelist() of PresaleContract
- User Approve PresaleContract to spent USDT, BUSD, DAI
- Admin approve PresaleContract to spent cori
- User call BuyToken()

Seeding Setting init parameter(for testnet only): 0x70633a85c19C3266a44A9F1b050A5631b6E59321
"Seeding", 1000000000000000000, 9143117, 10143117, 1, 200000000000000000000000, 100, 12
Private sale Setting init parameter(for testnet only): 0xDAED8243c63C001070aA66a854eD84Bd7D613056
"Private Sale", 100000000000000000, 9143117, 10143117, 1, 100000000000000000000000, 999, 11
Public sale Setting init parameter(for testnet only): 0x6A0471BdC04d0b7d99502b9E6c35021479DD93BC
"Private Sale", 100000000000000000, 9143117, 10143117, 1, 100000000000000000000000, 999, 11