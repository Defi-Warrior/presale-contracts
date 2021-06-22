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
    //mapping from address to presale stage -> lock amount
    mapping(address => mapping(uint => LockDuration)) public lockRecords;

    // address of deployed Presale contract
    address public presaleAddress;
    // number of block that represent 1 month in BSC
    uint256 public constant MONTH = 864000;
    uint public constant PRESALE_STAGE = 4;

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
    function lock(address addr, uint256 amount, uint256 start, uint256 end, uint256 vestingMonth, uint256 cliff, uint index) external override onlyPresaleAddress {
        LockDuration memory locker = lockRecords[addr][index];

        whitelist[addr] = true;
        // convert {cliff} to block number
        cliff = end + cliff * MONTH;
        // getting the exact end time of Presale
        end = cliff + vestingMonth * MONTH;

        lockRecords[addr][index] = LockDuration(start, end, amount + locker.lockAmount, vestingMonth, cliff);
        // emit Lock(addr, amount, start, end, cliff);
    }
    /**
     * @dev calculate the true amount being locked of an address after a while
     * @param source address representing account being checked
     * @return uint256 address representing the locked amount
     */
    function getRealLockedAmount(address source, uint index) public view returns (uint256) {
        LockDuration memory lockDuration = lockRecords[source][index];
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

    function getLockedAmount(address source) public view returns(uint256) {
        uint256 lockAmount = 0;
        for (uint i = 0; i < PRESALE_STAGE; i++)
            lockAmount += getRealLockedAmount(source, i);
        return lockAmount;
    }

     /**
     * @dev check the validity of {newBalance} of {source} address, {newBalance} must smaller than lockedAmount of {source}
     */
    function checkLock(address source, uint256 newBalance) external view override returns (bool) {
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