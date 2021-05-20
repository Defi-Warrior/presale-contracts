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
        nftToken = await NFTToken.deployed(); 

    });

    it("Should put 4000000 token in the first account", async() => {
        const balance = await erc20Token.balanceOf.call(accounts[0]);
        console.log(erc20Token.address);
        console.log(BigInt(balance));

    });
})
