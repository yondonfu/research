pragma solidity ^0.4.17;

import "zeppelin-solidity/contracts/ECRecovery.sol";
import "zeppelin-solidity/contracts/math/Math.sol";


contract TicketBroker {
    string constant PERSONAL_HASH_PREFIX = "\u0019Ethereum Signed Message:\n32";

    // Sender deposits
    mapping (address => uint256) public deposits;
    // Sender penalty escrows
    mapping (address => uint256) public penaltyEscrows;

    function deposit(uint256 _deposit, uint256 _penaltyEscrow) external payable {
        require(msg.value == _deposit + _penaltyEscrow);
        deposits[msg.sender] += _deposit;
        penaltyEscrows[msg.sender] += _penaltyEscrow;
    }

    function withdraw() external {
        require(deposits[msg.sender] + penaltyEscrows[msg.sender] > 0);

        uint256 amount = deposits[msg.sender];
        amount += penaltyEscrows[msg.sender];

        deposits[msg.sender] = 0;
        penaltyEscrows[msg.sender] = 0;

        msg.sender.transfer(amount);
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
        address creator = ECRecovery.recover(personalHashMsg(ticketHash), _creatorSig);
        // Check if creator has a penalty escrow
        require(penaltyEscrows[creator] > 0);

        // Check if the ticket won
        require(uint256(keccak256(ticketHash, _rand)) % 100 <= _winProb);

        if (deposits[creator] < _faceValue) {
            // Slash creator's penalty escrow if deposit cannot cover ticket value
            penaltyEscrows[creator] = 0;
        }

        uint256 amount = Math.min256(deposits[creator], _faceValue);
        _recipient.transfer(amount);
    }

    function personalHashMsg(bytes32 _msg) internal pure returns (bytes32) {
        bytes memory prefixBytes = bytes(PERSONAL_HASH_PREFIX);
        return keccak256(prefixBytes, _msg);
    }
}
