import jwt from "jsonwebtoken";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

const algorithm = "aes-256-cbc";
const key = Buffer.from(process.env.ENCRYPTION_KEY, "base64");

// Encrypt (gera novo IV por token)
export const encrypt = (text) => {
    const iv = crypto.randomBytes(16);        // <-- CRUCIAL !!!
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    let encrypted = cipher.update(text, "utf8", "base64");
    encrypted += cipher.final("base64");

    return { iv: iv.toString("hex"), encryptedData: encrypted };
};

// Decrypt
export const decrypt = (text) => {
    try {
        if (typeof text === "string") text = JSON.parse(text);

        const iv = Buffer.from(text.iv, "hex");
        const encryptedText = Buffer.from(text.encryptedData, "base64");

        const decipher = crypto.createDecipheriv(algorithm, key, iv);

        let decrypted = decipher.update(encryptedText, "base64", "utf8");
        decrypted += decipher.final("utf8");

        return decrypted;

    } catch (e) {
        console.error("Decryption error:", e.message);
        console.error("Texto tentado:", text);
        return null;
    }
};

// JWT + encryption
export const generateToken = (id) => {
    const token = jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_TOKEN_EXPIRATION,
    });

    return encrypt(token);
};

export const generateRefreshToken = (id) => {
    const token = jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
        expiresIn: process.env.JWT_REFRESH_EXPIRATION,
    });

    return encrypt(token);
};

export const generateTokenFor1stLog = (id) => {
    const token = jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: "30m",
    });

    return encrypt(token);
};

export const verifyToken = (encrypted) => {
    try {
        const decrypted = decrypt(encrypted);
        return jwt.verify(decrypted, process.env.JWT_SECRET);
    } catch (err) {
        if (err instanceof jwt.TokenExpiredError) throw err;
        return null;
    }
};
