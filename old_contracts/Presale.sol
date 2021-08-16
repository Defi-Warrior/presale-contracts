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

    ISetting[] public settings;

    ISetting public currentSetting;
    
    ILocker public locker;

    event BuyToken(address buyer, uint256 amount);

    constructor(address lockerAddr, 
                address[] memory _settings,
                address usdtAddr,
                address busdAddr,
                address coriAddr) {

        for(uint i = 0; i < _settings.length; i++) {
            settings.push(ISetting(_settings[i]));
            presaleIndex[_settings[i]] = i;
        }

        currentSetting = settings[0];

        USDT_ADDRESS = usdtAddr;
        BUSD_ADDRESS = busdAddr;

        FIWA_TOKEN = IERC20(coriAddr);

        locker = ILocker(lockerAddr);
    }

    function isBlockInRange(ISetting setting) internal view returns (bool) {
        return (block.number >= setting.start()) && (block.number <= setting.end());
    }

    /**
   * @dev update the current setting and status of presale
   */
    function updatePresaleStatus() external {
        for(uint i = 0; i < settings.length; i++) {
            if (isBlockInRange(settings[i])) {
                currentSetting = settings[i];
                return;
            }
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
        FIWA_TOKEN.transfer(spender, sellAmount);
        totalSold[address(currentSetting)] += sellAmount;
        totalTokenSold += sellAmount;
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
        require(isBlockInRange(currentSetting), "Presale is not started or has ended");
        require(tokenType == TokenType.USDT || tokenType == TokenType.BUSD, "Invalid token type");
        require(amount >= currentSetting.minPurchase(), "Invest amount must larger or equal to mininimum purchase amount");
        require(totalSold[address(currentSetting)] + amount * currentSetting.price() <= currentSetting.totalSupply(), "The amount you are buying exceed maximum supply token at this stage");

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
        IERC20 usdt = IERC20(USDT_ADDRESS);
        IERC20 busd = IERC20(BUSD_ADDRESS);

        uint256 usdtBalance = usdt.balanceOf(address(this));
        uint256 busdBalance = busd.balanceOf(address(this));
        uint256 fiwaBalance = FIWA_TOKEN.balanceOf(address(this));

        if (usdtBalance > 0)
            usdt.transfer(owner(), usdtBalance);

        if (busdBalance > 0)
            busd.transfer(owner(), busdBalance);

        if (fiwaBalance > 0) 
            FIWA_TOKEN.transfer(owner(), fiwaBalance);
    }
}