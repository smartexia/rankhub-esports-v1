const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Supabase URL or Service Key is not defined in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const runMigration = async () => {
  try {
    const migrationFile = path.join(__dirname, 'supabase', 'migrations', '20250825100000_create_match_prints_table.sql');
    const sql = fs.readFileSync(migrationFile, 'utf8');

    // Split the script into individual commands
    const commands = sql.split(';').filter(cmd => cmd.trim() !== '');

    for (const command of commands) {
        const { error } = await supabase.rpc('exec_sql', { sql: command + ';' });
        if (error) {
            console.error(`Error executing command: ${command}`);
            throw error;
        }
    }

    console.log('Migration executed successfully!');
  } catch (error) {
    console.error('Failed to execute migration:', error);
    process.exit(1);
  }
};

runMigration();