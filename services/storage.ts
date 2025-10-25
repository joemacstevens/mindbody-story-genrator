import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const generateUniqueFileName = (fileName: string): string => {
    const fileExtension = fileName.split('.').pop() || 'jpg';
    const randomString = Math.random().toString(36).substring(2, 15);
    return `uploads/${randomString}-${Date.now()}.${fileExtension}`;
};

export const uploadImage = async (file: File): Promise<string> => {
    if (!file) {
        throw new Error("No file provided for upload.");
    }

    const filePath = generateUniqueFileName(file.name);
    const storageRef = ref(storage, filePath);

    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
};