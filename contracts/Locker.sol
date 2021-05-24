/**
 *Submitted for verification at Etherscan.io on 2021-04-13
*/
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./utils/Ownable.sol";


struct LockDuration {
    uint256 start;
    uint256 end;
}

contract Locker is Ownable {
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
    function addWhitelist(address[] memory addresses, uint256[] memory starts, uint256[] memory ends) external onlyOwner {
        require(addresses.length == starts.length && starts.length == ends.length, 
                "Invalid input data, the length of addresses and starts, ends list must equal");
        for (uint i = 0; i < addresses.length; i++) {
            whitelist[addresses[i]] = true;
            lockRecords[addresses[i]] = LockDuration(starts[i], ends[i]);
        }
    }

    /**
     * @dev Sets the values for {seedingRoundWhitelist} or {privateRoundWhitelist},
     * the length of addresses and starts, ends list must equal
     */
    function lock(address addr, uint256 start, uint256 end) external onlyPresaleAddress {
        whitelist[addr] = true;
        lockRecords[addr] = LockDuration(start, end);
    }

     /**
     * @dev check the value of {source} address, revert transaction if this address is in one of the two whitelist and still in lock period
     */
    function checkLock(address source) external view returns (bool) {
        LockDuration memory lockDuration = lockRecords[source];
        if (whitelist[source] && block.number >= lockDuration.start && block.number <= lockDuration.end)
            return true;
        return false;
    }
}