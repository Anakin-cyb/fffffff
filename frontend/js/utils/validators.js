/**
 * ResQSync - Validation Utilities
 */

(function () {
    "use strict";

    function isRequired(value) {
        if (value === null || value === undefined) {
            return false;
        }

        return String(value).trim().length > 0;
    }

    function isEmail(value) {
        if (!isRequired(value)) {
            return false;
        }

        const email = String(value).trim();

        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    function isPhone(value) {
        if (!isRequired(value)) {
            return false;
        }

        const digits = String(value).replace(/\D/g, "");

        return digits.length >= 10 && digits.length <= 15;
    }

    function isPositiveNumber(value) {
        const number = Number(value);

        return Number.isFinite(number) && number >= 0;
    }

    function isLatitude(value) {
        const latitude = Number(value);

        return (
            Number.isFinite(latitude) &&
            latitude >= -90 &&
            latitude <= 90
        );
    }

    function isLongitude(value) {
        const longitude = Number(value);

        return (
            Number.isFinite(longitude) &&
            longitude >= -180 &&
            longitude <= 180
        );
    }

    function isCoordinates(latitude, longitude) {
        return (
            isLatitude(latitude) &&
            isLongitude(longitude)
        );
    }

    function isVehicleId(value) {
        if (!isRequired(value)) {
            return false;
        }

        const vehicleId = String(value).trim();

        return /^[A-Za-z0-9_-]{2,32}$/.test(vehicleId);
    }

    function isNodeId(value) {
        if (!isRequired(value)) {
            return false;
        }

        const nodeId = String(value).trim();

        return /^[A-Za-z0-9_-]{2,32}$/.test(nodeId);
    }

    function isEmergencyId(value) {
        if (!isRequired(value)) {
            return false;
        }

        const emergencyId = String(value).trim();

        return /^[A-Za-z0-9_-]{2,40}$/.test(emergencyId);
    }

    function isPassword(value, minimumLength = 6) {
        if (value === null || value === undefined) {
            return false;
        }

        return String(value).length >= minimumLength;
    }

    function isInteger(value) {
        const number = Number(value);

        return (
            Number.isFinite(number) &&
            Number.isInteger(number)
        );
    }

    function isWithinRange(
        value,
        minimum,
        maximum
    ) {
        const number = Number(value);

        if (!Number.isFinite(number)) {
            return false;
        }

        return (
            number >= minimum &&
            number <= maximum
        );
    }

    function validateObject(
        object,
        rules = {}
    ) {
        const errors = {};

        if (!object || typeof object !== "object") {
            return {
                valid: false,
                errors: {
                    _form: "Invalid form data."
                }
            };
        }

        Object.entries(rules).forEach(
            ([field, fieldRules]) => {
                const value = object[field];
                const messages = [];

                if (
                    fieldRules.required &&
                    !isRequired(value)
                ) {
                    messages.push(
                        fieldRules.requiredMessage ||
                        `${field} is required.`
                    );
                }

                if (
                    isRequired(value) &&
                    fieldRules.email &&
                    !isEmail(value)
                ) {
                    messages.push(
                        fieldRules.emailMessage ||
                        `${field} must be a valid email.`
                    );
                }

                if (
                    isRequired(value) &&
                    fieldRules.phone &&
                    !isPhone(value)
                ) {
                    messages.push(
                        fieldRules.phoneMessage ||
                        `${field} must be a valid phone number.`
                    );
                }

                if (
                    isRequired(value) &&
                    fieldRules.password &&
                    !isPassword(
                        value,
                        fieldRules.minLength || 6
                    )
                ) {
                    messages.push(
                        fieldRules.passwordMessage ||
                        `${field} is too short.`
                    );
                }

                if (
                    isRequired(value) &&
                    fieldRules.vehicleId &&
                    !isVehicleId(value)
                ) {
                    messages.push(
                        fieldRules.vehicleIdMessage ||
                        `${field} is not a valid vehicle ID.`
                    );
                }

                if (
                    isRequired(value) &&
                    fieldRules.nodeId &&
                    !isNodeId(value)
                ) {
                    messages.push(
                        fieldRules.nodeIdMessage ||
                        `${field} is not a valid node ID.`
                    );
                }

                if (
                    isRequired(value) &&
                    fieldRules.emergencyId &&
                    !isEmergencyId(value)
                ) {
                    messages.push(
                        fieldRules.emergencyIdMessage ||
                        `${field} is not a valid emergency ID.`
                    );
                }

                if (
                    isRequired(value) &&
                    fieldRules.latitude &&
                    !isLatitude(value)
                ) {
                    messages.push(
                        fieldRules.latitudeMessage ||
                        `${field} must be a valid latitude.`
                    );
                }

                if (
                    isRequired(value) &&
                    fieldRules.longitude &&
                    !isLongitude(value)
                ) {
                    messages.push(
                        fieldRules.longitudeMessage ||
                        `${field} must be a valid longitude.`
                    );
                }

                if (
                    isRequired(value) &&
                    fieldRules.minLength &&
                    String(value).length <
                        fieldRules.minLength
                ) {
                    messages.push(
                        fieldRules.minLengthMessage ||
                        `${field} is too short.`
                    );
                }

                if (
                    isRequired(value) &&
                    fieldRules.maxLength &&
                    String(value).length >
                        fieldRules.maxLength
                ) {
                    messages.push(
                        fieldRules.maxLengthMessage ||
                        `${field} is too long.`
                    );
                }

                if (
                    isRequired(value) &&
                    Number.isFinite(fieldRules.minimum) &&
                    Number(value) < fieldRules.minimum
                ) {
                    messages.push(
                        fieldRules.minimumMessage ||
                        `${field} is below the allowed value.`
                    );
                }

                if (
                    isRequired(value) &&
                    Number.isFinite(fieldRules.maximum) &&
                    Number(value) > fieldRules.maximum
                ) {
                    messages.push(
                        fieldRules.maximumMessage ||
                        `${field} exceeds the allowed value.`
                    );
                }

                if (messages.length > 0) {
                    errors[field] = messages;
                }
            }
        );

        return {
            valid: Object.keys(errors).length === 0,
            errors
        };
    }

    function firstError(errors) {
        if (!errors || typeof errors !== "object") {
            return null;
        }

        const firstKey = Object.keys(errors)[0];

        if (!firstKey) {
            return null;
        }

        const messages = errors[firstKey];

        if (Array.isArray(messages)) {
            return messages[0] || null;
        }

        return String(messages);
    }

    window.RESQ_VALIDATORS = Object.freeze({
        isRequired,
        isEmail,
        isPhone,
        isPositiveNumber,
        isLatitude,
        isLongitude,
        isCoordinates,
        isVehicleId,
        isNodeId,
        isEmergencyId,
        isPassword,
        isInteger,
        isWithinRange,
        validateObject,
        firstError
    });
})();