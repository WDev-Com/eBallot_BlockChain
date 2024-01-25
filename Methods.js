const Block = require("./CryptoBlock");
const BlockChain = require("./CryptoBlockChain");
const VotesData = require("./VoteData");
const EC = require("elliptic").ec;
const ec = new EC("secp256k1");

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

const vote = (voterID, CandiateID, Auth) => {
  const mykey = ec.keyFromPrivate(voterID.concat("DADA"));
  const myPublicKey = mykey.getPublic("hex");
  let BallotVote = new VotesData(myPublicKey, voterID, CandiateID, 1, Auth);
  BallotVote.signVote(mykey);
  return BallotVote;
};

///////////////////// Fetching BlockChain From Network START'S //////////////////////
/*const fetchBlockChain = async () => {
  try {
    const response = await fetch("http://localhost:8000/blockchain");
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
    const response = await fetch("http://localhost:8000/minners");
    const data = await response.json();
    // console.log("Blockchain data:", data); // Add this line
    return data;
  } catch (error) {
    console.log("Error fetching blockchain:", error);
    throw error;
  }
};

const fetchPendingVotes = async () => {
  try {
    const response = await fetch("http://localhost:8000/pendingVoting");
    const data = await response.json();
    // console.log("Blockchain data:", data); // Add this line
    return data;
  } catch (error) {
    console.log("Error fetching blockchain:", error);
    throw error;
  }
};
*/

const fetchWithRetry = async (url, maxRetries = 3, retryDelay = 1000) => {
  for (let retry = 0; retry < maxRetries; retry++) {
    try {
      const response = await fetch(url);
      const data = await response.json();
      console.log("Data fetched successfully");
      return data;
    } catch (error) {
      console.error(`Error fetching data (Retry ${retry + 1}):`, error);
      console.error("Error details:", error.message, error.code, error.stack);
      await new Promise((resolve) => setTimeout(resolve, retryDelay));
    }
  }
  throw new Error(`Failed to fetch data after ${maxRetries} retries`);
};

const fetchMinner = async () => {
  const url = "http://localhost:8000/minners";
  return fetchWithRetry(url);
};

const fetchPendingVotes = async () => {
  const url = "http://localhost:8000/pendingVoting";
  return fetchWithRetry(url);
};

const fetchBlockChain = async () => {
  const url = "http://localhost:8000/blockchain";
  return fetchWithRetry(url);
};

module.exports = {
  vote,
  countVote,
  fetchBlockChain,
  fetchPendingVotes,
  fetchMinner,
};
