import jwt from "jsonwebtoken";
import { verifyToken } from "../utils/tokenutils.js";

export const validateToken = (req, res, next) => {
  const header = req.headers["authorization"];
  
  if (!header)
    return res.status(401).json({ message: "Token em falta" });

  // Extrair token removendo "Bearer " (case insensitive)
  // Suporta múltiplos "Bearer" caso o user tenha colado enganado
  const token = header.replace(/^(Bearer\s+)+/i, "").trim();

  console.log("[AuthMiddleware] Token recebido:", token);

  if (!token)
    return res.status(401).json({ message: "Token em falta" });

  let decoded;

  try {
    decoded = verifyToken(token);
    
    if (!decoded) {
      console.error("[AuthMiddleware] verifyToken retornou null (falha na desencriptação ou verificação)");
      return res.status(403).json({ message: "Token inválido" });
    }

  } catch (err) {
    console.error("[AuthMiddleware] Erro ao verificar token:", err.message);

    if (err instanceof jwt.TokenExpiredError)
      return res.status(401).json({ message: "Token expirado" });

    return res.status(403).json({ message: "Token inválido" });
  }

  req.user = decoded;
  next();
};
