const BigNumber = require('bignumber.js');
const utils = require('ethers/utils')

const bigNumberify= utils.bigNumberify

function expandTo18Decimals(n) {
    return bigNumberify(n).mul(bigNumberify(10).pow(18))
}

const tests = require("@daonomic/tests-common");
const expectThrow = tests.expectThrow;

const DefiWarriorToken = artifacts.require("DefiWarriorToken");
const Locker = artifacts.require("Locker");
const Presale = artifacts.require("Presale");
const StableCoin = artifacts.require("StableCoin");
const PresaleSetting = artifacts.require("PresaleSetting");

const USDT = 0;
const BUSD = 1;

contract("DefiWarriorToken", async accounts => {

    let presaleToken;
    let locker;
    let usdt, busd;
    let presale;
    let seedingSetting, privateSaleSetting, publicSaleSetting;
    const buyAmount = expandTo18Decimals(10000);
    const transferAmount = expandTo18Decimals(100000);

    beforeEach(async () => {
        let block = await web3.eth.getBlock("latest");

        locker = await Locker.new();

        seedingSetting = await PresaleSetting.new("Seeding", block.number, block.number + 1000, 5000, expandTo18Decimals(10000), expandTo18Decimals(500000000), 1, 15);
        privateSaleSetting_1 = await PresaleSetting.new("Private",  0, 0, 1000, expandTo18Decimals(100), expandTo18Decimals(100000000), 2, 12);
        privateSaleSetting_2 = await PresaleSetting.new("Private",  0, 0, 909, expandTo18Decimals(100), expandTo18Decimals(150000000), 2, 12);
        privateSaleSetting_3 = await PresaleSetting.new("Private",  0, 0, 833, expandTo18Decimals(100), expandTo18Decimals(200000000), 2, 12);
        privateSaleSetting_4 = await PresaleSetting.new("Private",  0, 0, 769, expandTo18Decimals(100), expandTo18Decimals(250000000), 2, 12);
        privateSaleSetting_5 = await PresaleSetting.new("Private",  0, 0, 714, expandTo18Decimals(100), expandTo18Decimals(300000000), 2, 12);


        usdt = await StableCoin.new("Tether", "USDT");
        busd = await StableCoin.new("Binance USD", "BUSD");

        presaleToken = await DefiWarriorToken.new();

        presale = await Presale.new(locker.address, 
                                    [seedingSetting.address, 
                                    privateSaleSetting_1.address, 
                                    privateSaleSetting_2.address, 
                                    privateSaleSetting_3.address, 
                                    privateSaleSetting_4.address, 
                                    privateSaleSetting_5.address],
                                    usdt.address,
                                    busd.address,
                                    presaleToken.address);
        
        await presaleToken.approve(presale.address, BigInt(await presaleToken.totalSupply()));
        await presaleToken.setLocker(locker.address);

        await locker.setPresaleAddress(presale.address);

        console.log("presale addr: ", presale.address);
        console.log("Block number: ", block.number);
    });


    it("Lock token after success purchase", async() => {
        await busd.transfer(accounts[1], transferAmount);
        await busd.approve(presale.address, transferAmount, {from: accounts[1]});

        await presale.buyToken(transferAmount, BUSD, {from: accounts[1]});

        let balance = await presaleToken.balanceOf(accounts[1]);
        console.log("balance: ", balance.toString());

        let lockedAmount = await locker.getRealLockedAmount(accounts[1], 0);
        console.log("locked amount: ", lockedAmount.toString());

        assert.equal(balance.toString(), lockedAmount.toString());

        await expectThrow(
            presaleToken.transfer(accounts[2], 10, {from: accounts[1]})
        );
    });

    it("Transfer token success because lock is expired", async() => {
        await busd.transfer(accounts[1], transferAmount);
        await busd.approve(presale.address, transferAmount, {from: accounts[1]});

        let block = await web3.eth.getBlock("latest");
        await seedingSetting.setEnd(block.number + 3);
        
        await presale.buyToken(buyAmount, BUSD, {from: accounts[1]});
        // wait for lock to expire
        for (var i = 0;i < 17; i++) {
            await busd.transfer(accounts[1], 1);
            let l = await locker.getLockedAmount(accounts[1]);
            console.log("locked: ", l.toString());
        }
        console.log("end end end");
        await presaleToken.transfer(accounts[2], 10, {from: accounts[1]});

        block = await web3.eth.getBlock("latest");
        await seedingSetting.setEnd(block.number);
        await privateSaleSetting_1.setStart(block.number);
        await privateSaleSetting_1.setEnd(block.number + 6);

        await presale.updatePresaleStatus();

        await presale.buyToken(buyAmount, BUSD, {from: accounts[1]});

        // wait for lock to expire
        for (var i = 0;i < 4; i++) {
            await busd.transfer(accounts[1], 1);
            let l = await locker.getLockedAmount(accounts[1]);
            console.log("locked: ", l.toString());
        }

        await presaleToken.transfer(accounts[2], 10, {from: accounts[1]});
    });

    it("Check lock amount", async() => {
        await busd.transfer(accounts[1], transferAmount);
        await busd.approve(presale.address, transferAmount, {from: accounts[1]});

        let block = await web3.eth.getBlock("latest");
        await seedingSetting.setEnd(block.number + 3);
        
        await presale.buyToken(buyAmount, BUSD, {from: accounts[1]});

        assert.equal((await locker.getLockedAmount(accounts[1])).toString(10), (await locker.getRealLockedAmount(accounts[1], 0)).toString(10));
        assert.equal(BigNumber(await locker.getLockedAmount(accounts[1])).toString(10), BigNumber((buyAmount * await seedingSetting.price()).toString(10)).toString(10));

        console.log("Locked amount in seeding: ", (await locker.getRealLockedAmount(accounts[1], 0)).toString(10));

        // wait for lock to expire
        for (var i = 0;i < 5; i++) {
            await busd.transfer(accounts[1], 1000);
            let l = await locker.getLockedAmount(accounts[1]);
            console.log("locked: ", l.toString());
        }
        block = await web3.eth.getBlock("latest");
        await privateSaleSetting_1.setStart(block.number);
        await privateSaleSetting_1.setEnd(block.number + 5);

        await presale.updatePresaleStatus(); 

        await presale.buyToken(buyAmount, BUSD, {from: accounts[1]});

        console.log("Total locked amount: ", (await locker.getLockedAmount(accounts[1])).toString());
        console.log("Locked amount in seeding: ", (await locker.getRealLockedAmount(accounts[1], 0)).toString());
        console.log("Locked amount in private: ", (await locker.getRealLockedAmount(accounts[1], 1)).toString());
    });
    it("Remove lock", async() => {
        await busd.transfer(accounts[1], transferAmount);
        await busd.approve(presale.address, transferAmount, {from: accounts[1]});

        let block = await web3.eth.getBlock("latest");
        await seedingSetting.setEnd(block.number + 3);
        
        await presale.buyToken(buyAmount, BUSD, {from: accounts[1]});

        assert.equal(BigNumber(await locker.getLockedAmount(accounts[1])).toString(10), BigNumber(await locker.getRealLockedAmount(accounts[1], 0)).toString(10));
        assert.equal(BigNumber(await locker.getLockedAmount(accounts[1])).toString(10), BigNumber(buyAmount * (await seedingSetting.price())).toString(10));

        console.log("Locked amount in seeding: ", (await locker.getRealLockedAmount(accounts[1], 0)).toString(10));

        await expectThrow(presaleToken.transfer(accounts[2], 10, {from: accounts[1]}));

        await presaleToken.setLocker("0x0000000000000000000000000000000000000000");

        await presaleToken.transfer(accounts[2], 10, {from: accounts[1]});
    });

})