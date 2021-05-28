/**
 *Submitted for verification at BscScan.com on 2021-05-09
*/

// SPDX-License-Identifier: MIT


pragma solidity ^0.8.0;

import {Ownable} from "./utils/Ownable.sol";
import {IERC20} from "./extensions/IERC20.sol";
import {ILocker} from "./extensions/ILocker.sol";


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

struct Balance {
    address owner;
    uint256 totalToken;
    uint256 vestingPeriod;
    uint256 availableBalance;
    uint256 vestedBalance;
}

interface ISetting {
    function start() external view returns (uint256);
    function end() external view returns (uint256);
    function price() external view returns (uint256);
    function lockDuration() external view returns (uint256);
    function totalSupply() external view returns (uint256);
    function minPurchase() external view returns (uint256);
    function vestingMonth() external view returns (uint256);
    function cliff() external view returns (uint256);
}

contract Presale is Ownable {

    uint256 public totalTokenSold;

    mapping(address => uint256) public balances;
    mapping(address => uint256) public totalSold;
    mapping(address => bool) public whitelist;

    address public USDT_ADDRESS;
    address public BUSD_ADDRESS;

    enum TokenType {USDT, BUSD}

    IERC20 public CORI_TOKEN;

    ISetting public SEEDING_SETTING;
    ISetting public PRIVATE_SALE_SETTING;
    ISetting public PUBLIC_SALE_SETTING;

    ISetting public currentSetting;
    ILocker public locker;

    event BuyToken(address buyer, uint256 amount);

    constructor(address lockerAddr, 
                address seedingSetting, 
                address privateSaleSetting, 
                address publicSaleSetting,
                address usdtAddr,
                address busdAddr,
                address coriAddr) {
        SEEDING_SETTING = ISetting(seedingSetting);
        PRIVATE_SALE_SETTING = ISetting(privateSaleSetting);
        PUBLIC_SALE_SETTING = ISetting(publicSaleSetting);

        USDT_ADDRESS = usdtAddr;
        BUSD_ADDRESS = busdAddr;
        CORI_TOKEN = IERC20(coriAddr);

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
        else if (block.number >= PRIVATE_SALE_SETTING.start() && block.number <= PRIVATE_SALE_SETTING.end()) {
            currentSetting = PRIVATE_SALE_SETTING;
        }
        else if (block.number >= PUBLIC_SALE_SETTING.start() && block.number <= PUBLIC_SALE_SETTING.end()) {
            currentSetting = PUBLIC_SALE_SETTING;
        }
    }

    /**
   * @dev
   */
    function deposit(address spender, uint256 amount, address tokenAddr) internal {
        // amount of CORI token that we are going to sell
        uint256 sellAmount = amount * currentSetting.price();
        // transfer buyer's stable coin to this contract
        IERC20(tokenAddr).transferFrom(spender, address(this), amount);
        // transfer CORI token to buyer
        CORI_TOKEN.transferFrom(owner(), spender, sellAmount);
        // // update user balance and total token sold
        balances[_msgSender()] += sellAmount;
        totalSold[address(currentSetting)] += sellAmount;
        totalTokenSold += sellAmount;
        // lock CORI token
        locker.lock(spender, 
                    balances[_msgSender()], 
                    currentSetting.start(),
                    currentSetting.end(),
                    currentSetting.vestingMonth(),
                    currentSetting.cliff());
    }
    
    /**
   * @dev user will call this function to buy our token by their stable coins
   */
    function buyToken(uint256 amount, TokenType tokenType) public {
        if (address(currentSetting) != address(PUBLIC_SALE_SETTING)) {
            require(whitelist[_msgSender()], "Not whitelisted address, you are not allowed to purchase in this time");
        }
        require(block.number >= currentSetting.start() && block.number < currentSetting.end(), "Presale is not started or has ended");
        require(tokenType == TokenType.USDT || tokenType == TokenType.BUSD, "Invalid token type");

        uint256 buyAmount = amount * currentSetting.price();

        require(buyAmount >= currentSetting.minPurchase(), "Invest amount must larger or equal to than mininimum purchase amount");
        require(totalSold[address(currentSetting)] + buyAmount <= currentSetting.totalSupply(), "No more token to sell in this round");

        // require(_seedingAllowances[_msgSender()] >= amount, "Invalid address or the invest amount is higher than allowed");
        address tokenAddr;
        if (tokenType == TokenType.USDT)
            tokenAddr = USDT_ADDRESS;

        if (tokenType == TokenType.BUSD)
            tokenAddr = BUSD_ADDRESS;

        deposit(_msgSender(), amount, tokenAddr);
    }

    function ownerWithdraw() external onlyOwner {
        require(block.number > PUBLIC_SALE_SETTING.end(), "Presale is not ended");
        IERC20 usdt = IERC20(USDT_ADDRESS);
        IERC20 busd = IERC20(BUSD_ADDRESS);

        if (usdt.balanceOf(address(this)) > 0)
            usdt.transfer(owner(), usdt.balanceOf(address(this)));

        if (busd.balanceOf(address(this)) > 0)
            busd.transfer(owner(), busd.balanceOf(address(this)));
    }
}