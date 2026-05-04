const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();
const VALID_STATUSES = ["pending", "active", "blocked"];

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function normalizeText(value) {
  return String(value || "").trim();
}

function normalizeStatus(status) {
  const normalizedStatus = String(status || "active").trim().toLowerCase();
  return VALID_STATUSES.includes(normalizedStatus) ? normalizedStatus : "active";
}

function authDisabledForStatus(status) {
  return status !== "active";
}

function httpsError(code, message) {
  return new functions.https.HttpsError(code, message);
}

async function assertAdmin(uid) {
  if (!uid) {
    throw httpsError("unauthenticated", "Autenticacao obrigatoria.");
  }

  const adminSnapshot = await db.collection("users").doc(uid).get();
  const adminProfile = adminSnapshot.data();

  if (!adminSnapshot.exists || adminProfile?.role !== "admin") {
    throw httpsError("permission-denied", "Apenas administradores podem criar clientes.");
  }

  return adminProfile;
}

exports.createClientUser = functions
  .region("southamerica-east1")
  .https.onCall(async (data, context) => {
    const adminUid = context.auth?.uid;
    await assertAdmin(adminUid);

    const nome = normalizeText(data?.nome);
    const email = normalizeEmail(data?.email);
    const password = String(data?.password || "");
    const normalizedStatus = normalizeStatus(data?.status);
    const observacoesInternas = normalizeText(data?.observacoesInternas);

    if (!nome) {
      throw httpsError("invalid-argument", "Informe o nome do cliente.");
    }

    if (!email) {
      throw httpsError("invalid-argument", "Informe o email do cliente.");
    }

    if (password.length < 8) {
      throw httpsError("invalid-argument", "A senha temporaria deve ter no minimo 8 caracteres.");
    }

    try {
      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName: nome,
        disabled: authDisabledForStatus(normalizedStatus),
      });

      const timestamp = admin.firestore.FieldValue.serverTimestamp();
      const userPayload = {
        uid: userRecord.uid,
        nome,
        name: nome,
        email,
        role: "client",
        status: normalizedStatus,
        ativo: normalizedStatus === "active",
        mustChangePassword: true,
        observacoesInternas,
        createdByAdminId: adminUid,
        createdAt: timestamp,
        updatedAt: timestamp,
        firstLoginAt: null,
        lastLoginAt: null,
        passwordChangedAt: null,
      };

      await db.collection("users").doc(userRecord.uid).set(userPayload);

      return {
        success: true,
        uid: userRecord.uid,
      };
    } catch (error) {
      if (error.code === "auth/email-already-exists") {
        throw httpsError("already-exists", "Email ja cadastrado.");
      }

      console.error("createClientUser failed", error);
      throw httpsError("internal", "Nao foi possivel criar o cliente.");
    }
  });

exports.updateClientStatus = functions
  .region("southamerica-east1")
  .https.onCall(async (data, context) => {
    const adminUid = context.auth?.uid;
    await assertAdmin(adminUid);

    const uid = normalizeText(data?.uid || data?.userId);
    const normalizedStatus = normalizeStatus(data?.status);

    if (!uid) {
      throw httpsError("invalid-argument", "Informe o UID do cliente.");
    }

    try {
      await admin.auth().updateUser(uid, {
        disabled: authDisabledForStatus(normalizedStatus),
      });

      await db.collection("users").doc(uid).update({
        status: normalizedStatus,
        ativo: normalizedStatus === "active",
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        uid,
        status: normalizedStatus,
      };
    } catch (error) {
      if (error.code === "auth/user-not-found") {
        throw httpsError("invalid-argument", "Cliente nao encontrado no Firebase Auth.");
      }

      console.error("updateClientStatus failed", error);
      throw httpsError("internal", "Nao foi possivel atualizar o status do cliente.");
    }
  });
