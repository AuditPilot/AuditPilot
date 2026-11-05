import { build as viteBuild } from "vite";

viteBuild().catch((err) => {
  console.error(err);
  process.exit(1);
});
