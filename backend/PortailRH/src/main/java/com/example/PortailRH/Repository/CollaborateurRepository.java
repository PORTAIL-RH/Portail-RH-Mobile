package com.example.PortailRH.Repository;

import com.example.PortailRH.Model.Collaborateur;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface CollaborateurRepository extends MongoRepository<Collaborateur, String> {
    Optional<Collaborateur> findByCode(String code);
    Optional<Collaborateur> findByEmail(String email);
}
