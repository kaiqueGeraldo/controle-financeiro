package com.controlefinanceiro.api.controller;

import com.controlefinanceiro.api.domain.user.User;
import com.controlefinanceiro.api.domain.user.dto.*;
import com.controlefinanceiro.api.service.UserService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/users/me")
public class UserController {

    @Autowired private UserService service;

    @PutMapping("/profile")
    public ResponseEntity<User> updateProfile(@AuthenticationPrincipal User user, @RequestBody @Valid UpdateProfileDTO data) {
        return ResponseEntity.ok(service.updateProfile(user, data));
    }

    @PutMapping("/password")
    public ResponseEntity<Void> changePassword(@AuthenticationPrincipal User user, @RequestBody @Valid ChangePasswordDTO data) {
        service.changePassword(user, data);
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/preferences")
    public ResponseEntity<User> updatePreferences(@AuthenticationPrincipal User user, @RequestBody UpdatePreferencesDTO data) {
        return ResponseEntity.ok(service.updatePreferences(user, data));
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteAccount(@AuthenticationPrincipal User user) {
        service.deleteAccount(user);
        return ResponseEntity.noContent().build();
    }
}