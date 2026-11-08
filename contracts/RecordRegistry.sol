// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract RecordRegistry {
    address public owner;

    struct Entry {
        bytes32 dataHash;
        uint256 timestamp;
    }

    mapping(bytes32 => Entry) private entries;

    event Recorded(bytes32 indexed key, bytes32 dataHash, uint256 timestamp);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    function record(bytes32 key, bytes32 dataHash) external onlyOwner {
        entries[key] = Entry(dataHash, block.timestamp);
        emit Recorded(key, dataHash, block.timestamp);
    }

    function get(bytes32 key) external view returns (bytes32, uint256) {
        Entry memory e = entries[key];
        return (e.dataHash, e.timestamp);
    }
}
