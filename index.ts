import * as crypto from "crypto";

/**
 * Transfer of funds between two wallets
 */
class Transaction {
	constructor(
		public amount: number,
		public payer: string, // public key
		public payee: string // public key
	) {}

	toString() {
		return JSON.stringify(this);
	}
}

/**
 * Individual block on the chain
 */
class Block {
	public nonce = Math.round(Math.random() * 999999999);

	constructor(
		public prevHash: string,
		public transaction: Transaction,
		public ts = Date.now()
	) {}

	get hash() {
		const str = JSON.stringify(this);
		const hash = crypto.createHash("SHA256");
		hash.update(str).end();
		return hash.digest("hex");
	}
}

/**
 * The Blockchain
 */
class Chain {
	public static instance = new Chain();

	chain: Block[];

	constructor() {
		this.chain = [
			// Genesis Block
			new Block("", new Transaction(100, "genesis", "satoshi")),
		];
	}

	// Get the most recent block in the blockchain
	get lastBlock() {
		return this.chain[this.chain.length - 1];
	}

	// Proof of Work
	mine(nonce: number) {
		let solution = 1;

		console.log("⛏️ Mining...");

		while (true) {
			const hash = crypto.createHash("MD5");
			hash.update((nonce + solution).toString()).end();

			const attempt = hash.digest("hex");

			if (attempt.substring(0, 4) === "0000") {
				console.log(`Solved: ${solution}`);
				return solution;
			}

			solution += 1;
		}
	}

	// Add a new block to the blockchain if valid signature and proof of work is complete
	addBlock(
		transaction: Transaction,
		senderPublicKey: string,
		signature: Buffer
	) {
		const verify = crypto.createVerify("SHA256");
		verify.update(transaction.toString());

		const isValid = verify.verify(senderPublicKey, signature);

		if (isValid) {
			const newBlock = new Block(this.lastBlock.hash, transaction);
			this.mine(newBlock.nonce);
			this.chain.push(newBlock);
		}
	}
}

/**
 * Wallet with public and private keys
 */
class Wallet {
	public publicKey: string;
	public privateKey: string;

	constructor() {
		const keyPair = crypto.generateKeyPairSync("rsa", {
			modulusLength: 2048,
			publicKeyEncoding: {
				type: "spki",
				format: "pem",
			},
			privateKeyEncoding: {
				type: "pkcs8",
				format: "pem",
			},
		});

		this.privateKey = keyPair.privateKey;
		this.publicKey = keyPair.publicKey;
	}

	sendMoney(amount: number, payeePublicKey: string) {
		const transaction = new Transaction(amount, this.publicKey, payeePublicKey);

		const sign = crypto.createSign("SHA256");
		sign.update(transaction.toString()).end();

		const signature = sign.sign(this.privateKey);
		Chain.instance.addBlock(transaction, this.publicKey, signature);
	}
}
