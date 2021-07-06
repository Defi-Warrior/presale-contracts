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


    it("Owner withdraw success", async() => {
        await usdt.transfer(accounts[1], transferAmount);
        await usdt.approve(presale.address, transferAmount, {from: accounts[1]});

        await busd.transfer(accounts[2], transferAmount);
        await busd.approve(presale.address, transferAmount, {from: accounts[2]});

        await presale.buyToken(buyAmount, USDT, {from: accounts[1]});
        await presale.buyToken(buyAmount, BUSD, {from: accounts[2]});

        let usdtBalance = BigInt(await usdt.balanceOf(accounts[0]));
        let busdBalance = BigInt(await busd.balanceOf(accounts[0]));
        console.log("usdt balance: ", usdtBalance);
        console.log("busd balance: ", busdBalance);

        let block = await web3.eth.getBlock("latest");

        await seedingSetting.setEnd(block.number - 1);

        await privateSaleSetting_5.setStart(0);
        await privateSaleSetting_5.setEnd(block.number);

        await expectThrow(presale.ownerWithdraw({from: accounts[1]}));

        block = await web3.eth.getBlock("latest");

        await privateSaleSetting_5.setStart(0);
        await privateSaleSetting_5.setEnd(block.number);

        await presale.ownerWithdraw();
        usdtBalance = BigInt(await usdt.balanceOf(accounts[0]));
        busdBalance = BigInt(await busd.balanceOf(accounts[0]));
        console.log("usdt balance: ", usdtBalance);
        console.log("busd balance: ", busdBalance);
    });

    // it("Owner withdraw failed", async() => {
    //     await usdt.transfer(accounts[1], 2000);
    //     await usdt.approve(presale.address, 2000, {from: accounts[1]});

    //     await busd.transfer(accounts[2], 2000);
    //     await busd.approve(presale.address, 2000, {from: accounts[2]});

    //     await presale.buyToken(1000, USDT, {from: accounts[1]});
    //     await presale.buyToken(1000, BUSD, {from: accounts[2]});

    //     await seedingSetting.setStart(0);
    //     await seedingSetting.setEnd(0);

    //     await publicSaleSetting.setStart(1000);
    //     await publicSaleSetting.setEnd(10000);

    //     await presale.buyToken(1000, USDT, {from: accounts[1]});
    //     await presale.buyToken(1000, BUSD, {from: accounts[2]});

    //     await expectThrow(presale.ownerWithdraw());
    // });

})
