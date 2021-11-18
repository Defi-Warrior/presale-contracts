const utils = require("ethers/utils");
const BigNumber = require("bignumber.js");
const bigNumberify = utils.bigNumberify;

function expandTo18Decimals(n) {
  return bigNumberify(n).mul(bigNumberify(10).pow(18));
}

const tests = require("@daonomic/tests-common");
const expectThrow = tests.expectThrow;

const DefiWarriorToken = artifacts.require("DefiWarriorToken");
const Locker = artifacts.require("MockLockerV2");

contract("DefiWarriorToken", async (accounts) => {
  let locker;

  beforeEach(async () => {
    presaleToken = await DefiWarriorToken.new();
    locker = await Locker.new(presaleToken.address);

    await presaleToken.transfer(accounts[5], expandTo18Decimals(10000000000));
    await presaleToken.transfer(accounts[0], 10000, { from: accounts[5] });
    await presaleToken.transfer(accounts[1], 10000, { from: accounts[5] });
    await presaleToken.transfer(accounts[2], 10000, { from: accounts[5] });

    await presaleToken.setLocker(locker.address);
    let block = await web3.eth.getBlock("latest");
    await locker.setPhaseOneEndBlock(block.number + 50);
    await locker.setLockDuration(0);
  });

  it("Successfully lock all token", async () => {
    let block = await web3.eth.getBlock("latest");

    await locker.lock(accounts[0], 10000, block.number, block.number + 100, true);

    let lockRecord = await locker.lockRecords(accounts[0]);

    let locked = await locker.getLockedAmount(accounts[0]);
    console.log("locked: ", locked.toNumber());

    await expectThrow(presaleToken.transfer(accounts[2], 201));

    block = await web3.eth.getBlock("latest");

    await presaleToken.transfer(accounts[2], BigNumber((block.number - lockRecord.start) * 100));
  });

  it("Successfully transfer 5% after IDO open", async () => {
    let block = await web3.eth.getBlock("latest");

    await locker.lock(accounts[0], 10000, block.number + 1, block.number + 101, true);
    await locker.setIDOBlock(block.number);

    assert.equal(await locker.getLockedAmount(accounts[0]), 9400);
  });

  it("Successfully transfer token by other user", async () => {
    let block = await web3.eth.getBlock("latest");
    await locker.lock(accounts[0], 10000, block.number + 1, block.number + 101, true);
    await presaleToken.transfer(accounts[1], 1000, { from: accounts[2] });
    assert.equal(await presaleToken.balanceOf(accounts[2]), 9000);
  });

  it("Cant lock token by other accounts", async () => {
    let block = await web3.eth.getBlock("latest");
    await expectThrow(
      locker.lock(accounts[0], 10000, block.number + 1, block.number + 101, true, {
        from: accounts[1],
      })
    );
  });

  it("Update lock amount after relock", async () => {
    let block = await web3.eth.getBlock("latest");
    await locker.lock(accounts[0], 10000, block.number + 1, block.number + 101, true);
    assert.equal(await locker.getLockedAmount(accounts[0]), 10000);
    await locker.lock(accounts[0], 20000, block.number + 2, block.number + 102, true);
    assert.equal(await locker.getLockedAmount(accounts[0]), 20000);
  });

  it("Transfer amount exceed balance", async () => {
    let block = await web3.eth.getBlock("latest");
    await locker.lock(accounts[0], 10000, block.number + 1, block.number + 101, true);
    await expectThrow(presaleToken.transfer(accounts[2], 10001));
  });

  it("Unlock amount = 0 after IDO", async () => {
    let block = await web3.eth.getBlock("latest");
    await locker.lock(accounts[0], 10000, block.number + 1, block.number + 101, false);
    await locker.lock(accounts[1], 10000, block.number + 1, block.number + 101, true);
    await locker.setIDOBlock(block.number);
    assert.equal(await locker.getLockedAmount(accounts[0]), 9800);
    assert.equal(await locker.getLockedAmount(accounts[1]), 9300);
  });

  it("Test transferFrom", async () => {
    let block = await web3.eth.getBlock("latest");
    await locker.lock(accounts[0], 10000, block.number + 1, block.number + 101, false);
    await presaleToken.approve(accounts[5], 10000);
    await expectThrow(
      presaleToken.transferFrom(accounts[0], accounts[1], 1000, { from: accounts[5] })
    );
  });

  it("Test lock phase one", async () => {
    await locker.setLockDuration(3);
    let block = await web3.eth.getBlock("latest");
    await locker.lock(accounts[0], 10000, block.number, block.number + 100, false);
    await locker.setPhaseOneEndBlock(block.number + 5);

    console.log(
      "start lock at: ",
      block.number,
      "\nphase one end at: ",
      block.number + 5,
      "\nend lock phase one at: ",
      block.number + 8
    );

    await presaleToken.approve(accounts[5], 10000);
    await presaleToken.approve(accounts[5], 10000);
    await presaleToken.approve(accounts[5], 10000);

    assert.equal((await locker.getLockedAmount(accounts[0])).toNumber(), 9500);

    await presaleToken.approve(accounts[5], 10000);

    assert.equal((await locker.getLockedAmount(accounts[0])).toNumber(), 9500);

    await presaleToken.approve(accounts[5], 10000);
    await presaleToken.approve(accounts[5], 10000);

    assert.equal((await locker.getLockedAmount(accounts[0])).toNumber(), 9500);

    await presaleToken.approve(accounts[5], 10000);

    assert.equal((await locker.getLockedAmount(accounts[0])).toNumber(), 9400);
  });
});
