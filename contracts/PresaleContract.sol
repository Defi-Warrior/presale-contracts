/**
 *Submitted for verification at BscScan.com on 2021-05-09
*/

// SPDX-License-Identifier: MIT


pragma solidity ^0.8.0;

import {Ownable} from "./utils/Ownable.sol";
import {IERC20} from "./extensions/IERC20.sol";


struct PresaleSetting {
    string name;
    uint256 minPurchase;
    uint256 start;
    uint256 end;
    uint256 lockDuration;
    uint256 totalSupply;
    uint256 PRICE;
    uint256 vestingMonth;
}

interface ILocker {
  /**
   * @dev lock the ability to transfer CORI token of {source} for a specific duration
   */
  function lock(address source, uint256 start, uint256 end) external;
}

interface ISetting {
    function start() external view returns (uint256);
    function end() external view returns (uint256);
    function price() external view returns (uint256);
    function lockDuration() external view returns (uint256);
    function totalSupply() external view returns (uint256);
    function minPurchase() external view returns (uint256);
}

contract Presale is Ownable {

    uint256 public totalTokenSold;

    mapping(address => uint256) public balances;
    mapping(address => uint256) public totalSold;
    mapping(address => bool) public whitelist;

    address public USDT_CONTRACT = 0x40d60E0282356D82358B0De9e5F437401a12f0ab;
    address public BUSD_CONTRACT = 0x68b55C4c19Ee274a68080b156b1e10CdAF34E63E;
    address public DAI_CONTRACT = 0xc85279aC8a24Ed7D3Fb7d4dC188AFf0c21010F0A;
    address public CORI_CONTRACT = 0xb826fBD3BD6ed888eEcAFF6B4dcD42bd6b930971;

    enum TokenType {USDT, BUSD, DAI}

    IERC20 public CORI_TOKEN;

    ISetting public SEEDING_SETTING;
    ISetting public FIRST_ROUND_SETTING;
    // ISetting public SECOND_ROUND_SETTING;
    // ISetting public THRID_ROUND_SETTING;
    ISetting public PUBLIC_SALE_SETTING;

    ISetting public currentSetting;
    ILocker public locker;


    constructor(address lockerAddr, address seedingSetting, address roundOneSetting, address publicSaleSetting) {
        SEEDING_SETTING = ISetting(seedingSetting);
        FIRST_ROUND_SETTING = ISetting(roundOneSetting);
        PUBLIC_SALE_SETTING = ISetting(publicSaleSetting);
        // SECOND_ROUND_SETTING = ISetting();
        // THRID_ROUND_SETTING = ISetting();

        CORI_TOKEN = IERC20(CORI_CONTRACT);

        locker = ILocker(lockerAddr);
    }

    function addWhitelist(address[] memory addr) external onlyOwner {
        for(uint i = 0; i < addr.length; i++)
            whitelist[addr[i]] = true;
    }

    /**
   * @dev update the current setting and status of presale
   */
    function updatePresaleStatus() public {
        if (block.number >= SEEDING_SETTING.start() && block.number <= SEEDING_SETTING.end()) {
            currentSetting = SEEDING_SETTING;
        }
        else if (block.number >= FIRST_ROUND_SETTING.start() && block.number <= FIRST_ROUND_SETTING.end()) {
            currentSetting = FIRST_ROUND_SETTING;
        }
        else if (block.number >= PUBLIC_SALE_SETTING.start() && block.number <= PUBLIC_SALE_SETTING.end()) {
            currentSetting = PUBLIC_SALE_SETTING;
        }
        // else if (block.number >= SECOND_ROUND_SETTING.start() && block.number <= SECOND_ROUND_SETTING.end()) {
        //     currentSetting = SECOND_ROUND_SETTING;
        //     presaleStatus = PresaleStatus.ON_GOING;
        // }    
        // else if (block.number >= THRID_ROUND_SETTING.start() && block.number <= THRID_ROUND_SETTING.end()) {
        //     currentSetting = THRID_ROUND_SETTING;
        //     presaleStatus = PresaleStatus.ON_GOING;
        // }
    }

    /**
   * @dev
   */
    function deposit(address spender, uint256 amount, address tokenAddr) internal {
        // amount of CORI token that we are going to sell
        uint256 sellAmount = amount * currentSetting.price();
        // transfer buyer's stable coin to this contract
        IERC20(tokenAddr).transferFrom(spender, address(this), amount);
        // lock CORI token before transfer
        locker.lock(spender, currentSetting.start(), currentSetting.end() + currentSetting.lockDuration());
        // transfer CORI token to buyer
        CORI_TOKEN.transferFrom(owner(), spender, sellAmount);
        // update user balance and total token sold
        balances[_msgSender()] += sellAmount;
        totalSold[address(currentSetting)] += sellAmount;
        totalTokenSold += sellAmount;
    }
    
    /**
   * @dev user will call this function to buy our token by their stable coins
   */
    function buyToken(uint256 amount, TokenType tokenType) public {
        if (address(currentSetting) != address(PUBLIC_SALE_SETTING)) {
            require(whitelist[_msgSender()], "Not whitelisted address, you are not allowed to purchase in this time");
        }
        require(block.number >= currentSetting.start() && block.number < currentSetting.end(), "Presale is not started or has ended");
        require(tokenType == TokenType.USDT || tokenType == TokenType.BUSD || tokenType == TokenType.DAI, "Invalid token type");

        uint256 buyAmount = amount * currentSetting.price();

        require(buyAmount >= currentSetting.minPurchase(), "Invest amount must larger or equal to than mininimum purchase amount");
        require(totalSold[address(currentSetting)] + buyAmount <= currentSetting.totalSupply(), "No more token to sell in this round");

        // require(_seedingAllowances[_msgSender()] >= amount, "Invalid address or the invest amount is higher than allowed");
        address tokenAddr;
        if (tokenType == TokenType.USDT)
            tokenAddr = USDT_CONTRACT;

        if (tokenType == TokenType.BUSD)
            tokenAddr = BUSD_CONTRACT;

        if (tokenType == TokenType.DAI)
            tokenAddr = DAI_CONTRACT;

        deposit(_msgSender(), amount, tokenAddr);
    }

    function ownerWithdraw() external onlyOwner {
        require(block.number > PUBLIC_SALE_SETTING.end(), "Presale is not ended");
        IERC20 usdt = IERC20(USDT_CONTRACT);
        IERC20 busd = IERC20(BUSD_CONTRACT);
        IERC20 dai = IERC20(DAI_CONTRACT);

        if (usdt.balanceOf(address(this)) > 0)
            usdt.transfer(owner(), usdt.balanceOf(address(this)));

        if (busd.balanceOf(address(this)) > 0)
            busd.transfer(owner(), busd.balanceOf(address(this)));

        if (dai.balanceOf(address(this)) > 0)
            dai.transfer(owner(), dai.balanceOf(address(this)));

        if (CORI_TOKEN.balanceOf(address(this)) > 0)
            CORI_TOKEN.transfer(owner(), CORI_TOKEN.balanceOf(address(this)));
    }
}