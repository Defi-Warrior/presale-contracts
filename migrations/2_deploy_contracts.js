const bigNumberify = require('ethers/utils').bigNumberify

function expandTo18Decimals(n) {
    return bigNumberify(n).mul(bigNumberify(10).pow(18))
}

var DefiWarriorToken = artifacts.require("DefiWarriorToken");
var Locker = artifacts.require("LockerV2");


module.exports = async function(deployer) {
};