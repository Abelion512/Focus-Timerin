// Utility function to safely get DOM elements
const $ = (id) => document.getElementById(id);

// Track initialization state
let initialized = false;

// Main button initialization function
function initButtons() {
    if (initialized) return;
    console.log('Initializing profile buttons...');

    // Back button
    const backBtn = $('backBtn');
    if (backBtn) {
        backBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.history.back();
        });
    }

    // Edit dropdown handling
    const editBtn = $('editDropdownBtn');
    const editActions = $('editActions');
    if (editBtn && editActions) {
        const toggleEditMenu = (e) => {
            e.stopPropagation();
            const isVisible = editActions.style.display === 'flex';
            editActions.style.display = isVisible ? 'none' : 'flex';
        };

        editBtn.addEventListener('click', toggleEditMenu);
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (editActions.style.display === 'flex' && 
                !editActions.contains(e.target) && 
                e.target !== editBtn) {
                editActions.style.display = 'none';
            }
        });
    }

    // Edit name functionality
    const editNameBtn = $('editNameBtn');
    if (editNameBtn) {
        editNameBtn.addEventListener('click', async () => {
            const newName = prompt('Nama baru:');
            if (!newName) return;
            
            const user = window.auth?.currentUser;
            if (!user) {
                alert('Please log in first');
                return;
            }

            try {
                await window.updateProfile(user, { displayName: newName });
                $('profileName').textContent = newName;
                alert('Nama berhasil diubah!');
                editActions.style.display = 'none';
            } catch (err) {
                alert('Gagal mengubah nama: ' + err.message);
            }
        });
    }

    // Edit email functionality
    const editEmailBtn = $('editEmailBtn');
    if (editEmailBtn) {
        editEmailBtn.addEventListener('click', async () => {
            const user = window.auth?.currentUser;
            if (!user) {
                alert('Please log in first');
                return;
            }

            const newEmail = prompt('Masukkan email baru:');
            if (!newEmail) return;

            try {
                await user.updateEmail(newEmail);
                $('profileEmail').textContent = newEmail;
                alert('Email berhasil diubah!');
                editActions.style.display = 'none';
            } catch (err) {
                alert('Gagal mengubah email: ' + err.message);
            }
        });
    }

    // Edit photo functionality
    const editPhotoBtn = $('editPhotoBtn');
    const avatarInput = $('avatarInput');
    if (editPhotoBtn && avatarInput) {
        editPhotoBtn.addEventListener('click', () => {
            avatarInput.click();
            editActions.style.display = 'none';
        });
    }

    // Change password functionality
    const changePasswordBtn = $('changePasswordBtn');
    if (changePasswordBtn) {
        changePasswordBtn.addEventListener('click', async () => {
            const user = window.auth?.currentUser;
            if (!user?.email || changePasswordBtn.disabled) {
                alert('Cannot change password for this account type');
                return;
            }

            try {
                await window.sendPasswordResetEmail(window.auth, user.email);
                alert('Link reset password telah dikirim ke email Anda.');
            } catch (err) {
                alert('Gagal mengirim email reset: ' + err.message);
            }
        });
    }

    // Theme toggle functionality
    const toggleThemeBtn = $('toggleThemeBtn');
    if (toggleThemeBtn) {
        toggleThemeBtn.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            document.body.classList.toggle('light-mode');
            const settings = JSON.parse(localStorage.getItem('focusTimerSettings')) || {};
            settings.theme = document.body.classList.contains('light-mode') ? 'light' : 'dark';
            localStorage.setItem('focusTimerSettings', JSON.stringify(settings));
        });
    }

    // Logout functionality
    const logoutBtn = $('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (!window.auth || !window.signOut) return;
            try {
                await window.signOut(window.auth);
                window.location.reload();
            } catch (err) {
                alert('Gagal logout: ' + err.message);
            }
        });
    }

    // Login functionality
    const loginBtn = $('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            window.location.href = 'login.html';
        });
    }

    // Version info functionality
    const versionInfoBtn = $('versionInfoBtn');
    const versionInfoModal = $('versionInfoModal');
    const closeVersionInfo = $('closeVersionInfo');
    if (versionInfoBtn && versionInfoModal && closeVersionInfo) {
        // Open version modal
        versionInfoBtn.addEventListener('click', () => {
            const versionHistory = JSON.parse(localStorage.getItem('focusTimerVersionHistory') || '[]');
            const currentVersion = localStorage.getItem('focusTimerVersion') || '1.2.0';
            
            let versionHtml = `<div style="text-align:left;">
                <h3 style="margin-bottom:1rem;">Versi Terkini: ${currentVersion}</h3>`;
            
            versionHistory.slice(0, 4).forEach(ver => {
                versionHtml += `
                    <div style="margin-bottom:1rem;padding-bottom:1rem;border-bottom:1px solid #444;">
                        <b>v${ver.version}</b> (${ver.date})<br>
                        <div style="margin:0.5rem 0;white-space:pre-line;">${ver.changelog}</div>
                    </div>`;
            });
            versionHtml += '</div>';

            $('modalVersion').textContent = currentVersion;
            $('modalChangelog').innerHTML = versionHtml;
            versionInfoModal.style.display = 'flex';
        });

        // Close version modal
        closeVersionInfo.addEventListener('click', () => {
            versionInfoModal.style.display = 'none';
        });

        // Close on outside click
        versionInfoModal.addEventListener('click', (e) => {
            if (e.target === versionInfoModal) {
                versionInfoModal.style.display = 'none';
            }
        });
    }

    initialized = true;
    console.log('Profile buttons initialized successfully');
}

// Initialize when all required resources are ready
function waitForInitialization() {
    // Check if Firebase auth is ready
    if (!window.auth) {
        console.log('Waiting for Firebase auth...');
        setTimeout(waitForInitialization, 100);
        return;
    }

    // Initialize buttons
    initButtons();
}

// Start initialization when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForInitialization);
} else {
    waitForInitialization();
}
