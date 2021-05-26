/**
 *Submitted for verification at Etherscan.io on 2021-04-13
*/
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./utils/Ownable.sol";
import "./extensions/ILocker.sol";


struct LockDuration {
    uint256 start;
    uint256 end;
    uint256 lockAmount;
}

contract Locker is Ownable, ILocker {
    // contains addresses that were in the seeding, private sale or marketing campaign
    // these addresses will be locked from sending their token to other addresses in different durations
    // these lock durations will be stored in lockRecords
    mapping(address => bool) public whitelist;
    mapping(address => LockDuration) lockRecords;

    address public presaleAddress;

    modifier onlyPresaleAddress() {
        require(_msgSender() == presaleAddress, "Invalid caller, must be presale address");
        _;
    }

    constructor() {}

    function setPresaleAddress(address newAddr) public onlyOwner {
        presaleAddress = newAddr;
    }

    /**
     * @dev Sets the values for {seedingRoundWhitelist} or {privateRoundWhitelist},
     * the length of addresses and starts, ends list must equal
     */
    function lock(address addr, uint256 start, uint256 end, uint256 amount) external override onlyPresaleAddress {
        whitelist[addr] = true;
        lockRecords[addr] = LockDuration(start, end, amount);
    }

     /**
     * @dev check the value of {source} address, revert transaction if this address is in one of the two whitelist and still in lock period
     */
    function checkLock(address source, uint256 remainBalance) external view override returns (bool) {
        LockDuration memory lockDuration = lockRecords[source];
        if (whitelist[source] && block.number >= lockDuration.start && block.number <= lockDuration.end && remainBalance < lockDuration.lockAmount)
            return true;
        return false;
    }
}