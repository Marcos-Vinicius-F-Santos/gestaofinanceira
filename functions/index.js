const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

admin.initializeApp();

const db = admin.firestore();
const VALID_STATUSES = ["pending", "active", "blocked"];
const PASSWORD_RESET_EXPIRATION_MS = 10 * 60 * 1000;
const PASSWORD_RESET_RESEND_MS = 60 * 1000;
const PASSWORD_RESET_MAX_ATTEMPTS = 5;

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

function getTimestampMillis(value) {
  if (!value) return 0;
  if (typeof value.toMillis === "function") return value.toMillis();
  if (typeof value.toDate === "function") return value.toDate().getTime();
  return new Date(value).getTime() || 0;
}

function generateResetCode() {
  return String(crypto.randomInt(100000, 1000000));
}

function hashResetCode(email, code, salt) {
  const secret = process.env.PASSWORD_RESET_HASH_SECRET || process.env.GCLOUD_PROJECT || "gestaofinanceira";
  return crypto
    .createHash("sha256")
    .update(`${email}:${code}:${salt}:${secret}`)
    .digest("hex");
}

function getEmailTransporter() {
  const host = normalizeText(process.env.EMAIL_HOST);
  const user = normalizeText(process.env.EMAIL_USER);
  const pass = normalizeText(process.env.EMAIL_PASS);
  const from = normalizeText(process.env.EMAIL_FROM);
  const port = Number(process.env.EMAIL_PORT || 587);
  const secure = String(process.env.EMAIL_SECURE || "false").toLowerCase() === "true";

  if (!host || !user || !pass || !from) {
    throw httpsError("failed-precondition", "Servico de email nao configurado.");
  }

  return {
    from,
    transporter: nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass,
      },
    }),
  };
}

async function sendPasswordResetEmail(email, code) {
  const { from, transporter } = getEmailTransporter();

  await transporter.sendMail({
    from,
    to: email,
    subject: "Codigo de recuperacao de senha",
    text: `Seu codigo de recuperacao e ${code}. Ele expira em 10 minutos.`,
    html: `
      <p>Seu codigo de recuperacao e:</p>
      <p style="font-size: 24px; font-weight: 700; letter-spacing: 4px;">${code}</p>
      <p>Ele expira em 10 minutos. Se voce nao solicitou essa alteracao, ignore este email.</p>
    `,
  });
}

async function getLatestPasswordResetCode(email) {
  const snapshot = await db
    .collection("passwordResetCodes")
    .where("email", "==", email)
    .where("used", "==", false)
    .get();

  return snapshot.docs
    .map((docSnapshot) => ({
      id: docSnapshot.id,
      ref: docSnapshot.ref,
      data: docSnapshot.data(),
    }))
    .sort((a, b) => getTimestampMillis(b.data.createdAt) - getTimestampMillis(a.data.createdAt))[0] || null;
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

exports.requestPasswordResetCode = functions
  .region("southamerica-east1")
  .https.onCall(async (data, context) => {
    const email = normalizeEmail(data?.email);

    if (!email) {
      throw httpsError("invalid-argument", "Informe o email.");
    }

    try {
      const userRecord = await admin.auth().getUserByEmail(email).catch((error) => {
        if (error.code === "auth/user-not-found") return null;
        throw error;
      });

      if (!userRecord) {
        return { success: true };
      }

      const latestCode = await getLatestPasswordResetCode(email);
      const latestCreatedAt = getTimestampMillis(latestCode?.data?.createdAt);

      if (latestCreatedAt && Date.now() - latestCreatedAt < PASSWORD_RESET_RESEND_MS) {
        return { success: true };
      }

      const code = generateResetCode();
      const salt = crypto.randomBytes(16).toString("hex");
      const timestamp = admin.firestore.FieldValue.serverTimestamp();

      await db.collection("passwordResetCodes").add({
        email,
        codeHash: hashResetCode(email, code, salt),
        codeSalt: salt,
        expiresAt: admin.firestore.Timestamp.fromMillis(Date.now() + PASSWORD_RESET_EXPIRATION_MS),
        used: false,
        attempts: 0,
        createdAt: timestamp,
        updatedAt: timestamp,
      });

      await sendPasswordResetEmail(email, code);

      return { success: true };
    } catch (error) {
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      console.error("requestPasswordResetCode failed", error);
      throw httpsError("internal", "Nao foi possivel solicitar a recuperacao de senha.");
    }
  });

exports.verifyPasswordResetCode = functions
  .region("southamerica-east1")
  .https.onCall(async (data, context) => {
    const email = normalizeEmail(data?.email);
    const code = normalizeText(data?.code);
    const newPassword = String(data?.newPassword || "");

    if (!email) {
      throw httpsError("invalid-argument", "Informe o email.");
    }

    if (!code) {
      throw httpsError("invalid-argument", "Informe o codigo.");
    }

    if (newPassword.length < 8) {
      throw httpsError("invalid-argument", "A nova senha deve ter no minimo 8 caracteres.");
    }

    try {
      const resetCode = await getLatestPasswordResetCode(email);

      if (!resetCode) {
        throw httpsError("invalid-argument", "Codigo invalido ou expirado.");
      }

      const record = resetCode.data;
      const attempts = Number(record.attempts || 0);
      const expiresAt = getTimestampMillis(record.expiresAt);

      if (record.used || attempts >= PASSWORD_RESET_MAX_ATTEMPTS || !expiresAt || expiresAt < Date.now()) {
        throw httpsError("invalid-argument", "Codigo invalido ou expirado.");
      }

      const expectedHash = hashResetCode(email, code, record.codeSalt);

      if (expectedHash !== record.codeHash) {
        await resetCode.ref.update({
          attempts: attempts + 1,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        throw httpsError("invalid-argument", "Codigo invalido ou expirado.");
      }

      const userRecord = await admin.auth().getUserByEmail(email);
      const timestamp = admin.firestore.FieldValue.serverTimestamp();

      await admin.auth().updateUser(userRecord.uid, {
        password: newPassword,
      });

      await db.collection("users").doc(userRecord.uid).set({
        mustChangePassword: false,
        passwordChangedAt: timestamp,
        updatedAt: timestamp,
      }, { merge: true });

      await resetCode.ref.update({
        used: true,
        usedAt: timestamp,
        updatedAt: timestamp,
      });

      return { success: true };
    } catch (error) {
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }

      console.error("verifyPasswordResetCode failed", error);
      throw httpsError("internal", "Nao foi possivel alterar a senha.");
    }
  });
