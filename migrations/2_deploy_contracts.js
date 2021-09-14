
var DefiWarriorToken = artifacts.require("DefiWarriorToken");
var Locker = artifacts.require("LockerV2");


module.exports = async function(deployer) {
    await deployer.deploy(DefiWarriorToken)
    const token = await DefiWarriorToken.deployed()
    await deployer.deploy(Locker, token.address)
    const locker = await Locker.deployed()
    await token.setLocker(locker.address)

};