package com.communitystore.controller;

import com.communitystore.domain.Product;
import com.communitystore.domain.ProductCategory;
import com.communitystore.domain.ProductCondition;
import com.communitystore.domain.User;
import com.communitystore.repository.UserRepository;
import com.communitystore.service.ProductCategoryService;
import com.communitystore.service.ProductService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/products")
public class ProductController {

    private final ProductService productService;
    private final ProductCategoryService categoryService;
    private final UserRepository userRepository;

    public ProductController(
            ProductService productService,
            ProductCategoryService categoryService,
            UserRepository userRepository
    ) {
        this.productService = productService;
        this.categoryService = categoryService;
        this.userRepository = userRepository;
    }

    /**
     * Creates a listing and associates it with the supplied seller account.
     * Seller attribution is not access-controlled.
     */
    @PostMapping
    public ResponseEntity<Product> createProduct(
            @RequestParam String name,
            @RequestParam double price,
            @RequestParam int stock,
            @RequestParam Long category_Id,
            @RequestParam Long sellerId,
            @RequestParam(required = false) String condition,
            @RequestParam(required = false) MultipartFile productImage
    ) throws IOException {

        if (stock < 0) {
            return ResponseEntity.badRequest().build();
        }

        if (price <= 0) {
            return ResponseEntity.badRequest().build();
        }

        ProductCategory category = categoryService.getById(category_Id);
        if (category == null) {
            return ResponseEntity.badRequest().build();
        }

        User seller = userRepository.findById(sellerId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "Seller account could not be found"
                ));

        Product product = new Product.Builder()
                .setName(name.trim())
                .setPrice(price)
                .setStock(stock)
                .setCondition(parseCondition(condition))
                .setCategory(category)
                .build();

        if (productImage != null && !productImage.isEmpty()) {
            product.setProductImage(productImage.getBytes());
        }

        product.setSeller(seller);

        return ResponseEntity.ok(productService.create(product));
    }
    /**
     * Converts an optional condition value into the
     * {@link ProductCondition} enum.
     *
     * A blank/absent value is allowed and means
     * "condition not specified".
     */
    private static ProductCondition parseCondition(String condition) {
        if (condition == null || condition.isBlank()) {
            return null;
        }

        try {
            return ProductCondition.valueOf(condition.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Unknown product condition: " + condition
            );
        }
    }


    @GetMapping
    public ResponseEntity<List<Product>> getAllProducts() {
        return ResponseEntity.ok(productService.getAll());
    }

    @GetMapping("/available")
    public ResponseEntity<List<Product>> getAvailableProducts() {
        return ResponseEntity.ok(productService.getAllAvailableProducts());
    }

    @GetMapping("/out-of-stock")
    public ResponseEntity<List<Product>> getOutOfStockProducts() {
        return ResponseEntity.ok(productService.getOutOfStockProducts());
    }

    @GetMapping("/low-stock")
    public ResponseEntity<List<Product>> getLowStockProducts(
            @RequestParam(defaultValue = "10") int threshold
    ) {
        return ResponseEntity.ok(productService.getLowStockProducts(threshold));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Product> getProductById(@PathVariable Long id) {
        Product product = productService.getById(id);
        return product != null
                ? ResponseEntity.ok(product)
                : ResponseEntity.notFound().build();
    }

    @GetMapping("/{id}/availability")
    public ResponseEntity<Boolean> checkProductAvailability(
            @PathVariable Long id,
            @RequestParam int quantity
    ) {
        return ResponseEntity.ok(productService.isProductAvailable(id, quantity));
    }

    @GetMapping("/{id}/stock")
    public ResponseEntity<Integer> getProductStock(@PathVariable Long id) {
        return ResponseEntity.ok(productService.getAvailableStock(id));
    }

    /**
     * Updates a listing.
     *
     * The existing seller and image are carried over so that
     * editing the price, stock, condition or category does not
     * detach the listing from its owner or drop its picture.
     */
    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(
            @PathVariable Long id,
            @RequestBody Product product
    ) {
        Product existingProduct = productService.getById(id);

        if (existingProduct == null) {
            return ResponseEntity.notFound().build();
        }

        if (product == null || product.getName() == null || product.getName().isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        if (product.getPrice() <= 0 || product.getStock() < 0) {
            return ResponseEntity.badRequest().build();
        }

        ProductCategory category = product.getCategory() != null
                ? product.getCategory()
                : existingProduct.getCategory();

        Product productToUpdate = new Product.Builder()
                .setProductId(id)
                .setName(product.getName().trim())
                .setPrice(product.getPrice())
                .setStock(product.getStock())
                .setCondition(product.getCondition() != null
                        ? product.getCondition()
                        : existingProduct.getCondition())
                .setCategory(category)
                .setProductImage(existingProduct.getProductImage())
                .setSeller(existingProduct.getSeller())
                .build();


        Product updatedProduct = productService.update(productToUpdate);
        return updatedProduct != null
                ? ResponseEntity.ok(updatedProduct)
                : ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}/stock")
    public ResponseEntity<Product> updateProductStock(
            @PathVariable Long id,
            @RequestParam int stock
    ) {
        try {
            Product updatedProduct = productService.updateStock(id, stock);
            return updatedProduct != null
                    ? ResponseEntity.ok(updatedProduct)
                    : ResponseEntity.notFound().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{id}/decrease-stock")
    public ResponseEntity<Product> decreaseProductStock(
            @PathVariable Long id,
            @RequestParam int quantity
    ) {
        try {
            return ResponseEntity.ok(productService.decreaseStock(id, quantity));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @PutMapping("/{id}/increase-stock")
    public ResponseEntity<Product> increaseProductStock(
            @PathVariable Long id,
            @RequestParam int quantity
    ) {
        try {
            return ResponseEntity.ok(productService.increaseStock(id, quantity));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        return productService.delete(id)
                ? ResponseEntity.ok().build()
                : ResponseEntity.notFound().build();
    }
}
