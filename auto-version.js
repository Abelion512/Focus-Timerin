const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Debug mode
const DEBUG = process.argv.includes('--debug');
function log(...args) {
    if (DEBUG) console.log(...args);
}

// Pastikan folder ada
const DIR = __dirname;
log('Working directory:', DIR);
if (!fs.existsSync(path.join(DIR, '.version-cache'))) {
    fs.mkdirSync(path.join(DIR, '.version-cache'));
}

// Fungsi untuk membaca dan parse version.json
function readVersionFile() {
    const versionPath = path.join(__dirname, 'version.json');
    if (!fs.existsSync(versionPath)) {
        return {
            currentVersion: "1.0.0",
            lastUpdate: new Date().toISOString().split('T')[0],
            versionHistory: []
        };
    }
    return JSON.parse(fs.readFileSync(versionPath, 'utf8'));
}

// Fungsi untuk menulis version.json
function writeVersionFile(data) {
    const versionPath = path.join(__dirname, 'version.json');
    fs.writeFileSync(versionPath, JSON.stringify(data, null, 2));
}

// Fungsi untuk menghitung hash dari file
function getFileHash(filePath) {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('md5').update(content).digest('hex');
}

// Fungsi untuk mengecek perubahan dan mengupdate versi
function checkAndUpdateVersion() {
    const versionData = readVersionFile();
    const filesToWatch = [
        'login.html', 'register.html', 'index.html', 'profile.html',
        'style.css', 'script.js', 'auth.css'
    ];
    
    // Baca hash terakhir dari localStorage atau buat baru
    let lastHashes = {};
    try {
        lastHashes = JSON.parse(fs.readFileSync('.last-hashes.json', 'utf8'));
    } catch (err) {
        // File belum ada, buat baru
        lastHashes = {};
    }

    let changes = [];
    let hasChanges = false;

    // Cek setiap file untuk perubahan
    log('Checking files for changes...');
    filesToWatch.forEach(file => {
        try {
            const filePath = path.join(__dirname, file);
            if (fs.existsSync(filePath)) {
                log(`Checking file: ${file}`);
                const currentHash = getFileHash(filePath);
                if (lastHashes[file] && lastHashes[file] !== currentHash) {
                    hasChanges = true;
                    changes.push(file);
                    log(`Changes detected in: ${file}`);
                    log(`Previous hash: ${lastHashes[file]}`);
                    log(`Current hash: ${currentHash}`);
                }
                lastHashes[file] = currentHash;
            }
        } catch (err) {
            console.log(`Error checking ${file}:`, err);
        }
    });    // Backup version.json sebelum update
    function backupVersionFile() {
        try {
            const backup = path.join(DIR, `.version.backup.${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
            fs.copyFileSync(path.join(DIR, 'version.json'), backup);
            log('Created backup:', backup);
        } catch (err) {
            console.error('Error creating backup:', err);
        }
    }

    // Jika ada perubahan, update version.json
    if (hasChanges) {
        log('Changes detected in files:', changes);
        backupVersionFile();
        
        const [major, minor, patch] = versionData.currentVersion.split('.').map(Number);
        const newVersion = `${major}.${minor}.${patch + 1}`;
        
        // Validasi format versi
        if (!/^\d+\.\d+\.\d+$/.test(newVersion)) {
            console.error('Invalid version format');
            return;
        log('Updating version from', versionData.currentVersion, 'to', newVersion);
        const today = new Date().toISOString().split('T')[0];

        // Buat changelog berdasarkan file yang berubah
        const changelog = [];
        if (changes.includes('login.html') || changes.includes('register.html')) {
            changelog.push('• Updated authentication pages');
        }
        if (changes.includes('style.css') || changes.includes('auth.css')) {
            changelog.push('• UI improvements');
        }
        if (changes.includes('script.js')) {
            changelog.push('• Performance improvements');
        }
        if (changes.includes('index.html')) {
            changelog.push('• Updated main interface');
        }
        if (changes.includes('profile.html')) {
            changelog.push('• Updated profile features');
        }

        // Tambahkan versi baru ke history
        const newVersionInfo = {
            version: newVersion,
            date: today,
            changelog: changelog.join('\n'),
            details: {
                features: ['Automatic version update'],
                bugfixes: ['Various improvements and fixes']
            }
        };

        // Update version.json
        versionData.currentVersion = newVersion;
        versionData.lastUpdate = today;
        versionData.versionHistory.unshift(newVersionInfo);
        
        // Jaga hanya 4 versi terakhir
        versionData.versionHistory = versionData.versionHistory.slice(0, 4);
          try {
            // Simpan perubahan
            writeVersionFile(versionData);
            fs.writeFileSync(path.join(DIR, '.last-hashes.json'), JSON.stringify(lastHashes, null, 2));
            log('Version file updated successfully');
            log('New version data:', JSON.stringify(versionData, null, 2));
        } catch (err) {
            console.error('Error saving version files:', err);
        }
        
        console.log(`Version updated to ${newVersion}`);
        console.log('Changes detected in:', changes);
    }
}

// Jalankan pengecekan
checkAndUpdateVersion();
