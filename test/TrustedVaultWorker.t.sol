// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {VaultFixtureTest} from "./VaultFixture.t.sol";

/// @notice Fixed worker oracle, reviewed and compiled into the image.
contract TrustedVaultTest is VaultFixtureTest {
    function testVulnerableDonationReproduces() public {
        (uint256 shares, uint256 attacker, uint256 victim) = _runAttack(false);
        require(shares == 0 && attacker == 201 && victim == 0, "attack did not reproduce");
    }

    function testPatchedDonationDoesNotReproduce() public {
        (uint256 shares, uint256 attacker, uint256 victim) = _runAttack(true);
        require(shares > 0 && attacker <= ATTACKER_START && victim == 0, "patch rejected by oracle");
    }
}
