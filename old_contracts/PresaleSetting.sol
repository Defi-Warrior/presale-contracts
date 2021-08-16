/**
 *Submitted for verification at BscScan.com on 2021-05-09
*/

// SPDX-License-Identifier: MIT


pragma solidity ^0.8.0;

import {Ownable} from "./utils/Ownable.sol";


contract PresaleSetting is Ownable {
    string public name;
    uint256 public start;
    uint256 public end;
    uint256 public price;
    uint256 public minPurchase;
    uint256 public totalSupply;
    uint256 public cliff;
    uint256 public vestingMonth;

    constructor(string memory name_, 
                uint256 start_, 
                uint256 end_, 
                uint256 price_, 
                uint256 minPurchase_,
                uint256 totalSupply_, 
                uint256 cliff_, 
                uint256 vestingMonth_) {
        name = name_;
        start = start_;
        end = end_;
        price = price_;
        minPurchase = minPurchase_;
        totalSupply = totalSupply_;
        cliff = cliff_;
        vestingMonth = vestingMonth_;
    }

    function setName(string memory newName) external onlyOwner {
        name = newName;
    }

    function setMinPurchase(uint256 newValue) external onlyOwner {
        minPurchase = newValue;
    }

    function setStart(uint256 newValue) external onlyOwner {
        start = newValue;
    }

    function setEnd(uint256 newValue) external onlyOwner {
        end = newValue;
    }

    function setCliff(uint256 newValue) external onlyOwner {
        cliff = newValue;
    }

    function setTotalSupply(uint256 newValue) external onlyOwner {
        totalSupply = newValue;
    }
    function setPrice(uint256 newValue) external onlyOwner {
        price = newValue;
    }

    function setVestingMonth(uint256 newValue) external onlyOwner {
        vestingMonth = newValue;
    }
}