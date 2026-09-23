// Global error handler to suppress 'document has been modified' error popup if redirecting
window.addEventListener('unhandledrejection', function(event) {
	if (event && event.reason && typeof event.reason.message === 'string') {
		if (event.reason.message.includes('document has been modified') || event.reason.message.includes('Document has been modified')) {
			// Suppress the error popup
			event.preventDefault();
			return false;
		}
	}
});

if (window.frappe && frappe.msgprint) {
	const originalMsgprint = frappe.msgprint;
	frappe.msgprint = function(msg, ...args) {
		if (typeof msg === 'string' && (msg.includes('document has been modified') || msg.includes('Document has been modified'))) {
			// Suppress the error popup
			return Promise.resolve();
		}
		return originalMsgprint.call(this, msg, ...args);
	};
}

// Suppress document modified error in frappe.show_alert
if (window.frappe && frappe.show_alert) {
	const originalShowAlert = frappe.show_alert;
	frappe.show_alert = function(msg, ...args) {
		if (typeof msg === 'string' && (msg.includes('document has been modified') || msg.includes('Document has been modified'))) {
			return;
		}
		return originalShowAlert.call(this, msg, ...args);
	};
}

// Suppress document modified error in window.alert
const originalWindowAlert = window.alert;
window.alert = function(msg, ...args) {
	if (typeof msg === 'string' && (msg.includes('document has been modified') || msg.includes('Document has been modified'))) {
		return;
	}
	return originalWindowAlert.call(this, msg, ...args);
}
if (!window.webshop) window.webshop = {}
if (!frappe.boot) frappe.boot = {}
