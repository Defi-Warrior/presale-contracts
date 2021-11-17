/**
 *Submitted for verification at Etherscan.io on 2021-04-13
*/
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./utils/Ownable.sol";
import "./extensions/IERC20.sol";


contract MultiSender {

    address public fiwa;
    address public cwig;

    constructor(address _fiwa, address _cwig) {
        fiwa = _fiwa;
        cwig = _cwig;
    }

    function send(address[] memory addrs, uint _fiwaAmount, uint _cwigAmount) public {
        for(uint i = 0; i < addrs.length; i++) {
            IERC20(fiwa).transfer(addrs[i], _fiwaAmount);
            IERC20(cwig).transfer(addrs[i], _cwigAmount);
        }
    }
}