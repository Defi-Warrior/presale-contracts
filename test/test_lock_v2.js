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

        await presaleToken.transfer(accounts[5], expandTo18Decimals(10000000000))
        await presaleToken.transfer(accounts[0], 10000, {from: accounts[5]})
        await presaleToken.transfer(accounts[1], 10000, {from: accounts[5]})
        await presaleToken.transfer(accounts[2], 10000, {from: accounts[5]})

        await presaleToken.setLocker(locker.address);
    });

    it("Successfully lock all token", async() => {
        let block = await web3.eth.getBlock("latest");

        await locker.lock(accounts[0], 10000, block.number, block.number + 100);

        let lockRecord = await locker.lockRecords(accounts[0]);

        await expectThrow(presaleToken.transfer(accounts[2], 201));

        block = await web3.eth.getBlock("latest");

        await presaleToken.transfer(accounts[2], BigNumber((block.number - lockRecord.start)*100))
    });

    it("Successfully transfer 5% after IDO open", async() => {
        let block = await web3.eth.getBlock("latest");

        await locker.lock(accounts[0], 10000, block.number + 1, block.number + 101);
        await locker.unlockForIDO(true);

        assert.equal(await locker.getLockedAmount(accounts[0]), 9400)
    });

    it("Successfully transfer token by other user", async() => {
        let block = await web3.eth.getBlock("latest");
        await locker.lock(accounts[0], 10000, block.number + 1, block.number + 101);
        await presaleToken.transfer(accounts[1], 100, {from: accounts[2]})
        assert.equal(await presaleToken.balanceOf(accounts[2]), 9900);
    });

    it("Cant lock token by other accounts", async() => {
        let block = await web3.eth.getBlock("latest");
        await expectThrow(locker.lock(accounts[0], 10000, block.number + 1, block.number + 101, {from: accounts[1]}));
    });

    it("Update lock amount after relock", async() => {
        let block = await web3.eth.getBlock("latest");
        await locker.lock(accounts[0], 10000, block.number + 1, block.number + 101);
        assert.equal(await locker.getLockedAmount(accounts[0]), 10000)
        await locker.lock(accounts[0], 20000, block.number + 2, block.number + 102);
        assert.equal(await locker.getLockedAmount(accounts[0]), 20000)
    });

})
