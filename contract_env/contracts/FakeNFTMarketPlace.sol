//SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

contract FakeNFTMarketPlace {
    uint256 nftPrice = 0.01 ether;

     mapping(uint256 => address) public tokens;

     function purchase(uint256 _tokenId) payable external  {
         require(msg.value == nftPrice, "This NFT costs 0.1 ether");
         tokens[_tokenId] = msg.sender;
     }

     function getPrice() external view returns (uint256){
         return nftPrice;
     }

     function available(uint256 _tokenId) external view returns(bool){
         if(tokens[_tokenId] == address(0)){
             return true;
         }else {
             return false;
         }
     }
}