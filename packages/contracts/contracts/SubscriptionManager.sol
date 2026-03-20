// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC2771Context} from "@gelatonetwork/relay-context/contracts/vendor/ERC2771Context.sol";

/**
 * @title SubscriptionManager
 * @notice Mirrors subscription state on-chain for payout eligibility.
 * Source of truth is Helio API + webhooks; this contract provides
 * on-chain verification for PaymentSplitter eligibility checks.
 */
contract SubscriptionManager is ERC2771Context {
    enum SubStatus { Inactive, Active, PastDue, Cancelled }

    struct Subscription {
        address subscriber;
        SubStatus status;
        uint256 activatedAt;
        uint256 renewsAt;
        uint256 gracePeriodEndsAt;
    }

    mapping(bytes32 => Subscription) public subscriptions; // key: keccak256(helioSubId)
    address public admin;

    event SubscriptionActivated(bytes32 indexed subKey, address indexed subscriber);
    event SubscriptionRenewed(bytes32 indexed subKey, uint256 renewsAt);
    event SubscriptionCancelled(bytes32 indexed subKey);

    constructor(address trustedForwarder) ERC2771Context(trustedForwarder) {
        admin = _msgSender();
    }

    modifier onlyAdmin() {
        require(_msgSender() == admin, "Not admin");
        _;
    }

    /**
     * @notice Activate a subscription. Called by server after Helio webhook.
     * @dev Attribution MUST be recorded BEFORE calling this function.
     */
    function activate(
        bytes32 subKey,
        address subscriber,
        uint256 renewsAt
    ) external onlyAdmin {
        subscriptions[subKey] = Subscription({
            subscriber: subscriber,
            status: SubStatus.Active,
            activatedAt: block.timestamp,
            renewsAt: renewsAt,
            gracePeriodEndsAt: 0
        });

        emit SubscriptionActivated(subKey, subscriber);
    }

    function renew(bytes32 subKey, uint256 renewsAt) external onlyAdmin {
        Subscription storage sub = subscriptions[subKey];
        require(sub.subscriber != address(0), "Sub not found");

        sub.status = SubStatus.Active;
        sub.renewsAt = renewsAt;
        sub.gracePeriodEndsAt = 0;

        emit SubscriptionRenewed(subKey, renewsAt);
    }

    function flagPastDue(
        bytes32 subKey,
        uint256 gracePeriodEndsAt
    ) external onlyAdmin {
        Subscription storage sub = subscriptions[subKey];
        require(sub.subscriber != address(0), "Sub not found");

        sub.status = SubStatus.PastDue;
        sub.gracePeriodEndsAt = gracePeriodEndsAt;
    }

    function cancel(bytes32 subKey) external onlyAdmin {
        Subscription storage sub = subscriptions[subKey];
        require(sub.subscriber != address(0), "Sub not found");

        sub.status = SubStatus.Cancelled;
        emit SubscriptionCancelled(subKey);
    }

    function isActive(bytes32 subKey) external view returns (bool) {
        return subscriptions[subKey].status == SubStatus.Active;
    }

    function getSubscription(bytes32 subKey)
        external view returns (Subscription memory)
    {
        return subscriptions[subKey];
    }

    function transferAdmin(address newAdmin) external onlyAdmin {
        admin = newAdmin;
    }
}
