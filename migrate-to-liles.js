// migrate-to-liles.js
// Run with: node migrate-to-liles.js [--dry-run]
//
// What it does:
// 1. Renames .json and .ll files to .lile
// 2. Ensures every lile is in a folder of the same name
// 3. For non-entity files: splits into slim pointer + @verfassung.lile
//    e.g. ui/grains/counter.json becomes:
//      ui/grains/counter/counter.lile      (slim pointer with iddress + default)
//      ui/grains/counter/@verfassung.lile   (actual content)
// 4. Skips connections/, connection_log/, options/ (vespid migration separate)
// 5. Files already under @entity folders stay as-is (already entity-specific)
// 6. Files starting with @ stay as-is (entity variants)

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve('D:\\prozess\\verfassung');
const DRY_RUN = process.argv.includes('--dry-run');

const SKIP_DIRS = new Set(['connections', 'connection_log', 'options', '.git', 'node_modules', '.vscode']);
const SKIP_EXTENSIONS = new Set(['.md', '.js']);

let stats = { pointers: 0, verfassung: 0, renamed: 0, moved: 0, mkdir: 0, skipped: 0, already_ok: 0 };

function log(action, msg) {
    const prefix = DRY_RUN ? '[DRY] ' : '';
    console.log(`  ${prefix}${action.padEnd(10)} ${msg}`);
}

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        if (!DRY_RUN) fs.mkdirSync(dir, { recursive: true });
        log('MKDIR', dir);
        stats.mkdir++;
    }
}

// Check if any ancestor folder starts with @
function isInsideEntityFolder(filePath) {
    const rel = path.relative(ROOT, filePath);
    const parts = rel.split(path.sep);
    // Check all parts except the filename itself
    for (let i = 0; i < parts.length - 1; i++) {
        if (parts[i].startsWith('@')) return true;
    }
    return false;
}

// Build iddress from file path relative to ROOT
// D:\prozess\verfassung\ui\grains\counter.json → ui.grains.counter
function buildIddress(filePath, basename) {
    const rel = path.relative(ROOT, path.dirname(filePath));
    const parts = rel.split(path.sep).filter(p => p.length > 0);
    parts.push(basename);
    return parts.join('.');
}

// Try to read JSON and extract cap, kind, label for the slim pointer
function readJsonSafe(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
    } catch (e) {
        return null;
    }
}

function createPointerAndVerfassung(originalPath, targetDir, basename) {
    const iddress = buildIddress(originalPath, basename);
    const data = readJsonSafe(originalPath);
    if (!data) {
        log('WARN', `Could not parse JSON: ${originalPath}`);
        return false;
    }

    // Update the original data: ensure it has the iddress
    data.iddress = data.iddress || data.id || iddress;
    // Remove old 'id' field if present (migrating to 'iddress')
    if (data.id && data.id !== data.iddress) {
        delete data.id;
    }

    // Create slim pointer
    const pointer = {
        cap: data.cap || 'indo',
        kind: data.kind || basename,
        iddress: iddress,
        label: data.label || basename.charAt(0).toUpperCase() + basename.slice(1),
        default: iddress + '.@verfassung'
    };

    const pointerPath = path.join(targetDir, basename + '.lile');
    const verfassungPath = path.join(targetDir, '@verfassung.lile');

    ensureDir(targetDir);

    if (!DRY_RUN) {
        fs.writeFileSync(pointerPath, JSON.stringify(pointer, null, 4));
        fs.writeFileSync(verfassungPath, JSON.stringify(data, null, 4));
        // Remove original
        if (fs.existsSync(originalPath)) {
            fs.unlinkSync(originalPath);
        }
    }

    log('POINTER', pointerPath);
    log('VERFASSG', verfassungPath);
    stats.pointers++;
    stats.verfassung++;
    return true;
}

function processDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            if (SKIP_DIRS.has(entry.name)) {
                log('SKIP', `directory: ${entry.name}`);
                stats.skipped++;
                continue;
            }
            processDir(fullPath);
            continue;
        }

        if (!entry.isFile()) continue;

        const ext = path.extname(entry.name);
        const basename = path.basename(entry.name, ext);

        // Skip non-data files
        if (SKIP_EXTENSIONS.has(ext)) {
            stats.skipped++;
            continue;
        }

        // Already .lile
        if (ext === '.lile') {
            stats.already_ok++;
            continue;
        }

        // Only process .json and .ll files
        if (ext !== '.json' && ext !== '.ll') {
            stats.skipped++;
            continue;
        }

        const parentDir = dir;
        const parentName = path.basename(parentDir);
        const isEntityFile = basename.startsWith('@');
        const insideEntity = isInsideEntityFolder(fullPath);

        // --- Entity files (e.g. @verfassung.json, @seri--.json) ---
        if (isEntityFile) {
            // Just rename to .lile, keep in place
            const newPath = path.join(parentDir, basename + '.lile');
            if (!DRY_RUN) fs.renameSync(fullPath, newPath);
            log('RENAME', `${entry.name} → ${basename}.lile`);
            stats.renamed++;
            continue;
        }

        // --- Files inside @entity folders (e.g. plocks/@Seri--/colors.json) ---
        if (insideEntity) {
            // These are entity-specific data. Move into own folder, rename to .lile
            // No pointer/verfassung split needed
            if (basename === parentName) {
                // Already in correct folder
                const newPath = path.join(parentDir, basename + '.lile');
                if (!DRY_RUN) fs.renameSync(fullPath, newPath);
                log('RENAME', `${entry.name} → ${basename}.lile`);
                stats.renamed++;
            } else {
                // Needs own folder
                const newDir = path.join(parentDir, basename);
                const newPath = path.join(newDir, basename + '.lile');
                ensureDir(newDir);
                if (!DRY_RUN) fs.renameSync(fullPath, newPath);
                log('MOVE', `${entry.name} → ${basename}/${basename}.lile`);
                stats.moved++;
            }
            continue;
        }

        // --- Regular files: split into pointer + @verfassung.lile ---
        if (basename === parentName) {
            // Already in a folder of its name (e.g. aggro/aggro.json)
            // Check if @verfassung.lile already exists (e.g. window/main/ already has it)
            const verfassungCheck = path.join(parentDir, '@verfassung.lile');
            const verfassungCheckLL = path.join(parentDir, '@verfassung.ll');
            if (fs.existsSync(verfassungCheck) || fs.existsSync(verfassungCheckLL)) {
                // Already has an @verfassung variant — just rename the base to .lile
                const newPath = path.join(parentDir, basename + '.lile');
                if (!DRY_RUN) fs.renameSync(fullPath, newPath);
                log('RENAME', `${entry.name} → ${basename}.lile (has @verfassung)`);
                stats.renamed++;
                // Also rename @verfassung.ll → .lile if needed
                if (fs.existsSync(verfassungCheckLL)) {
                    const newVPath = path.join(parentDir, '@verfassung.lile');
                    if (!DRY_RUN) fs.renameSync(verfassungCheckLL, newVPath);
                    log('RENAME', `@verfassung.ll → @verfassung.lile`);
                    stats.renamed++;
                }
            } else {
                // Split: current content → @verfassung.lile, create slim pointer
                createPointerAndVerfassung(fullPath, parentDir, basename);
            }
        } else {
            // Not in own folder yet — create folder, then split
            const newDir = path.join(parentDir, basename);
            createPointerAndVerfassung(fullPath, newDir, basename);
        }
    }
}

console.log(`\n  Migrating to .lile format${DRY_RUN ? ' (DRY RUN)' : ''}`);
console.log(`  Root: ${ROOT}\n`);
processDir(ROOT);
console.log(`\n  Results:`);
console.log(`    Pointers created:  ${stats.pointers}`);
console.log(`    @verfassung created: ${stats.verfassung}`);
console.log(`    Renamed:           ${stats.renamed}`);
console.log(`    Moved to folder:   ${stats.moved}`);
console.log(`    Dirs created:      ${stats.mkdir}`);
console.log(`    Skipped:           ${stats.skipped}`);
console.log(`    Already .lile:     ${stats.already_ok}`);
if (DRY_RUN) console.log(`\n  Run without --dry-run to apply changes.\n`);
