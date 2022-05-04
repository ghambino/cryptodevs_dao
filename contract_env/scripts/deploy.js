const { ethers } = require("hardhat");

const { CRYPTODEVS_NFT_CONTRACT_ADDRESS } = require("../constants");

const main = async () => {
  //deploy the fakeNFTMarketplace contract first
  const FakeNFTMarketplaceInstance = await ethers.getContractFactory(
    "FakeNFTMarketPlace"
  );
  const deployedNFTMarketplace = await FakeNFTMarketplaceInstance.deploy();

  await deployedNFTMarketplace.deployed();

  console.log(
    "FakeNFTMarketplace deployed to: ",
    deployedNFTMarketplace.address
  );

  //deploy the main DAO CONTRACT HERE

  const CryptoDevsDAO = await ethers.getContractFactory("CryptoDevsDAO");
  const deployedCryptoDevsDAO = await CryptoDevsDAO.deploy(
    deployedNFTMarketplace.address,
    CRYPTODEVS_NFT_CONTRACT_ADDRESS,
    {
      value: ethers.utils.parseEther("0.5"),
    }
  );

  await deployedCryptoDevsDAO.deployed();

  console.log("CryptoDevs DAO Contract Address", deployedCryptoDevsDAO.address);
};

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
