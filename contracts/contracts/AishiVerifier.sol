// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IERC7857DataVerifier.sol";

/// @title AishiVerifier - Simplified verifier for Aishi testing
/// @notice This is a simplified verifier that accepts all proofs for testing purposes
/// @dev In production, this would be replaced with proper TEE or ZKP verification
contract AishiVerifier is IERC7857DataVerifier {
    
    /// @notice Verify preimage of data (simplified for testing)
    /// @param proofs Array of data hashes to verify
    /// @return outputs Array of verification results
    function verifyPreimage(
        bytes[] calldata proofs
    ) external pure override returns (PreimageProofOutput[] memory outputs) {
        outputs = new PreimageProofOutput[](proofs.length);
        
        for (uint256 i = 0; i < proofs.length; i++) {
            require(proofs[i].length == 32, "Invalid data hash length");
            bytes32 dataHash = bytes32(proofs[i]);
            
            // Simplified: accept all valid-length hashes
            outputs[i] = PreimageProofOutput({
                dataHash: dataHash,
                isValid: true
            });
        }
        
        return outputs;
    }

    /// @notice Verify data transfer validity (simplified for testing)
    /// @param proofs Array of transfer proofs
    /// @return outputs Array of transfer verification results
    function verifyTransferValidity(
        bytes[] calldata proofs
    ) external pure override returns (TransferValidityProofOutput[] memory outputs) {
        outputs = new TransferValidityProofOutput[](proofs.length);
        
        for (uint256 i = 0; i < proofs.length; i++) {
            // Expect 144 bytes: oldHash(32) + newHash(32) + pubKey(64) + sealedKey(16)
            require(proofs[i].length == 144, "Invalid proof length");
            
            bytes32 oldHash = bytes32(proofs[i][0:32]);
            bytes32 newHash = bytes32(proofs[i][32:64]);
            bytes memory pubKey = proofs[i][64:128];
            bytes16 sealedKey = bytes16(proofs[i][128:144]);
            
            // Simplified: accept all properly formatted proofs
            outputs[i] = TransferValidityProofOutput({
                oldDataHash: oldHash,
                newDataHash: newHash,
                pubKey: pubKey,
                sealedKey: sealedKey,
                isValid: true
            });
        }
        
        return outputs;
    }
} 