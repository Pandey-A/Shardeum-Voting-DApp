# 🗳️ VoteChain - Decentralized Voting DApp

A full-stack decentralized voting application built with Solidity, Hardhat, React, and ethers.js. Create polls, cast votes, and let the blockchain ensure complete transparency!

![VoteChain Preview](https://via.placeholder.com/800x400?text=VoteChain+DApp)

## ✨ Features

- **Create Polls**: Anyone can create a poll with 2-10 options and custom duration
- **Cast Votes**: One vote per wallet address per poll
- **Real-time Results**: View vote counts and percentages live
- **Transparent**: All votes are recorded on the blockchain
- **End Polls Early**: Poll creators can end their polls before expiration
- **Mobile Responsive**: Beautiful UI that works on all devices

## 🛠️ Tech Stack

### Smart Contract
- **Solidity** (v0.8.19) - Smart contract language
- **Hardhat** - Development environment, testing, deployment
- **OpenZeppelin** patterns - Security best practices

### Frontend
- **React** (v18) - UI framework
- **ethers.js** (v6) - Ethereum interaction library
- **CSS3** - Custom styling with animations

## 📁 Project Structure

```
voting-dapp/
├── contracts/
│   └── Voting.sol          # Main voting smart contract
├── scripts/
│   └── deploy.js           # Deployment script
├── test/
│   └── Voting.test.js      # Contract tests
├── frontend/
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── App.js          # Main React app
│       ├── App.css         # Styles
│       ├── index.js        # Entry point
│       └── contracts/      # Generated after deployment
│           ├── contract-address.json
│           └── Voting.json
├── hardhat.config.js
├── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MetaMask browser extension

### Installation

1. **Clone the repository**
```bash
cd voting-dapp
```

2. **Install Hardhat dependencies**
```bash
npm install
```

3. **Install frontend dependencies**
```bash
cd frontend
npm install
cd ..
```

### Running Locally

1. **Compile the smart contract**
```bash
npm run compile
```

2. **Run tests** (optional but recommended)
```bash
npm run test
```

3. **Start a local Hardhat node**
```bash
npm run node
```

4. **Open a new terminal and deploy the contract**
```bash
npm run deploy:local
```

5. **Start the frontend**
```bash
cd frontend
npm start
```

6. **Configure MetaMask**
   - Open MetaMask
   - Add a new network:
     - Network Name: `Hardhat Local`
     - RPC URL: `http://127.0.0.1:8545`
     - Chain ID: `31337`
     - Currency Symbol: `ETH`
   - Import a test account from Hardhat (copy private key from the terminal running the node)

7. **Open your browser** at `http://localhost:3000`

## 📝 Smart Contract API

### Functions

| Function | Description |
|----------|-------------|
| `createPoll(question, options[], duration)` | Create a new poll |
| `vote(pollId, optionIndex)` | Cast a vote |
| `endPoll(pollId)` | End a poll early (creator only) |
| `getPoll(pollId)` | Get poll details |
| `hasVoted(pollId, address)` | Check if address has voted |
| `getActivePolls()` | Get all active poll IDs |
| `getWinner(pollId)` | Get the winning option |

### Events

| Event | Description |
|-------|-------------|
| `PollCreated` | Emitted when a new poll is created |
| `VoteCast` | Emitted when a vote is cast |
| `PollEnded` | Emitted when a poll is ended |

## 🧪 Testing

Run the comprehensive test suite:

```bash
npm run test
```

Tests cover:
- Poll creation (valid and invalid inputs)
- Voting mechanics
- Access control
- Time-based expiration
- Poll queries and statistics

## 🌐 Deploying to Testnets

### Sepolia Testnet

1. **Get testnet ETH** from a faucet (e.g., https://sepoliafaucet.com/)

2. **Configure environment variables**
   Create a `.env` file:
   ```
   INFURA_PROJECT_ID=your_infura_project_id
   PRIVATE_KEY=your_wallet_private_key
   ```

3. **Update `hardhat.config.js`** to uncomment the Sepolia network config

4. **Deploy**
   ```bash
   npm run deploy:sepolia
   ```

## 🎨 UI Features

- **Glassmorphism Design**: Modern, frosted glass aesthetic
- **Animated Gradients**: Dynamic background orbs
- **Real-time Updates**: Polls refresh automatically
- **Toast Notifications**: User-friendly feedback
- **Responsive Layout**: Works on mobile and desktop

## 🔒 Security Considerations

- One vote per address per poll
- Only poll creators can end polls early
- Maximum 10 options per poll
- Maximum 7-day poll duration
- Input validation on all parameters

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [Hardhat](https://hardhat.org/) - Ethereum development environment
- [ethers.js](https://docs.ethers.org/) - Ethereum library
- [React](https://reactjs.org/) - Frontend framework

---

**Happy Voting!** 🗳️✨
# Shardeum-Voting-DApp
