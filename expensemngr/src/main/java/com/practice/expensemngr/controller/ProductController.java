package com.practice.expensemngr.controller;

import com.practice.expensemngr.dto.ProductCreateRequestDTO;
import com.practice.expensemngr.dto.ProductDTO;
import com.practice.expensemngr.dto.ProductRestockRequestDTO;
import com.practice.expensemngr.service.InventoryService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Validated
@RestController
@RequestMapping("/products")
public class ProductController {

    @Autowired
    private InventoryService inventoryService;

    @GetMapping
    public ResponseEntity<List<ProductDTO>> getProducts(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean lowStockOnly) {
        List<ProductDTO> products = inventoryService.getAllProducts(search, lowStockOnly);
        return ResponseEntity.ok(products);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductDTO> getProductById(@PathVariable Long id) {
        ProductDTO product = inventoryService.getProductById(id);
        return ResponseEntity.ok(product);
    }

    @PostMapping
    public ResponseEntity<ProductDTO> createProduct(@Valid @RequestBody ProductCreateRequestDTO request) {
        ProductDTO product = inventoryService.createProduct(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(product);
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProductDTO> updateProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductCreateRequestDTO request) {
        ProductDTO product = inventoryService.updateProduct(id, request);
        return ResponseEntity.ok(product);
    }

    @PostMapping("/{id}/restock")
    public ResponseEntity<ProductDTO> restockProduct(
            @PathVariable Long id,
            @Valid @RequestBody ProductRestockRequestDTO request) {
        ProductDTO product = inventoryService.restockProduct(id, request);
        return ResponseEntity.ok(product);
    }
}
