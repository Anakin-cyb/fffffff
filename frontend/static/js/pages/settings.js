window.SettingsPage = (() => {
    const renderSettings = () => {
        const user = AuthManager.getCurrentUser();
        const content = document.getElementById('page-settings');
        
        content.innerHTML = `
            
                <div class="section">
                    
                    
                    <div class="settings-container">
                        <div class="settings-sidebar">
                            <button class="settings-menu-item active" onclick="SettingsPage.switchTab('profile')">
                                <i class="fas fa-user-circle"></i>
                                <span class="settings-menu-label">Profile</span>
                            </button>
                            <button class="settings-menu-item" onclick="SettingsPage.switchTab('preferences')">
                                <i class="fas fa-sliders-h"></i>
                                <span class="settings-menu-label">Preferences</span>
                            </button>
                            <button class="settings-menu-item" onclick="SettingsPage.switchTab('about')">
                                <i class="fas fa-info-circle"></i>
                                <span class="settings-menu-label">About</span>
                            </button>
                        </div>
                        
                        <div class="settings-content">
                            
                            <div id="tab-profile" class="settings-tab active">
                                <div class="settings-section">
                                    <h2 class="settings-section-title">User Profile</h2>
                                    
                                    <div class="settings-option">
                                        <div class="settings-option-label">
                                            <div class="settings-option-title">Name</div>
                                        </div>
                                        <div class="settings-option-control">
                                            <strong>${user?.name || 'N/A'}</strong>
                                        </div>
                                    </div>
                                    
                                    <div class="settings-option">
                                        <div class="settings-option-label">
                                            <div class="settings-option-title">Email</div>
                                        </div>
                                        <div class="settings-option-control">
                                            <strong>${user?.email || 'N/A'}</strong>
                                        </div>
                                    </div>
                                    
                                    <div class="settings-option">
                                        <div class="settings-option-label">
                                            <div class="settings-option-title">Role</div>
                                        </div>
                                        <div class="settings-option-control">
                                            <strong>${user?.role || 'N/A'}</strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            
                            <div id="tab-preferences" class="settings-tab">
                                <div class="settings-section">
                                    <h2 class="settings-section-title">Preferences</h2>
                                    
                                    <div class="settings-option">
                                        <div class="settings-option-label">
                                            <div class="settings-option-title">Theme</div>
                                            <div class="settings-option-description">Choose your preferred color scheme</div>
                                        </div>
                                        <div class="settings-option-control">
                                            <select onchange="SettingsPage.changeTheme(this.value)">
                                                <option value="dark">Dark</option>
                                                <option value="light">Light</option>
                                                <option value="auto">Auto</option>
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div class="settings-option">
                                        <div class="settings-option-label">
                                            <div class="settings-option-title">Notifications</div>
                                            <div class="settings-option-description">Enable desktop notifications</div>
                                        </div>
                                        <div class="settings-option-control">
                                            <div class="switch">
                                                <input type="checkbox" id="notif-toggle" checked>
                                                <span class="switch-slider"></span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            
                            <div id="tab-about" class="settings-tab">
                                <div class="settings-section">
                                    <h2 class="settings-section-title">About ResQSync</h2>
                                    
                                    <div style="padding: var(--spacing-lg); background-color: var(--color-bg-tertiary); border-radius: var(--radius-md);">
                                        <h3 style="margin-bottom: var(--spacing-sm);">ResQSync v1.0.0</h3>
                                        <p style="margin-bottom: var(--spacing-md); color: var(--color-text-secondary);">
                                            Smart Emergency Vehicle & Traffic Management System
                                        </p>
                                        <p style="color: var(--color-text-tertiary); font-size: var(--font-size-sm);">
                                            Â© 2024 ResQSync. All rights reserved.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    
                    <div style="margin-top: var(--spacing-2xl); padding-top: var(--spacing-2xl); border-top: 1px solid var(--color-border);">
                        <button class="btn btn-danger" onclick="ResQSyncApp.logout()">
                            <i class="fas fa-sign-out-alt"></i>
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        
        if (!document.getElementById('settings-page-styles')) {
            const style = document.createElement('style');
            style.id = 'settings-page-styles';
            style.textContent = `
                .settings-tab {
                    display: none;
                }
                
                .settings-tab.active {
                    display: block;
                }
                
                .settings-menu-item.active {
                    background-color: var(--color-primary);
                    color: white;
                }
            `;
            document.head.appendChild(style);
        }
    };
    
    return {
        init() {
            SidebarComponent.setActive('settings');
            HeaderComponent.updateTitle();
            renderSettings();
        },
        
        switchTab(tabName) {
            document.querySelectorAll('.settings-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            
            document.querySelectorAll('.settings-menu-item').forEach(btn => {
                btn.classList.remove('active');
            });
            
            
            const tab = document.getElementById(`tab-${tabName}`);
            if (tab) {
                tab.classList.add('active');
            }
            
            
            event.target.closest('.settings-menu-item').classList.add('active');
        },
        
        changeTheme(theme) {
            localStorage.setItem('theme', theme);
            Toast.info(`Theme changed to ${theme}`);
        },
    };
})();
