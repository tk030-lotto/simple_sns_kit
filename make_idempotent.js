const fs = require('fs');
let sql = fs.readFileSync('schema.sql', 'utf8');

// 1. CREATE TABLE -> CREATE TABLE IF NOT EXISTS
sql = sql.replace(/CREATE TABLE\s+(?!IF NOT EXISTS)(plugin_[a-zA-Z0-9_]+)/g, 'CREATE TABLE IF NOT EXISTS $1');

// 2. CREATE POLICY -> DROP POLICY IF EXISTS; CREATE POLICY
sql = sql.replace(/CREATE POLICY\s+\"?([a-zA-Z0-9_]+)\"?\s+ON\s+([a-zA-Z0-9_]+)/g, 'DROP POLICY IF EXISTS "$1" ON $2;\nCREATE POLICY "$1" ON $2');

// 3. CREATE TRIGGER -> DROP TRIGGER IF EXISTS; CREATE TRIGGER
sql = sql.replace(/CREATE TRIGGER\s+([a-zA-Z0-9_]+)\s+(AFTER|BEFORE)\s+(.*?)\s+ON\s+([a-zA-Z0-9_]+)/g, 'DROP TRIGGER IF EXISTS $1 ON $4;\nCREATE TRIGGER $1 $2 $3 ON $4');

fs.writeFileSync('schema.sql', sql);
console.log('Made schema.sql idempotent.');
