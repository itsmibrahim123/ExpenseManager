package com.practice.expensemngr.controller;

import com.practice.expensemngr.dto.UsersDTO;
import com.practice.expensemngr.dto.UserRegistrationResponseDTO;
import  com.practice.expensemngr.service.UsersService;
import com.practice.expensemngr.vo.UserRegistrationRequestVO;
import com.practice.expensemngr.vo.UsersQueryVO;
import com.practice.expensemngr.vo.UsersUpdateVO;
import com.practice.expensemngr.vo.UsersVO;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import com.practice.expensemngr.dto.LoginRequestDTO;
import com.practice.expensemngr.dto.LoginResponseDTO;

@Validated
@RestController
@RequestMapping("/users")
public class UsersController {

    @Autowired
    private UsersService usersService;

    /**
     * Register a new user
     * @param requestVO User registration data
     * @return UserRegistrationResponseDTO with user details
     */
    @PostMapping("/register")
    public ResponseEntity<UserRegistrationResponseDTO> register(@Valid @RequestBody UserRegistrationRequestVO requestVO) {
        UserRegistrationResponseDTO response = usersService.registerUser(requestVO);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * User login endpoint
     * @param loginRequest Login credentials (email and password)
     * @return LoginResponseDTO with JWT token and user details
     */
    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(@Valid @RequestBody LoginRequestDTO loginRequest) {
        LoginResponseDTO response = usersService.login(loginRequest);
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public String save(@Valid @RequestBody UsersVO vO) {
        return usersService.save(vO).toString();
    }

    @DeleteMapping("/{id}")
    public void delete(@Valid @NotNull @PathVariable("id") Long id) {
        usersService.delete(id);
    }

    @PutMapping("/{id}")
    public void update(@Valid @NotNull @PathVariable("id") Long id,
                       @Valid @RequestBody UsersUpdateVO vO) {
        usersService.update(id, vO);
    }

    @GetMapping("/{id}")
    public UsersDTO getById(@Valid @NotNull @PathVariable("id") Long id) {
        return usersService.getById(id);
    }

    @GetMapping
    public Page<UsersDTO> query(@Valid UsersQueryVO vO) {
        return usersService.query(vO);
    }
}