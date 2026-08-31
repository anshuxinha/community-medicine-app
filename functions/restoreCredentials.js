const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require("@simplewebauthn/server");

const RP_ID = "community-med-app.firebaseapp.com";
const RP_NAME = "STROMA";
const CHALLENGE_TTL_MS = 10 * 60 * 1000;
const MAX_KEYS_PER_USER = 5;

const originAllowed = (origin) => {
  if (typeof origin !== "string" || !origin) return false;
  if (origin.startsWith("android:apk-key-hash:")) return true;
  if (origin === `https://${RP_ID}`) return true;
  return false;
};

const readClientOrigin = (responseJson) => {
  try {
    const parsed =
      typeof responseJson === "string" ? JSON.parse(responseJson) : responseJson;
    const b64 = parsed?.response?.clientDataJSON;
    if (!b64) return null;
    const padded = b64.replace(/-/g, "+").replace(/_/g, "/");
    const json = Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json).origin || null;
  } catch (_) {
    return null;
  }
};

const challengeDoc = (id) =>
  admin.firestore().collection("restoreChallenges").doc(id);

const credentialCol = () =>
  admin.firestore().collection("restoreCredentials");

const storeChallenge = async (challenge, extra) => {
  await challengeDoc(challenge).set({
    challenge,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAtMs: Date.now() + CHALLENGE_TTL_MS,
    ...extra,
  });
};

const consumeChallenge = async (challenge) => {
  if (!challenge) return null;
  const ref = challengeDoc(challenge);
  const snap = await ref.get();
  if (!snap.exists) return null;
  const data = snap.data() || {};
  await ref.delete().catch(() => {});
  if (data.expiresAtMs && Date.now() > data.expiresAtMs) return null;
  return data;
};

const toWebAuthnCredential = (body) => {
  if (!body) return null;
  return typeof body === "string" ? JSON.parse(body) : body;
};

exports.createRestoreCredentialOptions = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "Sign in to create a restore key.");
  }

  const userRecord = await admin.auth().getUser(uid);
  const existingSnap = await credentialCol().where("uid", "==", uid).get();
  const excludeCredentials = existingSnap.docs.map((docSnap) => ({
    id: docSnap.id,
  }));

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userName: userRecord.email || uid,
    userDisplayName: userRecord.displayName || userRecord.email || uid,
    userID: new TextEncoder().encode(uid),
    attestationType: "none",
    excludeCredentials,
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      residentKey: "required",
      requireResidentKey: true,
      userVerification: "preferred",
    },
    supportedAlgorithmIDs: [-7, -257],
  });

  await storeChallenge(options.challenge, { uid, type: "create" });
  return { requestJson: JSON.stringify(options) };
});

