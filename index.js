const admin = require("firebase-admin");
admin.initializeApp();

const { gradeAssessment } = require("./src/grading");
const { onEnrollmentPassed } = require("./src/certificates");
const {
  initiatePayment,
  paystackWebhook,
  flutterwaveWebhook,
} = require("./src/payments");

// Callable from the app (via Firebase SDK)
exports.gradeAssessment = gradeAssessment;
exports.initiatePayment = initiatePayment;

// Firestore trigger — fires automatically when an enrollment updates
exports.onEnrollmentPassed = onEnrollmentPassed;

// HTTPS endpoints — set these as the webhook URLs in your Paystack/Flutterwave dashboards
exports.paystackWebhook = paystackWebhook;
exports.flutterwaveWebhook = flutterwaveWebhook;
