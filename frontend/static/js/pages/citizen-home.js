window.CitizenHomePage = (() => {
    const renderHome = () => {
        const content = document.getElementById('app-content');
        content.innerHTML = `
            <div class="page active" id="page-citizen-home">
                <div style="padding: var(--spacing-lg);">
                    <div style="text-align: center; margin-bottom: var(--spacing-3xl);">
                        <div style="font-size: 64px; margin-bottom: var(--spacing-lg);">
                            <i class="fas fa-heartbeat" style="color: var(--color-danger);"></i>
                        </div>
                        <h1 style="font-size: var(--font-size-3xl); margin-bottom: var(--spacing-md);">ResQSync</h1>
                        <p style="color: var(--color-text-secondary); font-size: var(--font-size-lg);">Emergency Response System</p>
                    </div>
                    
                    <div class="grid grid-2" style="max-width: 800px; margin: 0 auto;">
                        <div class="card" onclick="Router.navigateTo('request-emergency')" style="cursor: pointer; text-align: center;">
                            <div class="card-body" style="padding: var(--spacing-2xl);">
                                <div style="font-size: 48px; color: var(--color-danger); margin-bottom: var(--spacing-md);">
                                    <i class="fas fa-phone-volume"></i>
                                </div>
                                <h3 style="margin-bottom: var(--spacing-sm);">Request Help</h3>
                                <p style="color: var(--color-text-secondary); margin-bottom: 0;">Call an emergency vehicle to your location</p>
                            </div>
                        </div>
                        
                        <div class="card" onclick="Router.navigateTo('emergency-status')" style="cursor: pointer; text-align: center;">
                            <div class="card-body" style="padding: var(--spacing-2xl);">
                                <div style="font-size: 48px; color: var(--color-primary); margin-bottom: var(--spacing-md);">
                                    <i class="fas fa-info-circle"></i>
                                </div>
                                <h3 style="margin-bottom: var(--spacing-sm);">My Status</h3>
                                <p style="color: var(--color-text-secondary); margin-bottom: 0;">Track your emergency request status</p>
                            </div>
                        </div>
                    </div>
                    
                    <div style="max-width: 800px; margin: var(--spacing-3xl) auto 0; padding: var(--spacing-lg); background-color: var(--color-bg-secondary); border-radius: var(--radius-lg); border-left: 4px solid var(--color-primary);">
                        <h4 style="margin-bottom: var(--spacing-sm);">In Emergency?</h4>
                        <p style="color: var(--color-text-secondary); margin-bottom: 0;">If this is a life-threatening emergency, call your local emergency services immediately or dial 112.</p>
                    </div>
                </div>
            </div>
        `;
    };
    
    return {
        init() {
            SidebarComponent.setActive('home');
            HeaderComponent.updateTitle();
            renderHome();
        },
    };
})();
