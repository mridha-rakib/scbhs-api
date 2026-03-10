import { env } from "@/env";
import { NotFoundException } from "@/utils/app-error.utils";
import admin from "firebase-admin";

if (
  !env.FIREBASE_CLIENT_EMAIL ||
  !env.FIREBASE_PRIVATE_KEY ||
  !env.FIREBASE_PROJECT_ID
) {
  throw new NotFoundException(
    "Missing Firebase configuration in environment variables"
  );
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: env.FIREBASE_PROJECT_ID,
    clientEmail: env.FIREBASE_CLIENT_EMAIL,
    privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  } as admin.ServiceAccount),
});

const firebaseAdmin = admin;

export default firebaseAdmin;
