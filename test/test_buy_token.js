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

    // it("Successfully buy token using busd or usdt", async() => {
    //     await busd.transfer(accounts[1], transferAmount);
    //     await busd.approve(presale.address, transferAmount, {from: accounts[1]});

    //     await usdt.transfer(accounts[1], transferAmount);
    //     await usdt.approve(presale.address, transferAmount, {from: accounts[1]});

    //     await presale.buyToken(buyAmount, USDT, {from: accounts[1]});
    //     await presale.buyToken(buyAmount, BUSD, {from: accounts[1]});
    //     assert.equal(BigNumber(await presaleToken.balanceOf(accounts[1])).toString(), BigNumber(buyAmount * BigNumber(await seedingSetting.price()) * 2).toString());
    // });

    // it("Successfully buy token during 3 stages of sale", async() => {
    //     await busd.transfer(accounts[1], transferAmount);
    //     await busd.approve(presale.address, transferAmount, {from: accounts[1]});

    //     await usdt.transfer(accounts[1], transferAmount);
    //     await usdt.approve(presale.address, transferAmount, {from: accounts[1]});

    //     await busd.transfer(accounts[2], transferAmount);
    //     await busd.approve(presale.address, transferAmount, {from: accounts[2]});

    //     await usdt.transfer(accounts[2], transferAmount);
    //     await usdt.approve(presale.address, transferAmount, {from: accounts[2]});
        
    //     // buy in seeding stage
    //     await presale.buyToken(buyAmount, USDT, {from: accounts[1]});
    //     await presale.buyToken(buyAmount, BUSD, {from: accounts[1]});
        
    //     assert.equal((BigNumber(await presaleToken.balanceOf(accounts[1]))), buyAmount * BigNumber(await seedingSetting.price() * 2));

    //     let block = await web3.eth.getBlock("latest"); 
    //     // end seeding sale
    //     seedingSetting.setEnd(block.number);
    //     // move to private sale
    //     privateSaleSetting_1.setStart(block.number);
    //     privateSaleSetting_1.setEnd(block.number + 1000);

    //     presale.updatePresaleStatus();

    //     // buy in private sale
    //     await presale.buyToken(buyAmount, USDT, {from: accounts[2]});
    //     await presale.buyToken(buyAmount, BUSD, {from: accounts[2]});

    //     await presale.buyToken(buyAmount, BUSD, {from: accounts[1]});
        
    //     assert.equal(BigNumber(await presaleToken.balanceOf(accounts[2])).toString(), BigNumber(buyAmount * BigNumber(await privateSaleSetting_1.price()) * 2).toString());
    //     assert.equal(BigNumber(await presaleToken.balanceOf(accounts[1])).toString(), BigNumber(buyAmount * BigNumber(await privateSaleSetting_1.price()) + buyAmount * BigNumber(await seedingSetting.price()) * 2).toString());

    //     block = await web3.eth.getBlock("latest"); 

    //     privateSaleSetting_1.setEnd(block.number);
    //     // move to public sale
    //     privateSaleSetting_2.setStart(block.number);
    //     privateSaleSetting_2.setEnd(block.number + 1000);

    //     presale.updatePresaleStatus();
    //     // buy from accounts[4] which is not whitelisted
    //     await busd.transfer(accounts[4], transferAmount);
    //     await busd.approve(presale.address, transferAmount, {from: accounts[4]});

    //     await presale.buyToken(buyAmount, BUSD, {from: accounts[4]});

    //     assert.equal(BigNumber(await presaleToken.balanceOf(accounts[4])).toString(), BigNumber(buyAmount * await privateSaleSetting_2.price()).toString());

    // });

    // it("Buy token failed because sale has ended", async() => {
    //     await busd.transfer(accounts[1], transferAmount);
    //     await busd.approve(presale.address, transferAmount, {from: accounts[1]});

    //     await usdt.transfer(accounts[1], transferAmount);
    //     await usdt.approve(presale.address, transferAmount, {from: accounts[1]});

    //     await presale.buyToken(buyAmount, USDT, {from: accounts[1]});
    //     await presale.buyToken(buyAmount, BUSD, {from: accounts[1]});
        
    //     assert.equal(BigNumber(await presaleToken.balanceOf(accounts[1])).toString(), BigNumber(buyAmount * BigNumber(await seedingSetting.price()) * 2).toString());

    //     let block = await web3.eth.getBlock("latest"); 

    //     seedingSetting.setEnd(block.number);
        
    //     presale.updatePresaleStatus();

    //     await expectThrow(
    //         presale.buyToken(buyAmount, BUSD, {from: accounts[1]})
    //     );

    // });
    it("buy token fail because owner dont approve presale contract to spent presaleToken", async() => {
        presaleToken.approve(presale.address, 0);

        await usdt.transfer(accounts[1], transferAmount);
        await usdt.approve(presale.address, transferAmount, {from: accounts[1]});

        await expectThrow(
            presale.buyToken(transferAmount, USDT, {from: accounts[1]})
        );

        presaleToken.approve(presale.address, BigNumber(await presaleToken.totalSupply()));
        await presale.buyToken(transferAmount, USDT, {from: accounts[1]});
        console.log("transfer amount: ", transferAmount.toString(10), "price: ", BigNumber(await seedingSetting.price()).toString(10), "result: ", (transferAmount * BigNumber(await seedingSetting.price())).toString(10));
        // assert.equal(BigNumber(await presaleToken.balanceOf(accounts[1])).toString(), BigNumber(transferAmount * BigNumber(await seedingSetting.price())).toString());
    });

    it("Buy token fail because buyer dont approve Presale to transfer stable coin", async() => {
        await usdt.transfer(accounts[1], transferAmount);

        await expectThrow(
            presale.buyToken(transferAmount, USDT, {from: accounts[1]})
        );

        await usdt.approve(presale.address, transferAmount, {from: accounts[1]});
        await presale.buyToken(transferAmount, USDT, {from: accounts[1]});
        
        // assert.equal(BigNumber(await presaleToken.balanceOf(accounts[1])).toString(), BigNumber(transferAmount * BigNumber(await seedingSetting.price())).toString());
    });

    it("Buy token fail because buyer dont have enough money", async() => {
        await usdt.transfer(accounts[1], transferAmount);
        await usdt.approve(presale.address, transferAmount, {from: accounts[1]});

        await presale.buyToken(transferAmount, USDT, {from: accounts[1]});

        await expectThrow(
            presale.buyToken(1, USDT, {from: accounts[1]})
        );
    });

    it("Buy token fail because token type is invalid", async() => {
        await usdt.transfer(accounts[1], transferAmount);
        await usdt.approve(presale.address, transferAmount, {from: accounts[1]});

        await presale.buyToken(transferAmount, USDT, {from: accounts[1]});

        await expectThrow(
            presale.buyToken(transferAmount, 2, {from: accounts[1]})
        );
    });

    it("Buy token fail because buyer buy amount is lower than minimum purchase", async() => {
        await usdt.transfer(accounts[1], transferAmount);
        await usdt.approve(presale.address, transferAmount, {from: accounts[1]});

        await expectThrow(
            presale.buyToken(1, USDT, {from: accounts[1]})
        );
    });
})
