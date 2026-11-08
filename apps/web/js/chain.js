// KaSetereke: read-only blockchain helpers (Verify button).
// Needs ethers v6 loaded on the page before this file.
(function () {
  const CHAIN = {
    contract: '0xbAE4e3421d073eABf87a0A2A8b7a5a00E4179692', // Sepolia
    rpc: 'https://ethereum-sepolia-rpc.publicnode.com',
    abi: ['function get(bytes32 key) view returns (bytes32, uint256)']
  };

  // The recipe for each fingerprint. Order and formatting must never change.
  function bookingText(b) {
    return [b.id, b.place_id, b.check_in, b.check_out, b.guests,
            Number(b.total_amount).toFixed(2), b.status].join('|');
  }

  function reviewText(r) {
    return [r.id, r.place_id, r.rating, r.comment ?? '', r.reviewer_pseudonym].join('|');
  }

  // Rebuild the hash, read the saved one from the chain, compare.
  async function verifyRecord(id, text) {
    const provider = new ethers.JsonRpcProvider(CHAIN.rpc);
    const contract = new ethers.Contract(CHAIN.contract, CHAIN.abi, provider);
    const [onChain, ts] = await contract.get(ethers.id(id));
    const local = ethers.id(text);

    let status = 'mismatch';
    if (onChain === ethers.ZeroHash) status = 'pending';
    else if (onChain.toLowerCase() === local.toLowerCase()) status = 'verified';

    return {
      status: status,
      local: local,
      onChain: onChain,
      time: ts > 0n ? new Date(Number(ts) * 1000).toISOString() : null
    };
  }

  window.KaChain = {
    bookingText: bookingText,
    reviewText: reviewText,
    verifyBooking: function (b) { return verifyRecord(b.id, bookingText(b)); },
    verifyReview: function (r) { return verifyRecord(r.id, reviewText(r)); }
  };
})();
