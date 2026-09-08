package com.communitystore.repository;

import com.communitystore.domain.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    // Find products with stock greater than 0
    List<Product> findByStockGreaterThan(int stock);

    // Find products with specific stock level
    List<Product> findByStock(int stock);

    // Find products with stock between min and max (inclusive)
    List<Product> findByStockGreaterThanAndStockLessThanEqual(int minStock, int maxStock);

    // Find products by category that are in stock
    @Query("SELECT p FROM Product p WHERE p.category.categoryId = :categoryId AND p.stock > 0")
    List<Product> findAvailableProductsByCategory(@Param("categoryId") Long categoryId);

    // Find low stock products (stock > 0 but <= threshold)
    @Query("SELECT p FROM Product p WHERE p.stock > 0 AND p.stock <= :threshold")
    List<Product> findLowStockProducts(@Param("threshold") int threshold);
}