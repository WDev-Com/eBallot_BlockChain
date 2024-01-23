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

**************************************************************************************** */
(async () => {
  try {
    let blockchainData = await fetchBlockChain();
    const pendingVoting = await fetchPendingVotes();
    const minners = await fetchMinner();
    const block = new Block(1, "01/01/2024", "Initail Block in the chain", "0");
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
          console.log("New Genesis Block added successfully: jsonData OK");
        })
        .catch((error) => {
          console.log("Index.js Line No 79 : Error adding new block:", error);
        });
    }
    // 1. For Creating Vote
    app.post("/createVote", async function (req, res) {
      let votes = req.body;
      let { voterID, candidateID, authority } = votes;
      await evm.createVoting(vote(voterID, candidateID, authority));
      res.send(JSON.stringify(votes));
      //////////// Refetching the block chain
      blockchainData = await fetchBlockChain();
    });

    // 2. For Creating Minner
    app.post("/createMinner", async function (req, res) {
      let { minnerID } = req.body;
      await evm.addMinner(minnerID);
      res.status(200).send(JSON.stringify(req.body));
      //////////// Refetching the block chain
      blockchainData = await fetchBlockChain();
    });

    // 3. For Minning Pending Voting Using Minnner ID
    app.post("/miningPendingVoting/:ID", async function (req, res) {
      let { ID } = req.params;
      console.log(ID);

      let minnersData = evm.minners;
      // console.log(minnersData);
      let findMinners = minnersData.find((minner) => minner.minnerID === ID);
      let vote = evm.pendingVoting.find(
        (ele) => ele.authority === findMinners.minnerID
      );
      console.log("votevotevotevotevote", vote);
      if (findMinners) {
        if (evm.pendingVoting.length != 0 && vote != undefined) {
          await evm.miningPendingVoting(ID, vote);
          console.log("API.js Line No 85 Successfully Minned : " + ID);
          res.status(201).send("Successfully Minned : " + ID); // Use .send() correctly
          //////////// Refetching the block chain
          blockchainData = await fetchBlockChain();
        } else if (evm.pendingVoting.length == 0) {
          console.log("No Pending Voting Remain");
          res.status(401).send("No Pending Voting Remain");
        } else {
          console.log("!!!!!!!! Vote Belongs To Other Minners !!!!!!!!!!!");
          res
            .status(401)
            .send("!!!!!!!! Vote Belongs To Other Minners !!!!!!!!!!!");
        }
      } else {
        console.log("Unauthorized Access");
        res.status(401).send("Unauthorized Access");
      }
    });

    // 4. For Genrate Voting Credit Using Minner ID
    app.post("/generateVotingCredit/:ID", async function (req, res) {
      let { ID } = req.params;
      let minnersData = evm.minners;
      // console.log(minnersData);
      let findMinners = minnersData.find((minner) => minner.minnerID === ID);
      // console.log(findMinners);
      if (!findMinners) {
        console.log("No Minners found of ID :" + ID);
        res
          .status(401)
          .send("Unauthorized Access ! " + "No Minners found of ID :" + ID);
      } else if (
        findMinners &&
        findMinners.minnerData.length !== findMinners.credits
      ) {
        await evm.generateVotingCredit(ID);
        res.status(201).send("Successfully Minned : " + ID); // Use .send() correctly
        //////////// Refetching the block chain
        blockchainData = await fetchBlockChain();
      } else {
        console.log(
          `!!!!!!!!!!!!!! Work is over for minner ${findMinners.minnerID} !!!!!!!!!!!!!!!!`
        );
        res
          .status(401)
          .send(
            `!!!!!!!!!!!!!! Work is over for minner ${findMinners.minnerID} !!!!!!!!!!!!!!!!`
          );
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
    let plainBlockChain = evm.blockchain.map((data) => Object.assign({}, data));
    app.get("/CountVote/:CandidateID", async (req, res) => {
      let { CandidateID } = req.params;
      let votes = countVote(plainBlockChain.slice(1), CandidateID);
      if (votes) {
        res.status(200).json({
          msg: `The Total Votes Of Candidate ID : ${CandidateID} `,
          count: Number(votes),
        });
      } else {
        res.send("No Candidate Found Of This ID");
      }
    });
  } catch (error) {
    console.log("Error:", error);
  }
})();

app.get("/", async function (req, res) {
  let blockChain = await fetchBlockChain();
  res.json(blockChain);
});

app.listen(5000, (err) => {
  if (err) {
    console.log(err);
  } else {
    console.log("listening on port 5000");
  }
});
