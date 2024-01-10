const Block = require("./CryptoBlock");
const BlockChain = require("./CryptoBlockChain");
const VotesData = require("./VoteData");
const EC = require("elliptic").ec;
const ec = new EC("secp256k1");

const vote = (voterID, CandiateID, Auth) => {
  const mykey = ec.keyFromPrivate(voterID.concat("DADA"));
  const myPublicKey = mykey.getPublic("hex");
  let BallotVote = new VotesData(myPublicKey, voterID, CandiateID, 1, Auth);
  BallotVote.signVote(mykey);
  return BallotVote;
};

///////////////////// Fetching BlockChain From Network //////////////////////
const fetchBlockChain = async () => {
  try {
    const response = await fetch("http://localhost:3000/blockchain");
    const data = await response.json();
    // console.log("Blockchain data:", data); // Add this line
    console.log("Blockchain data fetched successfully");
    return data;
  } catch (error) {
    console.log("Error fetching blockchain:", error);
    throw error;
  }
};

const fetchMinner = async () => {
  try {
    const response = await fetch("http://localhost:3000/minners");
    const data = await response.json();
    // console.log("Blockchain data:", data); // Add this line
    return data;
  } catch (error) {
    console.log("Error fetching blockchain:", error);
    throw error;
  }
};

const fetchPending = async () => {
  try {
    const response = await fetch("http://localhost:3000/pendingVoting");
    const data = await response.json();
    // console.log("Blockchain data:", data); // Add this line
    return data;
  } catch (error) {
    console.log("Error fetching blockchain:", error);
    throw error;
  }
};
// Usage example with async/await
(async () => {
  try {
    let blockchainData = await fetchBlockChain();
    const pendingVoting = await fetchPending();
    const minners = await fetchMinner();
    // console.log("fetchBlockChain : ", blockchainData);
    const block = new Block(1, "01/01/2024", "Initail Block in the chain", "0");
    // console.log(block);
    // You can also perform other operations with the cryptoBlockChain instance
    const evm = new BlockChain(blockchainData, pendingVoting, minners);
    if (evm.blockchain[0] === undefined || null) {
      fetch("http://localhost:3000/blockchain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(block),
      })
        .then((response) => response.text())
        .then((data) => {
          // console.log("Raw response from server:", data);
          const jsonData = JSON.stringify(data);
          // console.log("New block added successfully:", jsonData);
          console.log("New block added successfully: jsonData OK");
        })
        .catch((error) => {
          console.log("Index.js Line No 79 : Error adding new block:", error);
        });
    }

    // console.log("evm.blockchain : ", evm.blockchain[0]);

    // Access the blockchain property outside the class
    // console.log("Index.js Line no 85", evm.blockchain);

    // console.log("BlockChain Is Valid : ",evm.checkChainVaildity());

    ///// For Adding Miner
    // evm.addMinner("BB33");
    //~~~~~~~~~~~~~~~~ Creating voting
    // evm.createVoting(vote("EL22", "AA11", "DD22")); //k
    // evm.createVoting(vote("DD55", "BB11", "DD22")); //k
    // evm.createVoting(vote("ZZ94", "AA11", "BB33")); //k
    // evm.createVoting(vote("UQ56", "BB11", "BB33")); //k
    // evm.createVoting(vote("HH33", "BB11", "DD22")); //k
    // evm.createVoting(vote("BGSE", "BB11", "DD22")); //k
    // evm.createVoting(vote("SSGG", "BB11", "DD22"));
    // evm.createVoting(vote("FFSS", "BB11", "BB33"));
    // evm.createVoting(vote("LLAA", "BB11", "BB33"));
    // evm.createVoting(vote("BBDE", "BB11", "DD22"));
    // console.log("Line no 97 index evm.pendingVoting", evm.pendingVoting);
    // console.log("Minner Data : Line No  98 Index.js : ", evm.minners);

    //~~~~~~~~~~~~~~~~ Minning Should be done one completed after that mine other vote~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
    //~~~~~~~~~~~~~~~~ You Need to call this function multiple times for mining all votes
    // evm.miningPendingVoting("DD22");

    // evm.miningPendingVoting("BB33");

    ///~~~~~~~~~~~~~~~~  Genrate Voting Should be done after minning is done ~~~~~~~~~~~~~~~~

    // await evm.generateVotingCredit("DD22");

    // evm.generateVotingCredit("BB33");

    // console.log(
    //   "---------Section evm.pendingVoting Line no 228 START---------------"
    // );
    // console.log("Pending Voting For mining", evm.pendingVoting);
    // console.log(
    //   "---------Section evm.pendingVoting Line no 232 ENDS---------------"
    // );
    // console.log(
    //   "---------Section evm.blockchain Line no 234 START---------------"
    // );

    // console.log("Index.js Line no 80 BlockChain", evm.blockchain);

    // console.log(
    //   "---------Section evm.blockchain Line no 236 ENDS---------------"
    // );

    const countVote = (Data, candidateID) => {
      const res = Data.reduce((accum, ele) => {
        let curr = Object.assign({}, ele.VoterData);
        // console.log(curr);
        if (curr.candidateID == candidateID) {
          accum = accum + 1;
        }
        return accum;
      }, 0);
      return res;
    };

    let plainBlockChain = evm.blockchain.map((data) => Object.assign({}, data));

    console.log("BlockChain Is Valid : ", evm.checkChainVaildity());
    console.log(
      "Vote Count of Candiate AA11",
      countVote(plainBlockChain.slice(1), "AA11")
    );
    console.log(
      "Vote Count of Candiate BB11",
      countVote(plainBlockChain.slice(1), "BB11")
    );
  } catch (error) {
    console.log("Error:", error);
  }
})();
