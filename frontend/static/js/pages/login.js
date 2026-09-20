/**
 * Login Page
 * 
 * Handles user authentication and login form
 */

window.LoginPage = (() => {
    const renderLogin = () => {
        const content = document.getElementById('page-login');
        
        content.innerHTML = `
            <div class="login-container">
                <div class="login-card">
                    <!-- Logo & Branding -->
                    <div class="login-header">
                        <div class="login-logo">
                            <i class="fas fa-heartbeat"></i>
                        </div>
                        <h1 class="login-title">ResQSync</h1>
                        <p class="login-subtitle">Emergency Response System</p>
                    </div>
                    
                    <!-- Login Form -->
                    <form class="login-form" onsubmit="LoginPage.handleSubmit(event)">
                        <!-- Email Input -->
                        <div class="form-group">
                            <label class="form-label" for="login-email">
                                <i class="fas fa-envelope"></i>
                                Email Address
                            </label>
                            <input 
                                type="email" 
                                id="login-email" 
                                class="form-input" 
                                placeholder="admin@resqsync.com"
                                required
                                autocomplete="email"
                            >
                            <div class="form-error" id="email-error"></div>
                        </div>
                        
                        <!-- Password Input -->
                        <div class="form-group">
                            <label class="form-label" for="login-password">
                                <i class="fas fa-lock"></i>
                                Password
                            </label>
                            <input 
                                type="password" 
                                id="login-password" 
                                class="form-input" 
                                placeholder="Enter your password"
                                required
                                autocomplete="current-password"
                            >
                            <div class="form-error" id="password-error"></div>
                        </div>
                        
                        <!-- Remember Me -->
                        <div class="form-group" style="display: flex; align-items: center;">
                            <input 
                                type="checkbox" 
                                id="login-remember"
                                style="width: auto; margin-right: 8px;"
                            >
                            <label for="login-remember" style="margin: 0; font-size: var(--font-size-sm); color: var(--color-text-secondary);">
                                Remember me
                            </label>
                        </div>
                        
                        <!-- Submit Button -->
                        <button 
                            type="submit" 
                            class="btn btn-primary btn-large" 
                            id="login-submit-btn"
                        >
                            <span id="login-btn-text">Login</span>
                            <span id="login-spinner" style="display: none;">
                                <i class="fas fa-spinner spin"></i>
                            </span>
                        </button>
                    </form>
                    
                    <!-- Error Alert -->
                    <div class="form-error alert alert-danger" id="login-error" style="display: none; margin-top: var(--spacing-md);">
                        <i class="fas fa-exclamation-circle"></i>
                        <span id="login-error-message"></span>
                    </div>
                    
                    <!-- Demo Credentials -->
                    <div class="login-footer">
                        <div class="demo-section">
                            <p style="color: var(--color-text-secondary); font-size: var(--font-size-sm); margin-bottom: var(--spacing-md);">
                                <strong>Demo Credentials:</strong>
                            </p>
                            
                            <div class="demo-credential">
                                <div class="demo-role">
                                    <i class="fas fa-user-tie"></i>
                                    Control Room
                                </div>
                                <div class="demo-details">
                                    <div>📧 admin@resqsync.com</div>
                                    <div>🔑 password123</div>
                                </div>
                            </div>
                            
                            <div class="demo-credential">
                                <div class="demo-role">
                                    <i class="fas fa-user"></i>
                                    Citizen
                                </div>
                                <div class="demo-details">
                                    <div>📧 citizen@resqsync.com</div>
                                    <div>🔑 password123</div>
                                </div>
                            </div>
                            
                            <div class="demo-credential">
                                <div class="demo-role">
                                    <i class="fas fa-ambulance"></i>
                                    Emergency Vehicle
                                </div>
                                <div class="demo-details">
                                    <div>📧 driver@resqsync.com</div>
                                    <div>🔑 password123</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    };

    return {
        /**
         * Initialize login page
         */
        init() {
            Logger.info('LoginPage', 'Initialized');
            
            // Hide sidebar and header
            const sidebar = document.querySelector('.sidebar');
            const header = document.querySelector('.header');
            
            if (sidebar) sidebar.style.display = 'none';
            if (header) header.style.display = 'none';
            
            // Render login page
            renderLogin();
            
            // Focus email input
            setTimeout(() => {
                const emailInput = document.getElementById('login-email');
                if (emailInput) emailInput.focus();
            }, 100);
            
            // Clear any previous errors
            document.getElementById('login-error').style.display = 'none';
            document.getElementById('email-error').textContent = '';
            document.getElementById('password-error').textContent = '';
        },

        /**
         * Clean up login page
         */
        destroy() {
            Logger.debug('LoginPage', 'Destroyed');
        },

        /**
         * Handle login form submission
         */
        async handleSubmit(event) {
            event.preventDefault();
            
            // Get form values
            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value;
            const remember = document.getElementById('login-remember').checked;
            
            // Clear previous errors
            document.getElementById('login-error').style.display = 'none';
            document.getElementById('email-error').textContent = '';
            document.getElementById('password-error').textContent = '';
            
            // Validate
            if (!email) {
                document.getElementById('email-error').textContent = 'Email is required';
                return;
            }
            
            if (!password) {
                document.getElementById('password-error').textContent = 'Password is required';
                return;
            }
            
            if (password.length < 6) {
                document.getElementById('password-error').textContent = 'Password must be at least 6 characters';
                return;
            }
            
            // Show loading state
            const submitBtn = document.getElementById('login-submit-btn');
            const btnText = document.getElementById('login-btn-text');
            const spinner = document.getElementById('login-spinner');
            
            submitBtn.disabled = true;
            btnText.style.display = 'none';
            spinner.style.display = 'inline';
            
            try {
                Logger.debug('LoginPage', 'Attempting login', { email });
                
                // Attempt login
                const result = await AuthManager.login(email, password);
                
                if (result.success) {
                    Logger.info('LoginPage', 'Login successful', { email });
                    
                    // Store remember me preference
                    if (remember) {
                        StorageUtil.set('remember-me', email);
                    }
                    
                    // Show success message
                    Toast.success('Login successful!');
                    
                    // Get user role and redirect
                    const user = AuthManager.getCurrentUser();
                    
                    setTimeout(() => {
                        if (user.role === CONFIG.roles.CONTROL_ROOM) {
                            Router.navigateTo('dashboard');
                        } else if (user.role === CONFIG.roles.CITIZEN) {
                            Router.navigateTo('citizen-home');
                        } else if (user.role === CONFIG.roles.EMERGENCY_VEHICLE) {
                            Router.navigateTo('vehicle-dashboard');
                        }
                    }, 500);
                } else {
                    Logger.warn('LoginPage', 'Login failed', { 
                        email,
                        message: result.message 
                    });
                    
                    // Show error
                    document.getElementById('login-error').style.display = 'flex';
                    document.getElementById('login-error-message').textContent = 
                        result.message || 'Login failed. Please check your credentials.';
                    
                    Toast.error(result.message || 'Login failed');
                    
                    // Re-enable button
                    submitBtn.disabled = false;
                    btnText.style.display = 'inline';
                    spinner.style.display = 'none';
                }
            } catch (error) {
                Logger.error('LoginPage', 'Login error', { 
                    email,
                    error: error.message 
                });
                
                // Show error
                document.getElementById('login-error').style.display = 'flex';
                document.getElementById('login-error-message').textContent = 
                    error.message || 'An error occurred. Please try again.';
                
                Toast.error('Login error: ' + error.message);
                
                // Re-enable button
                submitBtn.disabled = false;
                btnText.style.display = 'inline';
                spinner.style.display = 'none';
            }
        },
    };
})();