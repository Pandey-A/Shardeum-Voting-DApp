import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import './App.css';

// Import contract artifacts (these will be generated after deployment)
// For development, we'll include fallback values
let contractAddress, contractABI;

try {
  const addressData = require('./contracts/contract-address.json');
  const artifactData = require('./contracts/Voting.json');
  contractAddress = addressData.Voting;
  contractABI = artifactData.abi;
} catch (e) {
  console.log('Contract artifacts not found. Please deploy the contract first.');
  contractAddress = null;
  contractABI = [
    "function createPoll(string memory _question, string[] memory _options, uint256 _durationInMinutes) external returns (uint256)",
    "function vote(uint256 _pollId, uint256 _optionIndex) external",
    "function endPoll(uint256 _pollId) external",
    "function getPoll(uint256 _pollId) external view returns (uint256 id, string memory question, string[] memory options, uint256[] memory voteCounts, address creator, uint256 endTime, bool active, uint256 totalVotes)",
    "function hasVoted(uint256 _pollId, address _voter) external view returns (bool)",
    "function getActivePolls() external view returns (uint256[] memory)",
    "function pollCount() external view returns (uint256)",
    "event PollCreated(uint256 indexed pollId, string question, address creator, uint256 endTime)",
    "event VoteCast(uint256 indexed pollId, address indexed voter, uint256 optionIndex)",
    "event PollEnded(uint256 indexed pollId)"
  ];
}

// ============ COMPONENTS ============

