import { execFileSync } from 'node:child_process';

const run = (command: string, args: string[], env: Record<string, string> = {}) => {
  console.log(`\n>>> ${command} ${args.join(' ')}\n`);

  execFileSync(command, args, {
    env: { ...process.env, ...env },
    stdio: 'inherit',
  });
};

const buildSpa = (env: Record<string, string>, heapSizeMb: number) => {
  run('pnpm', ['exec', 'vite', 'build'], {
    NODE_OPTIONS: `--max-old-space-size=${heapSizeMb}`,
    ...env,
  });
};

// Keep each compiler below the Vercel Hobby memory limit and release its heap
// before starting the next build target.
buildSpa({}, 6144);
buildSpa({ AUTH: 'true' }, 5120);
buildSpa({ SPA_TARGET: 'workbench' }, 5120);
buildSpa({ MOBILE: 'true' }, 4096);

run('pnpm', ['exec', 'tsx', 'scripts/copySpaBuild.mts']);
run('pnpm', ['exec', 'tsx', 'scripts/generateSpaTemplates.mts']);
run('pnpm', ['exec', 'next', 'build'], {
  NODE_OPTIONS: '--max-old-space-size=5120',
});
run('pnpm', ['exec', 'tsx', 'scripts/migrateServerDB/index.ts'], {
  MIGRATION_DB: '1',
});
