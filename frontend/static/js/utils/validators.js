const Validators = {
    isEmail(email) {
        return CONSTANTS.VALIDATION.EMAIL_PATTERN.test(email);
    },

    isPhone(phone) {
        return CONSTANTS.VALIDATION.PHONE_PATTERN.test(phone);
    },

    isPasswordStrong(password) {
        return (
            password &&
            password.length >= CONSTANTS.VALIDATION.PASSWORD_MIN_LENGTH
        );
    },

    isName(name) {
        return (
            name &&
            name.trim().length >= CONSTANTS.VALIDATION.NAME_MIN_LENGTH
        );
    },

    isLatitude(lat) {
        return (
            lat !== null &&
            lat !== undefined &&
            lat >= -90 &&
            lat <= 90
        );
    },

    isLongitude(lon) {
        return (
            lon !== null &&
            lon !== undefined &&
            lon >= -180 &&
            lon <= 180
        );
    },

    isCoordinates(lat, lon) {
        return this.isLatitude(lat) && this.isLongitude(lon);
    },

    isURL(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },

    isRequired(value) {
        if (value === null || value === undefined) {
            return false;
        }

        if (typeof value === 'string') {
            return value.trim().length > 0;
        }

        return true;
    },

    minLength(value, min) {
        return value && value.length >= min;
    },

    maxLength(value, max) {
        return !value || value.length <= max;
    },

    isNumber(value) {
        return !isNaN(value) && isFinite(value);
    },

    isPositive(value) {
        return this.isNumber(value) && value > 0;
    },

    validateForm(form) {
        if (!form) {
            return false;
        }

        const inputs = form.querySelectorAll('[required]');
        let isValid = true;

        inputs.forEach(input => {
            if (!this.isRequired(input.value)) {
                input.classList.add('error');
                isValid = false;
            } else {
                input.classList.remove('error');
            }
        });

        return isValid;
    },
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Validators;
}