function Header({ account, connectWallet, isConnecting }) {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <span className="logo-icon">⬡</span>
          <span className="logo-text">VoteChain</span>
        </div>
        <div className="wallet-section">
          {account ? (
            <div className="wallet-connected">
              <span className="wallet-indicator"></span>
              <span className="wallet-address">
                {account.slice(0, 6)}...{account.slice(-4)}
              </span>
            </div>
          ) : (
            <button 
              className="connect-btn" 
              onClick={connectWallet}
              disabled={isConnecting}
            >
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

function CreatePollForm({ onCreatePoll, isLoading }) {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [duration, setDuration] = useState(60);
  const [isExpanded, setIsExpanded] = useState(false);

  const addOption = () => {
    if (options.length < 10) {
      setOptions([...options, '']);
    }
  };

  const removeOption = (index) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validOptions = options.filter(opt => opt.trim() !== '');
    if (question.trim() && validOptions.length >= 2) {
      await onCreatePoll(question, validOptions, duration);
      setQuestion('');
      setOptions(['', '']);
      setDuration(60);
      setIsExpanded(false);
    }
  };

  return (
    <div className={`create-poll-section ${isExpanded ? 'expanded' : ''}`}>
      <button 
        className="create-poll-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span className="toggle-icon">{isExpanded ? '−' : '+'}</span>
        <span>Create New Poll</span>
      </button>
      
      {isExpanded && (
        <form className="create-poll-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Question</label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="What would you like to ask?"
              required
            />
          </div>

          <div className="form-group">
            <label>Options</label>
            <div className="options-list">
              {options.map((option, index) => (
                <div key={index} className="option-input-group">
                  <span className="option-number">{index + 1}</span>
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => updateOption(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    required
                  />
                  {options.length > 2 && (
                    <button 
                      type="button" 
                      className="remove-option-btn"
                      onClick={() => removeOption(index)}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 10 && (
              <button type="button" className="add-option-btn" onClick={addOption}>
                + Add Option
              </button>
            )}
          </div>

          <div className="form-group">
            <label>Duration</label>
            <div className="duration-selector">
              {[30, 60, 180, 1440].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  className={`duration-btn ${duration === mins ? 'active' : ''}`}
                  onClick={() => setDuration(mins)}
                >
                  {mins < 60 ? `${mins}m` : mins < 1440 ? `${mins / 60}h` : '24h'}
                </button>
              ))}
            </div>
          </div>

          <button 
            type="submit" 
            className="submit-poll-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="loading-spinner"></span>
            ) : (
              'Create Poll'
            )}
          </button>
        </form>
      )}
    </div>
  );
}

function PollCard({ poll, onVote, onEndPoll, account, isLoading }) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [hasVoted, setHasVoted] = useState(poll.hasVoted);

  const totalVotes = poll.voteCounts.reduce((a, b) => a + b, 0);
  const timeLeft = getTimeLeft(poll.endTime);
  const isCreator = account && poll.creator.toLowerCase() === account.toLowerCase();

  const handleVote = async () => {
    if (selectedOption !== null) {
      await onVote(poll.id, selectedOption);
      setHasVoted(true);
    }
  };

  return (
    <div className={`poll-card ${!poll.active ? 'ended' : ''}`}>
      <div className="poll-header">
        <div className="poll-status">
          {poll.active ? (
            <span className="status-badge active">
              <span className="status-dot"></span>
              Live
            </span>
          ) : (
            <span className="status-badge ended">Ended</span>
          )}
          {poll.active && <span className="time-left">{timeLeft}</span>}
        </div>
        <span className="poll-id">#{poll.id}</span>
      </div>

      <h3 className="poll-question">{poll.question}</h3>

      <div className="poll-options">
        {poll.options.map((option, index) => {
          const votes = poll.voteCounts[index];
          const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
          const isWinning = poll.voteCounts[index] === Math.max(...poll.voteCounts) && totalVotes > 0;

          return (
            <div
              key={index}
              className={`poll-option ${selectedOption === index ? 'selected' : ''} ${hasVoted || !poll.active ? 'voted' : ''} ${isWinning && (hasVoted || !poll.active) ? 'winning' : ''}`}
              onClick={() => !hasVoted && poll.active && setSelectedOption(index)}
            >
              <div className="option-content">
                <span className="option-text">{option}</span>
                {(hasVoted || !poll.active) && (
                  <span className="option-stats">
                    <span className="vote-count">{votes} votes</span>
                    <span className="vote-percentage">{percentage.toFixed(1)}%</span>
                  </span>
                )}
              </div>
              {(hasVoted || !poll.active) && (
                <div 
                  className="option-bar" 
                  style={{ width: `${percentage}%` }}
                ></div>
              )}
              {!hasVoted && poll.active && (
                <div className="option-radio">
                  {selectedOption === index && <span className="radio-dot"></span>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="poll-footer">
        <div className="poll-stats">
          <span className="total-votes">{totalVotes} total votes</span>
          <span className="poll-creator" title={poll.creator}>
            by {poll.creator.slice(0, 6)}...{poll.creator.slice(-4)}
          </span>
        </div>

        <div className="poll-actions">
          {poll.active && !hasVoted && (
            <button 
              className="vote-btn"
              onClick={handleVote}
              disabled={selectedOption === null || isLoading}
            >
              {isLoading ? <span className="loading-spinner small"></span> : 'Cast Vote'}
            </button>
          )}
          {poll.active && isCreator && (
            <button 
              className="end-poll-btn"
              onClick={() => onEndPoll(poll.id)}
              disabled={isLoading}
            >
              End Poll
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function PollList({ polls, onVote, onEndPoll, account, isLoading }) {
  if (polls.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📊</div>
        <h3>No polls yet</h3>
        <p>Be the first to create a poll and let the community vote!</p>
      </div>
    );
  }

  return (
    <div className="polls-grid">
      {polls.map((poll) => (
        <PollCard
          key={poll.id}
          poll={poll}
          onVote={onVote}
          onEndPoll={onEndPoll}
          account={account}
          isLoading={isLoading}
        />
      ))}
    </div>
  );
}

function Notification({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`notification ${type}`}>
      <span className="notification-icon">
        {type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}
      </span>
      <span className="notification-message">{message}</span>
      <button className="notification-close" onClick={onClose}>×</button>
    </div>
  );
}

// ============ HELPER FUNCTIONS ============

function getTimeLeft(endTime) {
  const now = Math.floor(Date.now() / 1000);
  const diff = endTime - now;
  
  if (diff <= 0) return 'Ended';
  
  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

// ============ MAIN APP ============

function App() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [account, setAccount] = useState(null);
  const [polls, setPolls] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'ended'

  // Show notification
  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
  };

  // Connect wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      showNotification('Please install MetaMask!', 'error');
      return;
    }

    setIsConnecting(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      
      setProvider(provider);
      setSigner(signer);
      setAccount(accounts[0]);

      if (contractAddress) {
        const votingContract = new ethers.Contract(contractAddress, contractABI, signer);
        setContract(votingContract);
        showNotification('Wallet connected successfully!', 'success');
      } else {
        showNotification('Contract not deployed. Please deploy the contract first.', 'error');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      showNotification('Failed to connect wallet', 'error');
    }
    setIsConnecting(false);
  };

  // Load polls
  const loadPolls = useCallback(async () => {
    if (!contract) return;

    try {
      const pollCount = await contract.pollCount();
      const loadedPolls = [];

      for (let i = 1; i <= pollCount; i++) {
        const pollData = await contract.getPoll(i);
        const hasVoted = account ? await contract.hasVoted(i, account) : false;
        
        loadedPolls.push({
          id: Number(pollData.id),
          question: pollData.question,
          options: pollData.options,
          voteCounts: pollData.voteCounts.map(v => Number(v)),
          creator: pollData.creator,
          endTime: Number(pollData.endTime),
          active: pollData.active,
          totalVotes: Number(pollData.totalVotes),
          hasVoted
        });
      }

      // Sort by ID descending (newest first)
      loadedPolls.sort((a, b) => b.id - a.id);
      setPolls(loadedPolls);
    } catch (error) {
      console.error('Error loading polls:', error);
    }
  }, [contract, account]);

  // Create poll
  const createPoll = async (question, options, duration) => {
    if (!contract) {
      showNotification('Please connect your wallet first', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const tx = await contract.createPoll(question, options, duration);
      showNotification('Creating poll... Please wait for confirmation', 'info');
      await tx.wait();
      showNotification('Poll created successfully!', 'success');
      await loadPolls();
    } catch (error) {
      console.error('Error creating poll:', error);
      showNotification(error.reason || 'Failed to create poll', 'error');
    }
    setIsLoading(false);
  };

  // Cast vote
  const vote = async (pollId, optionIndex) => {
    if (!contract) {
      showNotification('Please connect your wallet first', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const tx = await contract.vote(pollId, optionIndex);
      showNotification('Casting vote... Please wait for confirmation', 'info');
      await tx.wait();
      showNotification('Vote cast successfully!', 'success');
      await loadPolls();
    } catch (error) {
      console.error('Error voting:', error);
      showNotification(error.reason || 'Failed to cast vote', 'error');
    }
    setIsLoading(false);
  };

  // End poll
  const endPoll = async (pollId) => {
    if (!contract) return;

    setIsLoading(true);
    try {
      const tx = await contract.endPoll(pollId);
      showNotification('Ending poll... Please wait for confirmation', 'info');
      await tx.wait();
      showNotification('Poll ended successfully!', 'success');
      await loadPolls();
    } catch (error) {
      console.error('Error ending poll:', error);
      showNotification(error.reason || 'Failed to end poll', 'error');
    }
    setIsLoading(false);
  };

  // Handle account changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          setAccount(null);
          setContract(null);
        }
      });

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }
  }, []);

  // Load polls when contract is ready
  useEffect(() => {
    loadPolls();
  }, [loadPolls]);

  // Auto-refresh polls every 30 seconds
  useEffect(() => {
    const interval = setInterval(loadPolls, 30000);
    return () => clearInterval(interval);
  }, [loadPolls]);

  // Filter polls
  const filteredPolls = polls.filter(poll => {
    if (filter === 'active') return poll.active;
    if (filter === 'ended') return !poll.active;
    return true;
  });

  return (
    <div className="app">
      <div className="background-effects">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="gradient-orb orb-3"></div>
        <div className="grid-overlay"></div>
      </div>

      <Header 
        account={account} 
        connectWallet={connectWallet}
        isConnecting={isConnecting}
      />

      <main className="main-content">
        <section className="hero">
          <h1 className="hero-title">
            Decentralized <span className="highlight">Voting</span>
          </h1>
          <p className="hero-subtitle">
            Create polls, cast votes, and let the blockchain ensure transparency
          </p>
        </section>

        {account && (
          <CreatePollForm onCreatePoll={createPoll} isLoading={isLoading} />
        )}

        <section className="polls-section">
          <div className="section-header">
            <h2>Polls</h2>
            <div className="filter-tabs">
              {['all', 'active', 'ended'].map((f) => (
                <button
                  key={f}
                  className={`filter-tab ${filter === f ? 'active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {!account ? (
            <div className="connect-prompt">
              <p>Connect your wallet to view and participate in polls</p>
              <button className="connect-btn large" onClick={connectWallet}>
                Connect Wallet
              </button>
            </div>
          ) : (
            <PollList
              polls={filteredPolls}
              onVote={vote}
              onEndPoll={endPoll}
              account={account}
              isLoading={isLoading}
            />
          )}
        </section>
      </main>

      <footer className="footer">
        <p>Built with ❤️ on Ethereum</p>
      </footer>

      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}

export default App;
