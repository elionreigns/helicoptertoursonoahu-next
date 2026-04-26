/**
 * `next build` fails when the project path contains `#` (webpack treats it as a URL
 * fragment for ?__next_metadata__ imports). On Windows, map the folder to a drive
 * letter with SUBST, then build, then unmap.
 */
const { execFileSync, spawnSync } = require("child_process");
const fs = require("fs");

const cwd = process.cwd();

function runNextBuild() {
  const r = spawnSync("npx", ["next", "build", "--webpack"], {
    stdio: "inherit",
    shell: true,
    cwd,
  });
  process.exit(r.status === null ? 1 : r.status);
}

if (process.platform !== "win32" || !cwd.includes("#")) {
  runNextBuild();
}

// Find a free drive letter (prefer Z: downward).
for (let code = 90; code >= 68; code--) {
  const letter = String.fromCharCode(code);
  const testRoot = letter + ":\\";
  try {
    if (fs.existsSync(testRoot)) continue;
  } catch {
    /* drive letter may be invalid on some systems */
  }
  try {
    execFileSync("subst", [`${letter}:`, cwd], { stdio: "inherit" });
    const r = spawnSync("npx", ["next", "build", "--webpack"], {
      stdio: "inherit",
      shell: true,
      cwd: `${letter}:`,
    });
    const status = r.status === null ? 1 : r.status;
    try {
      execFileSync("subst", [`${letter}:`, "/d"], { stdio: "inherit" });
    } catch (e) {
      console.error("Warning: could not subst /d for drive " + letter);
    }
    process.exit(status);
  } catch (e) {
    continue;
  }
}

console.error("next-build.cjs: no free drive letter for SUBST; rename the project folder to remove # from the path, or run: subst Z: <this-folder>  then  Z:  then  npx next build --webpack");
process.exit(1);
