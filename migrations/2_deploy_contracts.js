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

    await deployer.deploy(Setting, "Seeding", block.number + 1, block.number + 10000000, 100, 1, "200000000000000000000000000", 6, 12);
    seedingSetting = await Setting.deployed();

    await deployer.deploy(Setting, "Private", block.number + 10001, block.number + 20000, 50, 1, "300000000000000000000000000", 2, 12);
    privateSetting = await Setting.deployed();

    await deployer.deploy(Setting, "Public Sale", block.number + 20001, block.number + 30000, 25, 1, "500000000000000000000000000", 0, 0);
    publicSetting = await Setting.deployed();

    await deployer.deploy(DefiWarriorToken);
    presaleToken = await DefiWarriorToken.deployed();

    await deployer.deploy(Presale,
                          locker.address,
                          seedingSetting.address,
                          privateSetting.address,
                          publicSetting.address,
                          usdt_address,
                          busd_address,
                          presaleToken.address);

    presale = await Presale.deployed();

    await presaleToken.approve(presale.address, BigInt(await presaleToken.totalSupply()));

    await presaleToken.setLocker(locker.address);

    await locker.setPresaleAddress(presale.address);
};