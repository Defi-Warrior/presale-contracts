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

    it("Successfully buy token using busd or usdt", async() => {
        const buyAmount = 100;

        await busd.transfer(accounts[1], 1000);
        await busd.approve(presale.address, 1000, {from: accounts[1]});

        await usdt.transfer(accounts[1], 1000);
        await usdt.approve(presale.address, 1000, {from: accounts[1]});

        await presale.buyToken(buyAmount, USDT, {from: accounts[1]});
        await presale.buyToken(buyAmount, BUSD, {from: accounts[1]});
        
        assert.equal((await presaleToken.balanceOf(accounts[1])).toNumber(), buyAmount * await seedingSetting.price() * 2);
    });

    it("Successfully buy token during 3 stages of sale", async() => {
        const buyAmount = 1000;

        await busd.transfer(accounts[1], 10000);
        await busd.approve(presale.address, 10000, {from: accounts[1]});

        await usdt.transfer(accounts[1], 10000);
        await usdt.approve(presale.address, 10000, {from: accounts[1]});

        await busd.transfer(accounts[2], 10000);
        await busd.approve(presale.address, 10000, {from: accounts[2]});

        await usdt.transfer(accounts[2], 10000);
        await usdt.approve(presale.address, 10000, {from: accounts[2]});
        
        // buy in seeding stage
        await presale.buyToken(buyAmount, USDT, {from: accounts[1]});
        await presale.buyToken(buyAmount, BUSD, {from: accounts[1]});
        
        assert.equal((await presaleToken.balanceOf(accounts[1])).toNumber(), buyAmount * await seedingSetting.price() * 2);

        let block = await web3.eth.getBlock("latest"); 
        // end seeding sale
        seedingSetting.setEnd(block.number);
        // move to private sale
        privateSaleSetting.setStart(block.number);
        privateSaleSetting.setEnd(block.number + 1000);

        // buy in private sale
        await presale.buyToken(buyAmount, USDT, {from: accounts[2]});
        await presale.buyToken(buyAmount, BUSD, {from: accounts[2]});

        await presale.buyToken(buyAmount, BUSD, {from: accounts[1]});
        
        assert.equal((await presaleToken.balanceOf(accounts[2])).toNumber(), buyAmount * await privateSaleSetting.price() * 2);
        assert.equal((await presaleToken.balanceOf(accounts[1])).toNumber(), buyAmount * await privateSaleSetting.price() + buyAmount * await seedingSetting.price() * 2);

        block = await web3.eth.getBlock("latest"); 

        privateSaleSetting.setEnd(block.number);
        // move to public sale
        publicSaleSetting.setStart(block.number);
        publicSaleSetting.setEnd(block.number + 1000);
        // buy from accounts[4] which is not whitelisted
        await busd.transfer(accounts[4], 10000);
        await busd.approve(presale.address, 10000, {from: accounts[4]});

        await presale.buyToken(buyAmount, BUSD, {from: accounts[4]});

        assert.equal((await presaleToken.balanceOf(accounts[4])).toNumber(), buyAmount * await publicSaleSetting.price());

    });

    it("Buy token failed because sale has ended", async() => {
        const buyAmount = 10;

        await busd.transfer(accounts[1], 1000);
        await busd.approve(presale.address, 1000, {from: accounts[1]});

        await usdt.transfer(accounts[1], 1000);
        await usdt.approve(presale.address, 1000, {from: accounts[1]});

        await presale.buyToken(buyAmount, USDT, {from: accounts[1]});
        await presale.buyToken(buyAmount, BUSD, {from: accounts[1]});
        
        assert.equal((await presaleToken.balanceOf(accounts[1])).toNumber(), buyAmount * await seedingSetting.price() * 2);

        let block = await web3.eth.getBlock("latest"); 

        seedingSetting.setEnd(block.number);
        privateSaleSetting.setEnd(block.number);
        publicSaleSetting.setEnd(block.number);

        await expectThrow(
            presale.buyToken(buyAmount, BUSD, {from: accounts[1]})
        );

    });

    it("Buy token failed because it is not whitelisted and sale stage is not public sale", async() => {
        const buyAmount = 10;

        await busd.transfer(accounts[4], 1000);
        await busd.approve(presale.address, 1000, {from: accounts[4]});

        await usdt.transfer(accounts[4], 1000);
        await usdt.approve(presale.address, 1000, {from: accounts[4]});

        await expectThrow(
            presale.buyToken(buyAmount, USDT, {from: accounts[4]})
        );
    });

    it("buy token fail because owner dont approve presale contract to spent presaleToken", async() => {
        presaleToken.approve(presale.address, 0);

        await usdt.transfer(accounts[1], 1000);
        await usdt.approve(presale.address, 1000, {from: accounts[1]});

        await expectThrow(
            presale.buyToken(1000, USDT, {from: accounts[1]})
        );

        presaleToken.approve(presale.address, BigInt(await presaleToken.totalSupply()));
        await presale.buyToken(1000, USDT, {from: accounts[1]});
        assert.equal((await presaleToken.balanceOf(accounts[1])).toNumber(), 1000 * await seedingSetting.price());
    });

    it("Buy token fail because buyer dont approve Presale to transfer stable coin", async() => {
        await usdt.transfer(accounts[1], 1000);

        await expectThrow(
            presale.buyToken(1000, USDT, {from: accounts[1]})
        );

        await usdt.approve(presale.address, 1000, {from: accounts[1]});
        presale.buyToken(1000, USDT, {from: accounts[1]});
        
        assert.equal((await presaleToken.balanceOf(accounts[1])).toNumber(), 1000 * await seedingSetting.price());
    });

    it("Buy token fail because buyer dont have enough money", async() => {
        await usdt.transfer(accounts[1], 1000);
        await usdt.approve(presale.address, 1000, {from: accounts[1]});

        await presale.buyToken(1000, USDT, {from: accounts[1]});

        await expectThrow(
            presale.buyToken(1, USDT, {from: accounts[1]})
        );
    });

    it("Buy token fail because token type is invalid", async() => {
        await usdt.transfer(accounts[1], 1000);
        await usdt.approve(presale.address, 1000, {from: accounts[1]});

        await presale.buyToken(1000, USDT, {from: accounts[1]});

        await expectThrow(
            presale.buyToken(1000, 2, {from: accounts[1]})
        );
    });

    it("Buy token fail because buyer buy amount is lower than minimum purchase", async() => {
        await usdt.transfer(accounts[1], 1000);
        await usdt.approve(presale.address, 1000, {from: accounts[1]});

        await expectThrow(
            presale.buyToken(1, USDT, {from: accounts[1]})
        );
    });
})
