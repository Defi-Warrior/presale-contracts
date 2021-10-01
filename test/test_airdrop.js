const utils = require("ethers/utils");
const BigNumber = require("bignumber.js");
const bigNumberify = utils.bigNumberify;

const tests = require("@daonomic/tests-common");
const { expectRevert } = require("@openzeppelin/test-helpers");

const DefiWarriorToken = artifacts.require("DefiWarriorToken");
const Airdrop = artifacts.require("AirDrop");

contract("Airdrop", async (accounts) => {
    beforeEach(async () => {
        presaleToken = await DefiWarriorToken.new();
        airdrop = await Airdrop.new(presaleToken.address);
        await presaleToken.transfer(airdrop.address, 100);
        await airdrop.updateWhitelist(
            [accounts[1], accounts[2], accounts[3]],
            [true, true, true]
        );
        await airdrop.updateGiveAwayAmount(10);
    });

    it("Successfully claim", async () => {
        let canClaim = await airdrop.canClaim(accounts[1]);
        tests.assertEq(canClaim, true);

        canClaim = await airdrop.canClaim(accounts[0]);
        tests.assertEq(canClaim, false);

        await airdrop.claim({ from: accounts[1] });
        let balance = await presaleToken.balanceOf(accounts[1]);
        tests.assertEq(balance.toString(), "10");

        canClaim = await airdrop.canClaim(accounts[1]);
        tests.assertEq(canClaim, false);

        await airdrop.claim({ from: accounts[2] });
        balance = await presaleToken.balanceOf(accounts[2]);
        tests.assertEq(balance.toString(), "10");

        canClaim = await airdrop.canClaim(accounts[2]);
        tests.assertEq(canClaim, false);
    });

    it("Claim fail", async () => {
        await airdrop.claim({ from: accounts[1] });
        await expectRevert(
            airdrop.claim({ from: accounts[1] }),
            "claimed or not in whitelist"
        );

        await expectRevert(airdrop.claim(), "claimed or not in whitelist");

        await airdrop.setAirdropId(1);

        await expectRevert(
            airdrop.claim({ from: accounts[1] }),
            "claimed or not in whitelist"
        );
    });

    it("Update claim amount", async () => {
        await airdrop.claim({ from: accounts[1] });

        let balance = await presaleToken.balanceOf(accounts[1]);
        tests.assertEq(balance.toString(), "10");

        await airdrop.updateGiveAwayAmount(20);

        await airdrop.claim({ from: accounts[2] });

        balance = await presaleToken.balanceOf(accounts[2]);
        tests.assertEq(balance.toString(), "20");
    });
});
