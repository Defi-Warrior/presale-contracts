Deploy step to step:
- Deploy PresaleSetting.sol (each of them is for one invest round)
- Deploy locker.sol: 0x2bEB78E40f27d9370d085d14a6d69946567a7586
- Deploy CORI token at: 0xd28572DB8932988f357a1e60544E839Ba6760BB6 (call setLocker() if you deploy new locker.sol file to the blockchain)
- Deploy USDT token at: 0xbBF25ffd774162a94f9A1fc01068fA3479BB75f1
- Deploy BUSD token at: 0xBAfFbecEB5406CBDf06a271F83c07ecaF7328a3A
- Deploy DAI token at: 0xAb2fD4Cd12F6b2Db67b67cAf942FA369852A5f4C
- Put cori, usdt, busd, dai address to PresaleContract.sol
- Deploy PresaleContract.sol with locker address
- Call updatePresaleStatus() of PresaleContract
- Call addWhitelist() of PresaleContract
- User Approve PresaleContract to spent USDT, BUSD, DAI
- Admin approve PresaleContract to spent cori
- User call BuyToken()

Seeding Setting init parameter(for testnet only): 0x700d06bEcc04D5B1252ef4A2d8a1A03A163149a9
"Seeding", 1000000000000000000, 9143117, 10143117, 1, 200000000000000000000000, 100, 12
Private sale Setting init parameter(for testnet only): 0x56ba7880929B37F2B87BE55c3221bF3B30F86486
"Private Sale", 100000000000000000, 9143117, 10143117, 1, 100000000000000000000000, 999, 11
Public sale Setting init parameter(for testnet only): 0x72ce94735B537C01A2F3036D8d087844e621D2c3
"Private Sale", 100000000000000000, 9143117, 10143117, 1, 100000000000000000000000, 999, 11