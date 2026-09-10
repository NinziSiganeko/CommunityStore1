package com.communitystore.controller;

import com.communitystore.domain.Product;
import com.communitystore.domain.ProductCategory;
import com.communitystore.domain.User;
import com.communitystore.repository.UserRepository;
import com.communitystore.service.ProductCategoryService;
import com.communitystore.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/products")
public class ProductController {

    @Autowired
    private ProductService productService;

    @Autowired
    private ProductCategoryService categoryService;

    @Autowired
    private UserRepository userRepository;

    @PostMapping
    public ResponseEntity<Product> createProduct(
            @RequestParam String name,
            @RequestParam double price,
            @RequestParam int stock,
            @RequestParam Long category_Id,
            @RequestParam(required = false) Long sellerId,
            @RequestParam(required = false) MultipartFile productImage) throws IOException {

        // Validate stock
        if (stock < 0) {
            return ResponseEntity.badRequest().build();
        }

        // 1. GET THE CATEGORY FROM DATABASE
        ProductCategory category = categoryService.getById(category_Id);
        if (category == null) {
            return ResponseEntity.badRequest().build();
        }

        // 2. CREATE PRODUCT WITH THE CATEGORY
        Product product = new Product.Builder()
                .setName(name)
                .setPrice(price)
                .setStock(stock)
                .setCategory(category)
                .build();

        if (productImage != null && !productImage.isEmpty()) {
            product.setProductImage(productImage.getBytes());
        }
        if (sellerId != null) {
            User seller = userRepository.findById(sellerId)
                    .orElseThrow(() -> new IllegalArgumentException("Seller not found"));
            product.setSeller(seller);
        }

        // 3. SAVE PRODUCT
        Product savedProduct = productService.create(product);
        return ResponseEntity.ok(savedProduct);
    }

    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts() {
        List<Product> products = productService.getAll();
        return ResponseEntity.ok(products);
    }

    // NEW: Get only available products (stock > 0)
    @GetMapping("/available")
    public ResponseEntity<List<Product>> getAvailableProducts() {
        List<Product> availableProducts = productService.getAllAvailableProducts();
        return ResponseEntity.ok(availableProducts);
    }

    // NEW: Get out of stock products
    @GetMapping("/out-of-stock")
    public ResponseEntity<List<Product>> getOutOfStockProducts() {
        List<Product> outOfStockProducts = productService.getOutOfStockProducts();
        return ResponseEntity.ok(outOfStockProducts);
    }

    // NEW: Get low stock products
    @GetMapping("/low-stock")
    public ResponseEntity<List<Product>> getLowStockProducts(@RequestParam(defaultValue = "10") int threshold) {
        List<Product> lowStockProducts = productService.getLowStockProducts(threshold);
        return ResponseEntity.ok(lowStockProducts);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {
        Product product = productService.getById(id);
        if (product != null) {
            return ResponseEntity.ok(product);
        }
        return ResponseEntity.notFound().build();
    }

    // NEW: Check if product is available in specific quantity
    @GetMapping("/{id}/availability")
    public ResponseEntity<Boolean> checkProductAvailability(@PathVariable Long id, @RequestParam int quantity) {
        boolean isAvailable = productService.isProductAvailable(id, quantity);
        return ResponseEntity.ok(isAvailable);
    }

    // NEW: Get available stock for a product
    @GetMapping("/{id}/stock")
    public ResponseEntity<Integer> getProductStock(@PathVariable Long id) {
        int stock = productService.getAvailableStock(id);
        return ResponseEntity.ok(stock);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable Long id, @RequestBody Product product) {
        // For update, use builder to set the ID
        Product productToUpdate = new Product.Builder()
                .setProductId(id)
                .setName(product.getName())
                .setPrice(product.getPrice())
                .setStock(product.getStock())
                .setCategory(product.getCategory())
                .build();

        Product updatedProduct = productService.update(productToUpdate);
        if (updatedProduct != null) {
            return ResponseEntity.ok(updatedProduct);
        }
        return ResponseEntity.notFound().build();
    }

    // NEW: Update stock endpoint
    @PutMapping("/{id}/stock")
    public ResponseEntity<Product> updateProductStock(@PathVariable Long id, @RequestParam int stock) {
        try {
            Product updatedProduct = productService.updateStock(id, stock);
            if (updatedProduct != null) {
                return ResponseEntity.ok(updatedProduct);
            }
            return ResponseEntity.notFound().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    // NEW: Decrease stock endpoint (for orders)
    @PutMapping("/{id}/decrease-stock")
    public ResponseEntity<Product> decreaseProductStock(@PathVariable Long id, @RequestParam int quantity) {
        try {
            Product updatedProduct = productService.decreaseStock(id, quantity);
            return ResponseEntity.ok(updatedProduct);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    // NEW: Increase stock endpoint
    @PutMapping("/{id}/increase-stock")
    public ResponseEntity<Product> increaseProductStock(@PathVariable Long id, @RequestParam int quantity) {
        try {
            Product updatedProduct = productService.increaseStock(id, quantity);
            return ResponseEntity.ok(updatedProduct);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        boolean deleted = productService.delete(id);
        if (deleted) {
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
    }
}
