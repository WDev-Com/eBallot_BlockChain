("use strict");
const crypto = require("crypto");
const SHA256 = (data) => crypto.createHash("sha256").update(data).digest("hex");
const VotesData = require("./VoteData");
// Single Block Class Definition
class CryptoBlock {
  constructor(id, timestamp, VoterData, previousHash = " ") {
    this.id = id;
    this.timestamp = timestamp;
    this.VoterData = VoterData;
    this.previousHash = previousHash;
    this.hash = this.computeHash();
    this.nonce = 0;
  }

  computeHash() {
    return SHA256(
      this.timestamp +
        JSON.stringify(this.VoterData) +
        this.previousHash +
        this.nonce
    ).toString();
  }

  proofOfWork(difficulty) {
    while (
      this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")
    ) {
      this.nonce++;
      this.hash = this.computeHash();
    }
  }
  //////////////////////////// Promblem is here
  hasValidVote() {
    let vote = new VotesData(
      this.VoterData.fromAddress,
      this.VoterData.voterID,
      this.VoterData.candidateID,
      this.VoterData.voted,
      this.VoterData.authority,
      this.VoterData.signature
    );

    // console.log("this.VoterData.signature ====>", this.VoterData.signature);
    // console.log("\n From CB Line no 36----------------->", vote);
    if (!vote.isValid()) {
      return false;
    }
    return true;
  }
}

module.exports = CryptoBlock;