exports.registerRestoreCredential = onCall(async (request) => {
  const uid = request.auth?.uid;
  if (!uid) {
    throw new HttpsError("unauthenticated", "Sign in to register a restore key.");
  }

  const registration = toWebAuthnCredential(request.data?.registrationJson);
  if (!registration) {
    throw new HttpsError("invalid-argument", "registrationJson is required.");
  }

  const origin = readClientOrigin(registration);
  if (!originAllowed(origin)) {
    throw new HttpsError("failed-precondition", "Unexpected credential origin.");
  }

  const clientData = JSON.parse(
    Buffer.from(
      String(registration.response.clientDataJSON).replace(/-/g, "+").replace(/_/g, "/"),
      "base64",
    ).toString("utf8"),
  );
  const challengeRow = await consumeChallenge(clientData.challenge);
  if (!challengeRow || challengeRow.uid !== uid || challengeRow.type !== "create") {
    throw new HttpsError("failed-precondition", "Restore challenge expired.");
  }

  const verification = await verifyRegistrationResponse({
    response: registration,
    expectedChallenge: clientData.challenge,
    expectedOrigin: origin,
    expectedRPID: RP_ID,
    requireUserPresence: false,
    requireUserVerification: false,
  });

  if (!verification.verified || !verification.registrationInfo) {
    throw new HttpsError("failed-precondition", "Could not verify restore key.");
  }

  const info = verification.registrationInfo;
  const credential = info.credential || {};
  const credentialId = credential.id || info.credentialID;
  const publicKey = credential.publicKey || info.credentialPublicKey;
  const counter =
    typeof credential.counter === "number" ? credential.counter : info.counter || 0;

  const id =
    typeof credentialId === "string"
      ? credentialId
      : Buffer.from(credentialId).toString("base64url");
  const publicKeyStored = Buffer.from(publicKey).toString("base64");

  await credentialCol().doc(id).set({
    uid,
    credentialId: id,
    publicKey: publicKeyStored,
    counter,
    kind: "restore",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    lastUsedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  const extras = await credentialCol().where("uid", "==", uid).get();
  if (extras.size > MAX_KEYS_PER_USER) {
    const sorted = extras.docs
      .map((d) => ({ id: d.id, created: d.data()?.createdAt?.toMillis?.() || 0 }))
      .sort((a, b) => a.created - b.created);
    const toDelete = sorted.slice(0, extras.size - MAX_KEYS_PER_USER);
    const batch = admin.firestore().batch();
    toDelete.forEach((row) => batch.delete(credentialCol().doc(row.id)));
    await batch.commit();
  }

  return { ok: true, credentialId: id };
});

exports.getRestoreCredentialOptions = onCall(async () => {
  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    userVerification: "preferred",
  });
  await storeChallenge(options.challenge, { type: "auth" });
  return { requestJson: JSON.stringify(options) };
});

exports.completeRestoreSignIn = onCall(async (request) => {
  const assertion = toWebAuthnCredential(request.data?.assertionJson);
  if (!assertion) {
    throw new HttpsError("invalid-argument", "assertionJson is required.");
  }

  const origin = readClientOrigin(assertion);
  if (!originAllowed(origin)) {
    throw new HttpsError("failed-precondition", "Unexpected credential origin.");
  }

  const clientData = JSON.parse(
    Buffer.from(
      String(assertion.response.clientDataJSON).replace(/-/g, "+").replace(/_/g, "/"),
      "base64",
    ).toString("utf8"),
  );
  const challengeRow = await consumeChallenge(clientData.challenge);
  if (!challengeRow || challengeRow.type !== "auth") {
    throw new HttpsError("failed-precondition", "Restore challenge expired.");
  }

  const credentialId = assertion.id || assertion.rawId;
  if (!credentialId) {
    throw new HttpsError("invalid-argument", "Credential id missing.");
  }
  const credSnap = await credentialCol().doc(credentialId).get();
  if (!credSnap.exists) {
    throw new HttpsError("not-found", "Restore key is not registered.");
  }
  const stored = credSnap.data() || {};
  const publicKey = Buffer.from(stored.publicKey, "base64");

  const verification = await verifyAuthenticationResponse({
    response: assertion,
    expectedChallenge: clientData.challenge,
    expectedOrigin: origin,
    expectedRPID: RP_ID,
    requireUserVerification: false,
    credential: {
      id: stored.credentialId,
      publicKey,
      counter: stored.counter || 0,
    },
  });

  if (!verification.verified) {
    throw new HttpsError("failed-precondition", "Could not verify restore key.");
  }

  const newCounter =
    verification.authenticationInfo?.newCounter ?? (stored.counter || 0);
  const uid = stored.uid;
  const deviceId = String(request.data?.deviceId || "").trim();

  const batch = admin.firestore().batch();
  batch.update(credSnap.ref, {
    counter: newCounter,
    lastUsedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  if (deviceId) {
    batch.set(
      admin.firestore().collection("users").doc(uid),
      { currentDeviceId: deviceId },
      { merge: true },
    );
  }
  await batch.commit();

  const customToken = await admin.auth().createCustomToken(uid);
  return { customToken, uid };
});
