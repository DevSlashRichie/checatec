import {
    collection,
    doc,
    getDocs,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "./firebase";
import type { Form, Response } from "./types";

const FORMS_COLLECTION = "forms";
const RESPONSES_COLLECTION = "responses";

export const api = {
    // --- Public / User ---

    async getActiveForm(): Promise<Form | null> {
        const q = query(
            collection(db, FORMS_COLLECTION),
            where("status", "==", "active"),
            limit(1)
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) return null;
        const docData = snapshot.docs[0];
        return { id: docData.id, ...docData.data() } as Form;
    },

    async submitResponse(response: Omit<Response, "id" | "timestamp">): Promise<string> {
        const docRef = await addDoc(collection(db, RESPONSES_COLLECTION), {
            ...response,
            timestamp: serverTimestamp()
        });
        return docRef.id;
    },

    // --- Admin ---

    async getForms(): Promise<Form[]> {
        const q = query(collection(db, FORMS_COLLECTION), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Form));
    },

    async createForm(form: Omit<Form, "id" | "createdAt" | "status">): Promise<string> {
        const docRef = await addDoc(collection(db, FORMS_COLLECTION), {
            ...form,
            status: "draft",
            createdAt: serverTimestamp()
        });
        return docRef.id;
    },

    async updateForm(id: string, data: Partial<Form>): Promise<void> {
        const docRef = doc(db, FORMS_COLLECTION, id);
        await updateDoc(docRef, data);
    },

    // Helper to set a form as active (and potentially deactivate others if we only allow 1 active)
    async setFormActive(id: string): Promise<void> {
        console.log("Setting form active:", id);
        try {
            // 1. Deactivate all other active forms first
            const q = query(
                collection(db, FORMS_COLLECTION),
                where("status", "==", "active")
            );
            const snapshot = await getDocs(q);
            console.log(`Found ${snapshot.size} active forms to deactivate.`);

            const updates = snapshot.docs.map(doc => {
                console.log("Deactivating form:", doc.id);
                return updateDoc(doc.ref, { status: "draft" });
            });
            await Promise.all(updates);

            // 2. Activate the requested form
            console.log("Activating target form:", id);
            // We duplicate logic here or access via 'api' variable if exported, but 'api' is const being defined.
            // Safest to just reimplement the simple update here to avoid 'this' context issues.
            const docRef = doc(db, FORMS_COLLECTION, id);
            await updateDoc(docRef, { status: "active" });
            console.log("Form activation complete.");
        } catch (error) {
            console.error("Error in setFormActive:", error);
            throw error;
        }
    },

    async deleteForm(id: string): Promise<void> {
        await deleteDoc(doc(db, FORMS_COLLECTION, id));
    },

    async getFormById(id: string): Promise<Form | null> {
        const docRef = doc(db, FORMS_COLLECTION, id);
        const snap = await getDoc(docRef);
        if (!snap.exists()) return null;
        return { id: snap.id, ...snap.data() } as Form;
    },

    async getFormResponses(formId: string): Promise<Response[]> {
        const q = query(
            collection(db, RESPONSES_COLLECTION),
            where("formId", "==", formId),
            orderBy("timestamp", "desc")
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Response));
    },

    async uploadFile(file: File): Promise<string> {
        const storageRef = ref(storage, `uploads/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        return getDownloadURL(snapshot.ref);
    }
};
