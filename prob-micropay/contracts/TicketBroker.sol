pragma solidity ^0.4.17;

import "zeppelin-solidity/contracts/ECRecovery.sol";
import "zeppelin-solidity/contracts/token/ERC20.sol";
import "zeppelin-solidity/contracts/math/SafeMath.sol";


contract TicketBroker {
    using SafeMath for uint256;

    string constant PERSONAL_HASH_PREFIX = "\u0019Ethereum Signed Message:\n32";

    ERC20 public token;

    uint256 public withdrawDelay;

    struct Creator {
        uint256 deposit;
        uint256 penaltyEscrow;
        uint256 withdrawTimestamp;
    }

    mapping (address => Creator) public creators;

    function TicketBroker(address _token, uint256 _withdrawDelay) public {
        token = ERC20(_token);
        withdrawDelay = _withdrawDelay;
    }

    function deposit(uint256 _deposit, uint256 _penaltyEscrow) external {
        creators[msg.sender].deposit = creators[msg.sender].deposit.add(_deposit);
        creators[msg.sender].penaltyEscrow = creators[msg.sender].penaltyEscrow.add(_penaltyEscrow);
        creators[msg.sender].withdrawTimestamp = now.add(withdrawDelay);

        uint256 amount = _deposit.add(_penaltyEscrow);
        token.transferFrom(msg.sender, this, amount);
    }

    function withdraw() external {
        Creator storage creator = creators[msg.sender];

        require(creator.withdrawTimestamp >= now);

        uint256 amount = creator.deposit.add(creator.penaltyEscrow);

        require(amount > 0);

        creator.deposit = 0;
        creator.penaltyEscrow = 0;

        token.transfer(msg.sender, amount);
    }

    /*
     * @dev Claim payment for a ticket
     * @param _rand Random integer chosen by the ticket recipient
     * @param _nonce Random integer chosen by the ticket sender
     * @param _faceValue The value of the ticket
     * @param _winProb The % probability that the recipient wins _faceValue from the sender
     * @param _recipient The recipient's address
     * @param _recipientSig The recipient's signature over the ticket hash h(h(_rand), _recipient, _faceValue, _winProb, _nonce)
     * @param _creatorSig The sender's signature over the ticket hash h(h(_rand), _recipient, _faceValue, _winProb, _nonce)
     */
    function claimPayment(
        uint256 _rand,
        uint256 _nonce,
        uint256 _faceValue,
        uint256 _winProb,
        address _recipient,
        bytes _recipientSig,
        bytes _creatorSig
    )
        external
    {
        bytes32 randHash = keccak256(_rand);
        bytes32 ticketHash = keccak256(randHash, _recipient, _faceValue, _winProb, _nonce);

        // Verify recipient
        require(ECRecovery.recover(personalHashMsg(ticketHash), _recipientSig) == _recipient);

        // Recover creator address
        address creatorAddr = ECRecovery.recover(personalHashMsg(ticketHash), _creatorSig);

        Creator storage creator = creators[creatorAddr];

        // Check if creator has a penalty escrow
        require(creator.penaltyEscrow > 0);

        // Check if the ticket won
        require(uint256(keccak256(ticketHash, _rand)) % 100 <= _winProb);

        if (creator.deposit < _faceValue) {
            // Slash creator's penalty escrow if deposit cannot cover ticket value
            creator.penaltyEscrow = 0;
            // Zero out deposit
            creator.deposit = 0;
        } else {
            // Deduct deposit
            creator.deposit = creator.deposit.sub(_faceValue);
        }

        token.transfer(_recipient, _faceValue);
    }

    function personalHashMsg(bytes32 _msg) internal pure returns (bytes32) {
        bytes memory prefixBytes = bytes(PERSONAL_HASH_PREFIX);
        return keccak256(prefixBytes, _msg);
    }
}
