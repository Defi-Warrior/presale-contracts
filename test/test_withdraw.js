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

    beforeEach(async () => {
        let block = await web3.eth.getBlock("latest");

        locker = await Locker.new();

        seedingSetting = await PresaleSetting.new("Seeding", block.number, block.number + 1000, 100, 1000, 2000000, 6, 12);
        privateSaleSetting = await PresaleSetting.new("Private",  0, 0, 50, 1000, 3000000, 1, 6);
        publicSaleSetting = await PresaleSetting.new("Public",  0, 0, 10, 1000, 4000000, 0, 0);

        usdt = await StableCoin.new("Tether", "USDT");
        busd = await StableCoin.new("Binance USD", "BUSD");

        presaleToken = await DefiWarriorToken.new();

        presale = await Presale.new(locker.address, 
                                    seedingSetting.address, 
                                    privateSaleSetting.address, 
                                    publicSaleSetting.address,
                                    usdt.address,
                                    busd.address,
                                    presaleToken.address);
        
        await presaleToken.approve(presale.address, BigInt(await presaleToken.totalSupply()));
        await presaleToken.setLocker(locker.address);

        await locker.setPresaleAddress(presale.address);

        console.log("seeding addr: ", seedingSetting.address);
        console.log("privateSaleSetting addr: ", privateSaleSetting.address);
        console.log("publicSaleSetting addr: ", publicSaleSetting.address);
        console.log("presale addr: ", presale.address);
        console.log("Block number: ", block.number);
    });

    it("Owner withdraw success", async() => {
        await usdt.transfer(accounts[1], 2000);
        await usdt.approve(presale.address, 2000, {from: accounts[1]});

        await busd.transfer(accounts[2], 2000);
        await busd.approve(presale.address, 2000, {from: accounts[2]});

        await presale.buyToken(2000, USDT, {from: accounts[1]});
        await presale.buyToken(2000, BUSD, {from: accounts[2]});

        let usdtBalance = BigInt(await usdt.balanceOf(accounts[0]));
        let busdBalance = BigInt(await busd.balanceOf(accounts[0]));
        console.log("usdt balance: ", usdtBalance);
        console.log("busd balance: ", busdBalance);

        let block = await web3.eth.getBlock("latest");

        await seedingSetting.setEnd(block.number - 1);

        await publicSaleSetting.setStart(0);
        await publicSaleSetting.setEnd(0);

        await privateSaleSetting.setStart(block.number - 1);
        await privateSaleSetting.setEnd(block.number);

        await expectThrow(presale.ownerWithdraw({from: accounts[1]}));

        await presale.ownerWithdraw();
        usdtBalance = BigInt(await usdt.balanceOf(accounts[0]));
        busdBalance = BigInt(await busd.balanceOf(accounts[0]));
        console.log("usdt balance: ", usdtBalance);
        console.log("busd balance: ", busdBalance);
    });

    it("Owner withdraw failed", async() => {
        await usdt.transfer(accounts[1], 2000);
        await usdt.approve(presale.address, 2000, {from: accounts[1]});

        await busd.transfer(accounts[2], 2000);
        await busd.approve(presale.address, 2000, {from: accounts[2]});

        await presale.buyToken(1000, USDT, {from: accounts[1]});
        await presale.buyToken(1000, BUSD, {from: accounts[2]});

        await seedingSetting.setStart(0);
        await seedingSetting.setEnd(0);

        await publicSaleSetting.setStart(1000);
        await publicSaleSetting.setEnd(10000);

        await presale.buyToken(1000, USDT, {from: accounts[1]});
        await presale.buyToken(1000, BUSD, {from: accounts[2]});

        await expectThrow(presale.ownerWithdraw());
    });

})
