const bigNumberify = require('ethers/utils').bigNumberify

function expandTo18Decimals(n) {
    return bigNumberify(n).mul(bigNumberify(10).pow(18))
}

var DefiWarriorToken = artifacts.require("DefiWarriorToken");
var Locker = artifacts.require("LockerV2");


module.exports = async function(deployer) {
    let block = await web3.eth.getBlock("latest");
    console.log("block number: ", block.number);

    let token = await DefiWarriorToken.artifacts("0x633237C6FA30FAe46Cc5bB22014DA30e50a718cC")
    await deployer.deployer(Locker)
    let locker = await Locker.deployed();

    // await locker.lock()
};