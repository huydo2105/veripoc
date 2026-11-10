// SPDX-License-Identifier: MIT
pragma solidity 0.8.24;

import {MockAsset} from "../contracts/evm/MockAsset.sol";
import {FixtureVault, VulnerableVault, PatchedVault} from "../contracts/evm/FixtureVault.sol";

contract VaultActor {
    function approve(MockAsset token, FixtureVault vault) external {
        token.approve(address(vault), type(uint256).max);
    }

    function deposit(FixtureVault vault, uint256 amount) external returns (uint256) {
        return vault.deposit(amount, address(this));
    }

    function donate(MockAsset token, FixtureVault vault, uint256 amount) external {
        require(token.transfer(address(vault), amount), "donation failed");
    }

    function redeem(FixtureVault vault, uint256 shares) external returns (uint256) {
        return vault.redeem(shares, address(this));
    }
}

/// @notice Independent balance and share oracles for two locally controlled targets.
contract VaultFixtureTest {
    uint256 internal constant ATTACKER_START = 101;
    uint256 internal constant VICTIM_START = 100;

    function testDonationAttackReproducesOnlyOnVulnerableVault() public {
        (uint256 vulnerableVictimShares, uint256 vulnerableAttackerEnd, uint256 vulnerableVictimEnd) =
            _runAttack(false);
        require(vulnerableVictimShares == 0, "victim should receive zero shares");
        require(vulnerableAttackerEnd == 201, "attacker should capture victim deposit");
        require(vulnerableVictimEnd == 0, "victim balance should be lost");

        (uint256 patchedVictimShares, uint256 patchedAttackerEnd, uint256 patchedVictimEnd) =
            _runAttack(true);
        require(patchedVictimShares > 0, "patched vault must issue victim shares");
        require(patchedAttackerEnd <= ATTACKER_START, "patched attacker must not profit");
        require(patchedVictimEnd == 0, "victim has deposited, not redeemed");
    }

    function testFuzzHonestRoundTrip(uint64 amount) public {
        if (amount == 0) return;
        _honestRoundTrip(new VulnerableVault(new MockAsset()), amount);
        _honestRoundTrip(new PatchedVault(new MockAsset()), amount);
    }

    function _honestRoundTrip(FixtureVault vault, uint256 amount) internal {
        MockAsset token = vault.asset();
        VaultActor depositor = new VaultActor();
        token.mint(address(depositor), amount);
        depositor.approve(token, vault);
        uint256 shares = depositor.deposit(vault, amount);
        require(shares > 0 && shares == vault.balanceOf(address(depositor)), "share accounting");
        require(vault.totalAssets() == amount, "asset accounting");
        depositor.redeem(vault, shares);
        require(token.balanceOf(address(depositor)) == amount, "round trip balance");
        require(vault.totalSupply() == 0, "shares remain");
    }

    function _runAttack(bool patched) internal returns (uint256, uint256, uint256) {
        MockAsset token = new MockAsset();
        FixtureVault vault = patched ? FixtureVault(new PatchedVault(token)) : FixtureVault(new VulnerableVault(token));
        VaultActor attacker = new VaultActor();
        VaultActor victim = new VaultActor();
        token.mint(address(attacker), ATTACKER_START);
        token.mint(address(victim), VICTIM_START);
        attacker.approve(token, vault);
        victim.approve(token, vault);
        require(attacker.deposit(vault, 1) > 0, "seed failed");
        attacker.donate(token, vault, 100);
        require(vault.totalAssets() == 101, "donation accounting");
        uint256 victimShares = victim.deposit(vault, 100);
        require(vault.totalAssets() == 201, "deposit accounting");
        attacker.redeem(vault, vault.balanceOf(address(attacker)));
        return (victimShares, token.balanceOf(address(attacker)), token.balanceOf(address(victim)));
    }
}
