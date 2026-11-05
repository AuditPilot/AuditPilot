/**
 * Dev-only visual-test seed: one fixed user + rich fixtures so the dashboard
 * dark theme can be screenshot-verified without a GitHub login.
 *
 * Fixed IDs (any 24-hex words work — client code treats them as opaque):
 *   user   690000000000000000000001
 *   audit  6900000000000000000000a1
 *   ...
 */
const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/audit-pilot";

const USER_ID = "690000000000000000000001";
const AUDIT_CODE = "6900000000000000000000a1";
const AUDIT_SECOND = "6900000000000000000000a2";
const ITEM_PREFIX = "690000000000000000000b0";

const CODE_DIFF = {
  auth: {
    file: "server/middleware/auth.ts",
    line: 42,
    old: `const token = req.headers.authorization?.split(" ")[1];\nconsole.log("token", token); // debug`,
    new: `const token = (req.cookies?.[AUTH_COOKIE] as string) || bearer;`,
  },
  inject: {
    file: "server/lib/sanitize.ts",
    line: 15,
    old: `const q = \`SELECT * FROM users WHERE name = '\${name}'\`;`,
    new: `const user = await db.users.findOne({ name: { $eq: name } });`,
  },
  perf: {
    file: "server/routes/imports.ts",
    line: 120,
    old: `for (const file of files) {\n  rows.push(await parseCSV(file));\n}`,
    new: `const rows = await Promise.all(files.map((f) => parseCSV(f)));`,
  },
};

function segs(lines, kind, start) {
  return { kind, startLine: start, lines };
}

