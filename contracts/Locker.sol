/**
 *Submitted for verification at Etherscan.io on 2021-04-13
*/
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./utils/Ownable.sol";


contract Locker is Ownable{
    // contains addresses that were in the seeding or private sale,
    // these addresses will be locked from sending their token to other addresses
    mapping(address => bool) public seedingRoundWhitelist;
    mapping(address => bool) public privateRoundWhitelist;

    // block number indicates the ending of lock period for seeding round
    uint256 public seedingRoundEnd;
    // block number indicates the ending of lock period for private sale round
    uint256 public privateSaleEnd;

    uint256 minLockPeriod = 1 hours;

    enum RoundType {SEEDING, PRIVATE}

    constructor(uint256 seedingRoundLockPeriod, 
                uint256 privateSaleLockPeriod) {
        require(seedingRoundLockPeriod >= minLockPeriod, "Invalid lock period for seeding round");
        require(privateSaleLockPeriod >= minLockPeriod, "Invalid lock period for private sale round");

        seedingRoundEnd = block.number + seedingRoundLockPeriod;
        privateSaleEnd = block.number + privateSaleLockPeriod;
    }
    
    /**
     * @dev Sets the values for {newLockPeriod},
     */
    function updateLockTime(uint256 newLockPeriod, RoundType round) external onlyOwner {
        require(round == RoundType.SEEDING || round == RoundType.PRIVATE, "Invalid round type");

        if (round == RoundType.SEEDING)
            seedingRoundEnd = block.number + newLockPeriod;
        if (round == RoundType.PRIVATE)
            privateSaleEnd = block.number + newLockPeriod;
    }

    /**
     * @dev Sets the values for {seedingRoundWhitelist} or {privateRoundWhitelist},
     * the list type is depends on value of {round}, valid values are: [0: SeedingRound, 1: PrivateSaleRound] 
     */
    function addWhitelist(address[] memory addresses, RoundType round) external onlyOwner {
        require(round == RoundType.SEEDING || round == RoundType.PRIVATE, "Invalid round type");

        if (round == RoundType.SEEDING) {
            for (uint i = 0; i < addresses.length; i++) {
                seedingRoundWhitelist[addresses[i]] = true;
            }
        }

        else if (round == RoundType.PRIVATE) {
            for (uint i = 0; i < addresses.length; i++) {
                privateRoundWhitelist[addresses[i]] = true;
            }
        }
    }

     /**
     * @dev check the value of {source} address, revert transaction if this address is in one of the two whitelist and still in lock period
     */
    function checkLock(address source) external {
        if (seedingRoundWhitelist[source])
            require(block.number >= seedingRoundEnd, "You can not transfer money during seeding time");
        if (privateRoundWhitelist[source])
            require(block.number >= privateSaleEnd, "You can not transfer money during private sale time");
    }
}