/**
 *Submitted for verification at BscScan.com on 2021-05-09
*/

// SPDX-License-Identifier: MIT


pragma solidity ^0.8.0;

import {Ownable} from "./utils/Ownable.sol";
import {IERC20} from "./extensions/IERC20.sol";


contract Presale is Ownable {

    uint256 private SEEDING_RATE;
    uint256 private PRIVATE_SALE_RATE;

    uint256 private seedingStart;
    uint256 private seedingEnd;

    uint256 private privateSaleStart;
    uint256 private privateSaleEnd;

    uint256 private totalTokenSold;

    mapping(address=>uint256) private _seedingAllowances;
    mapping(address=>uint256) private _privateSaleAllowances;

    mapping(address=>uint256) private _balances;

    address private USDT_CONTRACT = 0x55d398326f99059fF775485246999027B3197955;
    address private BUSD_CONTRACT = 0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56;
    address private DAI_CONTRACT = 0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3;

    enum TokenType {USDT, BUSD, DAI}

    modifier onlyInSeedingRound() {
        require(seedingStart >= block.number && seedingEnd <= block.number, "Seeding round is not started or it has ended");
        _;
    }

    modifier onlyInPrivateSaleRound() {
        require(privateSaleStart >= block.number && privateSaleEnd <= block.number, "Private sale is not started or it has ended");
        _;
    }

    constructor(uint256 seedingRate_, uint256 privateSaleRate_) {
        SEEDING_RATE = seedingRate_;
        PRIVATE_SALE_RATE = privateSaleRate_;
    }

    function addWhitelistForSeedingRound(address[] memory whilelists_, uint256[] memory maxPurchases_) public onlyOwner {
        for (uint i = 0; i < whilelists_.length; i++) {
            _seedingAllowances[whilelists_[i]] = maxPurchases_[i];
        }
    }

    function addWhitelistForPrivateRound(address[] memory whilelists_, uint256[] memory maxPurchases_) public onlyOwner {
        for (uint i = 0; i < whilelists_.length; i++) {
            _privateSaleAllowances[whilelists_[i]] = maxPurchases_[i];
        }
    }

    function deposit(address token, uint256 amount, mapping(address=>uint256) storage allowances, uint256 RATE) internal {
        IERC20(token).transferFrom(address(this), address(this), amount);
        allowances[_msgSender()] -= amount;
        uint256 totalSold = amount * RATE;
        _balances[_msgSender()] += totalSold;
        totalTokenSold += totalSold;
    }

    function depositSeedingRound(uint256 amount, TokenType tokenType) public onlyInSeedingRound {
        require(amount > 0, "Invest amount must larger than zero");
        require(_seedingAllowances[_msgSender()] >= amount, "Invalid address or the invest amount is higher than allowed");

        if (tokenType == TokenType.USDT) {
            deposit(USDT_CONTRACT, amount, _seedingAllowances, SEEDING_RATE);
        }
        else if (tokenType == TokenType.BUSD) {
            deposit(BUSD_CONTRACT, amount, _seedingAllowances, SEEDING_RATE);
        } 
        else if (tokenType == TokenType.DAI) {
            deposit(DAI_CONTRACT, amount, _seedingAllowances, SEEDING_RATE);
        }
        else {
            revert("Invalid token type");
        }
    }


    function depositPrivateSaleRound(uint256 amount, TokenType tokenType) public onlyInPrivateSaleRound {
        require(amount > 0, "Invest amount must larger than zero");
        require(_privateSaleAllowances[_msgSender()] >= amount, "Invalid address or the invest amount is higher than allowed");

        if (tokenType == TokenType.USDT) {
            deposit(USDT_CONTRACT, amount, _privateSaleAllowances, PRIVATE_SALE_RATE);
        }
        else if (tokenType == TokenType.BUSD) {
            deposit(BUSD_CONTRACT, amount, _privateSaleAllowances, PRIVATE_SALE_RATE);
        } 
        else if (tokenType == TokenType.DAI) {
            deposit(DAI_CONTRACT, amount, _privateSaleAllowances, PRIVATE_SALE_RATE);
        }
        else {
            revert("Invalid token type");
        }
    }
}