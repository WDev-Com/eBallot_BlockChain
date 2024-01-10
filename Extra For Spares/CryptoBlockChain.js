class Spare {
  ///////// Check For Valid Reletion Between Blocks
  //////////OLD FUNCTIONS //////////////////////////////////   7-1-2024

  generateVotingCredit(MinnerID) {
    let minnerNow = this.minners.find((ele) => ele.minnerID === MinnerID);
    if (minnerNow === undefined) {
      console.log("CBC Line No : 177 : UnAuthorized Access To Method");
    } else {
      // console.log("CBC Line No 209 :", minnerNow.minnerData[0]);
      //////////////////////// WORK IN PROGRESS !!!!!!!!!!!!!!!!!!!!!!!!!!!
      // for (let minData of minnerNow.minnerData) {
      let count = 0;
      console.log(
        "minnerNow.minnerData.length --->",
        minnerNow.minnerData.length
      );
      while (count < minnerNow.minnerData.length) {
        console.log(
          `minnerNow.minnerData[${count}] :->`,
          minnerNow.minnerData[count]
        );
        let votsData = Object.assign({}, minnerNow.minnerData[count].VoterData);
        console.log("TEST ::::::::::::::: ", votsData.authority);
        if (minnerNow.credits === minnerNow.minnerData.length) {
          console.log(
            "<>",
            minnerNow.credits,
            ">-----<",
            minnerNow.minnerData.length
          );
          console.log("Work is over");
        } else if (votsData.authority === MinnerID) {
          minnerNow.credits += 1;
          let { timestamp, VoterData, previousHash } =
            minnerNow.minnerData[count];
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
            .then((response) => {
              response.text();
              if (response.status === 200) {
                count = count + 1;
              }
            })
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
          //////////////// Updating The Credits //////////////////

          minnerNow.credits = minnerNow.credits + 1;
          fetch(`http://localhost:3000/minners/${minnerNow.id}`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(minnerNow),
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
              console.log("Error adding new block:", error);
            });
          //////////////// Updating The Credits //////////////////
        } else {
          console.log("Line no 225 CBC : This minner has no authority");
        }
      }
      // console.log("---------Section 4 CBC Line no 140 ENDS---------------");
      //*/
    }
  }
  ///////////  New Function 1 - //////////////////////////////////   9-1-2024
  generateVotingCredit(MinnerID) {
    let minnerNow = this.minners.find((ele) => ele.minnerID === MinnerID);

    if (!minnerNow) {
      console.log("CBC Line No : 177 : Unauthorized Access To Method");
    } else {
      console.log(
        "minnerNow.minnerData.length --->",
        minnerNow.minnerData.length
      );

      minnerNow.minnerData.forEach(async (minData, index) => {
        let votsData = Object.assign({}, minData.VoterData);

        if (minnerNow.credits === minnerNow.minnerData.length) {
          console.log(
            "<>",
            minnerNow.credits,
            ">-----<",
            minnerNow.minnerData.length
          );
          console.log("Work is over");
        } else if (votsData.authority === MinnerID) {
          minnerNow.credits += 1;
          let { timestamp, VoterData } = minData;
          let block = new Block();
          block.timestamp = timestamp;
          block.VoterData = VoterData;
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
              console.log("Error adding new block:", await response.text());
            }
          } catch (error) {
            console.log("Error adding new block:", error);
          }
        } else {
          console.log("Line no 225 CBC : This minner has no authority");
        }

        // Check if it's the last iteration, then update the credits
        if (index === minnerNow.minnerData.length - 1) {
          try {
            let minnerUpdateResponse = await fetch(
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
                "Error updating minner credits:",
                await minnerUpdateResponse.text()
              );
            }
          } catch (error) {
            console.log("Error updating minner credits:", error);
          }
        }
      });
    }
  }
  ///////////  New Function 1 - //////////////////////////////////

  // addnewBlock replace by miningPendingVoting
  addnewBlock(newBlock) {
    newBlock.previousHash = this.obtainLastBlock().hash;
    newBlock.hash = newBlock.computeHash();
    newBlock.proofOfWork(this.difficulty);
    this.blockchain.push(newBlock);
  }
}
