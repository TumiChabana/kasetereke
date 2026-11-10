/*
  KaSetereke admin console: blockchain helper (Area 5, built from the Area 3 anchor tool).
  Requires ethers v6.13.4 to be loaded first, with this tag in index.html:
  <script src="https://cdnjs.cloudflare.com/ajax/libs/ethers/6.13.4/ethers.umd.min.js"></script>

  This file holds no secrets. The contract address, owner address and public RPC address are public values.
  Only hashes go on the chain, never personal data.
  The hash recipes must match docs/chain-spec.md and apps/web/js/chain.js exactly.
  Never change the order or the formatting of the fields.
*/
(function () {
  'use strict';

  var CONTRACT = '0xbAE4e3421d073eABf87a0A2A8b7a5a00E4179692';
  var OWNER = '0x6e6bF3bd8142f16244b83c1881986409fd544a50';
  var RPC = 'https://ethereum-sepolia-rpc.publicnode.com';
  var SEPOLIA_ID = 11155111n;
  var ABI_READ = ['function get(bytes32 key) view returns (bytes32, uint256)'];
  var ABI_WRITE = [
    'function record(bytes32 key, bytes32 dataHash)',
    'function get(bytes32 key) view returns (bytes32, uint256)'
  ];

  function bookingText(b) {
    return [b.id, b.place_id, b.check_in, b.check_out, b.guests, Number(b.total_amount).toFixed(2), b.status].join('|');
  }

  function reviewText(r) {
    return [r.id, r.place_id, r.rating, r.comment == null ? '' : r.comment, r.reviewer_pseudonym].join('|');
  }

  function textFor(kind, row) {
    return kind === 'booking' ? bookingText(row) : reviewText(row);
  }

  function existingHash(kind, row) {
    return kind === 'booking' ? row.record_hash : row.comment_hash;
  }

  // Reads the chain through the public node. No wallet and no fee are needed.
  async function readChain(id) {
    var contract = new ethers.Contract(CONTRACT, ABI_READ, new ethers.JsonRpcProvider(RPC));
    var result = await contract.get(ethers.id(id));
    return { hash: result[0], timestamp: result[1] };
  }

  // Returns one of: pending, verified, mismatch.
  async function verify(kind, row) {
    var onChain = await readChain(row.id);
    var local = ethers.id(textFor(kind, row));
    if (onChain.hash === ethers.ZeroHash) { return 'pending'; }
    return onChain.hash.toLowerCase() === local.toLowerCase() ? 'verified' : 'mismatch';
  }

  async function connectOwnerWallet() {
    if (!window.ethereum) {
      throw new Error('MetaMask was not found. Open the console in a browser where MetaMask is installed.');
    }
    var provider = new ethers.BrowserProvider(window.ethereum);
    await provider.send('eth_requestAccounts', []);
    var network = await provider.getNetwork();
    if (network.chainId !== SEPOLIA_ID) {
      await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0xaa36a7' }] });
      provider = new ethers.BrowserProvider(window.ethereum);
    }
    var signer = await provider.getSigner();
    var address = await signer.getAddress();
    if (address.toLowerCase() !== OWNER.toLowerCase()) {
      throw new Error('Wrong wallet. Select the owner wallet in MetaMask.');
    }
    return signer;
  }

  /*
    Writes one hash to the chain. The screen must ask the admin for confirmation BEFORE calling this.
    Returns { hash, txHash }. The screen then saves record_hash (or comment_hash) and chain_tx_hash
    to the database with the admin token. If that save fails, the screen must tell the admin
    NOT to anchor again and to keep the transaction hash.
  */
  async function anchor(kind, row, onStatus) {
    var say = typeof onStatus === 'function' ? onStatus : function () {};
    if (kind === 'booking' && row.status !== 'confirmed' && row.status !== 'completed') {
      throw new Error('Confirm the booking first. The status is part of the hash.');
    }
    if (existingHash(kind, row)) { throw new Error('Already anchored.'); }

    var signer = await connectOwnerWallet();
    var contract = new ethers.Contract(CONTRACT, ABI_WRITE, signer);
    var key = ethers.id(row.id);
    var hash = ethers.id(textFor(kind, row));

    var exists = false;
    try { var entry = await contract.get(key); exists = entry[1] !== 0n; } catch (e) { exists = false; }
    if (exists) { throw new Error('This record is already on the blockchain. Not recording twice.'); }

    say('Waiting for MetaMask...');
    var tx = await contract.record(key, hash);
    say('Sent ' + tx.hash + '. Waiting for confirmation...');
    await tx.wait();
    return { hash: hash, txHash: tx.hash };
  }

  window.KaChain = {
    bookingText: bookingText,
    reviewText: reviewText,
    verify: verify,
    anchor: anchor,
    etherscanTx: function (txHash) { return 'https://sepolia.etherscan.io/tx/' + txHash; }
  };
})();
