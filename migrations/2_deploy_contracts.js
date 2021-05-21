var ERC20 = artifacts.require("SmartCopyRightToken");
var Locker = artifacts.require("Locker");
var NFTToken = artifacts.require("NFTToken");

module.exports = function(deployer) {
  deployer.deploy(ERC20);
  deployer.deploy(Locker, 10000, 10000);
  deployer.deploy(NFTToken);
};