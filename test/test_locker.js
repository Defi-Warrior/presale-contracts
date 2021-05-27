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

        seedingSetting = await PresaleSetting.new("Seeding", 0, 10000, 10000, 1, 2000000, 1, 2);
        privateSaleSetting = await PresaleSetting.new("Private",  0, 10000, 50, 1, 3000000, 1, 6);
        publicSaleSetting = await PresaleSetting.new("Public",  0, 10000, 10, 1, 4000000, 0, 0);

        usdt = await StableCoin.new("Tether", "USDT");
        busd = await StableCoin.new("Binance USD", "BUSD");

        cori = await SmartCopyRightToken.new();

        presale = await Presale.new(locker.address, seedingSetting.address, privateSaleSetting.address, publicSaleSetting.address);
        
        await presale.updateTokenAddresses(usdt.address, busd.address, cori.address);
        
        await presale.updatePresaleStatus();

        await presale.addWhitelist([accounts[1], accounts[2], accounts[3]]);

        await cori.approve(presale.address, BigInt(await cori.totalSupply()));
        await cori.setLocker(locker.address);

        await locker.setPresaleAddress(presale.address);

        let block = await web3.eth.getBlock("latest");

        console.log("seeding addr: ", seedingSetting.address);
        console.log("privateSaleSetting addr: ", privateSaleSetting.address);
        console.log("publicSaleSetting addr: ", publicSaleSetting.address);
        console.log("current setting addr: ", await presale.currentSetting());
        console.log("presale addr: ", presale.address);
        console.log("Block number: ", block.number);
    });

    it("Should lock token in 18 months", async() => {
        await busd.transfer(accounts[1], 1000);
        await busd.approve(presale.address, 1000, {from: accounts[1]});

        await presale.buyToken(1000, BUSD, {from: accounts[1]});

        let balance = await cori.balanceOf(accounts[1]);
        console.log("balance: ", balance.toNumber());

        let amount = await locker.getRealLockedAmount(accounts[1]);
        console.log("locked amount: ", amount.toNumber());

        await expectThrow(
            cori.transfer(accounts[2], 10, {from: accounts[1]})
        );
    });

    it("Should lock token in 18 months", async() => {
        await busd.transfer(accounts[1], 1000);
        await busd.approve(presale.address, 1000, {from: accounts[1]});

        let block = await web3.eth.getBlock("latest");
        await seedingSetting.setEnd(block.number + 3);
        
        await presale.buyToken(100, BUSD, {from: accounts[1]});

        for (var i = 0;i < 20; i++) {
            await busd.transfer(accounts[1], 1000);
            let l = await locker.getRealLockedAmount(accounts[1]);
            console.log("locked: ", l.toNumber());
        }
        // let l = await locker.lockRecords(accounts[1]);
        // console.log("lll: ", l);
        await cori.transfer(accounts[2], 10, {from: accounts[1]});
    });

})