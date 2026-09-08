package com.communitystore.service.impl;

import com.communitystore.domain.Product;
import com.communitystore.repository.ProductRepository;
import com.communitystore.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

@Service
public class ProductServiceImpl implements ProductService {

    @Autowired
    private ProductRepository repository;

    @Override
    @Transactional
    public Product create(Product product) {
        // Validate stock is not negative
        if (product.getStock() < 0) {
            throw new IllegalArgumentException("Stock cannot be negative");
        }
        return repository.save(product);
    }

    @Override
    @Transactional
    public Product saveProductWithImage(Product product, MultipartFile imageFile) throws IOException {
        // Validate stock is not negative
        if (product.getStock() < 0) {
            throw new IllegalArgumentException("Stock cannot be negative");
        }

        if (imageFile != null && !imageFile.isEmpty()) {
            product.setProductImage(imageFile.getBytes());
        }
        return repository.save(product);
    }

    @Override
    @Transactional
    public Product update(Product product) {
        // Validate stock is not negative
        if (product.getStock() < 0) {
            throw new IllegalArgumentException("Stock cannot be negative");
        }

        if (repository.existsById(product.getProductId())) {
            return repository.save(product);
        }
        return null;
    }

    @Override
    @Transactional(readOnly = true)
    public Product getById(Long id) {
        return repository.findById(id).orElse(null);
    }
    @Override
    @Transactional(readOnly = true)
    public List<Product> getAll() {
        return repository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Product> getAllAvailableProducts() {
        // Only return products with stock > 0
        return repository.findByStockGreaterThan(0);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Product> getOutOfStockProducts() {
        // Return products with 0 stock
        return repository.findByStock(0);
    }

    @Override
    @Transactional
    public boolean delete(Long id) {
        if (repository.existsById(id)) {
            repository.deleteById(id);
            return true;
        }
        return false;
    }

    @Override
    @Transactional
    public Product updateStock(Long productId, int newStock) {
        if (newStock < 0) {
            throw new IllegalArgumentException("Stock cannot be negative");
        }

        Optional<Product> productOpt = repository.findById(productId);
        if (productOpt.isPresent()) {
            Product product = productOpt.get();
            product.setStock(newStock);
            return repository.save(product);
        }
        return null;
    }

    @Override
    @Transactional
    public Product decreaseStock(Long productId, int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be positive");
        }

        Optional<Product> productOpt = repository.findById(productId);
        if (productOpt.isPresent()) {
            Product product = productOpt.get();

            if (product.getStock() < quantity) {
                throw new IllegalArgumentException(
                        "Insufficient stock. Available: " + product.getStock() + ", Requested: " + quantity
                );
            }

            int newStock = product.getStock() - quantity;
            product.setStock(newStock);

            System.out.println(" Stock updated for product " + productId + ": " +
                    product.getStock() + " -> " + newStock);

            return repository.save(product);
        }
        throw new IllegalArgumentException("Product not found with ID: " + productId);
    }

    @Override
    @Transactional
    public Product increaseStock(Long productId, int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Quantity must be positive");
        }

        Optional<Product> productOpt = repository.findById(productId);
        if (productOpt.isPresent()) {
            Product product = productOpt.get();
            int newStock = product.getStock() + quantity;
            product.setStock(newStock);

            System.out.println(" Stock increased for product " + productId + ": " +
                    product.getStock() + " -> " + newStock);

            return repository.save(product);
        }
        throw new IllegalArgumentException("Product not found with ID: " + productId);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isProductAvailable(Long productId, int quantity) {
        Optional<Product> productOpt = repository.findById(productId);
        if (productOpt.isPresent()) {
            return productOpt.get().getStock() >= quantity;
        }
        return false;
    }

    @Override
    @Transactional(readOnly = true)
    public int getAvailableStock(Long productId) {
        Optional<Product> productOpt = repository.findById(productId);
        return productOpt.map(Product::getStock).orElse(0);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Product> getLowStockProducts(int threshold) {
        return repository.findByStockGreaterThanAndStockLessThanEqual(0, threshold);
    }
}