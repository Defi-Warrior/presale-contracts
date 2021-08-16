/**
 *Submitted for verification at Etherscan.io on 2021-04-13
*/
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;


import "./utils/Ownable.sol";
import "./extensions/IERC20.sol";

contract AirDrop is Ownable {

    // contains amount that each user can withdraw
    mapping(address => bool) public claimed;
    mapping(address => bool) public whitelist;
    // token used for airdrop event
    IERC20 public token;
    uint256 public GIVE_AWAY_AMOUNT = 888000000000000000000;

    constructor(address token_addr) {
        token = IERC20(token_addr);
    }

    function updateWhitelist(address[] memory addrs, bool[] memory permission) external onlyOwner {
        for (uint i = 0; i < addrs.length; i++)
            whitelist[addrs[i]] = permission[i];
    }

    function updateGiveAwayAmount(uint256 value) public onlyOwner {
        GIVE_AWAY_AMOUNT = value;
    }

    function claim() external {
        require(!claimed[msg.sender] && whitelist[msg.sender], "claimed or not in whitelist");
        claimed[msg.sender] = true;
        token.transferFrom(owner(), msg.sender, GIVE_AWAY_AMOUNT);
    }

}