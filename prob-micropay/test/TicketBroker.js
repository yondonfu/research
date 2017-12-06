import ethAbi from "ethereumjs-abi"
import ethUtil from "ethereumjs-util"

const TicketBroker = artifacts.require("TicketBroker")

contract("TicketBroker", accounts => {
    let broker

    before(async () => {
        broker = await TicketBroker.new()
    })

    describe("claimPayment", () => {
        const bob = accounts[0]
        const alice = accounts[1]

        it("recipient can claim payment for a winning ticket", async () => {
            // Bob puts funds into deposit and penalty escrow
            await broker.deposit(1000, 2000, {from: bob, value: 3000})

            // Alice chooses random witness
            const rand = Math.trunc(Math.random() * 100000)
            // Alice sends Bob random witness commitment
            const randHash = ethAbi.soliditySHA3(["uint256"], [rand])

            // Bob generates a ticket
            const nonce = Math.trunc(Math.random() * 100000)
            const faceValue = 500
            const winProb = 100
            const ticketHash = ethAbi.soliditySHA3(["bytes32", "address", "uint256", "uint256", "uint256"], [randHash, alice, faceValue, winProb, nonce])
            // Bob signs the ticket
            const creatorSig = web3.eth.sign(bob, "0x" + ticketHash.toString("hex"))

            // Bob creates ticket and sends it to Alice
            const ticket = {
                randHash: randHash,
                nonce: nonce,
                recipient: alice,
                faceValue: faceValue,
                winProb: winProb,
                ticketHash: ticketHash,
                creator: bob,
                creatorSig: creatorSig
            }

            // Alice receives and verifies the ticket
            if (ticket.randHash.toString("hex") !== ethAbi.soliditySHA3(["uint256"], [rand]).toString("hex")) {
                console.log("Wrong rand hash")
            }

            if (ticket.recipient !== alice) {
                console.log("Wrong recipient")
            }

            const sigParams = ethUtil.fromRpcSig(ticket.creatorSig)
            const recoveredPubKey = ethUtil.ecrecover(ethUtil.hashPersonalMessage(ticket.ticketHash), sigParams.v, sigParams.r, sigParams.s)
            const recoveredAddr = ethUtil.pubToAddress(recoveredPubKey)

            if (ticket.creator !== "0x" + recoveredAddr.toString("hex")) {
                console.log("Wrong creator")
            }

            const deposit = await broker.deposits.call(bob)

            if (deposit.toNumber() < ticket.faceValue) {
                console.log("Insufficient deposit")
            }

            if (ethAbi.soliditySHA3(["bytes32", "uint256"], [ticket.ticketHash, rand]).readUInt32BE(0) % 100 > ticket.winProb) {
                console.log("Not a winning ticket")
            }

            const aliceStartBalance = web3.eth.getBalance(alice)

            // Alice signs the winning ticket to claim payment
            const recipientSig = web3.eth.sign(alice, "0x" + ticketHash.toString("hex"))
            await broker.claimPayment(rand, nonce, faceValue, winProb, alice, recipientSig, creatorSig)

            const aliceEndBalance = web3.eth.getBalance(alice)

            assert.equal(aliceEndBalance.sub(aliceStartBalance), 500, "recipient balance updated incorrectly")
        })
    })
})
