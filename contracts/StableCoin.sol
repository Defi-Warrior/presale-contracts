/**
 *Submitted for verification at Etherscan.io on 2021-04-13
*/
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;


import "./utils/Ownable.sol";
import "./utils/SafeMath.sol";
import {ERC20} from "./LockableERC20Token.sol";


contract StableCoin is Ownable, ERC20 {
    using SafeMath for uint256;
    constructor(string memory name, string memory symbol) ERC20(name, symbol) Ownable() {
    _setupDecimals(18);
    _mint(msg.sender, 400000000 * 10**decimals());
  }
}