async function main() {
  await mongoose.connect(MONGO_URI);

  const users = mongoose.connection.collection("users");
  const audits = mongoose.connection.collection("audits");
  const audititems = mongoose.connection.collection("audititems");
  const draftprs = mongoose.connection.collection("draftprs");
  const audithistories = mongoose.connection.collection("audithistories");
  const usagerecords = mongoose.connection.collection("usagerecords");

  // --- user ---
  await users.deleteMany({ _id: new mongoose.Types.ObjectId(USER_ID) });
  await users.insertOne({
    _id: new mongoose.Types.ObjectId(USER_ID),
    githubId: "1234567",
    username: "aurora-dev",
    displayName: "Aurora Dev",
    email: "dev@auditpilot.local",
    plan: "pro",
    auditsUsed: 0,
    pullRequestsUsed: 0,
    lastLogin: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  console.log("user seeded");

  // usage records for this month (used by auth-status audit counters)
  const now = new Date();
  const period = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  await usagerecords.deleteMany({ userId: new mongoose.Types.ObjectId(USER_ID) });
  await usagerecords.insertMany([
    { userId: new mongoose.Types.ObjectId(USER_ID), action: "audit", period, count: 1, createdAt: now, updatedAt: now },
    { userId: new mongoose.Types.ObjectId(USER_ID), action: "pr-review", period, count: 1, createdAt: now, updatedAt: now },
  ]);

  // --- audits ---
  await audits.deleteMany({ _id: { $in: [new mongoose.Types.ObjectId(AUDIT_CODE), new mongoose.Types.ObjectId(AUDIT_SECOND)] } });
  await audits.insertMany([
    {
      _id: new mongoose.Types.ObjectId(AUDIT_CODE),
      userId: new mongoose.Types.ObjectId(USER_ID),
      title: "Security & performance audit — aurora-storefront",
      description: "Full DeepScan of aurora-storefront @ main",
      status: "completed",
      priority: "high",
      branch: "main",
      createdAt: new Date(Date.now() - 3600e3),
      updatedAt: new Date(Date.now() - 3600e3),
    },
    {
      _id: new mongoose.Types.ObjectId(AUDIT_SECOND),
      userId: new mongoose.Types.ObjectId(USER_ID),
      title: "Security & performance audit — billing-service",
      description: "Full DeepScan of billing-service @ develop",
      status: "completed",
      priority: "critical",
      branch: "develop",
      createdAt: new Date(Date.now() - 86400e3),
      updatedAt: new Date(Date.now() - 86400e3),
    },
  ]);

  // --- audit items (shape mirrors AuditItem schema: label/type/value/severity/old_code/new_code) ---
  await audititems.deleteMany({ auditId: { $in: [new mongoose.Types.ObjectId(AUDIT_CODE), new mongoose.Types.ObjectId(AUDIT_SECOND)] } });
  await audititems.insertMany([
    {
      _id: new mongoose.Types.ObjectId(ITEM_PREFIX + "1"),
      auditId: new mongoose.Types.ObjectId(AUDIT_CODE),
      label: "Authorization header token logged in plaintext",
      type: "security",
      value: "server/middleware/auth.ts",
      severity: "critical",
      old_code: CODE_DIFF.auth.old,
      new_code: CODE_DIFF.auth.new,
    },
    {
      _id: new mongoose.Types.ObjectId(ITEM_PREFIX + "2"),
      auditId: new mongoose.Types.ObjectId(AUDIT_CODE),
      label: "SQL string concatenation allows injection",
      type: "security",
      value: "server/lib/sanitize.ts",
      severity: "critical",
      old_code: CODE_DIFF.inject.old,
      new_code: CODE_DIFF.inject.new,
    },
    {
      _id: new mongoose.Types.ObjectId(ITEM_PREFIX + "3"),
      auditId: new mongoose.Types.ObjectId(AUDIT_CODE),
      label: "Sequential await in a loop slows imports",
      type: "performance",
      value: "server/routes/imports.ts",
      severity: "high",
      old_code: CODE_DIFF.perf.old,
      new_code: CODE_DIFF.perf.new,
    },
    {
      _id: new mongoose.Types.ObjectId(ITEM_PREFIX + "4"),
      auditId: new mongoose.Types.ObjectId(AUDIT_CODE),
      label: "No maxLength bound on user-supplied note field",
      type: "security",
      value: "server/routes/notes.ts",
      severity: "medium",
      old_code: "",
      new_code: "",
    },
    // second audit item (for results variety)
    {
      _id: new mongoose.Types.ObjectId(ITEM_PREFIX + "5"),
      auditId: new mongoose.Types.ObjectId(AUDIT_SECOND),
      label: "Webhook secret compared with == (timing attack)",
      type: "security",
      value: "server/integrations/stripe/verify.ts",
      severity: "critical",
      old_code: `if (sig === expected) { ... }`,
      new_code: `const ok = ST.timingSafeEqual(Buffer.from(sig), Buffer.from(expected));`,
    },
  ]);

  // --- PR-manager draft + audit history ---
  await draftprs.deleteMany({});
  await audithistories.deleteMany({});
  const pid = new mongoose.Types.ObjectId();
  await draftprs.insertOne({
    _id: pid,
    userId: new mongoose.Types.ObjectId(USER_ID),
    title: "Fix critical findings in server/middleware",
    description: "Auth header logging + injection hardening.",
    owner: "aurora-dev",
    repo: "storefront",
    targetBranch: "main",
    filesChanged: [
      {
        fileName: "server/middleware/auth.ts",
        oldCode: CODE_DIFF.auth.old,
        newCode: CODE_DIFF.auth.new,
        status: "edited",
      },
      {
        fileName: "server/lib/sanitize.ts",
        oldCode: CODE_DIFF.inject.old,
        newCode: CODE_DIFF.inject.new,
        status: "pending",
      },
    ],
    createdAt: new Date(Date.now() - 7200e3),
    updatedAt: new Date(Date.now() - 7200e3),
  });
  await audithistories.insertOne({
    userId: new mongoose.Types.ObjectId(USER_ID),
    prId: "42",
    prUrl: "https://github.com/aurora-dev/storefront/pull/42",
    aiFixSummary: "Removed debug logging that leaked Authorization tokens.",
    changes: [
      {
        fileName: "server/middleware/auth.ts",
        lineNumbers: [41, 42],
        oldCode: CODE_DIFF.auth.old,
        newCode: CODE_DIFF.auth.new,
      },
    ],
    createdAt: new Date(Date.now() - 86400e3),
    updatedAt: new Date(Date.now() - 86400e3),
  });

  console.log("seed complete:", { USER_ID, AUDIT_CODE, AUDIT_SECOND });
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
