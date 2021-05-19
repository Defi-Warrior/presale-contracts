/**
 *Submitted for verification at Etherscan.io on 2021-04-13
*/
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./utils/Ownable.sol";


contract Locker is Ownable{

    mapping(address => bool) public seedingRoundWhitelist;
    mapping(address => bool) public privateRoundWhitelist;

    uint256 public seedingStart;
    uint256 public seedingEnd;

    uint256 public privateSaleStart;
    uint256 public privateSaleEnd;

    enum RoundType {SEEDING, PRIVATE}
    
    constructor(uint256 seedingStart_, 
                uint256 seedingEnd_, 
                uint256 privateSaleStart_, 
                uint256 privateSaleEnd_) {
                    
        seedingStart = seedingStart_;
        seedingEnd = seedingEnd_;
        privateSaleStart = privateSaleStart_;
        privateSaleEnd = privateSaleEnd_;
    }
    
    function updateSeedingTime(uint256 newStart, uint256 newEnd) external onlyOwner {
        seedingStart = newStart;
        seedingEnd = newEnd;
    }
    
    function updatePrivateSaleTime(uint256 newStart, uint256 newEnd) external onlyOwner {
        privateSaleStart = newStart;
        privateSaleEnd = newEnd;
    }


    function addWhitelist(address[] memory addresses, RoundType round) external onlyOwner {
        if (round == RoundType.SEEDING) {
            for (uint i = 0; i < addresses.length; i++) {
                seedingRoundWhitelist[addresses[i]] = true;
            }
        }

        if (round == RoundType.PRIVATE) {
            for (uint i = 0; i < addresses.length; i++) {
                privateRoundWhitelist[addresses[i]] = true;
            }
        }
    }
    
    function enableTransfer(address[] memory addresses) external onlyOwner {
        for (uint i = 0; i < addresses.length; i++) {
                seedingRoundWhitelist[addresses[i]] = false;
                privateRoundWhitelist[addresses[i]] = false;
            }
    }

    function checkLock(address source) external {
        if (seedingRoundWhitelist[source]) {
            if(block.number >= seedingStart && block.number <= seedingEnd) {
                revert("You can not transfer money during seeding time");
            }
        }

        if (privateRoundWhitelist[source]) {
            if(block.number >= privateSaleStart && block.number <= privateSaleEnd) {
                revert("You can not transfer money during private sale time");
            }
        }
    }
}