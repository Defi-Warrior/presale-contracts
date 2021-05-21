const SmartCopyRightToken = artifacts.require("SmartCopyRightToken");
const Locker = artifacts.require("Locker");
const NFTToken = artifacts.require("NFTToken");


contract("SmartCopyRightToken", async accounts => {

    let erc20Token;
    let locker;
    let nftToken;

    beforeEach(async () => {
        erc20Token = await SmartCopyRightToken.deployed();
        locker = await Locker.deployed();
        console.log(await locker.seedingRoundEnd.call());
        nftToken = await NFTToken.deployed(); 

    });

    it("Should put 400000000 token in the first account", async() => {
        let balance = await erc20Token.balanceOf.call(accounts[0]);
        console.log(erc20Token.address);
        console.log(BigInt(balance));
        assert.equal(BigInt(balance), 400000000000000000000000000n);
    });

    it("Should transfer success before and after inser locker", async() => {
        console.log("locker address: ", locker.address);
        await erc20Token.setLocker.call(locker.address);

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
