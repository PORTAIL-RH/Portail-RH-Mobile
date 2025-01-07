package com.example.PortailRH.Util.Util;



import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.Date;

@Component
public class JwtUtil {

    // Clé secrète sécurisée générée automatiquement (à sauvegarder dans un fichier sécurisé en production)
    private final SecretKey secretKey = Keys.secretKeyFor(SignatureAlgorithm.HS256);

    // Temps d'expiration du token (1 jour en millisecondes)
    private final long expirationTime = 86400000L; // 1 jour

    /**
     * Génère un token JWT pour un utilisateur donné
     * @param email - Identifiant de l'utilisateur
     * @return Token JWT
     */
    public String generateToken(String email) {
        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expirationTime))
                .signWith(secretKey)
                .compact();
    }

    public String extractUsername(String token) {
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(secretKey)
                    .build()
                    .parseClaimsJws(token)
                    .getBody()
                    .getSubject();
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * Vérifie si le token est valide
     * @param token - Token JWT
     * @return true si valide, false sinon
     */
    public boolean isTokenValid(String token, String email) {
        return email.equals(extractUsername(token)) && !isTokenExpired(token);
    }


    private boolean isTokenExpired(String token) {
        try {
            Date expiration = Jwts.parserBuilder()
                    .setSigningKey(secretKey)
                    .build()
                    .parseClaimsJws(token)
                    .getBody()
                    .getExpiration();
            return expiration.before(new Date());
        } catch (Exception e) {
            return true;
        }
    }
}
