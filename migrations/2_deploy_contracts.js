const bigNumberify = require('ethers/utils').bigNumberify

function expandTo18Decimals(n) {
    return bigNumberify(n).mul(bigNumberify(10).pow(18))
}

var DefiWarriorToken = artifacts.require("DefiWarriorToken");
var Locker = artifacts.require("Locker");
var Setting = artifacts.require("PresaleSetting");
var Presale = artifacts.require("Presale");
const StableCoin = artifacts.require("StableCoin");


// var locker, seedingSetting, privateSetting, publicSetting, cori, presale; 
// testnet addresses
const usdt_address = "0xF9148233A42787147Cab2690B90ea962Adc22126";
const busd_address = "0x26C84EAeC7735a3B263bde1368f586791DBB978A";

// mainnet address
//const usdt_address = "0x55d398326f99059fF775485246999027B3197955";
//const busd_address = "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56";

module.exports = async function(deployer) {
    let block = await web3.eth.getBlock("latest");
    console.log("block number: ", block.number);

//   await deployer.deploy(StableCoin, "Tether", "USDT");
//   usdt = await StableCoin.deployed();
//
//   await deployer.deploy(StableCoin, "Bianance USD", "BUSD");
//   busd = await StableCoin.deployed();

    await deployer.deploy(Locker);
    locker = await Locker.deployed();

    await deployer.deploy(Setting, "Seeding", block.number + 1, block.number + 86400, 5000, expandTo18Decimals(10000), expandTo18Decimals(500000000), 1, 15);
    seedingSetting = await Setting.deployed();

    await deployer.deploy(Setting, "Private Sale Phase 1", block.number + 1, block.number + 86400, 1000, expandTo18Decimals(100), expandTo18Decimals(100000000), 2, 12);
    privateSetting_1 = await Setting.deployed();

    await deployer.deploy(Setting, "Private Sale Phase 2", block.number + 1, block.number + 86400, 909, expandTo18Decimals(100), expandTo18Decimals(150000000), 2, 12);
    privateSetting_2 = await Setting.deployed();

    await deployer.deploy(Setting, "Private Sale Phase 3", block.number + 1, block.number + 86400, 833, expandTo18Decimals(100), expandTo18Decimals(200000000), 2, 12);
    privateSetting_3 = await Setting.deployed();

    await deployer.deploy(Setting, "Private Sale Phase 4", block.number + 1, block.number + 86400, 769, expandTo18Decimals(100), expandTo18Decimals(250000000), 2, 12);
    privateSetting_4 = await Setting.deployed();

    await deployer.deploy(Setting, "Private Sale Phase 5", block.number + 1, block.number + 86400, 714, expandTo18Decimals(100), expandTo18Decimals(300000000), 2, 12);
    privateSetting_5 = await Setting.deployed();

    await deployer.deploy(DefiWarriorToken);
    presaleToken = await DefiWarriorToken.deployed();

    await deployer.deploy(Presale,
                          locker.address,
                          [seedingSetting.address,
                          privateSetting_1.address,
                          privateSetting_2.address,
                          privateSetting_3.address,
                          privateSetting_4.address,
                          privateSetting_5.address],
                          usdt_address,
                          busd_address,
                          presaleToken.address);

    presale = await Presale.deployed();

    await presaleToken.approve(presale.address, BigInt(await presaleToken.totalSupply()));

    await presaleToken.setLocker(locker.address);

    await locker.setPresaleAddress(presale.address);
};