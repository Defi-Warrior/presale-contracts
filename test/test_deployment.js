const SmartCopyRightToken = artifacts.require("SmartCopyRightToken");
const Locker = artifacts.require("Locker");
const Presale = artifacts.require("Presale");
const ERC20 = artifacts.require("ERC20");


contract("SmartCopyRightToken", async accounts => {

    let CORI;
    let locker;
    let usdt, busd, dai;
    let presale;

    beforeEach(async () => {
        locker = await Locker.deployed();
        usdt = await ERC20.deployed("Tether", "USDT");
        busd = await ERC20.deployed("Tether", "BUSD");
        dai = await ERC20.deployed("Tether", "DAI");
        CORI = await SmartCopyRightToken.deployed(locker.address);
        presale = await Presale.deployed(lock.address);
        

    });

    it("Should put 400000000 token in the first account", async() => {
        let balance = await CORI.balanceOf.call(accounts[0]);
        console.log(CORI.address);
        console.log(BigInt(balance));
        assert.equal(BigInt(balance), 400000000000000000000000000n);
    });

    it("Should transfer success before and after insert locker", async() => {
        
        await presale.update();

        await erc20Token.transfer(accounts[2], 1000000000000000000n);

        await erc20Token.transfer(accounts[3], 100000000000000000n, {from: accounts[2]});

        await locker.addWhitelist([accounts[2], accounts[3]], 0);

        await erc20Token.transfer(accounts[3], 100000000000000000n, {from: accounts[2]});

        // let balance = await erc20Token.balanceOf.call(accounts[2]);
        // console.log(BigInt(balance));

        let isWhitelisted = await locker.seedingRoundWhitelist.call(accounts[2]);
        console.log("whitelisted: ", isWhitelisted);
        isWhitelisted = await locker.privateRoundWhitelist.call(accounts[2]);
        console.log("whitelisted: ", isWhitelisted);
        console.log("seeding end", await locker.seedingRoundEnd.call());

    })

})
