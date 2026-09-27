package com.communitystore.repository;

import com.communitystore.domain.Product;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    /**
     * Get one product together with its category and seller.
     */
    @Override
    @EntityGraph(attributePaths = {"category", "seller"})
    Optional<Product> findById(Long id);

    /**
     * Get all products that have stock available.
     *
     * The seller and category are loaded together with the product.
     *
     * This is important because Product.seller is LAZY.
     * Without this EntityGraph, Jackson may try to serialize
     * a Hibernate lazy proxy after the database transaction
     * has already finished.
     */
    @EntityGraph(attributePaths = {"category", "seller"})
    List<Product> findByStockGreaterThan(int stock);

    /**
     * Get products with an exact stock quantity.
     */
    @EntityGraph(attributePaths = {"category", "seller"})
    List<Product> findByStock(int stock);

    /**
     * Get products whose stock falls within a range.
     */
    @EntityGraph(attributePaths = {"category", "seller"})
    List<Product> findByStockGreaterThanAndStockLessThanEqual(
            int minStock,
            int maxStock
    );

    /**
     * Get available products belonging to a specific category.
     */
    @EntityGraph(attributePaths = {"category", "seller"})
    @Query("""
            SELECT p
            FROM Product p
            WHERE p.category.categoryId = :categoryId
              AND p.stock > 0
            """)
    List<Product> findAvailableProductsByCategory(
            @Param("categoryId") Long categoryId
    );

    /**
     * Get products with low stock.
     */
    @EntityGraph(attributePaths = {"category", "seller"})
    @Query("""
            SELECT p
            FROM Product p
            WHERE p.stock > 0
              AND p.stock <= :threshold
            """)
    List<Product> findLowStockProducts(
            @Param("threshold") int threshold
    );
}

