import Head from "next/head";
import React, { useState, useEffect, useRef } from "react";
import { BigNumber, Contract, providers, utils } from "ethers";
import Web3Modal from "web3modal";
import { formatEther } from "ethers/lib/utils";
import {
  CRYPTODEVS_NFT_ABI,
  NFT_CONTRACT_ADDRESS,
  CRYPTODEVS_DAO_CONTRACT_ABI,
  CRYPTODEVS_DAO_CONTRACT_ADDRESS,
} from "../constants";
import styles from "../styles/Home.module.css";

export default function Home() {
  const [treasuryBalance, setTreasuryBalance] = useState("0");
  const [numProposals, setNumProposals] = useState("0");
  const [proposals, setProposals] = useState([]);
  const [nftBalance, setNftBalance] = useState(0);
  const [fakeNftTokenId, setFakeNftTokenId] = useState("");
  const [loading, setLoading] = useState(false);
  const [walletConnected, setWalletConnected] = useState(false);
  //create proposal or view proposal///which of the tabs is selected
  const [selectedTab, setSelectedTab] = useState("");
  const web3ModalRef = useRef();

  //start writing of the functionality

  //get the provider or signer and connect your injected wallet through the useRef(
  const getProviderOrSigner = async (needSigner = false) => {
    try {
      const provider = await web3ModalRef.current.connect();

      const web3Provider = new providers.Web3Provider(provider);

      const { chainId } = await web3Provider.getNetwork();

      if (chainId !== 4) {
        window.alert("Please switch to the Rinkeby network");
        throw new Error("Please switch to the Rinkeby network");
      }

      if (needSigner) {
        const signer = await web3Provider.getSigner();
        return signer;
      }

      return web3Provider;
    } catch (err) {
      console.error(err.message);
    }
  };

  const connectWallet = async () => {
    try {
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (err) {
      console.error(err.message);
    }
  };

  const getCryptodevsNFTContractInstance = (providerOrSigner) => {
    return new Contract(
      NFT_CONTRACT_ADDRESS,
      CRYPTODEVS_NFT_ABI,
      providerOrSigner
    );
  };
  const getCryptodevsDAOContractInstance = (providerOrSigner) => {
    return new Contract(
      CRYPTODEVS_DAO_CONTRACT_ADDRESS,
      CRYPTODEVS_DAO_CONTRACT_ABI,
      providerOrSigner
    );
  };

  const getDAOTreasuryBalance = async () => {
    try {
      const provider = await getProviderOrSigner();
      const balance = await provider.getBalance(
        CRYPTODEVS_DAO_CONTRACT_ADDRESS
      );
      setTreasuryBalance(balance);
    } catch (err) {
      console.error(err);
    }
  };

  const numOfProposalInDAO = async () => {
    try {
      const provider = await getProviderOrSigner();
      const daoInstance = getCryptodevsDAOContractInstance(provider);
      const currentNumOfProposal = await daoInstance.numProposals();
      setNumProposals(currentNumOfProposal.toString());
    } catch (err) {
      console.error(err.message);
    }
  };

  const getUserNFTBalance = async () => {
    try {
      const provider = await getProviderOrSigner()
      const nftContractIns = getCryptodevsNFTContractInstance(provider);
      const signer = await getProviderOrSigner(true);
      const address = await signer.getAddress()
      const nftBalance = await nftContractIns.balanceOf(address);
      setNftBalance(parseInt(nftBalance.toString()));
    } catch (err) {
      console.error(err.message);
    }
  };

  const createProposal = async (fakeNftTokenId) => {
    try {
      const signer = await getProviderOrSigner(true);
      const daoInstance = getCryptodevsDAOContractInstance(signer);
      const txn = await daoInstance.createProposal(fakeNftTokenId);
      setLoading(true);
      await txn.wait();
      await numOfProposalInDAO();
      setLoading(false);
    } catch (error) {
      console.error(error.message);
      window.alert(error.message);
    }
  };

  const fetchProposalById = async (id) => {
    try {
      const provider = await getProviderOrSigner();
      const daoInstance = getCryptodevsDAOContractInstance(provider);
      const proposal = await daoInstance.proposals(id);
      // console.log(proposal);
      const parsedProposal = {
        proposalId: id,
        nftTokenId: proposal.nftTokenId.toString(),
        deadline: new Date(parseInt(proposal.deadline.toString()) * 1000),
        yayVotes: proposal.yayVotes.toString(),
        nayVotes: proposal.nayVotes.toString(),
        executed: proposal.executed,
      };
      console.log(parsedProposal)
      return parsedProposal;
    } catch (error) {
      console.error(error.message);
    }
  };

  const fetchAllProposals = async () => {
    try {
      let proposals = [];
      for (let i = 0; i < numProposals; i++) {
        const proposal = await fetchProposalById(i);
        proposals.push(proposal);
      }
      setProposals(proposals);
      return proposals;
    } catch (error) {
      console.error(error);
    }
  };

  const voteOnProposals = async (proposalId, _vote) => {
    try {
      const signer = await getProviderOrSigner(true);
      const daoInstance = getCryptodevsDAOContractInstance(signer);

      let vote = _vote === "YAY" ? 0 : 1;
      const txn = await daoInstance.voteOnProposal(proposalId, vote);
      setLoading(true);
      await txn.wait();
      setLoading(false);
      await fetchAllProposals();
    } catch (error) {
      console.error(error);
      window.alert(error.data.message);
    }
  };

  const executeProposal = async (proposalIndex) => {
    try {
      const signer = await getProviderOrSigner(true);
      const daoInstance = getCryptodevsDAOContractInstance(signer);
      const txn = await daoInstance.executeProposal(proposalIndex);
      setLoading(true);
      await txn.wait();
      setLoading(false);
      await fetchAllProposals();
    } catch (error) {
      console.error(error);
      window.alert(error.message)
    }
  };

  ///when page loads initially, useEffecrt should take charge
  useEffect(() => {
    if(!walletConnected){
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false
      });

      connectWallet()
      .then(() => {
        getDAOTreasuryBalance();
        getUserNFTBalance();
        numOfProposalInDAO();
      })
    }
  }, [walletConnected])

  useEffect(() => {
    if(selectedTab === "View Proposals"){
      fetchAllProposals()
    }
  }, [selectedTab])

  function renderTabs() {
    if (selectedTab === "Create Proposal") {
      return renderCreateProposalTab();
    } else if (selectedTab === "View Proposals") {
      return renderViewProposalsTab();
    }
    return null;
  }

  function renderCreateProposalTab() {
    if(loading){
      return (
        <div className={styles.description}>
          loading..... waiting for transaction!!!
        </div>
      );
    }
    else if(nftBalance === 0){
      return (
        <div className={styles.description}>
          You do not own any CryptoDevs NFTs <br />
          <b>You cannot create or vote on proposals</b>
        </div>
      )
    }else {
      return (
        <div className={styles.container}>
          <label>
            Fake NFT Token ID to Purchase: 
          </label>
          <input 
          placeholder="0"
          type='number'
          onChange={({target}) => setFakeNftTokenId(BigNumber.from(target.value))}
          />
          <button onClick={() => createProposal(fakeNftTokenId)} className={styles.button2}>
            Create Proposal
          </button>
        </div>
      )
    }
  }

  function renderViewProposalsTab() {
    if(loading){
      return(
        <div className={styles.description}>
          loading....waiting for transaction
        </div>
      )
    }
    else if(proposals.length === 0){
      return (
        <div className={styles.description}>
          No proposals have been created
        </div>
      )
    }
    else {
      return (
        <div>
          {
            proposals.map((unit, index) => (
              <div key={index}>
                <p>Proposal ID: {unit.proposalId}</p>
                <p>Fake NFT to Purchase: {unit.nftTokenId}</p>
                <p>Deadline: {unit.deadline.toLocaleString()}</p>
                <p>Yay Votes: {unit.yayVotes}</p>
                <p>Nay Votes: {unit.nayVotes}</p>
                <p>Executed: {unit.executed.toString()}</p>
                {unit.deadline.getTime() > Date.now() && !unit.executed ? (
                  
                  <div>
                    <button onClick={() => voteOnProposals(unit.proposalId, "YAY")} className={styles.button2}>
                        Vote YAY
                    </button>
                    <button onClick={() => voteOnProposals(unit.proposalId, "NAY")} className={styles.button2}>
                        Vote NAY
                    </button>
                  </div>
                ): unit.deadline.getTime() < Date.now() && !unit.executed ? (
                  <div>
                    <button onClick={() => executeProposal(unit.proposalId)} className={styles.button2}>
                      Execute Proposal{" "}
                      {unit.yayVotes > unit.nayVotes ? "(YAY)" : "(NAY)"}
                    </button>
                  </div>
                ) : (
                  <div className={styles.description}>
                    Proposal Executed
                  </div>
                ) }
              </div>
            ))
          }
        </div>
      )
    }
  }



  return (
    <div>
      <Head>
        <title>CyptoDevs DAO</title>
        <meta
          name="description"
          content="a decentralised autonomous organisation"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={styles.main}>
        <div>
        <h1 className={styles.title}>Welcome to Crypto Devs!</h1>
          <div className={styles.description}>Welcome to the DAO!</div>
          <div className={styles.description}>
            Your CryptoDevs NFT Balance: {nftBalance}
            <br />
            Treasury Balance: {formatEther(treasuryBalance)} ETH
            <br />
            Total Number of Proposals: {numProposals}
          </div>
          <div className={styles.flex}>
            <button
              className={styles.button}
              onClick={() => setSelectedTab("Create Proposal")}
            >
              Create Proposal
            </button>
            <button
              className={styles.button}
              onClick={() => setSelectedTab("View Proposals")}
            >
              View Proposals
            </button>
          </div>
          {renderTabs()}
        </div>
        <div>
          <img className={styles.image} src="/cryptodevs/1.svg" />
        </div>
      </div>
      <footer className={styles.footer}>
        Made with &#10084; by Crypto Devs
      </footer>
    </div>
  );
}
