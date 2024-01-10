("use strict");
const crypto = require("crypto");
const EC = require("elliptic").ec;
const ec = new EC("secp256k1");

class VotesData {
  /**
   * @param {string} voterID
   * @param {string} candidateID
   * @param {number} voted
   * @param {string} authority
   * @param {string} signature
   */
  constructor(fromAddress, voterID, candidateID, voted, authority, signature) {
    this.fromAddress = fromAddress;
    this.voterID = voterID;
    this.candidateID = candidateID;
    this.voted = voted;
    this.authority = authority;
    this.signature = signature;
  }

  calculateHash() {
    return crypto
      .createHash("sha256")
      .update(this.voterID + this.candidateID + this.voted + this.authority)
      .digest("hex")
      .toString();
  }

  signVote(signingKey) {
    if (signingKey.getPublic("hex") !== this.fromAddress) {
      throw new Error("You cannot sign transactions for other wallets!");
    }
    const hashVote = this.calculateHash();
    const sig = signingKey.sign(hashVote, "base64");

    // console.log("VoteData Line no : 36 : Signature Value:", signatureValue);

    this.signature = sig.toDER("hex");
  }

  //////// check the signature of the vote is valid and verify the public of user
  isValid() {
    if (this.fromAddress === null) return true;

    if (!this.signature || this.signature.length === 0) {
      throw new Error("No signature in this transaction");
    }

    const publicKey = ec.keyFromPublic(this.fromAddress, "hex");
    // console.log("Public key: " + JSON.stringify(publicKey));
    return publicKey.verify(this.calculateHash(), this.signature);
  }
}

module.exports = VotesData;
