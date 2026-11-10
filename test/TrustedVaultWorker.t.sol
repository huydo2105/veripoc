// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {VaultFixtureTest} from "./VaultFixture.t.sol";

/// @notice Fixed worker oracle, reviewed and compiled into the image.
contract TrustedVaultTest is VaultFixtureTest {
    event log_named_uint(string key, uint256 value);

    function testVulnerableDonationReproduces() public {
        (uint256 attackerBefore, uint256 shares, uint256 attackerAfter, uint256 victim) = _runAttack(false);
        require(attackerBefore == ATTACKER_START && shares == 0 && attackerAfter == 201 && victim == 0, "attack did not reproduce");
        emit log_named_uint("VERIPOC_ATTACKER_BEFORE", attackerBefore);
        emit log_named_uint("VERIPOC_ATTACKER_AFTER", attackerAfter);
        emit log_named_uint("VERIPOC_VICTIM_SHARES", shares);
    }

    function testPatchedDonationDoesNotReproduce() public {
        (uint256 attackerBefore, uint256 shares, uint256 attackerAfter, uint256 victim) = _runAttack(true);
        require(attackerBefore == ATTACKER_START && shares > 0 && attackerAfter <= ATTACKER_START && victim == 0, "patch rejected by oracle");
        emit log_named_uint("VERIPOC_ATTACKER_BEFORE", attackerBefore);
        emit log_named_uint("VERIPOC_ATTACKER_AFTER", attackerAfter);
        emit log_named_uint("VERIPOC_VICTIM_SHARES", shares);
    }
}
