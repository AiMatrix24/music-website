// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC2771Context} from "@gelatonetwork/relay-context/contracts/vendor/ERC2771Context.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title PaymentSplitter
 * @notice Batch USDC payouts with $3.50 cap per subscription.
 * Creator: ALWAYS $1.00. NEVER pro-rated.
 * Facilitator + Outlier: pro-rated if total exceeds cap.
 * Admin: Gnosis Safe 3/5 multi-sig.
 */
contract PaymentSplitter is ERC2771Context, ReentrancyGuard, Pausable {
    IERC20 public immutable usdc;
    address public admin; // Gnosis Safe multi-sig

    uint256 public constant MAX_PAYOUT_PER_SUB = 350; // $3.50 in cents
    uint256 public constant CREATOR_AMOUNT = 100;     // $1.00 ALWAYS
    uint256 public constant MAX_BATCH_SIZE = 200;

    event BatchExecuted(uint256 indexed batchSize, uint256 totalPaid);
    event AdminTransferred(address indexed oldAdmin, address indexed newAdmin);

    constructor(
        address trustedForwarder,
        address _usdc,
        address _admin
    ) ERC2771Context(trustedForwarder) {
        usdc = IERC20(_usdc);
        admin = _admin;
    }

    // CRITICAL: Use _msgSender() everywhere instead of msg.sender
    modifier onlyAdmin() {
        require(_msgSender() == admin, "Not admin");
        _;
    }

    /**
     * @notice Execute batch payout for a set of subscriptions.
     * @dev Max 200 recipients per batch. Sequential execution only.
     *      Creator ALWAYS receives $1.00. Facilitator + Outlier pro-rated if cap exceeded.
     */
    function executeBatch(
        address[] calldata creators,
        address[] calldata facilitators,
        address[] calldata outliers,
        uint256[] calldata facilitatorAmounts,
        uint256[] calldata outlierAmounts
    ) external onlyAdmin nonReentrant whenNotPaused {
        require(creators.length <= MAX_BATCH_SIZE, "Batch too large");
        require(
            creators.length == facilitators.length &&
            creators.length == outliers.length &&
            creators.length == facilitatorAmounts.length &&
            creators.length == outlierAmounts.length,
            "Array mismatch"
        );

        uint256 totalPaid = 0;

        for (uint256 i = 0; i < creators.length; i++) {
            // Creator: ALWAYS $1.00. NEVER pro-rated.
            usdc.transfer(creators[i], CREATOR_AMOUNT * 1e4); // 6 decimals
            uint256 total = CREATOR_AMOUNT;

            // Facilitator: only if verified (address != 0x0)
            if (facilitators[i] != address(0) && facilitatorAmounts[i] > 0) {
                uint256 facAmt = facilitatorAmounts[i];

                if (total + facAmt + outlierAmounts[i] > MAX_PAYOUT_PER_SUB) {
                    // Pro-rate facilitator + outlier, NEVER creator
                    uint256 remaining = MAX_PAYOUT_PER_SUB - CREATOR_AMOUNT;
                    uint256 combined = facAmt + outlierAmounts[i];
                    facAmt = (facAmt * remaining) / combined;
                }

                usdc.transfer(facilitators[i], facAmt * 1e4);
                total += facAmt;
            }

            // Outlier: only if attributed (address != 0x0)
            if (outliers[i] != address(0) && outlierAmounts[i] > 0) {
                uint256 outAmt = MAX_PAYOUT_PER_SUB - total;
                if (outAmt > outlierAmounts[i]) outAmt = outlierAmounts[i];
                usdc.transfer(outliers[i], outAmt * 1e4);
                total += outAmt;
            }

            totalPaid += total;
        }

        emit BatchExecuted(creators.length, totalPaid);
    }

    function transferAdmin(address newAdmin) external onlyAdmin {
        emit AdminTransferred(admin, newAdmin);
        admin = newAdmin;
    }

    function pause() external onlyAdmin { _pause(); }
    function unpause() external onlyAdmin { _unpause(); }
}
