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
    // amount of token being locked
    uint256 lockAmount;
    // number of month it takes to release all {lockAmount}
    uint256 vestingMonth;
    // immidiately lock token transfer function from {start} to {cliff}
    // vesting will start after cliff time has passed
    uint256 cliff;

}

contract Locker is Ownable, ILocker {
    // contains addresses that were in the seeding, private sale or marketing campaign
    // these addresses will be locked from sending their token to other addresses in different durations
    // these lock durations will be stored in lockRecords
    mapping(address => bool) public whitelist;
    mapping(address => LockDuration) public lockRecords;

    // address of deployed Presale contract
    address public presaleAddress;
    // number of block that represent 1 month in BSC
    uint256 public constant MONTH = 864000;

    modifier onlyPresaleAddress() {
        require(_msgSender() == presaleAddress, "Invalid caller, must be presale address");
        _;
    }

    event Lock(address addr, uint256 amount, uint256 start, uint256 vestingMonth, uint256 cliff);

    constructor() {}

    function setPresaleAddress(address newAddr) public onlyOwner {
        presaleAddress = newAddr;
    }

    /**
     * @dev lock an account from transfering CORI token in a specific block number
     * the length of addresses and starts, ends list must equal
     * @param addr address representing account being locked
     * @param amount the amount being locked, account's balance can't go below this number during lock time
     * @param start block number represent start of lock period
     * @param end block number represent start of lock period
     * @param vestingMonth similar to {vestingMonth} in LockDuration
     * @param cliff number of months the token will be locked before able to vesting
     */
    function lock(address addr, uint256 amount, uint256 start, uint256 end, uint256 vestingMonth, uint256 cliff) external override onlyPresaleAddress {
        whitelist[addr] = true;
        // locked amount
        LockDuration memory lockDuration = lockRecords[addr];
        // convert {cliff} to block number
        cliff = end + cliff * MONTH;
        // getting the exact end time of Presale
        end = cliff + vestingMonth * MONTH;

        lockRecords[addr] = LockDuration(start, end, amount + lockDuration.lockAmount, vestingMonth, cliff);
        // emit Lock(addr, amount, start, end, cliff);
    }
     /**
     * @dev allow an account to transfer CORI token, this is just a backup function.
     * We implement it to prevent cases that user's token is lock permanently and for tesing purpose
     * we should never use this func in mainnet
     * @param addr address representing account being unlocked
     */
    function unlock(address addr) external onlyOwner {
        whitelist[addr] = false;
    }

    /**
     * @dev calculate the true amount being locked of an address after a while
     * @param source address representing account being checked
     * @return uint256 address representing the locked amount
     */
    function getRealLockedAmount(address source) public view returns (uint256) {
        LockDuration memory lockDuration = lockRecords[source];
        if (block.number >= lockDuration.end)
            return 0;
            
        uint256 monthPassSinceLock = 0;
        if (block.number > lockDuration.cliff)
            monthPassSinceLock = (block.number - lockDuration.cliff) / MONTH;

        // avoid divide by zero
        if (lockDuration.vestingMonth == 0)
            return lockDuration.lockAmount;

        uint256 amountVestedEachMonth = lockDuration.lockAmount / lockDuration.vestingMonth;
        return lockDuration.lockAmount - (monthPassSinceLock * amountVestedEachMonth);
    }

     /**
     * @dev check the validity of {newBalance} of {source} address, {newBalance} must smaller than lockedAmount of {source}
     */
    function checkLock(address source, uint256 newBalance) external view override returns (bool) {
        if (!whitelist[source])
            return false;

        uint256 lockAmount = getRealLockedAmount(source);
        if (lockAmount == 0)
            return false;

        if (newBalance < lockAmount)
            return true;
        return false;
    }
}