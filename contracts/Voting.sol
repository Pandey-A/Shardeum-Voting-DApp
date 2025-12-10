// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title Voting
 * @dev A simple voting/poll smart contract
 * @notice Allows creating polls and casting votes on the blockchain
 */
contract Voting {
    struct Poll {
        uint256 id;
        string question;
        string[] options;
        uint256[] voteCounts;
        address creator;
        uint256 endTime;
        bool active;
        mapping(address => bool) hasVoted;
        mapping(address => uint256) voterChoice;
    }

    uint256 public pollCount;
    mapping(uint256 => Poll) private polls;
    
    // Events
    event PollCreated(uint256 indexed pollId, string question, address creator, uint256 endTime);
    event VoteCast(uint256 indexed pollId, address indexed voter, uint256 optionIndex);
    event PollEnded(uint256 indexed pollId);

    // Modifiers
    modifier pollExists(uint256 _pollId) {
        require(_pollId > 0 && _pollId <= pollCount, "Poll does not exist");
        _;
    }

    modifier pollActive(uint256 _pollId) {
        require(polls[_pollId].active, "Poll is not active");
        require(block.timestamp < polls[_pollId].endTime, "Poll has ended");
        _;
    }

    modifier hasNotVoted(uint256 _pollId) {
        require(!polls[_pollId].hasVoted[msg.sender], "Already voted");
        _;
    }

    /**
     * @dev Create a new poll
     * @param _question The poll question
     * @param _options Array of voting options
     * @param _durationInMinutes How long the poll should be active
     */
    function createPoll(
        string memory _question,
        string[] memory _options,
        uint256 _durationInMinutes
    ) external returns (uint256) {
        require(bytes(_question).length > 0, "Question cannot be empty");
        require(_options.length >= 2, "Need at least 2 options");
        require(_options.length <= 10, "Maximum 10 options allowed");
        require(_durationInMinutes > 0, "Duration must be positive");
        require(_durationInMinutes <= 10080, "Max duration is 7 days");

        pollCount++;
        Poll storage newPoll = polls[pollCount];
        
        newPoll.id = pollCount;
        newPoll.question = _question;
        newPoll.creator = msg.sender;
        newPoll.endTime = block.timestamp + (_durationInMinutes * 1 minutes);
        newPoll.active = true;
        
        for (uint256 i = 0; i < _options.length; i++) {
            require(bytes(_options[i]).length > 0, "Option cannot be empty");
            newPoll.options.push(_options[i]);
            newPoll.voteCounts.push(0);
        }

        emit PollCreated(pollCount, _question, msg.sender, newPoll.endTime);
        return pollCount;
    }

    /**
     * @dev Cast a vote on a poll
     * @param _pollId The ID of the poll
     * @param _optionIndex The index of the chosen option
     */
    function vote(uint256 _pollId, uint256 _optionIndex) 
        external 
        pollExists(_pollId) 
        pollActive(_pollId) 
        hasNotVoted(_pollId) 
    {
        Poll storage poll = polls[_pollId];
        require(_optionIndex < poll.options.length, "Invalid option");

        poll.hasVoted[msg.sender] = true;
        poll.voterChoice[msg.sender] = _optionIndex;
        poll.voteCounts[_optionIndex]++;

        emit VoteCast(_pollId, msg.sender, _optionIndex);
    }

    /**
     * @dev End a poll early (only creator can do this)
     * @param _pollId The ID of the poll to end
     */
    function endPoll(uint256 _pollId) external pollExists(_pollId) {
        Poll storage poll = polls[_pollId];
        require(msg.sender == poll.creator, "Only creator can end poll");
        require(poll.active, "Poll already ended");
        
        poll.active = false;
        emit PollEnded(_pollId);
    }

    /**
     * @dev Get poll details
     * @param _pollId The ID of the poll
     */
    function getPoll(uint256 _pollId) 
        external 
        view 
        pollExists(_pollId) 
        returns (
            uint256 id,
            string memory question,
            string[] memory options,
            uint256[] memory voteCounts,
            address creator,
            uint256 endTime,
            bool active,
            uint256 totalVotes
        ) 
    {
        Poll storage poll = polls[_pollId];
        uint256 total = 0;
        for (uint256 i = 0; i < poll.voteCounts.length; i++) {
            total += poll.voteCounts[i];
        }
        
        return (
            poll.id,
            poll.question,
            poll.options,
            poll.voteCounts,
            poll.creator,
            poll.endTime,
            poll.active && block.timestamp < poll.endTime,
            total
        );
    }

    /**
     * @dev Check if an address has voted on a poll
     * @param _pollId The ID of the poll
     * @param _voter The address to check
     */
    function hasVoted(uint256 _pollId, address _voter) 
        external 
        view 
        pollExists(_pollId) 
        returns (bool) 
    {
        return polls[_pollId].hasVoted[_voter];
    }

    /**
     * @dev Get the vote choice of an address
     * @param _pollId The ID of the poll
     * @param _voter The address to check
     */
    function getVoterChoice(uint256 _pollId, address _voter) 
        external 
        view 
        pollExists(_pollId) 
        returns (uint256) 
    {
        require(polls[_pollId].hasVoted[_voter], "Address has not voted");
        return polls[_pollId].voterChoice[_voter];
    }

    /**
     * @dev Get all active poll IDs
     */
    function getActivePolls() external view returns (uint256[] memory) {
        uint256 activeCount = 0;
        
        // First pass: count active polls
        for (uint256 i = 1; i <= pollCount; i++) {
            if (polls[i].active && block.timestamp < polls[i].endTime) {
                activeCount++;
            }
        }
        
        // Second pass: collect active poll IDs
        uint256[] memory activePollIds = new uint256[](activeCount);
        uint256 index = 0;
        for (uint256 i = 1; i <= pollCount; i++) {
            if (polls[i].active && block.timestamp < polls[i].endTime) {
                activePollIds[index] = i;
                index++;
            }
        }
        
        return activePollIds;
    }

    /**
     * @dev Get the winning option of a poll
     * @param _pollId The ID of the poll
     */
    function getWinner(uint256 _pollId) 
        external 
        view 
        pollExists(_pollId) 
        returns (uint256 winningOption, string memory winningOptionText, uint256 winningVoteCount) 
    {
        Poll storage poll = polls[_pollId];
        
        uint256 maxVotes = 0;
        uint256 winnerIndex = 0;
        
        for (uint256 i = 0; i < poll.voteCounts.length; i++) {
            if (poll.voteCounts[i] > maxVotes) {
                maxVotes = poll.voteCounts[i];
                winnerIndex = i;
            }
        }
        
        return (winnerIndex, poll.options[winnerIndex], maxVotes);
    }
}
