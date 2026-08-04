/**
 * Rename historical preview/poster images that contain Chinese characters
 * to pinyin letter-based file names. Does not modify data.json.
 *
 * Usage:
 *   node scripts/rename-images.mjs          # apply renames
 *   node scripts/rename-images.mjs --dry-run  # preview only
 */
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { toImageName } from './utils.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const imagesDir = path.join(__dirname, '../docs/images');
const dryRun = process.argv.includes('--dry-run');

const CJK_PATTERN = /[\u3400-\u9fff]/;

function hasCJK(str) {
  return CJK_PATTERN.test(str);
}

async function main() {
  if (!(await fs.pathExists(imagesDir))) {
    console.error(`Images directory not found: ${imagesDir}`);
    process.exit(1);
  }

  const files = (await fs.readdir(imagesDir)).filter((f) => /\.(jpe?g|png|webp|gif)$/i.test(f));
  const suffixRe = /^(.+)-(poster|preview)(\.[^.]+)$/;

  /** @type {Array<{ from: string, to: string }>} */
  const renames = [];
  /** @type {string[]} */
  const skipped = [];

  for (const file of files) {
    const match = file.match(suffixRe);
    if (!match) continue;
    const [, baseName, kind, ext] = match;
    if (!hasCJK(baseName)) continue;

    const targetBase = toImageName(baseName);
    if (!targetBase || targetBase === baseName) continue;

    const from = path.join(imagesDir, file);
    const toName = `${targetBase}-${kind}${ext}`;
    const to = path.join(imagesDir, toName);

    if (await fs.pathExists(to)) {
      skipped.push(`${file} -> ${toName} (target exists)`);
      if (!dryRun) {
        await fs.remove(from);
        console.log(`  removed leftover CJK file (target exists): ${file}`);
      }
      continue;
    }

    renames.push({ from: file, to: toName });
    if (!dryRun) {
      await fs.move(from, to);
    }
  }

  console.log('');
  console.log(dryRun ? '=== DRY RUN ===' : '=== DONE ===');
  console.log(`image renames: ${renames.length}`);
  if (renames.length) {
    for (const { from, to } of renames.slice(0, 40)) {
      console.log(`  ${from}  =>  ${to}`);
    }
    if (renames.length > 40) console.log(`  ... and ${renames.length - 40} more`);
  }
  if (skipped.length) {
    console.log(`skipped (target exists): ${skipped.length}`);
    for (const s of skipped.slice(0, 20)) console.log(`  ${s}`);
    if (skipped.length > 20) console.log(`  ... and ${skipped.length - 20} more`);
  }
  if (dryRun) {
    console.log('\nRe-run without --dry-run to apply changes.');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
