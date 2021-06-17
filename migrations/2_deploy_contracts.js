var DefiWarriorToken = artifacts.require("DefiWarriorToken");
var Locker = artifacts.require("Locker");
var Setting = artifacts.require("PresaleSetting");
var Presale = artifacts.require("Presale");


// var locker, seedingSetting, privateSetting, publicSetting, cori, presale; 
// // testnet addresses
const usdt_address = "0x55d398326f99059fF775485246999027B3197955";
const busd_address = "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56";

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

//  await presale.addWhitelist(["0x60E0F7cDAb17b9B8421c12292Ce8CaC892f5ebee",
//                              "0x0da95fF7edd5A9A52b790bfA9FD2B638fA3F8eBd",
//                              "0x7a42581cC461E7FC1069C72D02fe3046af3BFcA0"]);
//
  await presaleToken.approve(presale.address, BigInt(await presaleToken.totalSupply()));

  await presaleToken.setLocker(locker.address);

  await locker.setPresaleAddress(presale.address);

//  console.log("presale address: ", await locker.presaleAddress());
//  console.log("env: ", process.env.PRIVATE_KEY);
};