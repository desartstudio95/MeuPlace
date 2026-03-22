import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();

// Middleware to check if user is admin
const checkAdmin = async (context: functions.https.CallableContext) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const userRecord = await admin.auth().getUser(context.auth.uid);
  if (userRecord.customClaims?.role !== "admin") {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only administrators can perform this action."
    );
  }
};

export const approveProperty = functions.https.onCall(async (data, context) => {
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
  } catch (error) {
    console.error("Error approving property:", error);
    throw new functions.https.HttpsError("internal", "Failed to approve property.");
  }
});

export const deleteProperty = functions.https.onCall(async (data, context) => {
  await checkAdmin(context);

  const { propertyId } = data;
  if (!propertyId) {
    throw new functions.https.HttpsError("invalid-argument", "Property ID is required.");
  }

  try {
    await db.collection("properties").doc(propertyId).delete();
    return { success: true, message: "Property deleted successfully." };
  } catch (error) {
    console.error("Error deleting property:", error);
    throw new functions.https.HttpsError("internal", "Failed to delete property.");
  }
});

export const setUserRole = functions.https.onCall(async (data, context) => {
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
  } catch (error) {
    console.error("Error setting user role:", error);
    throw new functions.https.HttpsError("internal", "Failed to set user role.");
  }
});
