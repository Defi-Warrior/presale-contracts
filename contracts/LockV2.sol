/**
 *Submitted for verification at Etherscan.io on 2021-04-13
*/
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./utils/Ownable.sol";


struct LockRecord {
    uint256 start;
    uint256 end;
    // amount of token being locked
    uint256 lockAmount;
    uint256 rewardPerBlock;
}

contract LockerV2 is Ownable {
    // contains addresses that were in the seeding, private sale or marketing campaign
    // these addresses will be locked from sending their token to other addresses in different durations
    // these lock durations will be stored in lockRecords
    mapping(address => bool) public whitelist;
    //mapping from address to presale stage -> lock amount
    mapping(address => LockRecord) public lockRecords;

    bool public IDOStarted;

    event Lock(address addr, uint start, uint end, uint amount);

    constructor() {}

    function unlockForIDO(bool _value) external onlyOwner {
        IDOStarted = _value;
    }

    /**
     * @dev lock an account from transfering CORI token in a specific block number
     */
    function lock(address addr, uint256 amount, uint256 start, uint256 end) onlyOwner external {
        require(start < end, "Invalid lock time");
        whitelist[addr] = true;
        
        uint256 duration = end - start;
        // duration always > 0 so this divide operator won't throw
        uint256 rewardPerBlock = amount / duration;
        uint256 remainder = 0;
        // safety check
        if (rewardPerBlock * duration <= amount)
            remainder = amount - rewardPerBlock * duration;
            
        LockRecord memory lockRecord = LockRecord({
            start: start,
            end: end,
            lockAmount: amount - remainder,
            rewardPerBlock: rewardPerBlock
        });
        lockRecords[addr] = lockRecord;
    }

    /**
     * @dev calculate the true amount being locked of an address in one presale stage
     */
    function getLockedAmount(address addr) public view returns(uint256) {
        LockRecord memory lockRecord = lockRecords[addr];

        // unlock 5% of fund after IDO start
        if (IDOStarted)
            lockRecord.lockAmount -= lockRecord.lockAmount * 5 / 100;

        // havest time is not started 
        if (block.number <= lockRecord.start)
            return lockRecord.lockAmount;

        if (block.number >= lockRecord.end)
            return 0;

        uint256 unlockedAmount = (lockRecord.rewardPerBlock * (block.number - lockRecord.start));
        // need this check because we unlock 5% when IDO start
        if (unlockedAmount <= lockRecord.lockAmount)
            return lockRecord.lockAmount - unlockedAmount;
            
        return 0;
    }

     /**
     * @dev check the validity of {newBalance} of {source} address, {newBalance} must smaller than lockedAmount of {source}
     */
    function checkLock(address source, uint256 newBalance) external view returns (bool) {
        if (!whitelist[source])
            return false;
            
        uint256 lockAmount = getLockedAmount(source);

        if (lockAmount == 0)
            return false;

        if (newBalance < lockAmount)
            return true;
        return false;
    }
}