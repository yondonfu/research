import ethAbi from "ethereumjs-abi"
import ethUtil from "ethereumjs-util"

const TicketBroker = artifacts.require("TicketBroker")
const TestToken = artifacts.require("./helpers/TestToken")

contract("TicketBroker", accounts => {
    let broker
    let token

    before(async () => {
        const withdrawDelay = 24 * 60 * 60
        token = await TestToken.new([accounts[0], accounts[1]], 10000)
        broker = await TicketBroker.new(token.address, withdrawDelay)
    })

    describe("claimPayment", () => {
        const bob = accounts[0]
        const alice = accounts[1]

        it("recipient can claim payment for a winning ticket", async () => {
            // Bob puts funds into deposit and penalty escrow
            await token.approve(broker.address, 3000, {from: bob})
            await broker.deposit(1000, 2000, {from: bob})

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

            const startDeposit = (await broker.creators.call(bob))[0]

            if (startDeposit.toNumber() < ticket.faceValue) {
                console.log("Insufficient deposit")
            }

            if (ethAbi.soliditySHA3(["bytes32", "uint256"], [ticket.ticketHash, rand]).readUInt32BE(0) % 100 > ticket.winProb) {
                console.log("Not a winning ticket")
            }

            const aliceStartBalance = await token.balanceOf(alice)

            // Alice signs the winning ticket to claim payment
            const recipientSig = web3.eth.sign(alice, "0x" + ticketHash.toString("hex"))
            await broker.claimPayment(rand, ticket.nonce, ticket.faceValue, ticket.winProb, ticket.recipient, recipientSig, ticket.creatorSig)

            const aliceEndBalance = await token.balanceOf(alice)

            assert.equal(aliceEndBalance.sub(aliceStartBalance), 500, "recipient balance updated incorrectly")

            const endDeposit = (await broker.creators.call(bob))[0]

            assert.equal(startDeposit.sub(endDeposit), 500, "deposit updated incorrectly")
        })
    })
})
