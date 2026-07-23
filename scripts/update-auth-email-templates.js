/**
 * Update Firebase Auth email branding for STROMA.
 * 1) Tries Identity Toolkit email template PATCH
 * 2) Falls back to Firebase project displayName (drives %APP_NAME%)
 *
 * Usage: node scripts/update-auth-email-templates.js
 * Requires: serviceAccountKey.json at repo root
 */
const fs = require("fs");
const path = require("path");
const { JWT } = require("google-auth-library");

const PROJECT_ID = "community-med-app";
const saPath = path.join(__dirname, "..", "serviceAccountKey.json");

const RESET_BODY = [
  "<p>Hello,</p>",
  "<p>We received a request to reset the password for your STROMA account (%EMAIL%).</p>",
  "<p><a href='%LINK%'>Reset your password</a></p>",
  "<p>If the link does not work, copy and paste this URL into your browser:</p>",
  "<p>%LINK%</p>",
  "<p>If you did not request a password reset, you can ignore this email — your password will stay the same.</p>",
  "<p>Thanks,<br/>The STROMA team</p>",
].join("\n");

async function getToken(sa) {
  const client = new JWT({
    email: sa.client_email,
    key: sa.private_key,
    scopes: [
      "https://www.googleapis.com/auth/identitytoolkit",
      "https://www.googleapis.com/auth/cloud-platform",
      "https://www.googleapis.com/auth/firebase",
    ],
  });
  const { token } = await client.getAccessToken();
  return token;
}

async function patchResetTemplate(token) {
  const attempts = [
    {
      label: "full template + display name",
      updateMask: "notification.sendEmail.resetPasswordTemplate",
      body: {
        notification: {
          sendEmail: {
            resetPasswordTemplate: {
              senderLocalPart: "noreply",
              senderDisplayName: "STROMA",
              subject: "Reset your STROMA password",
              body: RESET_BODY,
              bodyFormat: "HTML",
              replyTo: "noreply",
              customized: true,
            },
          },
        },
      },
    },
    {
      label: "subject + body only",
      updateMask: "notification.sendEmail.resetPasswordTemplate",
      body: {
        notification: {
          sendEmail: {
            resetPasswordTemplate: {
              senderLocalPart: "noreply",
              subject: "Reset your STROMA password",
              body: RESET_BODY,
              bodyFormat: "HTML",
              replyTo: "noreply",
            },
          },
        },
      },
    },
    {
      label: "subject only",
      updateMask: "notification.sendEmail.resetPasswordTemplate.subject",
      body: {
        notification: {
          sendEmail: {
            resetPasswordTemplate: {
              subject: "Reset your STROMA password",
            },
          },
        },
      },
    },
  ];

  for (const attempt of attempts) {
    const url =
      `https://identitytoolkit.googleapis.com/admin/v2/projects/${PROJECT_ID}/config` +
      `?updateMask=${encodeURIComponent(attempt.updateMask)}`;
    const res = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(attempt.body),
    });
    const text = await res.text();
    console.log(`[template] ${attempt.label}: ${res.status}`);
    if (res.ok) {
      const json = JSON.parse(text);
      const tpl = json?.notification?.sendEmail?.resetPasswordTemplate;
      console.log("  subject:", tpl?.subject);
      console.log("  senderDisplayName:", tpl?.senderDisplayName);
      return true;
    }
    console.log(" ", text.slice(0, 300));
  }
  return false;
}

async function updateProjectDisplayName(token) {
  // Firebase Management API — public-facing name used as %APP_NAME% in Auth emails
  const getRes = await fetch(
    `https://firebase.googleapis.com/v1beta1/projects/${PROJECT_ID}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const getText = await getRes.text();
  console.log("[project] GET", getRes.status, getText.slice(0, 500));
  if (!getRes.ok) return false;

  const current = JSON.parse(getText);
  if (current.displayName === "STROMA") {
    console.log("[project] displayName already STROMA");
    return true;
  }

  const patchRes = await fetch(
    `https://firebase.googleapis.com/v1beta1/projects/${PROJECT_ID}?updateMask=displayName`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ displayName: "STROMA" }),
    },
  );
  const patchText = await patchRes.text();
  console.log("[project] PATCH displayName", patchRes.status, patchText.slice(0, 500));
  return patchRes.ok;
}

async function main() {
  if (!fs.existsSync(saPath)) {
    console.error("Missing serviceAccountKey.json at project root.");
    process.exit(1);
  }
  const sa = JSON.parse(fs.readFileSync(saPath, "utf8"));
  const token = await getToken(sa);

  const templateOk = await patchResetTemplate(token);
  const nameOk = await updateProjectDisplayName(token);

  console.log("\n--- Summary ---");
  console.log("Template API update:", templateOk ? "OK" : "BLOCKED (use Console)");
  console.log("Project displayName STROMA:", nameOk ? "OK" : "FAILED");
  console.log(
    "\nSpam note: method is DEFAULT (Firebase shared IP). Deliverability improves with",
  );
  console.log(
    "custom domain verification + SPF/DKIM/DMARC, or custom SMTP (typically Blaze).",
  );

  if (!templateOk && !nameOk) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
