// scripts/validate-paths.ts
// Validates blueprint and skin YAML files for the path system
import { loadBlueprints, loadSkins } from '../src/lib/paths/loader';

async function main() {
  console.log('Validating paths...\n');

  let errors = 0;

  try {
    // Load and validate blueprints
    const blueprints = await loadBlueprints();
    console.log(`✓ Loaded ${blueprints.length} blueprints`);

    for (const bp of blueprints) {
      // Check for required fields
      if (!bp.description) {
        console.error(`  ✗ Blueprint ${bp.id}: missing description`);
        errors++;
      }
      if (bp.beats.length === 0) {
        console.error(`  ✗ Blueprint ${bp.id}: no beats defined`);
        errors++;
      }
      // Check beat numbering (should be 1, 2, 3, ... with no gaps)
      const beats = bp.beats.map(b => b.beat).sort((a, b) => a - b);
      for (let i = 0; i < beats.length; i++) {
        if (beats[i] !== i + 1) {
          console.error(`  ✗ Blueprint ${bp.id}: beat numbering gap at ${i + 1}`);
          errors++;
          break;
        }
      }
      // Check for duplicate exercises within a blueprint
      const exerciseSlugs = bp.beats.map(b => b.exercise);
      const uniqueSlugs = new Set(exerciseSlugs);
      if (uniqueSlugs.size !== exerciseSlugs.length) {
        console.error(`  ✗ Blueprint ${bp.id}: duplicate exercise slugs`);
        errors++;
      }
    }

    // Load and validate skins
    const skins = await loadSkins();
    console.log(`✓ Loaded ${skins.length} skins`);

    for (const skin of skins) {
      // Check for required vars
      const requiredVars = ['list_name', 'item_singular', 'item_plural'];
      for (const v of requiredVars) {
        if (!skin.vars[v]) {
          console.error(`  ✗ Skin ${skin.id}: missing var ${v}`);
          errors++;
        }
      }
      // Check blueprint references
      for (const bpId of skin.blueprints) {
        if (!blueprints.find(bp => bp.id === bpId)) {
          console.error(`  ✗ Skin ${skin.id}: references unknown blueprint ${bpId}`);
          errors++;
        }
      }
      // Check contexts reference valid exercises in blueprints
      for (const exerciseSlug of Object.keys(skin.contexts)) {
        const isInBlueprint = skin.blueprints.some(bpId => {
          const bp = blueprints.find(b => b.id === bpId);
          return bp?.beats.some(beat => beat.exercise === exerciseSlug);
        });
        if (!isInBlueprint) {
          console.warn(`  ⚠ Skin ${skin.id}: context for '${exerciseSlug}' not in any linked blueprint`);
        }
      }
    }

    // Summary
    console.log('\n---');
    if (errors === 0) {
      console.log('✓ All paths valid!');
      process.exit(0);
    } else {
      console.error(`✗ Found ${errors} error(s)`);
      process.exit(1);
    }
  } catch (err) {
    console.error('Validation failed:', err);
    process.exit(1);
  }
}

main();
