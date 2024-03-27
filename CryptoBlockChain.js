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
      fetch("http://localhost:9090/minners", {
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
          console.log("New Minner added successfully: jsonData OK");
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

  async miningPendingVoting(minnerAddress, vote) {
    try {
      console.log("vote.voterID", vote.voterID);
      if (this.pendingVoting.length !== 0) {
        let minner = this.minners.find((ele) => ele.minnerID === minnerAddress);

        if (minner === undefined) {
          console.log("Unauthorized Access To Method");
          // Add condition here to intercept when the minner's votes data is over
        } else if (minner.minnerID === minnerAddress) {
          if (this.blockchain.length > 0) {
            try {
              // Use async/await for fetch instead of promise chaining
              const response = await fetch(
                `http://localhost:9090/pendingVoting/${vote.id}`,
                {
                  method: "DELETE",
                  headers: {
                    "Content-Type": "application/json",
                  },
                }
              );

              if (!response.ok) {
                throw new Error(
                  `Failed to delete record. Status: ${response.status}`
                );
              }

              console.log("Record deleted successfully");

              // Delete vote.id property
              delete vote.id;

              // Add vote to minner's data
              minner.minnerData.push(vote);

              if (minner.id) {
                // Update minner data on the server
                const updateResponse = await fetch(
                  `http://localhost:9090/minners/${minner.id}`,
                  {
                    method: "PATCH",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify(minner),
                  }
                );

                if (!updateResponse.ok) {
                  throw new Error(
                    `Failed to update minner data. Status: ${updateResponse.status}`
                  );
                }

                console.log("Minner data updated successfully");
              }
            } catch (error) {
              console.error("Error processing votes:", error);
            }
          } else {
            console.log("CryptoBlockchain Line No 109 BlockChain is empty.");
          }
          console.log("Line No : 111 CBC > Block Mined Successfully");
        }
      } else {
        console.log("CBC Line No : 135 > No pending votes");
      }
    } catch (err) {
      console.log(err);
    }
  }

  /////////////////////////////////////////////////////  Create a new vote
  async createVoting(voteData) {
    try {
      console.log(voteData);
      console.log("$$$$$$$$$$$$$$$$$$$$$$$$$$$", voteData);
      if (!voteData.voterID || !voteData.candidateID) {
        throw new Error("Vote must include voterID and to CandiateID");
      }
      // Verify the transactiion
      if (!voteData.isValid()) {
        throw new Error("Cannot add invalid Vote to chain");
      }
      let voteValid = true;
      // Create a new function to check the vote is already in the chain
      for (let vote of this.pendingVoting) {
        console.log("$$$", vote);
        if (vote.voterID === voteData.voterID) {
          voteValid = false;
          throw new Error(
            "!!!!!!!!!!!!!! Line No : 140 : Vote Is Already Voted #  Voter Is Malpracticing !!!!!!!!!!!!!!!!!"
          );
        }
      }
      console.log("voteValid", voteValid);
      if (voteValid) {
        let { fromAddress, voterID, candidateID, voted, authority, signature } =
          voteData;
        await fetch("http://localhost:9090/pendingVoting", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fromAddress,
            voterID,
            candidateID,
            voted,
            authority,
            signature,
          }),
        })
          .then((response) => response.text())
          .then((data) => {
            // console.log("Raw response from server:", data);
            const jsonData = JSON.stringify(data);
            // console.log("New block added successfully:", jsonData);
            console.log("New Vote added successfully: jsonData OK ");
          })
          .catch((error) => {
            console.log(
              "CBC Line No 184 : While Post Vote Or Creating New Vote Error adding new block:",
              error
            );
          });
        // this.pendingVoting.push(voteData);
        // console.log("Line No 94 CBC : voteData : ", voteData);
      }
    } catch (error) {
      console.log("CBC Line No 183 : ", error);
    }
  }

  /////////////// To generate the credits for the miners
  async generateVotingCredit(MinnerID) {
    let minnerNow = this.minners.find((ele) => ele.minnerID === MinnerID);
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
          let response = await fetch("http://localhost:9090/blockchain", {
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
    }
    try {
      //await
      let minnerUpdateResponse = fetch(
        `http://localhost:9090/minners/${minnerNow.id}`,
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
      // throw new Error
      console.log("Checking Chain Validity : The Genesis Block Is Corrupt");
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
        // throw new Error
        console.log(
          "Checking Chain Validity : Current Block Previous Hash & Previous Block Hash Is Different"
        );
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
        // throw new Error
        console.log("Checking Chain Validity : Not Valid Vote");
        // console.log(currrBlock);
        return false;
      }

      if (currrBlock.hash !== currrBlock.computeHash()) {
        // throw new Error
        console.log(
          "Checking Chain Validity : Current Block Hash & Current Block Compute Hash Is Different"
        );
        return false;
      }
    }

    return true;
  }
}

module.exports = CryptoBlockChain;
