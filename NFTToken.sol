// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {Ownable} from "./utils/Ownable.sol";
import {ERC721} from "./extensions/ERC721.sol";
import {ERC721EnumerableSimple} from "./extensions/ERC721EnumerableSimple.sol";

contract NFTToken is ERC721EnumerableSimple, Ownable {
    // Maximum amount of NFTToken in existance. Ever.
    // uint public constant MAX_NFTTOKEN_SUPPLY = 10000;

    // The provenance hash of all NFTToken. (Root hash of all NFTToken hashes concatenated)
    string public constant METADATA_PROVENANCE_HASH =
        "F5E8F9752F537EB428B0DC3A3A0F6B3646417E6FBD79AEC314D19D41AC48AF25";

    // Bsae URI of NFTToken's metadata
    string private baseURI;

    constructor() ERC721("Smart Copyright", "CORI") {}

    function tokensOfOwner(address _owner) external view returns (uint[] memory) {
        uint tokenCount = balanceOf(_owner);
        if (tokenCount == 0) {
            return new uint[](0); // Return an empty array
        } else {
            uint[] memory result = new uint[](tokenCount);
            for (uint index = 0; index < tokenCount; index++) {
                result[index] = tokenOfOwnerByIndex(_owner, index);
            }
            return result;
        }
    }

    function mint() public onlyOwner {
        uint _totalSupply = totalSupply();

        // require(_totalSupply <= MAX_NFTTOKEN_SUPPLY, "Exceeds maximum NFTToken supply");

        _safeMint(msg.sender, _totalSupply);
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }

    function setBaseURI(string memory __baseURI) public onlyOwner {
        baseURI = __baseURI;
    }

    function burn(uint256 tokenId) public {
        require(_isApprovedOrOwner(msg.sender, tokenId));
        _burn(tokenId);
    }
}
