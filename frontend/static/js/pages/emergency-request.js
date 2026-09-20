window.EmergencyRequestPage = (() => {
    let userLocation = null;
    
    const getUserLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    userLocation = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    };
                    updateLocationDisplay();
                },
                (error) => {
                    Logger.error('Geolocation', 'Error getting location', { error: error.message });
                    Toast.warning('Could not get your location. Please enable location services.');
                }
            );
        }
    };
    
    const updateLocationDisplay = () => {
        const locationDiv = document.getElementById('current-location');
        if (locationDiv && userLocation) {
            locationDiv.innerHTML = `
                <div style="padding: var(--spacing-md); background-color: var(--color-success); color: white; border-radius: var(--radius-md);">
                    <i class="fas fa-map-marker-alt"></i>
                    Location: ${FormatUtils.formatCoordinate(userLocation.latitude, userLocation.longitude)}
                </div>
            `;
        }
    };
    
    const renderForm = () => {
        const content = document.getElementById('app-content');
        content.innerHTML = `
            <div class="page active" id="page-request-emergency">
                <div style="max-width: 600px; margin: 0 auto; padding: var(--spacing-lg);">
                    <button class="btn btn-ghost" onclick="Router.navigateTo('citizen-home')">
                        <i class="fas fa-arrow-left"></i>
                        Back
                    </button>
                    
                    <h1 class="section-title">Request Emergency Help</h1>
                    
                    <form onsubmit="EmergencyRequestPage.submitRequest(event)" class="form-container">
                        <div class="form-group">
                            <label class="label-required">Emergency Type</label>
                            <select id="emergency-type" required>
                                <option value="">-- Select Type --</option>
                                ${Object.entries(CONSTANTS.EMERGENCY_TYPES).map(([key, val]) => 
                                    `<option value="${key}">${val.name}</option>`
                                ).join('')}
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label class="label-required">Your Location</label>
                            <div id="current-location">
                                <div style="color: var(--color-text-tertiary); padding: var(--spacing-md);">
                                    <i class="fas fa-spinner spin"></i> Getting location...
                                </div>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label>Destination (Optional)</label>
                            <input type="text" id="destination" placeholder="Hospital name or address">
                        </div>
                        
                        <div class="form-group">
                            <label>Additional Information</label>
                            <textarea id="notes" placeholder="Describe your situation..."></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label class="label-required">Contact Number</label>
                            <input type="tel" id="contact-phone" required placeholder="Your phone number">
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn btn-ghost" onclick="Router.navigateTo('citizen-home')">Cancel</button>
                            <button type="submit" class="btn btn-primary" id="submit-btn">Request Help</button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        getUserLocation();
    };
    
    return {
        init() {
            SidebarComponent.setActive('request');
            HeaderComponent.updateTitle();
            renderForm();
        },
        
        async submitRequest(event) {
            event.preventDefault();
            
            if (!userLocation) {
                Toast.error('Please enable location services');
                return;
            }
            
            const type = document.getElementById('emergency-type').value;
            const destination = document.getElementById('destination').value;
            const notes = document.getElementById('notes').value;
            const phone = document.getElementById('contact-phone').value;
            
            if (!type) {
                Toast.error('Please select emergency type');
                return;
            }
            
            const submitBtn = document.getElementById('submit-btn');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner spin"></i> Submitting...';
            
            try {
                const result = await EmergencyService.createEmergency({
                    type,
                    latitude: userLocation.latitude,
                    longitude: userLocation.longitude,
                    destination,
                    notes,
                    contact_phone: phone,
                });
                
                if (result.success) {
                    Toast.success('Emergency request submitted!');
                    setTimeout(() => {
                        Router.navigateTo('emergency-status', { id: result.data.id });
                    }, 1000);
                } else {
                    Toast.error(result.message);
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = 'Request Help';
                }
            } catch (error) {
                Toast.error('Failed to submit request');
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Request Help';
            }
        },
    };
})();
