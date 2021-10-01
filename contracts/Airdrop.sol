/**
 *Submitted for verification at Etherscan.io on 2021-04-13
*/
// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;


import "./utils/Ownable.sol";
import "./extensions/IERC20.sol";

contract AirDrop is Ownable {

    // contains amount that each user can withdraw
    mapping(uint => mapping(address => bool)) public claimed;
    mapping(uint => mapping(address => bool)) public whitelist;

    uint public airdropId;
    // token used for airdrop event
    IERC20 public token;
    uint256 public GIVE_AWAY_AMOUNT = 0;

    constructor(address token_addr) {
        token = IERC20(token_addr);
    }

    function updateWhitelist(address[] memory addrs, bool[] memory permission) external onlyOwner {
        for (uint i = 0; i < addrs.length; i++)
            whitelist[airdropId][addrs[i]] = permission[i];
    }

    function updateGiveAwayAmount(uint256 value) public onlyOwner {
        GIVE_AWAY_AMOUNT = value;
    }

    function claim() external {
        require(!claimed[airdropId][msg.sender] && whitelist[airdropId][msg.sender], "claimed or not in whitelist");
        claimed[airdropId][msg.sender] = true;
        token.transfer(msg.sender, GIVE_AWAY_AMOUNT);
    }

    function setToken(address _token) external onlyOwner {
        token = IERC20(_token);
    }

    function setAirdropId(uint _id) external onlyOwner {
        airdropId = _id;
    }

    function withdraw(address _to) external onlyOwner {
        token.transfer(_to, token.balanceOf(address(this)));
    }

    function canClaim(address _user) external view returns(bool) {
        return (!claimed[airdropId][_user] && whitelist[airdropId][_user]);
    }

}