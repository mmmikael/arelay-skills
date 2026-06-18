/**
 * Submit an E2EE email draft for human review (Email Review Relay).
 * Envelope format matches @arelay/core (the published reference) — do not hand-roll ECDH/HKDF.
 *
 * Usage:
 *   AGENT_RELAY_URL=https://arelay.app AGENT_API_TOKEN=ar_... \
 *     node e2ee-email-draft.mjs recipient@example.com "Subject" "<p>HTML body</p>" "Plain text"
 */
import {
	agentFetch,
	defaultRelayUrl,
	encryptString,
	fetchE2eeConfig
} from './lib/e2ee.mjs';

const relayUrl = defaultRelayUrl();
const apiToken = process.env.AGENT_API_TOKEN;
if (!apiToken) {
	console.error('AGENT_API_TOKEN is required');
	process.exit(1);
}

const toAddress = process.argv[2] ?? process.env.TEST_EMAIL_TO;
const fromEmail = process.env.TEST_EMAIL_FROM ?? 'no-reply@arelay.app';
const fromName = process.env.TEST_EMAIL_FROM_NAME ?? 'Agent Relay';
const subject = process.argv[3] ?? 'Encrypted email draft';
const html =
	process.argv[4] ??
	'<p>This is an <strong>encrypted</strong> email draft submitted by <code>e2ee-email-draft.mjs</code>.</p>';
const text =
	process.argv[5] ??
	'Encrypted email draft. Open the portal to preview the HTML body and approve or reject.';

if (!toAddress) {
	console.error('Recipient required: pass as first arg or set TEST_EMAIL_TO');
	process.exit(1);
}

const { publicKeyJwk } = await fetchE2eeConfig(relayUrl, apiToken);

const result = await agentFetch(relayUrl, apiToken, '/api/agent/email-drafts', {
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify({
		encrypted: true,
		encrypted_to: await encryptString(toAddress, publicKeyJwk),
		encrypted_from_email: await encryptString(fromEmail, publicKeyJwk),
		encrypted_from_name: await encryptString(fromName, publicKeyJwk),
		encrypted_subject: await encryptString(subject, publicKeyJwk),
		encrypted_html: await encryptString(html, publicKeyJwk),
		encrypted_text: await encryptString(text, publicKeyJwk),
		encrypted_session_summary: await encryptString(`To: ${toAddress}`, publicKeyJwk)
	})
});

const portalUrl = `${relayUrl}/portal/${result.session.id}`;
console.log(
	JSON.stringify(
		{
			sessionId: result.session.id,
			draftId: result.draft.id,
			status: result.draft.status,
			portalUrl,
			nextStep:
				'Human opens portalUrl, unlocks E2EE, previews HTML, then Approve (send) or Reject.'
		},
		null,
		2
	)
);
