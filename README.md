# Concero V2 Relayers

![Concero Logo](https://raw.githubusercontent.com/concero/assets/main/logo.png)

> **⚠️ Alpha Release Warning**: This is an alpha release of the Concero V2 Relayers. The code is not yet production ready and is subject to change.

Concero V2 Relayers are specialized nodes that enable secure cross-chain communication in the Concero V2 network. They serve as the bridge between different blockchain networks, ensuring messages are validated and delivered reliably across chains while maintaining the highest security standards.

## Table of Contents

- [Overview](#overview)
- [What is a Relayer?](#what-is-a-relayer)
- [Architecture](#architecture)
- [Relayer Types](#relayer-types)
- [Core Components](#core-components)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Security](#security)
- [Monitoring](#monitoring)
- [Documentation Links](#documentation-links)
- [Contributing](#contributing)

## Overview

Concero V2 represents a significant advancement in cross-chain interoperability, extending beyond the capabilities of V1 to support any-to-any network communication. The relayer network is economically secured by [Symbiotic restaking](https://symbiotic.fi/) and leverages [Chainlink Functions](https://chain.link/functions) for verifiable compute, ensuring both security and decentralization.

### Key Features

- **Unlimited Network Reach**: Connect any blockchain network
- **Modular Security**: Choose your security modules based on requirements
- **Economic Security**: Backed by Symbiotic restaking protocol
- **Cryptographic Verification**: Trust-minimized validation via Chainlink Functions
- **Large Data Support**: Up to 1.875 MB per message (limited only by network constraints)
- **Fast Finality**: ~10-20 second challenge periods

## What is a Relayer?

A relayer in Concero V2 is a specialized node operator responsible for:

### Primary Responsibilities

1. **Message Validation**: Request validation reports from Chainlink Functions for cross-chain messages
2. **Message Delivery**: Deliver validated messages to destination chains within allocated time windows
3. **Uptime Maintenance**: Ensure operational availability to avoid downtime penalties
4. **Resource Management**: Maintain sufficient gas and deposits across all supported chains

### Economic Incentives

Relayers earn rewards through:
- **Report Request Rewards**: From ConceroVerifier contracts
- **Message Delivery Rewards**: From ConceroRouter contracts

Relayers face penalties for:
- **Missed Deliveries**: Failing to deliver within 10-second time slots
- **Downtime**: Extended periods of unavailability

## Architecture

The Concero V2 relayer system follows a modular architecture designed for reliability, scalability, and maintainability:

```
┌─────────────────────────────────────────────────────────────┐
│                    Concero V2 Relayer                      │
├─────────────────────────────────────────────────────────────┤
│  Block Manager Registry                                     │
│  ├── Block Manager (Network 1)                             │
│  ├── Block Manager (Network 2)                             │
│  └── Block Manager (Network N)                             │
├─────────────────────────────────────────────────────────────┤
│  Core Managers                                              │
│  ├── TX Manager (Read/Write/Monitor)                       │
│  ├── Network Manager                                       │
│  ├── Deployment Manager                                    │
│  ├── Viem Client Manager                                   │
│  └── RPC Manager                                          │
├─────────────────────────────────────────────────────────────┤
│  Infrastructure                                            │
│  ├── DB Manager (Prisma)                                  │
│  ├── Block Checkpoint Manager                             │
│  └── Nonce Manager                                        │
└─────────────────────────────────────────────────────────────┘
```

## Relayer Types

### Relayer A (Required)
The primary relayer responsible for essential operations:

- **Event Monitoring**: Captures `ConceroMessageSent` events from router contracts
- **CLF Integration**: Triggers Chainlink Functions for message validation
- **Report Relay**: Delivers validation reports to destination chains
- **Economic Security**: Manages deposits and stake requirements

### Relayer B (Optional)
Provides additional consensus layer for enhanced security:

- **Consensus Participation**: Works alongside Chainlink Functions for multi-party validation
- **Custom Verification**: Enables application-specific security requirements
- **Risk Adjustment**: Allows developers to balance speed vs. security

## Core Components

### Block Manager Registry
Central repository for network-specific BlockManagers, enabling dynamic network addition and management.

### Block Manager
- Fetches and reports new block ranges for individual networks
- Handles block polling and event detection
- Supports both sequential and catchup processing modes

### Block Checkpoint Manager
- Tracks latest successfully processed blocks
- Enables recovery from checkpoints after downtime
- Ensures continuity of operations during system interruptions

### TX Manager
Central transaction coordination layer providing:
- **TX Reader**: Handles all blockchain data retrieval operations
- **TX Writer**: Manages write operations across all networks
- **TX Monitor**: Ensures transaction finality and reliability

### Network Manager
- Oversees supported networks by monitoring `@concero/v2-networks`
- Enables dynamic network addition without operator intervention
- Manages network configurations and chain selectors

### Deployment Manager
- Tracks ConceroVerifier and ConceroRouter contract deployments
- Maintains up-to-date contract addresses
- Enables immediate contract availability for new networks

### Viem Client Manager
- Creates, retrieves, and disposes of Viem Fallback Clients
- Manages RPC connections with fallback support
- Optimizes client lifecycle management

### Nonce Manager
- Implements custom nonce tracking for optimal transaction throughput
- Prevents nonce-related transaction failures
- Enables faster transaction processing

### RPC Manager
- Maintains updatable lists of RPC endpoints
- Monitors `@concero/rpcs` for endpoint updates
- Provides failover and load balancing capabilities

## Getting Started

### Prerequisites

- **Node.js**: v22 or higher
- **Database**: PostgreSQL (configured via Prisma)
- **Symbiotic Registration**: Required for mainnet operations
- **ETH Deposits**: Sufficient for network operations and staking

### Installation

```bash
# Clone the repository
git clone https://github.com/concero/v2-operators.git
cd v2-operators

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate --schema=prisma/schema.prisma

# Set up database (if needed)
npx prisma migrate reset
```

### Environment Configuration

Create a `.env` file based on the provided template:

```bash
cp .env.example .env
```

Required environment variables:
- `NETWORK_MODE`: `mainnet`, `testnet`, or `localhost`
- `OPERATOR_ADDRESS`: Your relayer's Ethereum address
- `LOG_LEVEL_DEFAULT`: Logging level (`debug`, `info`, `warn`, `error`)
- Database connection strings for Prisma

### Running the Relayer

#### Development Mode
```bash
# Start Relayer A
npm run start:relayerA

# Or using bun for faster startup
bun ./src/relayer-a/index.ts
```

#### Production Mode (Docker)
```bash
# Build and start with Docker Compose
./start.sh

# Or manually
docker compose -f docker/docker-compose.yml up -d
```

### Registration Process

Before operating on mainnet, you must:

1. **Deposit Funds**: Deposit native tokens to ConceroVerifier contract
2. **Request Registration**: Call `requestOperatorRegistration` with:
   - Chain types you want to support (0 for EVMs)
   - Registration actions
   - Operator addresses
3. **Wait for Verification**: Chainlink Functions verifies your Symbiotic stake
4. **Begin Operations**: Start relaying messages once registration is confirmed

## Configuration

### Network Configuration
The relayer automatically fetches network configurations from:
- **Mainnet**: `@concero/v2-networks/networks/mainnet.json`
- **Testnet**: `@concero/v2-networks/networks/testnet.json`

### RPC Configuration
RPC endpoints are managed via `@concero/rpcs` with automatic updates.

### Deployment Configuration
Contract addresses are fetched from `@concero/v2-contracts` deployment files.

### Advanced Settings

```typescript
// Block Manager Settings
BLOCK_MANAGER_POLLING_INTERVAL_MS=5000
USE_CHECKPOINTS=true

// Transaction Settings
DRY_RUN=false
SIMULATE_TX=true
DEFAULT_CONFIRMATIONS=3

// Logging
LOG_LEVEL_DEFAULT=info
```

## Deployment

### Docker Deployment

The relayer includes production-ready Docker configuration:

```yaml
# docker-compose.yml
version: "3.8"
services:
  app:
    build:
      context: .
      dockerfile: ./docker/Dockerfile
    env_file:
      - .env
    volumes:
      - ./logs:/app/logs
    restart: always
```

### Monitoring and Health Checks

- **Logging**: Structured logging with Winston
- **Metrics**: Built-in performance monitoring
- **Alerts**: Slack integration for critical events
- **Checkpoints**: Automatic recovery from failures

## Security

### Economic Security
- **Symbiotic Staking**: Relayers must maintain delegated stake
- **Slashing Conditions**: Penalties for downtime and incorrect behavior
- **Deposit Requirements**: Funds held in ConceroVerifier for security

### Cryptographic Security
- **Chainlink Functions**: Verifiable compute for message validation
- **Multi-signature**: DON consensus for report authenticity
- **Hash Verification**: Tamper-proof message integrity

### Best Practices
- **Key Management**: Secure private key storage
- **Access Control**: Restricted operator permissions
- **Monitoring**: Continuous uptime and performance tracking
- **Updates**: Regular software updates and security patches

## Monitoring

### Key Metrics
- **Message Processing Rate**: Messages per minute
- **Success Rate**: Percentage of successful deliveries
- **Response Time**: Average delivery latency
- **Uptime**: Operational availability percentage

### Logging
Structured logs are written to:
- **Console**: Real-time monitoring
- **Files**: Persistent log storage (`./logs/`)
- **External**: Slack notifications for critical events

### Health Checks
- **Database Connectivity**: Prisma connection status
- **RPC Endpoints**: Network connectivity verification
- **Contract Interactions**: Successful contract calls
- **Balance Monitoring**: Sufficient gas and deposits

## Documentation Links

### Official Documentation
- [Concero V2 Technical Overview](https://olegkron.com/posts/concero-v2-technical-overview)
- [Concero V2 Relayer Documentation](https://docs.concero.io/v2/relayers)
- [Symbiotic Protocol](https://symbiotic.fi/)
- [Chainlink Functions](https://chain.link/functions)

### Developer Resources
- [Contract Utils](https://github.com/concero/contract-utils)
- [Operator Utils](https://github.com/concero/operator-utils)
- [V2 Networks](https://github.com/concero/v2-networks)
- [RPC Service](https://github.com/concero/rpcs)

### API References
- [Viem Documentation](https://viem.sh/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Winston Logging](https://github.com/winstonjs/winston)

## Contributing

We welcome contributions to improve the Concero V2 relayer software:

### Development Setup
```bash
# Install dependencies
npm install

# Run linting
npm run lint

# Format code
npm run format

# Run tests
npm test
```

### Code Standards
- **TypeScript**: Strict typing requirements
- **ESLint**: Configured linting rules
- **Prettier**: Consistent code formatting
- **SOLID Principles**: Clean architecture patterns

### Submission Process
1. Fork the repository
2. Create a feature branch
3. Implement changes with tests
4. Run quality checks
5. Submit a pull request

## License

This project is licensed under the terms specified in the [LICENSE](./LICENCE) file.

---

**Need Help?**
- 📖 [Read the Docs](https://docs.concero.io)
- 💬 [Join Discord](https://discord.gg/concero)
- 🐛 [Report Issues](https://github.com/concero/v2-operators/issues)
- 📧 [Contact Support](mailto:support@concero.io)

Built with ❤️ by the [Concero Team](https://concero.io)