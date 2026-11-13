import { Client, Account, Storage, TablesDB } from "appwrite";

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT;
const project = import.meta.env.VITE_APPWRITE_PROJECT_ID;

if (!endpoint || !project) {
    console.error("Missing VITE_APPWRITE_ENDPOINT / VITE_APPWRITE_PROJECT_ID (see .env.example)");
}

const client = new Client().setEndpoint(endpoint).setProject(project);

export const account = new Account(client);
export const storage = new Storage(client);
export const tablesDB = new TablesDB(client);
