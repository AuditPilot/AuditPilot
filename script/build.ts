import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile } from "fs/promises";

// server deps to bundle (everything else is external and loaded from node_modules)
const allowlist = [
  "date-fns",
  "express",
  "jsonwebtoken",
  "openai",
  "stripe",
  "zod",
  "zod-validation-error",
];

async function buildClient() {
  console.log("building client...");
  await viteBuild();
}

async function buildServer() {
  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    logLevel: "info",
  });
}

/**
 * `build.ts` builds client + server fresh.
 * `build.ts client` / `build.ts server` rebuilds just one artifact — used by
 * the split Dockerfiles (Dockerfile.server / Dockerfile.client) so each
 * image only builds what it deploys.
 */
type Segment = "client" | "server";

async function buildAll(segment?: Segment) {
  if (!segment) {
    await rm("dist", { recursive: true, force: true });
    await buildClient();
    await buildServer();
    return;
  }

  if (segment === "client") {
    await rm("dist/public", { recursive: true, force: true });
    await buildClient();
    return;
  }

  await rm("dist/index.cjs", { force: true });
  await buildServer();
}

const arg = process.argv[2];
const segment = arg === "client" || arg === "server" ? (arg as Segment) : undefined;

buildAll(segment).catch((err) => {
  console.error(err);
  process.exit(1);
});
