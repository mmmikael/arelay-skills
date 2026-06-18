/**
 * Format-compatibility guard for the skill's vendored envelope crypto.
 *
 * The skill carries a dependency-free copy of the Agent Relay envelope format
 * so it runs with plain `node`. This test locks that copy to the spec: it
 * encrypts with the skill's own functions, then decrypts with an INDEPENDENT
 * reference implementation of P-256-ECDH-A256GCM (the same algorithm
 * @arelay/core implements). If the skill's encrypt ever drifts — wrong curve,
 * renamed envelope fields, padded base64, bad IV handling — the round-trip
 * breaks here instead of silently producing deliveries no one can decrypt.
 *
 * Run: node --test skills/agent-relay/scripts/lib/e2ee.test.mjs
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';

import { encryptBytes, encryptString, splitEnvelopeForArtifact } from './e2ee.mjs';

const TEXT_DECODER = new TextDecoder();

function base64UrlToBytes(value) {
	return new Uint8Array(Buffer.from(value, 'base64url'));
}

function toArrayBuffer(bytes) {
	return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

/** Generate a recipient keyring the way the portal does (P-256 ECDH, jwk public). */
async function recipientKeyPair() {
	const keyPair = await webcrypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, [
		'deriveKey'
	]);
	const publicKeyJwk = await webcrypto.subtle.exportKey('jwk', keyPair.publicKey);
	return { publicKeyJwk, privateKey: keyPair.privateKey };
}

/** Independent decryptor — the inverse of the documented envelope spec. */
async function referenceDecrypt(envelope, recipientPrivateKey) {
	assert.equal(envelope.v, 1, 'envelope version must be 1');
	assert.equal(envelope.alg, 'P-256-ECDH-A256GCM', 'unexpected envelope alg');

	const ephemeralPublicKey = await webcrypto.subtle.importKey(
		'jwk',
		{ kty: envelope.epk.kty, crv: envelope.epk.crv, x: envelope.epk.x, y: envelope.epk.y },
		{ name: 'ECDH', namedCurve: 'P-256' },
		true,
		[]
	);
	const contentKey = await webcrypto.subtle.deriveKey(
		{ name: 'ECDH', public: ephemeralPublicKey },
		recipientPrivateKey,
		{ name: 'AES-GCM', length: 256 },
		false,
		['decrypt']
	);
	const plaintext = await webcrypto.subtle.decrypt(
		{ name: 'AES-GCM', iv: toArrayBuffer(base64UrlToBytes(envelope.iv)) },
		contentKey,
		toArrayBuffer(base64UrlToBytes(envelope.ciphertext))
	);
	return new Uint8Array(plaintext);
}

test('encryptString produces an envelope the reference decryptor can read', async () => {
	const { publicKeyJwk, privateKey } = await recipientKeyPair();
	const envelope = await encryptString('Quarterly report ready', publicKeyJwk);

	assert.equal(envelope.v, 1);
	assert.equal(envelope.alg, 'P-256-ECDH-A256GCM');
	assert.equal(envelope.epk.kty, 'EC');
	assert.equal(envelope.epk.crv, 'P-256');
	assert.ok(!('ciphertextBytes' in envelope), 'string envelope must not leak raw bytes');

	const plaintext = await referenceDecrypt(envelope, privateKey);
	assert.equal(TEXT_DECODER.decode(plaintext), 'Quarterly report ready');
});

test('encryptBytes round-trips arbitrary binary content', async () => {
	const { publicKeyJwk, privateKey } = await recipientKeyPair();
	const bytes = webcrypto.getRandomValues(new Uint8Array(4096));
	const envelope = await encryptBytes(bytes, publicKeyJwk);

	const plaintext = await referenceDecrypt(envelope, privateKey);
	assert.deepEqual(plaintext, bytes);
});

test('envelope fields use unpadded base64url', async () => {
	const { publicKeyJwk } = await recipientKeyPair();
	const envelope = await encryptString('x', publicKeyJwk);
	for (const value of [envelope.iv, envelope.ciphertext]) {
		assert.match(value, /^[A-Za-z0-9_-]+$/, 'must be unpadded base64url');
	}
});

test('splitEnvelopeForArtifact yields decryptable payload + ciphertext', async () => {
	const { publicKeyJwk, privateKey } = await recipientKeyPair();
	const body = new TextEncoder().encode('# Hello\n\nBody');
	const envelope = await encryptBytes(body, publicKeyJwk);
	const { encrypted_payload, ciphertext_base64, size_bytes } = splitEnvelopeForArtifact(envelope);

	assert.ok(!('ciphertext' in encrypted_payload), 'payload metadata must omit inline ciphertext');
	assert.equal(encrypted_payload.alg, 'P-256-ECDH-A256GCM');
	// AES-GCM: plaintext length + 16-byte tag.
	assert.equal(size_bytes, body.byteLength + 16);

	const reassembled = { ...encrypted_payload, ciphertext: ciphertext_base64 };
	const plaintext = await referenceDecrypt(reassembled, privateKey);
	assert.equal(TEXT_DECODER.decode(plaintext), '# Hello\n\nBody');
});
