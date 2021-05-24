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
   * @dev Fails if transaction is not allowed. Otherwise returns the penalty.
   * Returns a bool and a uint16, bool clarifying the penalty applied, and uint16 the penaltyOver1000
   */
  function lock(address source, uint256 start, uint256 end) external returns (bool);
}

contract Presale is Ownable {

    uint256 public totalTokenSold;

    mapping(address=>uint256) public balances;

    address public USDT_CONTRACT = 0x40d60E0282356D82358B0De9e5F437401a12f0ab;
    address public BUSD_CONTRACT = 0x68b55C4c19Ee274a68080b156b1e10CdAF34E63E;
    address public DAI_CONTRACT = 0xc85279aC8a24Ed7D3Fb7d4dC188AFf0c21010F0A;
    address public CORI_CONTRACT = 0xb826fBD3BD6ed888eEcAFF6B4dcD42bd6b930971;

    enum TokenType {USDT, BUSD, DAI}

    IERC20 public stableCoin;
    IERC20 public CORI_TOKEN;


    PresaleSetting public SEEDING_SETTING;
    PresaleSetting public FIRST_ROUND_SETTING;
    PresaleSetting public SECOND_ROUND_SETTING;
    PresaleSetting public THRID_ROUND_SETTING;

    PresaleSetting public currentSetting;

    constructor() {
        SEEDING_SETTING = PresaleSetting("Seeding", 100*10**18, 9119140, 10119140, 0, 200000000*10**18, 1000, 15);
        FIRST_ROUND_SETTING = PresaleSetting("Private Sale Round 1", 200*10**18, 0, 0, 0, 200000000*10**18, 666, 12);
        SECOND_ROUND_SETTING = PresaleSetting("Private Sale Round 2", 300*10**18, 0, 0, 0, 100000000*10**18, 666, 12);
        THRID_ROUND_SETTING = PresaleSetting("Private Sale Round 3", 400*10**18, 0, 0, 0, 100000000*10**18, 666, 12);

        CORI_TOKEN = IERC20(CORI_CONTRACT);
    }

    function updatePresaleSetting() public {
        if (block.number >= SEEDING_SETTING.start && block.number <= SEEDING_SETTING.end)
            currentSetting = SEEDING_SETTING;

        else if (block.number >= FIRST_ROUND_SETTING.start && block.number <= FIRST_ROUND_SETTING.end)
            currentSetting = FIRST_ROUND_SETTING;

        else if (block.number >= SECOND_ROUND_SETTING.start && block.number <= SECOND_ROUND_SETTING.end)
            currentSetting = SECOND_ROUND_SETTING;

        else if (block.number >= THRID_ROUND_SETTING.start && block.number <= THRID_ROUND_SETTING.end)
            currentSetting = THRID_ROUND_SETTING;
    }

    function deposit(address spender, uint256 amount, address tokenAddr) internal {
        stableCoin = IERC20(tokenAddr);
        stableCoin.transferFrom(spender, address(this), amount);
        uint256 sellAmount = amount * currentSetting.PRICE;
        balances[_msgSender()] += sellAmount;
        totalTokenSold += sellAmount;
    }

    function buyToken(uint256 amount, TokenType tokenType) public {
        require(amount > 0, "Invest amount must larger than zero");
        require(tokenType == TokenType.USDT || tokenType == TokenType.BUSD || tokenType == TokenType.DAI, "Invalid token type");
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