//SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

interface IFakeNFTMarketplace {
    function getPrice() external view returns(uint256);

    function purchase(uint256 _tokenId) external payable;

    function available(uint256 _tokenId) external view returns(bool);
}



interface ICryptoDevsNFT {

    function balanceOf(address _owner) external view returns(uint256);
    //token Id of current user NFT
    function tokenOfOwnerByIndex(address _owner, uint256 _i) external view returns(uint256);
}


///commence creation of the DAO CONTRACT

contract CryptoDevsDAO is Ownable {
  
    struct Proposal {
        
        uint256 nftTokenId;
        
        uint256 deadline;
        
        uint256 yayVotes;
        
        uint256 nayVotes;
        
        bool executed;
        
        mapping(uint256 => bool) voters;
    }

      mapping(uint256 => Proposal) public proposals;

      uint256 public numProposals;

      IFakeNFTMarketplace nftMarketplace;

      ICryptoDevsNFT cryptoDevsNFT;
//the constructor is payable at this contract because you have to pay some ether
//from the owner wallet in the DAO treasury pulse
      constructor(address _nftMarketplaceAddress, address _cryptoDevsNftAddress) payable {
          nftMarketplace = IFakeNFTMarketplace(_nftMarketplaceAddress);
          cryptoDevsNFT = ICryptoDevsNFT(_cryptoDevsNftAddress);
      }

      modifier nftHolderOnly() {
          require(cryptoDevsNFT.balanceOf(msg.sender) > 0, "Youre not a DAO MEMBER");
          _;
      }

    function createProposal(uint256 _nftTokenId) external nftHolderOnly returns(uint256) {
        
        require(nftMarketplace.available(_nftTokenId), "NFT NOT AVAILABLE FOR SALE");
        
        Proposal storage proposal = proposals[numProposals];
        
        proposal.nftTokenId = _nftTokenId;
        
        proposal.deadline = block.timestamp + 5 minutes;

        numProposals++;
//this function return the index of the proposal created
        return numProposals - 1;
    }

    modifier activeProposalOnly(uint256 proposalIndex) {
        require(proposals[proposalIndex].deadline > block.timestamp, "DEADLINE EXCEEDED");
        _;
    }

    enum Vote {
            YAY,
            NAY
    }

    function voteOnProposal(uint256 proposalIndex, Vote vote) external nftHolderOnly activeProposalOnly(proposalIndex) {
        Proposal storage proposal = proposals[proposalIndex];
        uint256 voterNFTBalance = cryptoDevsNFT.balanceOf(msg.sender);
        uint256 numVotes = 0;

        for(uint256 x = 0; x < voterNFTBalance; x++){
            uint256 nftTokenId = cryptoDevsNFT.tokenOfOwnerByIndex(msg.sender, x);
            if(proposal.voters[nftTokenId] == false){
                numVotes++;
                proposal.voters[nftTokenId] = true;
            }
        }
        require(numVotes > 0, "ALREADY VOTED");

        if(vote == Vote.YAY){
            proposal.yayVotes += numVotes;
        }else {
            proposal.nayVotes += numVotes;
        }

    }

    modifier inactiveProposalOnly(uint256 proposalIndex) {
        require(proposals[proposalIndex].deadline <= block.timestamp, "DEADLINE NOT EXCEEDED");

        require(proposals[proposalIndex].executed == false, "PROPOSAL ALREADY EXECUTED");

        _;
    }

    function executeProposal(uint256 proposalIndex) external nftHolderOnly inactiveProposalOnly(proposalIndex) {
        Proposal storage proposal = proposals[proposalIndex];

        if(proposal.yayVotes > proposal.nayVotes){
            uint256 nftPrice = nftMarketplace.getPrice();
            require(address(this).balance >= nftPrice, "NOT ENOUGH FUND IN DAO");
            nftMarketplace.purchase{value: nftPrice}(proposal.nftTokenId);
        }

        proposal.executed == true;
    }

    function withdrawEther() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    receive() external payable {}

    fallback() external payable {}
}
