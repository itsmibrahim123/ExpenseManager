package com.practice.expensemngr.controller;

import com.practice.expensemngr.dto.ProductDTO;
import com.practice.expensemngr.dto.StockAdjustmentDTO;
import com.practice.expensemngr.entity.StockMovement;
import com.practice.expensemngr.service.InventoryService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Validated
@RestController
@RequestMapping("/stock")
public class StockController {

    @Autowired
    private InventoryService inventoryService;

    @PostMapping("/adjust")
    public ResponseEntity<ProductDTO> adjustStock(@Valid @RequestBody StockAdjustmentDTO request) {
        ProductDTO product = inventoryService.adjustStock(request);
        return ResponseEntity.ok(product);
    }

    @GetMapping("/movements")
    public ResponseEntity<List<StockMovement>> getMovements(
            @RequestParam(required = false) Long productId) {
        List<StockMovement> movements = inventoryService.getStockMovements(productId);
        return ResponseEntity.ok(movements);
    }
}
