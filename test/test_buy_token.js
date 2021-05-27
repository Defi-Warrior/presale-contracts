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

        seedingSetting = await PresaleSetting.new("Seeding", 0, 10000, 100, 1, 2000000, 6, 12);
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
    it("Transfer cori success", async() => {
        await usdt.transfer(accounts[1], 1000);
        await usdt.approve(presale.address, 1000, {from: accounts[1]});

        await usdt.transfer(accounts[2], 1000);
        await usdt.approve(presale.address, 1000, {from: accounts[2]});

        await presale.buyToken(1000, USDT, {from: accounts[1]});
        await presale.buyToken(1000, USDT, {from: accounts[2]});

        await cori.transfer(accounts[1], 100);
        await cori.transfer(accounts[2], 100, {from: accounts[1]});

        await locker.checkLock(accounts[2], (await cori.balanceOf(accounts[1])).toNumber());
    });

    it("Transfer cori failed", async() => {
        await usdt.transfer(accounts[1], 1000);
        await usdt.approve(presale.address, 1000, {from: accounts[1]});

        await usdt.transfer(accounts[2], 1000);
        await usdt.approve(presale.address, 1000, {from: accounts[2]});

        await presale.buyToken(1000, USDT, {from: accounts[1]});
        await presale.buyToken(1000, USDT, {from: accounts[2]});

        await expectThrow(cori.transfer(accounts[2], 100, {from: accounts[1]}));
    });

    it("Switch to private phase success", async() => {
        await usdt.transfer(accounts[1], 2000);
        await usdt.approve(presale.address, 2000, {from: accounts[1]});

        await usdt.transfer(accounts[2], 2000);
        await usdt.approve(presale.address, 2000, {from: accounts[2]});

        await presale.buyToken(1000, USDT, {from: accounts[1]});
        await presale.buyToken(1000, USDT, {from: accounts[2]});

        await seedingSetting.setEnd(0);
        await privateSaleSetting.setEnd(10000);
        await privateSaleSetting.setStart(1000);
        await presale.updatePresaleStatus();

        await presale.buyToken(1000, USDT, {from: accounts[1]});
        await presale.buyToken(1000, USDT, {from: accounts[2]});

        assert.equal((await cori.balanceOf(accounts[1])).toNumber(), 1000 * await seedingSetting.price() + 1000 * await privateSaleSetting.price())
    });

    it("Test transfer cori fail after switch to private sale", async() => {
        await usdt.transfer(accounts[1], 2000);
        await usdt.approve(presale.address, 2000, {from: accounts[1]});

        await presale.buyToken(100, USDT, {from: accounts[1]});

        await seedingSetting.setEnd(0);
        await privateSaleSetting.setEnd(10000);
        await privateSaleSetting.setStart(1000);
        await presale.updatePresaleStatus();

        await presale.buyToken(1000, USDT, {from: accounts[1]});
        
        await expectThrow(
            cori.transfer(accounts[2], 100, {from: accounts[1]})
        );
    });

    it("Test transfer cori success after switch to public sale", async() => {
        await usdt.transfer(accounts[1], 2000);
        await usdt.approve(presale.address, 2000, {from: accounts[1]});

        await presale.buyToken(100, USDT, {from: accounts[1]});

        await seedingSetting.setStart(0);
        await seedingSetting.setEnd(0);

        await privateSaleSetting.setStart(1000);
        await privateSaleSetting.setEnd(10000);

        await presale.updatePresaleStatus();

        await presale.buyToken(100, USDT, {from: accounts[1]});

        await privateSaleSetting.setStart(0);
        await privateSaleSetting.setEnd(0);

        await publicSaleSetting.setStart(1000);

        block = await web3.eth.getBlock("latest");

        console.log("public sale start in: ", block.number);

        await publicSaleSetting.setEnd(block.number + 4);

        console.log("public sale end at block: ", await publicSaleSetting.end());

        await presale.updatePresaleStatus();

        await presale.buyToken(100, USDT, {from: accounts[1]});

        block = await web3.eth.getBlock("latest");

        console.log("current block number is: ", block.number);

        assert.equal((await cori.balanceOf(accounts[1])).toNumber(), 
            100 * await seedingSetting.price() + 100 * await privateSaleSetting.price() + 100 * await  publicSaleSetting.price());

        // dummy transaction
        await usdt.transfer(accounts[1], 2000);

        await cori.transfer(accounts[2], 100, {from: accounts[1]});

    });


    it("Buy token exceed amount of presale", async() => {
        
    });

    it("transfer CORI fail because its locked", async() => {
        
    });

    it("transfer CORI success even its locked", async() => {
        
    });

    it("move to next round and buy success", async() => {
        
    });

    it("Owner withdraw success", async() => {
        await usdt.transfer(accounts[1], 2000);
        await usdt.approve(presale.address, 2000, {from: accounts[1]});

        await busd.transfer(accounts[2], 2000);
        await busd.approve(presale.address, 2000, {from: accounts[2]});

        await presale.buyToken(100, USDT, {from: accounts[1]});
        await presale.buyToken(200, BUSD, {from: accounts[2]});

        await seedingSetting.setStart(0);
        await seedingSetting.setEnd(0);

        await publicSaleSetting.setStart(1000);
        await publicSaleSetting.setEnd(10000);

        await presale.updatePresaleStatus();

        await presale.buyToken(300, USDT, {from: accounts[1]});
        await presale.buyToken(400, BUSD, {from: accounts[2]});

        await publicSaleSetting.setEnd(0);

        await presale.ownerWithdraw();
        let usdtBalance = BigInt(await usdt.balanceOf(accounts[0]));
        let busdBalance = BigInt(await busd.balanceOf(accounts[0]));
        console.log("usdt balance: ", usdtBalance);
        console.log("busd balance: ", busdBalance);
    });

    it("Owner withdraw failed", async() => {
        await usdt.transfer(accounts[1], 2000);
        await usdt.approve(presale.address, 2000, {from: accounts[1]});

        await busd.transfer(accounts[2], 2000);
        await busd.approve(presale.address, 2000, {from: accounts[2]});

        await presale.buyToken(100, USDT, {from: accounts[1]});
        await presale.buyToken(200, BUSD, {from: accounts[2]});

        await seedingSetting.setStart(0);
        await seedingSetting.setEnd(0);

        await publicSaleSetting.setStart(1000);
        await publicSaleSetting.setEnd(10000);

        await presale.updatePresaleStatus();

        await presale.buyToken(300, USDT, {from: accounts[1]});
        await presale.buyToken(400, BUSD, {from: accounts[2]});

        await expectThrow(presale.ownerWithdraw());
    });

})
