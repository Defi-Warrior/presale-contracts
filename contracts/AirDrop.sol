/**
 *Submitted for verification at Etherscan.io on 2021-04-13
*/
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;


import "./utils/Ownable.sol";
import "./extensions/IERC20.sol";

contract AirDrop is Ownable {

    // contains amount that each user can withdraw
    mapping(address => uint256) public balances;
    // token used for airdrop event
    IERC20 public token;

    constructor(address token_addr) {
        token = IERC20(token_addr);
    }

    function updateBalance(address[] memory addrs, uint256[] memory newBalances) external onlyOwner {
        for (uint i = 0; i < addrs.length; i++)
            balances[addrs[i]] = newBalances[i];
    }

    function claim() external {
        uint256 amount = balances[msg.sender];
        balances[msg.sender] = 0;
        token.transferFrom(owner(), msg.sender, amount);
    }

}