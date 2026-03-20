// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC2771Context} from "@gelatonetwork/relay-context/contracts/vendor/ERC2771Context.sol";

/**
 * @title AttributionRegistry
 * @notice Append-only on-chain attribution ledger.
 * Once attribution is recorded, it CANNOT be modified or deleted.
 * Immutable audit trail for stakeholder transparency.
 */
contract AttributionRegistry is ERC2771Context {
    struct Attribution {
        address subscriber;
        address creator;       // ALWAYS required
        address facilitator;   // address(0) if unverified
        address outlier;       // address(0) if unattributed
        bool geoVerified;
        bool totpVerified;
        uint256 timestamp;
    }

    mapping(uint256 => Attribution) public attributions;
    uint256 public attributionCount;

    event AttributionRecorded(
        uint256 indexed id,
        address indexed subscriber,
        address indexed creator,
        address facilitator,
        address outlier
    );

    constructor(address trustedForwarder) ERC2771Context(trustedForwarder) {}

    /**
     * @notice Record an immutable attribution entry.
     * @dev Creator is ALWAYS required. Facilitator must be 0x0 if unverified.
     *      FRAUD PREVENTION: facilitator must be 0x0 if geoVerified=false AND totpVerified=false.
     */
    function recordAttribution(
        address subscriber,
        address creator,
        address facilitator,
        address outlier,
        bool geoVerified,
        bool totpVerified
    ) external returns (uint256) {
        require(creator != address(0), "Creator required");

        // FRAUD PREVENTION: facilitator must be 0x0 if unverified
        if (!geoVerified && !totpVerified) {
            require(facilitator == address(0), "Unverified facilitator");
        }

        uint256 id = attributionCount++;
        attributions[id] = Attribution({
            subscriber: subscriber,
            creator: creator,
            facilitator: facilitator,
            outlier: outlier,
            geoVerified: geoVerified,
            totpVerified: totpVerified,
            timestamp: block.timestamp
        });

        emit AttributionRecorded(id, subscriber, creator, facilitator, outlier);
        return id;
    }

    function getAttribution(uint256 id)
        external view returns (Attribution memory)
    {
        return attributions[id];
    }
}
