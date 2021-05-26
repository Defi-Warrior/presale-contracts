const tests = require("@daonomic/tests-common");
const expectThrow = tests.expectThrow;

const SmartCopyRightToken = artifacts.require("SmartCopyRightToken");
const Locker = artifacts.require("Locker");
const Presale = artifacts.require("Presale");
const StableCoin = artifacts.require("StableCoin");
const PresaleSetting = artifacts.require("PresaleSetting");

const USDT = 0;
const BUSD = 1;

contract("SmartCopyRightToken", async accounts => {

    let CORI;
    let locker;
    let usdt, busd;
    let presale;
    let seedingSetting, privateSaleSetting, publicSaleSetting;

    beforeEach(async () => {
        locker = await Locker.new();

        seedingSetting = await PresaleSetting.new("Seeding", 1, 0, 10000, 1, 2000000, 30, 12);
        privateSaleSetting = await PresaleSetting.new("Private", 2, 1000, 2000, 1, 3000000, 15, 12);
        publicSaleSetting = await PresaleSetting.new("Public", 10, 2000, 3000, 0, 4000000, 5, 0);

        usdt = await StableCoin.new("Tether", "USDT");
        busd = await StableCoin.new("Binance USD", "BUSD");

        cori = await SmartCopyRightToken.new();

        presale = await Presale.new(locker.address, seedingSetting.address, privateSaleSetting.address, publicSaleSetting.address);
        
        await presale.updateTokenAddresses(usdt.address, busd.address, cori.address);
        
        await presale.updatePresaleStatus();

        await presale.addWhitelist([accounts[1], accounts[2], accounts[3]]);

        cori.approve(presale.address, BigInt(await cori.totalSupply()));

        let block = await web3.eth.getBlock("latest");

        console.log("seeding addr: ", seedingSetting.address);
        console.log("privateSaleSetting addr: ", privateSaleSetting.address);
        console.log("publicSaleSetting addr: ", publicSaleSetting.address);
        console.log("current setting addr: ", await presale.currentSetting());
        console.log("presale addr: ", presale.address);
        console.log("Block number: ", block.number);
    });

    it("Successfully buy token", async() => {
        const buyAmount = 10;

        await busd.transfer(accounts[1], 1000);
        await busd.approve(presale.address, 1000, {from: accounts[1]});

        await usdt.transfer(accounts[1], 1000);
        await usdt.approve(presale.address, 1000, {from: accounts[1]});

        await presale.buyToken(buyAmount, USDT, {from: accounts[1]});
        await presale.buyToken(buyAmount, BUSD, {from: accounts[1]});
        
        assert.equal((await cori.balanceOf(accounts[1])).toNumber(), buyAmount * await seedingSetting.price() * 2);

        await expectThrow(
            presale.buyToken(1000, USDT, {from: accounts[1]})
        );
    });

    it("buy token fail because owner dont approve presale contract to spent cori", async() => {
        cori.approve(presale.address, 0);

        await usdt.transfer(accounts[1], 1000);
        await usdt.approve(presale.address, 1000, {from: accounts[1]});

        await expectThrow(
            presale.buyToken(1000, USDT, {from: accounts[1]})
        );

        cori.approve(presale.address, BigInt(await cori.totalSupply()));
        await presale.buyToken(1000, USDT, {from: accounts[1]});
        assert.equal((await cori.balanceOf(accounts[1])).toNumber(), 1000 * await seedingSetting.price());
    });

    it("Buy token fail because buyer dont approve Presale to transfer stable coin", async() => {
        await usdt.transfer(accounts[1], 1000);

        await expectThrow(
            presale.buyToken(1000, USDT, {from: accounts[1]})
        );

        await usdt.approve(presale.address, 1000, {from: accounts[1]});
        presale.buyToken(1000, USDT, {from: accounts[1]});
        
        assert.equal((await cori.balanceOf(accounts[1])).toNumber(), 1000 * await seedingSetting.price());

    });

    // it("Buy token exceed amount of presale", async() => {
        
    // });

    // it("transfer CORI fail because its locked", async() => {
        
    // });

    // it("transfer CORI success even its locked", async() => {
        
    // });

    // it("move to next round and buy success", async() => {
        
    // });

    // it("Owner withdraw success", async() => {
        
    // });

    // it("Owner withdraw failed", async() => {
        
    // });

})
