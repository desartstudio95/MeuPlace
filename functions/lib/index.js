"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setUserRole = exports.deleteProperty = exports.approveProperty = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();
// App Check verification (Protects against non-app calls and bot abuse)
const checkAppCheck = (context) => {
    if (process.env.ENFORCE_APP_CHECK === "true" && !context.app) {
        throw new functions.https.HttpsError("failed-precondition", "The function must be called from an App Check verified app.");
    }
};
// Middleware to check if user is admin
const checkAdmin = async (context) => {
    var _a;
    checkAppCheck(context);
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "The function must be called while authenticated.");
    }
    const userRecord = await admin.auth().getUser(context.auth.uid);
    if (((_a = userRecord.customClaims) === null || _a === void 0 ? void 0 : _a.role) !== "admin") {
        throw new functions.https.HttpsError("permission-denied", "Only administrators can perform this action.");
    }
};
exports.approveProperty = functions.https.onCall(async (data, context) => {
    await checkAdmin(context);
    const { propertyId } = data;
    if (!propertyId) {
        throw new functions.https.HttpsError("invalid-argument", "Property ID is required.");
    }
    try {
        await db.collection("properties").doc(propertyId).update({
            status: "Disponível",
            isApproved: true,
        });
        return { success: true, message: "Property approved successfully." };
    }
    catch (error) {
        console.error("Error approving property:", error);
        throw new functions.https.HttpsError("internal", "Failed to approve property.");
    }
});
exports.deleteProperty = functions.https.onCall(async (data, context) => {
    await checkAdmin(context);
    const { propertyId } = data;
    if (!propertyId) {
        throw new functions.https.HttpsError("invalid-argument", "Property ID is required.");
    }
    try {
        await db.collection("properties").doc(propertyId).delete();
        return { success: true, message: "Property deleted successfully." };
    }
    catch (error) {
        console.error("Error deleting property:", error);
        throw new functions.https.HttpsError("internal", "Failed to delete property.");
    }
});
exports.setUserRole = functions.https.onCall(async (data, context) => {
    await checkAdmin(context);
    const { uid, role } = data;
    if (!uid || !role) {
        throw new functions.https.HttpsError("invalid-argument", "UID and role are required.");
    }
    if (!["admin", "agent", "user"].includes(role)) {
        throw new functions.https.HttpsError("invalid-argument", "Invalid role.");
    }
    try {
        await admin.auth().setCustomUserClaims(uid, { role });
        await db.collection("users").doc(uid).update({ role });
        return { success: true, message: `User role updated to ${role}.` };
    }
    catch (error) {
        console.error("Error setting user role:", error);
        throw new functions.https.HttpsError("internal", "Failed to set user role.");
    }
});
//# sourceMappingURL=index.js.map