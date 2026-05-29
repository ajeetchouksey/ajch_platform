/**
 * Phase 2 migration: move implementations from src/pages/ into src/features/
 * and convert src/pages/ into thin barrel re-exports pointing to features/.
 * Safe to re-run — idempotent guard skips already-migrated files.
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = join(__dirname, '..', 'src');

const migrations = [
  // blog
  { domain: 'blog',      file: 'Blog'               },
  { domain: 'blog',      file: 'BlogPost'            },
  // exams
  { domain: 'exams',     file: 'ExamCatalog'         },
  { domain: 'exams',     file: 'ExamHome'            },
  { domain: 'exams',     file: 'CcafHome'            },
  { domain: 'exams',     file: 'Quiz'                },
  { domain: 'exams',     file: 'Notes'               },
  { domain: 'exams',     file: 'Scenarios'           },
  { domain: 'exams',     file: 'Progress'            },
  // tools
  { domain: 'tools',     file: 'Tools'               },
  { domain: 'tools',     file: 'TokenCounter'        },
  { domain: 'tools',     file: 'ContextVisualizer'   },
  { domain: 'tools',     file: 'McpScaffold'         },
  { domain: 'tools',     file: 'SystemPromptBuilder' },
  { domain: 'tools',     file: 'ModelCostCalc'       },
  { domain: 'tools',     file: 'ToolSchemaBuilder'   },
  { domain: 'tools',     file: 'RagChunkVisualizer'  },
  { domain: 'tools',     file: 'PromptTester'        },
  { domain: 'tools',     file: 'PromptLibrary'       },
  // analytics
  { domain: 'analytics', file: 'Analytics'           },
  { domain: 'analytics', file: 'Maintainer'          },
  { domain: 'analytics', file: 'MaintainerDashboard' },
  // profile
  { domain: 'profile',   file: 'Profile'             },
  { domain: 'profile',   file: 'TeamV2'              },
  // home
  { domain: 'home',      file: 'HomeV2'              },
];

const enc = 'utf8';
let migrated = 0, skipped = 0, alreadyDone = 0;

for (const { domain, file } of migrations) {
  const pagePath    = join(src, 'pages',    `${file}.tsx`);
  const featurePath = join(src, 'features', domain, 'pages', `${file}.tsx`);

  if (!existsSync(pagePath)) {
    console.warn(`  SKIP (no pages/${file}.tsx)`);
    skipped++;
    continue;
  }
  if (!existsSync(featurePath)) {
    console.warn(`  SKIP (no features/${domain}/pages/${file}.tsx)`);
    skipped++;
    continue;
  }

  const featureCurrent = readFileSync(featurePath, enc).trim();
  // Guard: only migrate if the feature file is still the old barrel
  if (!featureCurrent.startsWith(`export { default } from '@/pages/`)) {
    console.log(`  DONE  ${file} (already migrated)`);
    alreadyDone++;
    continue;
  }

  const impl = readFileSync(pagePath, enc);

  // 1. Move implementation → features/domain/pages/X.tsx
  writeFileSync(featurePath, impl, enc);

  // 2. Replace pages/X.tsx with thin reverse barrel
  writeFileSync(pagePath, `export { default } from '@/features/${domain}/pages/${file}';\n`, enc);

  console.log(`  OK    ${file.padEnd(24)} → features/${domain}/pages/${file}.tsx`);
  migrated++;
}

console.log(`\nResult: ${migrated} migrated, ${alreadyDone} already done, ${skipped} skipped.`);
