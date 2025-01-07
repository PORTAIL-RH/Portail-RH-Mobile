package com.example.PortailRH.Controller;

import com.example.PortailRH.Model.Collaborateur;
import com.example.PortailRH.Repository.CollaborateurRepository;
import com.example.PortailRH.Util.Util.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/Collaborateur")
public class CollaborateurController {

    @Autowired
    private BCryptPasswordEncoder bCryptPasswordEncoder;

    @Autowired
    private CollaborateurRepository collaborateurRepository;

    @Autowired
    private JwtUtil jwtUtil;

    // Register Endpoint
    @PostMapping("/register")
    public ResponseEntity<?> registerCollaborateur(@RequestBody Collaborateur collaborateur) {

        // Vérification si les mots de passe correspondent
        if (!collaborateur.getMotDePasse().equals(collaborateur.getConfirmationMotDePasse())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Les mots de passe ne correspondent pas.");
        }

        // Vérification si l'email est déjà utilisé
        if (collaborateurRepository.findByEmail(collaborateur.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("L'adresse e-mail est déjà utilisée.");
        }

        // Hashage du mot de passe
        String hashedPassword = bCryptPasswordEncoder.encode(collaborateur.getMotDePasse());
        collaborateur.setMotDePasse(hashedPassword);
        collaborateur.setConfirmationMotDePasse(null); // Ne pas stocker la confirmation du mot de passe

        // Enregistrement dans la base de données
        try {
            collaborateurRepository.save(collaborateur);
        } catch (DuplicateKeyException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Erreur: L'adresse e-mail doit être unique.");
        }

        // Génération du token avec JwtUtil
        String token = jwtUtil.generateToken(collaborateur.getNomUtilisateur());

        // Réponse avec le token
        return ResponseEntity.ok().body("Collaborateur enregistré avec succès ! Token : " + token);
    }
    @PostMapping("/login")
    public ResponseEntity<?> loginCollaborateur(@RequestBody Collaborateur collaborateur) {

        // Vérification de l'existence du collaborateur par son code
        Collaborateur existingCollaborateur = collaborateurRepository.findByCode(collaborateur.getCode())
                .orElse(null);

        if (existingCollaborateur == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Collaborateur non trouvé avec ce code.");
        }

        // Vérification du mot de passe
        if (!bCryptPasswordEncoder.matches(collaborateur.getMotDePasse(), existingCollaborateur.getMotDePasse())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Mot de passe incorrect.");
        }

        // Génération du token JWT
        String token = jwtUtil.generateToken(existingCollaborateur.getNomUtilisateur());

        // Réponse avec le token
        return ResponseEntity.ok().body("Connexion réussie ! Token : " + token);
    }
}
