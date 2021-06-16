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

    let presaleToken;
    let locker;
    let usdt, busd;
    let presale;
    let seedingSetting, privateSaleSetting, publicSaleSetting;

    beforeEach(async () => {
        let block = await web3.eth.getBlock("latest");

        locker = await Locker.new();

        seedingSetting = await PresaleSetting.new("Seeding", block.number, block.number + 1000, 100, 1000, 2000000, 6, 12);
        privateSaleSetting = await PresaleSetting.new("Private",  0, 0, 50, 1000, 3000000, 1, 6);
        publicSaleSetting = await PresaleSetting.new("Public",  0, 0, 10, 1000, 4000000, 0, 0);

        usdt = await StableCoin.new("Tether", "USDT");
        busd = await StableCoin.new("Binance USD", "BUSD");

        presaleToken = await SmartCopyRightToken.new();

        presale = await Presale.new(locker.address, 
                                    seedingSetting.address, 
                                    privateSaleSetting.address, 
                                    publicSaleSetting.address,
                                    usdt.address,
                                    busd.address,
                                    presaleToken.address);
        

        await presale.addWhitelist([accounts[1], accounts[2], accounts[3]]);

        await presaleToken.approve(presale.address, BigInt(await presaleToken.totalSupply()));
        await presaleToken.setLocker(locker.address);

        await locker.setPresaleAddress(presale.address);

        console.log("seeding addr: ", seedingSetting.address);
        console.log("privateSaleSetting addr: ", privateSaleSetting.address);
        console.log("publicSaleSetting addr: ", publicSaleSetting.address);
        console.log("presale addr: ", presale.address);
        console.log("Block number: ", block.number);
    });

    it("Lock token after success purchase", async() => {
        await busd.transfer(accounts[1], 1000);
        await busd.approve(presale.address, 1000, {from: accounts[1]});

        await presale.buyToken(1000, BUSD, {from: accounts[1]});

        let balance = await presaleToken.balanceOf(accounts[1]);
        console.log("balance: ", balance.toNumber());

        let lockedAmount = await locker.getRealLockedAmount(accounts[1]);
        console.log("locked amount: ", lockedAmount.toNumber());

        assert.equal(balance.toNumber(), lockedAmount.toNumber());

        await expectThrow(
            presaleToken.transfer(accounts[2], 10, {from: accounts[1]})
        );
    });

    it("Transfer token success because lock is expired", async() => {
        await busd.transfer(accounts[1], 1000);
        await busd.approve(presale.address, 1000, {from: accounts[1]});

        let block = await web3.eth.getBlock("latest");
        await seedingSetting.setEnd(block.number + 3);
        
        await presale.buyToken(100, BUSD, {from: accounts[1]});
        // wait for lock to expire
        for (var i = 0;i < 36; i++) {
            await busd.transfer(accounts[1], 1000);
            let l = await locker.getRealLockedAmount(accounts[1]);
            console.log("locked: ", l.toNumber());
        }
        await presaleToken.transfer(accounts[2], 10, {from: accounts[1]});

        block = await web3.eth.getBlock("latest");
        await privateSaleSetting.setStart(block.number);
        await privateSaleSetting.setEnd(block.number + 4);

        await presale.buyToken(100, BUSD, {from: accounts[1]});

        // wait for lock to expire
        for (var i = 0;i < 8; i++) {
            await busd.transfer(accounts[1], 1000);
            let l = await locker.getRealLockedAmount(accounts[1]);
            console.log("locked: ", l.toNumber());
        }

        await presaleToken.transfer(accounts[2], 10, {from: accounts[1]});

    });

})