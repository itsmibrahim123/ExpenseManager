package com.practice.expensemngr.service;

import com.practice.expensemngr.dto.ProductCreateRequestDTO;
import com.practice.expensemngr.dto.ProductDTO;
import com.practice.expensemngr.dto.ProductRestockRequestDTO;
import com.practice.expensemngr.dto.StockAdjustmentDTO;
import com.practice.expensemngr.entity.Accounts;
import com.practice.expensemngr.entity.Product;
import com.practice.expensemngr.entity.StockMovement;
import com.practice.expensemngr.entity.Transactions;
import com.practice.expensemngr.repository.AccountsRepository;
import com.practice.expensemngr.repository.ProductRepository;
import com.practice.expensemngr.repository.StockMovementRepository;
import com.practice.expensemngr.repository.TransactionsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class InventoryService {

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private StockMovementRepository stockMovementRepository;

    @Autowired
    private TransactionsRepository transactionsRepository;

    @Autowired
    private AccountsRepository accountsRepository;

    public List<ProductDTO> getAllProducts(String search, Boolean lowStockOnly) {
        List<Product> products;
        if (lowStockOnly != null && lowStockOnly) {
            products = productRepository.findLowStockProducts();
        } else if (search != null && !search.trim().isEmpty()) {
            products = productRepository.searchProducts(search.trim());
        } else {
            products = productRepository.findAll();
        }
        return products.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    public ProductDTO getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));
        return mapToDTO(product);
    }

    @Transactional
    public ProductDTO createProduct(ProductCreateRequestDTO request) {
        if (productRepository.findBySku(request.getSku()).isPresent()) {
            throw new RuntimeException("Product with SKU " + request.getSku() + " already exists.");
        }

        Product product = Product.builder()
                .sku(request.getSku())
                .barcode(request.getBarcode())
                .name(request.getName())
                .description(request.getDescription())
                .costPrice(request.getCostPrice())
                .sellingPrice(request.getSellingPrice())
                .currentStock(request.getCurrentStock() != null ? request.getCurrentStock() : 0)
                .reorderLevel(request.getReorderLevel() != null ? request.getReorderLevel() : 5)
                .unit(request.getUnit() != null ? request.getUnit() : "PCS")
                .categoryId(request.getCategoryId())
                .active(request.getActive() != null ? request.getActive() : true)
                .build();

        product = productRepository.save(product);

        if (product.getCurrentStock() > 0) {
            StockMovement movement = StockMovement.builder()
                    .productId(product.getId())
                    .movementType("PURCHASE_RESTOCK")
                    .quantityChanged(product.getCurrentStock())
                    .balanceAfter(product.getCurrentStock())
                    .notes("Initial inventory stock registration")
                    .build();
            stockMovementRepository.save(movement);
        }

        return mapToDTO(product);
    }

    @Transactional
    public ProductDTO updateProduct(Long id, ProductCreateRequestDTO request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));

        product.setName(request.getName());
        product.setBarcode(request.getBarcode());
        product.setDescription(request.getDescription());
        product.setCostPrice(request.getCostPrice());
        product.setSellingPrice(request.getSellingPrice());
        product.setReorderLevel(request.getReorderLevel());
        product.setUnit(request.getUnit());
        product.setCategoryId(request.getCategoryId());
        if (request.getActive() != null) {
            product.setActive(request.getActive());
        }

        product = productRepository.save(product);
        return mapToDTO(product);
    }

    @Transactional
    public ProductDTO restockProduct(Long id, ProductRestockRequestDTO request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + id));

        int oldStock = product.getCurrentStock();
        int newStock = oldStock + request.getQuantity();
        product.setCurrentStock(newStock);

        if (request.getUnitCostPrice() != null) {
            product.setCostPrice(request.getUnitCostPrice());
        }

        productRepository.save(product);

        // Record stock movement
        StockMovement movement = StockMovement.builder()
                .productId(product.getId())
                .movementType("PURCHASE_RESTOCK")
                .quantityChanged(request.getQuantity())
                .balanceAfter(newStock)
                .referenceId(request.getReferenceId())
                .notes(request.getNotes())
                .build();
        stockMovementRepository.save(movement);

        // Auto-generate Expense Transaction
        Accounts account = accountsRepository.findById(request.getAccountId())
                .orElseThrow(() -> new RuntimeException("Account not found with id: " + request.getAccountId()));

        BigDecimal totalCost = (request.getUnitCostPrice() != null ? request.getUnitCostPrice() : product.getCostPrice())
                .multiply(BigDecimal.valueOf(request.getQuantity()));

        Transactions expenseTx = Transactions.builder()
                .userId(account.getUserId())
                .accountId(account.getId())
                .categoryId(request.getCategoryId() != null ? request.getCategoryId() : (product.getCategoryId() != null ? product.getCategoryId() : 1L))
                .type("EXPENSE")
                .amount(totalCost)
                .currencyCode(account.getCurrencyCode())
                .transactionDate(new Date())
                .status("COMPLETED")
                .description("Inventory Restock Expense: " + product.getName() + " (" + request.getQuantity() + " " + product.getUnit() + ")")
                .referenceNumber(request.getReferenceId())
                .recurringInstance(false)
                .createdAt(new Date())
                .updatedAt(new Date())
                .build();

        transactionsRepository.save(expenseTx);

        // Deduct from account balance
        account.setCurrentBalance(account.getCurrentBalance().subtract(totalCost));
        accountsRepository.save(account);

        return mapToDTO(product);
    }

    @Transactional
    public ProductDTO adjustStock(StockAdjustmentDTO request) {
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + request.getProductId()));

        int newStock = product.getCurrentStock() + request.getQuantityChanged();
        if (newStock < 0) {
            throw new RuntimeException("Cannot adjust stock below 0. Current: " + product.getCurrentStock());
        }
        product.setCurrentStock(newStock);
        productRepository.save(product);

        StockMovement movement = StockMovement.builder()
                .productId(product.getId())
                .movementType(request.getMovementType())
                .quantityChanged(request.getQuantityChanged())
                .balanceAfter(newStock)
                .referenceId(request.getReferenceId())
                .notes(request.getNotes())
                .build();
        stockMovementRepository.save(movement);

        return mapToDTO(product);
    }

    public List<StockMovement> getStockMovements(Long productId) {
        if (productId != null) {
            return stockMovementRepository.findByProductIdOrderByCreatedAtDesc(productId);
        }
        return stockMovementRepository.findTop50ByOrderByCreatedAtDesc();
    }

    private ProductDTO mapToDTO(Product product) {
        boolean isLow = product.getCurrentStock() <= product.getReorderLevel();
        return ProductDTO.builder()
                .id(product.getId())
                .sku(product.getSku())
                .barcode(product.getBarcode())
                .name(product.getName())
                .description(product.getDescription())
                .costPrice(product.getCostPrice())
                .sellingPrice(product.getSellingPrice())
                .currentStock(product.getCurrentStock())
                .reorderLevel(product.getReorderLevel())
                .unit(product.getUnit())
                .categoryId(product.getCategoryId())
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .active(product.getActive())
                .isLowStock(isLow)
                .createdAt(product.getCreatedAt())
                .updatedAt(product.getUpdatedAt())
                .build();
    }
}
