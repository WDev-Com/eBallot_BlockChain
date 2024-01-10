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
          console.log(
            "CBC Line No 53 : While Post Creating New Minner Error adding new block:",
            error
          );
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
      let vote = this.pendingVoting.find(
        (ele) => ele.authority === minnerAddress
      );
      if (minner === undefined) {
        console.log("Unauthorized Access To Method");
        //////// Add Condition Here To Intercept the minners votes data is over
      } else if (vote === undefined) {
        throw Error("!!!!!!!! Vote Belongs To Other Minners !!!!!!!!!!!");
        // console.log(
        //   "!!! CBC Line No 81 : !!!!! Vote Belongs To Other Minners !!!!!!!!!!!"
        // );
      } else if (minner.minnerID === minnerAddress && vote !== undefined) {
        if (this.blockchain.length > 0) {
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
          // let idGenerator = Math.random() * this.blockchain.length + 1;
          // let block = new Block(
          //   idGenerator,
          //   Date.now().toString(),
          //   vote,
          //   this.obtainLastBlock().hash
          // );
          // Set the previousHash before calling proofOfWork
          // console.log(
          //   "Line no 50 this.obtainLastBlock().hash",
          //   this.obtainLastBlock().hash
          // );
          // block.previousHash = this.obtainLastBlock().hash;
          // block.proofOfWork(this.difficulty);
          // let { minnerID, minnerData, credits, id } = minner;
          minner.minnerData.push(vote);
          //////////////////////// WORK IN PROGRESS !!!!!!!!!!!!!!!!!!!!!!!!!!!
          // console.log("credits-------------->", minner);
          if (minner.id) {
            fetch(`http://localhost:3000/minners/${minner.id}`, {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(minner),
            })
              .then((response) => response.text())
              .then((data) => {
                // console.log("Raw response from server:", data);
                console.log("Raw response from server: data OK");
                const jsonData = JSON.stringify(data);
                // console.log("New block added successfully:", jsonData);
                console.log("New block added successfully: OK", jsonData);
              })
              .catch((error) => {
                console.log(
                  "CBC Line No : 132 : While Patch Error  Adding Vote Data To Minner DataBase:",
                  error
                );
              });
          }
          // minner.minnerData.push(block);
        }
      } else {
        console.log("CryptoBlockchain Line No 109 BlockChain is empty.");
      }
      console.log("Line No : 111 CBC > Block Mined Successfully");
    } else {
      console.log("CBC Line No : 122 > No pending votes");
    }
  }

  /////////////////////////////////////////////////////  Create a new vote
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
          console.log(
            "CBC Line No 184 : While Post Vote Or Creating New Vote Error adding new block:",
            error
          );
        });
      // this.pendingVoting.push(voteData);
      // console.log("Line No 94 CBC : voteData : ", voteData);
    } else {
      console.log(
        "!!!!!!!!!!!!!! Line No : 169 : Voter Is Malpracticing !!!!!!!!!!!!!!!!!"
      );
    }
  }

  /////////////// To generate the credits for the miners
  async generateVotingCredit(MinnerID) {
    let minnerNow = this.minners.find((ele) => ele.minnerID === MinnerID);

    if (!minnerNow) {
      console.log("CBC Line No : 177 : Unauthorized Access To Method");
      return;
    }
    // console.log("minnerNow-------->", minnerNow);
    if (minnerNow.minnerData.length !== minnerNow.credits) {
      let votsData = Object.assign({}, minnerNow.minnerData[minnerNow.credits]);

      if (votsData.authority === MinnerID) {
        // Increment the credits
        minnerNow.credits += 1;

        let idGenerator = Math.random() * this.blockchain.length + 1;
        let block = new Block(
          idGenerator,
          Date.now().toString(),
          votsData,
          this.obtainLastBlock().hash
        );
        // Set the previousHash before calling proofOfWork
        block.previousHash = this.obtainLastBlock().hash;
        block.proofOfWork(this.difficulty);

        try {
          let response = await fetch("http://localhost:3000/blockchain", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(block),
          });

          if (response.status === 200) {
            console.log("New block added successfully");
          } else {
            console.log(
              "CBC Line No 245 : if response.status Error adding new block:",
              await response.text()
            );
          }
        } catch (error) {
          console.log(
            "CBC Line No : 251 : POST Block To BlockChain Error adding new block:",
            error
          );
        }
      } else {
        console.log("Line no 251 CBC: This minner has no authority");
      }
    } else {
      console.log(
        `!!!!!!!!!!!!!! Work is over for minner ${minnerNow.minnerID} !!!!!!!!!!!!!!!!`
      );
    }

    try {
      //await
      let minnerUpdateResponse = fetch(
        `http://localhost:3000/minners/${minnerNow.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(minnerNow),
        }
      );

      if (minnerUpdateResponse.status === 200) {
        console.log("Minner credits updated successfully");
      } else {
        console.log(
          "Error updating minner minnerUpdateResponse.status:",
          minnerUpdateResponse
        );
      }
    } catch (error) {
      console.log("Error updating minner credits:", error);
    }
  }

  //// Check the Validation status of the BlockChain
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
