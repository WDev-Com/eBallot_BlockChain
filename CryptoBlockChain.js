const Block = require("./CryptoBlock");
const VotesData = require("./VoteData");
const EC = require("elliptic").ec;
const ec = new EC("secp256k1");

// Chaining Class Definition
class CryptoBlockChain {
  constructor(blockchain, pendingVoting, minners) {
    this.blockchain = blockchain;
    this.difficulty = 4;
    this.pendingVoting = pendingVoting;
    this.minners = minners;
    this.miningReward = 1;
  }
  startGenesisBlock() {
    return new Block(1, "01/01/2024", "Initail Block in the chain", "0");
  }

  obtainLastBlock() {
    return this.blockchain[this.blockchain.length - 1];
  }

  // addnewBlock replace by miningPendingVoting
  /*addnewBlock(newBlock) {
    newBlock.previousHash = this.obtainLastBlock().hash;
    newBlock.hash = newBlock.computeHash();
    newBlock.proofOfWork(this.difficulty);
    this.blockchain.push(newBlock);
  }*/

  addMinner(minnerAddress) {
    //////////////// Posting The Block //////////////////
    let existingMiner = this.minners.find(
      (miner) => miner.minnerID === minnerAddress
    );
    // console.log(
    //   "Line 38 ---------> ",
    //   existingMiner ? existingMiner.minnerID : "Miner not found"
    // );
    if (!existingMiner) {
      fetch("http://localhost:3000/minners", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          minnerID: minnerAddress,
          minnerData: [],
          credits: 0,
        }),
      })
        .then((response) => response.text())
        .then((data) => {
          // console.log("Raw response from server:", data);
          console.log("Raw response from server: data OK");
          const jsonData = JSON.stringify(data);
          // console.log("New block added successfully:", jsonData);
          console.log("New block added successfully: jsonData OK");
        })
        .catch((error) => {
          console.log("Error adding new block:", error);
        });
    } else {
      throw new Error(" Minner Already Exists ");
    }
    //////////////// Posting The Block //////////////////
    // this.minners.push({ minnerID: minnerAddress, minnerData: [], credits: 0 });
  }

  miningPendingVoting(minnerAddress) {
    if (this.pendingVoting.length !== 0) {
      let minner = this.minners.find((ele) => ele.minnerID === minnerAddress);
      if (minner === undefined) {
        console.log("Unauthorized Access To Method");
      } else if (minner.minnerID === minnerAddress) {
        if (this.blockchain.length > 0) {
          let vote = this.pendingVoting.find(
            (ele) => ele.authority === minnerAddress
          );
          // console.log("Dada", vote);
          fetch(`http://localhost:3000/pendingVoting/${vote.id}`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
          })
            .then((response) => response.text())
            .then((data) => {
              // console.log("Raw response from server:", data);
              console.log("Raw response from server: data OK ");
              const jsonData = JSON.stringify(data);
              // console.log("Record deleted successfully:", jsonData);
              console.log("Record deleted successfully: jsonData OK ");
            })
            .catch((error) => {
              console.log("Error deleting record:", error);
            });
          delete vote.id;
          let idGenerator = Math.random() * this.blockchain.length + 1;
          let block = new Block(
            idGenerator,
            Date.now().toString(),
            vote,
            this.obtainLastBlock().hash
          );
          // Set the previousHash before calling proofOfWork
          // console.log(
          //   "Line no 50 this.obtainLastBlock().hash",
          //   this.obtainLastBlock().hash
          // );
          block.previousHash = this.obtainLastBlock().hash;
          block.proofOfWork(this.difficulty);
          minner.minnerData.push(block);
        }
      } else {
        console.log("CryptoBlockchain Line No 109 BlockChain is empty.");
      }
      console.log("Line No : 111 CBC > Block Mined Successfully");
    } else {
      console.log("CBC Line No : 122 > No pending votes");
    }
  }

  /////////////////////////////////////////////////////
  createVoting(voteData) {
    if (!voteData.voterID || !voteData.candidateID) {
      throw new Error("Vote must include voterID and to CandiateID");
    }
    // Verify the transactiion
    if (!voteData.isValid()) {
      throw new Error("Cannot add invalid Vote to chain");
    }

    // Create a new function to check the vote is already in the chain
    for (let vote of this.blockchain) {
      if (vote.VoterData.voterID === voteData.voterID) {
        throw new Error(
          "!!!!!!!!!!!!!! Line No : 140 : Vote Is Already Voted #  Voter Is Malpracticing !!!!!!!!!!!!!!!!!"
        );
      }
    }

    let pendVoting = this.pendingVoting.find(
      (element) => element.voterID === voteData.voterID
    );
    if (pendVoting === undefined) {
      fetch("http://localhost:3000/pendingVoting", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(voteData),
      })
        .then((response) => response.text())
        .then((data) => {
          // console.log("Raw response from server:", data);
          const jsonData = JSON.stringify(data);
          // console.log("New block added successfully:", jsonData);
          console.log("New block added successfully: jsonData OK ");
        })
        .catch((error) => {
          console.log("Error adding new block:", error);
        });
      // this.pendingVoting.push(voteData);
      // console.log("Line No 94 CBC : voteData : ", voteData);
    } else {
      console.log(
        "!!!!!!!!!!!!!! Line No : 169 : Voter Is Malpracticing !!!!!!!!!!!!!!!!!"
      );
    }
  }

  generateVotingCredit(MinnerID) {
    let minnerNow = this.minners.find((ele) => ele.minnerID === MinnerID);
    if (minnerNow === undefined) {
      console.log("CBC Line No : 177 : UnAuthorized Access To Method");
    } else {
      // console.log("---------Section 1 Line no 179---------------", minnerNow);
      // let plainObjects = minnerNow.minnerData.map((minnerData) =>
      //   Object.assign({}, minnerData)
      // );
      // console.log("---------Section 2 Line no 183---------------");
      // console.log(plainObjects);
      // console.log("---------Section 3 CBC Line no 185---------------");

      // console.log(minnerNow.minnerData);

      // console.log("---------Section 4 Line no 189 START---------------");
      for (let minData of minnerNow.minnerData) {
        let votsData = Object.assign({}, minData.VoterData);
        console.log("TEST ::::::::::::::: ", votsData.authority);
        if (minnerNow.credits === minnerNow.minnerData.length) {
          console("Work is over");
        } else if (votsData.authority === MinnerID) {
          minnerNow.credits += 1;
          let { timestamp, VoterData, previousHash } = minData;
          let block = new Block();
          block.timestamp = timestamp;
          block.VoterData = VoterData;
          block.previousHash = this.obtainLastBlock().hash;
          block.proofOfWork(this.difficulty);

          // this.blockchain.push(block);
          //////////////// Posting The Block //////////////////
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
              console.log("Error adding new block:", error);
            });

          //////////////// Posting The Block //////////////////
        } else {
          console.log("Line no 225 CBC : This minner has no authority");
        }
      }
      // console.log("---------Section 4 CBC Line no 140 ENDS---------------");
    }
  }

  ////////// Check For Valid Reletion Between Blocks
  checkChainVaildity() {
    const realGenesis = JSON.stringify(this.startGenesisBlock());
    // console.log(realGenesis);
    if (realGenesis !== JSON.stringify(this.blockchain[0])) {
      console.log("Checking Chain Validity A");
      return false;
    }

    for (let i = 1; i < this.blockchain.length; i++) {
      const currrBlock = this.blockchain[i];
      const prevBlock = this.blockchain[i - 1];

      // console.log(
      //   "currrBlock.previousHash : ",
      //   currrBlock.previousHash,
      //   "prevBlock.hash : ",
      //   prevBlock.hash
      // );

      if (currrBlock.previousHash !== prevBlock.hash) {
        console.log("Checking Chain Validity 2");
        return false;
      }
    }

    for (let i = 1; i < this.blockchain.length; i++) {
      const currrBlock = new Block(
        this.blockchain[i].id,
        this.blockchain[i].timestamp,
        this.blockchain[i].VoterData,
        this.blockchain[i].previousHash
      );
      // Call computeHash method for each new block
      currrBlock.proofOfWork(this.difficulty);
      // Check the remaining blocks on the chain to see if their hashes and
      // console.log("currrBlock.hash: ", currrBlock.hash);
      // console.log("currrBlock.computeHash() : ", currrBlock.computeHash());
      // console.log("CBC Line no 270 ---------------> currrBlock", currrBlock);
      if (!currrBlock.hasValidVote()) {
        return false;
      }

      if (currrBlock.hash !== currrBlock.computeHash()) {
        console.log("Checking Chain Validity 1");
        return false;
      }
    }

    return true;
  }
}

module.exports = CryptoBlockChain;
