// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.20;

struct PreimageProofOutput {
    bytes32 dataHash;
    bool isValid;
}

struct TransferValidityProofOutput {
    bytes32 oldDataHash;
    bytes32 newDataHash;
    bytes pubKey;
    bytes16 sealedKey;
    bool isValid;
}

interface IERC7857DataVerifier {
    /// @notice Verify preimage of data
    /// @param proofs Proof of data ownership
    /// @return Output of the preimage proof verification
    function verifyPreimage(
        bytes[] calldata proofs
    ) external view returns (PreimageProofOutput[] memory);

    /// @notice Verify data transfer validity
    /// @param proofs Proof of data transfer validity
    /// @return Output of the transfer validity proof verification
    function verifyTransferValidity(
        bytes[] calldata proofs
    ) external view returns (TransferValidityProofOutput[] memory);
} 