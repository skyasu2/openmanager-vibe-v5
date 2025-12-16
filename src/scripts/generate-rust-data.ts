
import { writeFile } from 'fs/promises';
import path from 'path';
import { FIXED_24H_DATASETS } from '../data/fixed-24h-metrics';

async function generateRustData() {
  console.log('Generating Rust Fixed Data JSON...');
  
  const targetPath = path.join(process.cwd(), 'cloud-run', 'rust-inference', 'data', 'fixed-24h-data.json');
  
  // Ensure directory exists
  // Assuming cloud-run/rust-inference/data exists, if not we might need to create it.
  
  try {
    await writeFile(targetPath, JSON.stringify(FIXED_24H_DATASETS, null, 2));
    console.log(`✅ Successfully wrote fixed data to: ${targetPath}`);
  } catch (error) {
    console.error('❌ Failed to write Rust data:', error);
  }
}

generateRustData();
