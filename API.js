const express = require("express");
const Block = require("./CryptoBlock");
const BlockChain = require("./CryptoBlockChain");
const VotesData = require("./VoteData");
const EC = require("elliptic").ec;
const ec = new EC("secp256k1");
const cors = require("cors");

const {
  vote,
  countVote,
  fetchBlockChain,
  fetchPendingVotes,
  fetchMinner,
} = require("./Methods");

const app = express();

app.use(express.json()); // Use express.json() middleware to parse JSON requests
app.use(cors()); // Use cors middleware
/* ***************************************************************************************
Cautions : Afer the every api call the changes in the db.json , Is not directly
              Reflected in the CryptoBlockChain Class Therefore the server should
              not be able to perform the futher actions depending on that change
              data. 
              Therefore the server should be restarted or the block chain should refetch 
              After any changes/ API calls
@
  @
    @
      @
        @  For Avoiding the server from restarting refectch the specific data 
           And Preform Re-Assignment Opreation On The Class 
           Very Important  
        // Fetch updated pendingVoting data after creating a vote
        console.log("Fetching updated pendingVoting data...");
        pendingVoting = await fetchPendingVotes();
        evm = new BlockChain(blockchainData, pendingVoting, minners);
        // console.log("Updated blockchain data:", pendingVoting);
**************************************************************************************** */
(async () => {
  try {
    let blockchainData = await fetchBlockChain();
    let pendingVoting = await fetchPendingVotes();
    let minners = await fetchMinner();
    const block = new Block(1, "01/01/2024", "Initail Block in the chain", "0");
    let evm = new BlockChain(blockchainData, pendingVoting, minners);
    if (evm.blockchain[0] === undefined || null) {
      fetch("http://localhost:9090/blockchain", {
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
          console.log(
            "API.JS Line No 61 : New Genesis Block added successfully: jsonData OK"
          );
        })
        .catch((error) => {
          console.log("API .js Line No 64 : Error adding new block:", error);
        });
    }
    // 1. For Creating Vote
    app.post("/createVote", async function (req, res) {
      let votes = req.body;
      let { voterID, candidateID, authority } = votes;
      let pendVoting = evm.pendingVoting.find(
        (element) => element.voterID === voterID
      );
      if (!pendVoting) {
        await evm.createVoting(vote(voterID, candidateID, authority));
        res.status(200).send(JSON.stringify(votes));
        // Fetch updated pendingVoting data after creating a vote
        console.log("Fetching updated pendingVoting data...");
        pendingVoting = await fetchPendingVotes();
        evm = new BlockChain(blockchainData, pendingVoting, minners);
        // console.log("Updated blockchain data:", pendingVoting);
      } else {
        console.log(
          "!!!!!!!!!!!!!! API.JS Line No : 68 : Voter Is Malpracticing !!!!!!!!!!!!!!!!!"
        );
        res
          .status(401)
          .send("!!!!!!!!!!!!!! Voter Is Malpracticing !!!!!!!!!!!!!!!!!");
      }
    });
    //http://localhost:5000/createMinner
    // 2. For Creating Minner
    app.post("/createMinner", async function (req, res) {
      let { minnerID } = req.body;
      evm.addMinner(minnerID);
      res.status(200).send(JSON.stringify(req.body));
      // Fetch updated minner data after creating minner
      console.log("Fetching updated pendingVoting data...");
      minners = await fetchMinner();
      evm = new BlockChain(blockchainData, pendingVoting, minners);
    });

    // 3. For Minning Pending Voting Using Minnner ID
    app.post("/miningPendingVoting/:ID", async function (req, res) {
      try {
        minners = await fetchMinner();
        pendingVoting = await fetchPendingVotes();
        evm = new BlockChain(blockchainData, pendingVoting, minners);
        let { ID } = req.params;
        console.log(ID);
        let minnersData = evm.minners;
        // console.log(minnersData);

        let findMinners = minnersData.find((minner) => minner.minnerID === ID);
        let vote = evm.pendingVoting.find(
          (ele) => ele.authority === findMinners.minnerID || null
        );
        console.log("vote : ", vote);

        // console.log("votevotevotevotevote", vote);
        if (findMinners && vote) {
          if (evm.pendingVoting.length != 0 && vote != undefined) {
            evm.miningPendingVoting(ID, vote);
            console.log("API.js Line No 85 Successfully Minned : " + ID);
            res.status(201).json({ success: "Successfully Minned" }); // Use .send() correctly
            // Fetch updated minner data after mined pending votes
            console.log("Fetching updated minners && blockchainData  data...");
            minners = await fetchMinner();
            pendingVoting = await fetchPendingVotes();
            evm = new BlockChain(blockchainData, pendingVoting, minners);
          } else if (evm.pendingVoting.length == 0) {
            console.log("No Pending Voting Remain");
            res.status(401).send("No Pending Voting Remain");
          } else {
            console.log("!!!!!!!! Vote Belongs To Other Minners !!!!!!!!!!!");
            res
              .status(401)
              .send("!!!!!!!! Vote Belongs To Other Minners !!!!!!!!!!!");
          }
        } else if (vote == undefined && !findMinners) {
          console.log("Unauthorized Access");
          res.status(401).send("Unauthorized Access");
        } else if (findMinners) {
          console.log("Minner Has No Pending Votes of his bussiness To Mine");
          res
            .status(401)
            .send("Minner Has No Pending Votes of his bussiness To Mine");
        }
      } catch (e) {
        console.log(e);
      }
    });

    // 4. For Genrate Voting Credit Using Minner ID
    app.post("/generateVotingCredit/:ID", async function (req, res) {
      minners = await fetchMinner();
      pendingVoting = await fetchPendingVotes();
      evm = new BlockChain(blockchainData, pendingVoting, minners);
      let { ID } = req.params;
      let minnersData = evm.minners;
      // console.log(minnersData);
      let findMinners = minnersData.find((minner) => minner.minnerID === ID);
      console.log(
        "findMinners.minnerData.length",
        findMinners.minnerData.length
      );
      console.log("findMinners.credits", findMinners.credits);
      if (findMinners.minnerData.length === findMinners.credits) {
        console.log(
          `!!!!!!!!!!!!!! Work is over for minner ${findMinners.minnerID} !!!!!!!!!!!!!!!!`
        );
        res.status(401).json({
          error: `!!!!!!!!!!!!!! Work is over for minner ${findMinners.minnerID} !!!!!!!!!!!!!!!!`,
        });
      }
      if (!findMinners) {
        console.log("No Minners found of ID :" + ID);
        res.status(401).json({
          error: `Unauthorized Access ! " + "No Minners found of ID : ${ID}`,
        });
      } else if (
        findMinners &&
        findMinners.minnerData.length !== findMinners.credits
      ) {
        await evm.generateVotingCredit(ID);
        res.status(201).json({ success: "Successfully Minned" }); // Use .send() correctly
        // Fetch updated minner data after creating genrate vote credit
        console.log("Fetching updated minners && blockchainData  data...");
        minners = await fetchMinner();
        pendingVoting = await fetchPendingVotes();
        blockchainData = await fetchBlockChain();
        evm = new BlockChain(blockchainData, pendingVoting, minners);
      }
    });

    // 5. For Checking Block Chain Is Valid
    app.get("/CheckBlockChainIsValid", async (req, res) => {
      try {
        let validity = await evm.checkChainVaildity();
        let msg = `BlockChain Is Valid : ${validity}`;
        if (validity) {
          console.log("@ : ", msg);
          res.status(200).send({ msg: "@ : " + msg });
        } else {
          console.log("# : ", msg);
          res.status(401).json({ msg: "# : " + msg });
        }
      } catch (e) {
        console.log("API.js : Line No 96 : ", String(e));
        res.status(500).send(String(e));
      }
    });

    // 6. For Counting The Votes Of Candidates Using CandidateID
    // console.log(evm.blockchain);
    let plainBlockChain = evm.blockchain.map((data) => Object.assign({}, data));
    app.get("/CountVote/:CandidateID", async (req, res) => {
      let { CandidateID } = req.params;
      console.log("candidateID", CandidateID);
      let votes = countVote(plainBlockChain.slice(1), CandidateID);
      console.log("votes", votes);
      if (votes) {
        console.log("votes", votes);
        res.status(200).json({
          msg: `The Total Votes Of Candidate ID : ${CandidateID} `,
          count: Number(votes),
        });
      } else {
        res.send("No Candidate Found Of This ID");
      }
    });

    // 6. Fetch Miner Details
    app.post("/fetchMinner/:ID", async function (req, res) {
      let { ID } = req.params;
      let minner = await fetchMinnerFromArray(ID, minners); // Pass minners here
      let minnerArrayLen = minner.minnerData.length;
      if (minner) {
        res.status(200).json({
          pendingVoting: minnerArrayLen,
          credits: minner.credits,
        });
        return;
      } else {
        res.status(404).json({ error: "Miner not found" });
      }
    });

    async function fetchMinnerFromArray(minnerID, minners) {
      let miner = minners.find((miner) => miner.minnerID === minnerID);
      return miner;
    }
  } catch (error) {
    console.log("Error:", error);
  }
})();

app.get("/", async function (req, res) {
  let blockChain = await fetchBlockChain();
  console.log(blockChain);
  res.status(200).json(blockChain);
});
/*
json-server --watch db.json --port 9090
*/
app.listen(5000, (err) => {
  if (err) {
    console.log(err);
  } else {
    console.log("listening on port 5000");
  }
});
