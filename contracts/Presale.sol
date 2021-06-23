/**
 *Submitted for verification at BscScan.com on 2021-05-09
*/

// SPDX-License-Identifier: MIT


pragma solidity ^0.8.0;

import {Ownable} from "./utils/Ownable.sol";
import {IERC20} from "./extensions/IERC20.sol";
import {ILocker} from "./extensions/ILocker.sol";


interface ISetting {
    function name() external view returns (string memory);
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
    // tracking token sold by each stage using address of setting contracts.
    mapping(address => uint256) public totalSold;

    mapping(address => uint) public presaleIndex;

    mapping(address => bool) public buyer;

    uint32 public numBuyer;

    address public USDT_ADDRESS;
    address public BUSD_ADDRESS;

    enum TokenType {USDT, BUSD}

    IERC20 public FIWA_TOKEN;

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

        currentSetting = SEEDING_SETTING;

        USDT_ADDRESS = usdtAddr;
        BUSD_ADDRESS = busdAddr;

        presaleIndex[seedingSetting] = 0;
        presaleIndex[privateSaleSetting] = 1;
        presaleIndex[publicSaleSetting] = 2;

        FIWA_TOKEN = IERC20(coriAddr);

        locker = ILocker(lockerAddr);
    }

    /**
   * @dev update the current setting and status of presale
   */
    function updatePresaleStatus() internal {
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
        FIWA_TOKEN.transferFrom(owner(), spender, sellAmount);
        totalSold[address(currentSetting)] += sellAmount;
        totalTokenSold += sellAmount;
        if (address(currentSetting) != address(PUBLIC_SALE_SETTING))
            // lock CORI token
            locker.lock(spender, 
                        sellAmount, 
                        currentSetting.start(),
                        currentSetting.end(),
                        currentSetting.vestingMonth(),
                        currentSetting.cliff(),
                        presaleIndex[address(currentSetting)]);
    }
    
    /**
   * @dev user will call this function to buy our token by their stable coins
   */
    function buyToken(uint256 amount, TokenType tokenType) public {
        updatePresaleStatus();
        require(block.number >= currentSetting.start() && block.number < currentSetting.end(), "Presale is not started or has ended");
        require(tokenType == TokenType.USDT || tokenType == TokenType.BUSD, "Invalid token type");

        uint256 buyAmount = amount * currentSetting.price();

        require(amount >= currentSetting.minPurchase(), "Invest amount must larger or equal to than mininimum purchase amount");
        require(totalSold[address(currentSetting)] + buyAmount <= currentSetting.totalSupply(), "The amount you are buying exceed maximum supply token at this stage");

        // require(_seedingAllowances[_msgSender()] >= amount, "Invalid address or the invest amount is higher than allowed");
        address tokenAddr;
        if (tokenType == TokenType.USDT)
            tokenAddr = USDT_ADDRESS;

        if (tokenType == TokenType.BUSD)
            tokenAddr = BUSD_ADDRESS;

        if (!buyer[_msgSender()]) {
            buyer[_msgSender()] = true;
            numBuyer += 1;
        }

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