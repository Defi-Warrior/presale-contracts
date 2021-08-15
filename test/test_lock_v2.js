const utils = require('ethers/utils')
const BigNumber = require('bignumber.js');
const bigNumberify= utils.bigNumberify

function expandTo18Decimals(n) {
    return bigNumberify(n).mul(bigNumberify(10).pow(18))
}

const tests = require("@daonomic/tests-common");
const expectThrow = tests.expectThrow;

const DefiWarriorToken = artifacts.require("DefiWarriorToken");
const Locker = artifacts.require("LockerV2");

contract("DefiWarriorToken", async accounts => {

    let locker;

    beforeEach(async () => {

        locker = await Locker.new();

        presaleToken = await DefiWarriorToken.new();

        await presaleToken.transfer(accounts[2], expandTo18Decimals(9999999900))

        await presaleToken.setLocker(locker.address);
    });

    it("Successfully lock all token", async() => {
        let block = await web3.eth.getBlock("latest");

        await locker.lock(accounts[0], expandTo18Decimals(100), block.number, block.number + 10000);

        let lockRecord = await locker.lockRecords(accounts[0]);

        await expectThrow(presaleToken.transfer(accounts[2], expandTo18Decimals(1)));

        block = await web3.eth.getBlock("latest");

        await presaleToken.transfer(accounts[2], BigNumber((block.number - lockRecord.start)*10**16))
    });

    it("Successfully transfer 5% after IDO open", async() => {
        let block = await web3.eth.getBlock("latest");

        await locker.lock(accounts[0], expandTo18Decimals(100), block.number, block.number + 10000);
        await locker.unlockForIDO(true);

        assert.equal((await locker.getLockedAmount(accounts[0])).toString(), "94980000000000000000")
    });

})
