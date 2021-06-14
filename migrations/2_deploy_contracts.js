var SmartCopyrightToken = artifacts.require("SmartCopyRightToken");
var Locker = artifacts.require("Locker");
var Setting = artifacts.require("PresaleSetting");
var Presale = artifacts.require("Presale");


// var locker, seedingSetting, privateSetting, publicSetting, cori, presale; 
// // testnet addresses
const usdt_address = "0x5Fe101be7958Def91392650770765Eeb7EC04EDC";
const busd_address = "0xD84e643EcA06E942044211B50386bbb796E92C8C";

module.exports = async function(deployer) {
  let block = await web3.eth.getBlock("latest");
  console.log("block number: ", block.number);

  await deployer.deploy(Locker);
  locker = await Locker.deployed();
  
  await deployer.deploy(Setting, "Seeding", block.number + 1, block.number + 1000, 100, 1, 2000000, 6, 12);
  seedingSetting = await Setting.deployed();

  await deployer.deploy(Setting, "Private", block.number + 1001, block.number + 2000, 50, 1, 2000000, 6, 12);
  privateSetting = await Setting.deployed();

  await deployer.deploy(Setting, "Public Sale", block.number + 2001, block.number + 3000, 25, 1, 2000000, 0, 0);
  publicSetting = await Setting.deployed();

  await deployer.deploy(SmartCopyrightToken);
  cori = await SmartCopyrightToken.deployed();

  await deployer.deploy(Presale, 
                        locker.address, 
                        seedingSetting.address, 
                        privateSetting.address, 
                        publicSetting.address, 
                        usdt_address, 
                        busd_address, 
                        cori.address);

  presale = await Presale.deployed();

  await presale.addWhitelist(["0x60E0F7cDAb17b9B8421c12292Ce8CaC892f5ebee", 
                              "0x0da95fF7edd5A9A52b790bfA9FD2B638fA3F8eBd", 
                              "0x7a42581cC461E7FC1069C72D02fe3046af3BFcA0"]);

  await cori.approve(presale.address, BigInt(await cori.totalSupply()));

  await cori.setLocker(locker.address);

  await locker.setPresaleAddress(presale.address);

  console.log("presale address: ", await locker.presaleAddress());
  console.log("env: ", process.env.PRIVATE_KEY);
};