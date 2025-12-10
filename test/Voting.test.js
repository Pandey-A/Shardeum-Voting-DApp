const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Voting Contract", function () {
  let voting;
  let owner;
  let voter1;
  let voter2;
  let voter3;

  const sampleQuestion = "What is the best programming language?";
  const sampleOptions = ["JavaScript", "Python", "Rust", "Go"];
  const duration = 60; // 60 minutes

  beforeEach(async function () {
    [owner, voter1, voter2, voter3] = await ethers.getSigners();
    
    const Voting = await ethers.getContractFactory("Voting");
    voting = await Voting.deploy();
    await voting.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should start with zero polls", async function () {
      expect(await voting.pollCount()).to.equal(0);
    });
  });

  describe("Poll Creation", function () {
    it("Should create a poll successfully", async function () {
      await expect(voting.createPoll(sampleQuestion, sampleOptions, duration))
        .to.emit(voting, "PollCreated")
        .withArgs(1, sampleQuestion, owner.address, await getExpectedEndTime(duration));
      
      expect(await voting.pollCount()).to.equal(1);
    });

    it("Should fail if question is empty", async function () {
      await expect(
        voting.createPoll("", sampleOptions, duration)
      ).to.be.revertedWith("Question cannot be empty");
    });

    it("Should fail if less than 2 options", async function () {
      await expect(
        voting.createPoll(sampleQuestion, ["Only one"], duration)
      ).to.be.revertedWith("Need at least 2 options");
    });

    it("Should fail if more than 10 options", async function () {
      const tooManyOptions = Array(11).fill("Option");
      await expect(
        voting.createPoll(sampleQuestion, tooManyOptions, duration)
      ).to.be.revertedWith("Maximum 10 options allowed");
    });

    it("Should fail if duration is 0", async function () {
      await expect(
        voting.createPoll(sampleQuestion, sampleOptions, 0)
      ).to.be.revertedWith("Duration must be positive");
    });

    it("Should fail if duration exceeds 7 days", async function () {
      await expect(
        voting.createPoll(sampleQuestion, sampleOptions, 10081)
      ).to.be.revertedWith("Max duration is 7 days");
    });

    it("Should fail if an option is empty", async function () {
      await expect(
        voting.createPoll(sampleQuestion, ["Valid", ""], duration)
      ).to.be.revertedWith("Option cannot be empty");
    });
  });

  describe("Voting", function () {
    beforeEach(async function () {
      await voting.createPoll(sampleQuestion, sampleOptions, duration);
    });

    it("Should allow voting on a poll", async function () {
      await expect(voting.connect(voter1).vote(1, 0))
        .to.emit(voting, "VoteCast")
        .withArgs(1, voter1.address, 0);
      
      expect(await voting.hasVoted(1, voter1.address)).to.be.true;
    });

    it("Should increment vote count correctly", async function () {
      await voting.connect(voter1).vote(1, 0);
      await voting.connect(voter2).vote(1, 0);
      await voting.connect(voter3).vote(1, 1);

      const poll = await voting.getPoll(1);
      expect(poll.voteCounts[0]).to.equal(2);
      expect(poll.voteCounts[1]).to.equal(1);
      expect(poll.totalVotes).to.equal(3);
    });

    it("Should prevent double voting", async function () {
      await voting.connect(voter1).vote(1, 0);
      await expect(
        voting.connect(voter1).vote(1, 1)
      ).to.be.revertedWith("Already voted");
    });

    it("Should fail for invalid option index", async function () {
      await expect(
        voting.connect(voter1).vote(1, 10)
      ).to.be.revertedWith("Invalid option");
    });

    it("Should fail for non-existent poll", async function () {
      await expect(
        voting.connect(voter1).vote(99, 0)
      ).to.be.revertedWith("Poll does not exist");
    });

    it("Should fail after poll ends", async function () {
      // Fast forward time past the poll end
      await time.increase(61 * 60); // 61 minutes
      
      await expect(
        voting.connect(voter1).vote(1, 0)
      ).to.be.revertedWith("Poll has ended");
    });

    it("Should track voter choice correctly", async function () {
      await voting.connect(voter1).vote(1, 2);
      expect(await voting.getVoterChoice(1, voter1.address)).to.equal(2);
    });
  });

  describe("Poll Management", function () {
    beforeEach(async function () {
      await voting.createPoll(sampleQuestion, sampleOptions, duration);
    });

    it("Should allow creator to end poll early", async function () {
      await expect(voting.endPoll(1))
        .to.emit(voting, "PollEnded")
        .withArgs(1);
      
      const poll = await voting.getPoll(1);
      expect(poll.active).to.be.false;
    });

    it("Should prevent non-creator from ending poll", async function () {
      await expect(
        voting.connect(voter1).endPoll(1)
      ).to.be.revertedWith("Only creator can end poll");
    });

    it("Should prevent ending already ended poll", async function () {
      await voting.endPoll(1);
      await expect(voting.endPoll(1)).to.be.revertedWith("Poll already ended");
    });

    it("Should prevent voting on ended poll", async function () {
      await voting.endPoll(1);
      await expect(
        voting.connect(voter1).vote(1, 0)
      ).to.be.revertedWith("Poll is not active");
    });
  });

  describe("Poll Queries", function () {
    beforeEach(async function () {
      await voting.createPoll(sampleQuestion, sampleOptions, duration);
      await voting.createPoll("Second poll?", ["Yes", "No"], duration);
    });

    it("Should return correct poll details", async function () {
      const poll = await voting.getPoll(1);
      
      expect(poll.id).to.equal(1);
      expect(poll.question).to.equal(sampleQuestion);
      expect(poll.options).to.deep.equal(sampleOptions);
      expect(poll.creator).to.equal(owner.address);
      expect(poll.active).to.be.true;
    });

    it("Should return active polls", async function () {
      const activePolls = await voting.getActivePolls();
      expect(activePolls.length).to.equal(2);
      expect(activePolls[0]).to.equal(1);
      expect(activePolls[1]).to.equal(2);
    });

    it("Should not include ended polls in active list", async function () {
      await voting.endPoll(1);
      const activePolls = await voting.getActivePolls();
      expect(activePolls.length).to.equal(1);
      expect(activePolls[0]).to.equal(2);
    });

    it("Should return correct winner", async function () {
      await voting.connect(voter1).vote(1, 0);
      await voting.connect(voter2).vote(1, 0);
      await voting.connect(voter3).vote(1, 2);

      const winner = await voting.getWinner(1);
      expect(winner.winningOption).to.equal(0);
      expect(winner.winningOptionText).to.equal("JavaScript");
      expect(winner.winningVoteCount).to.equal(2);
    });
  });

  // Helper function to get expected end time
  async function getExpectedEndTime(durationMinutes) {
    const latestBlock = await ethers.provider.getBlock("latest");
    return latestBlock.timestamp + durationMinutes * 60;
  }
});
