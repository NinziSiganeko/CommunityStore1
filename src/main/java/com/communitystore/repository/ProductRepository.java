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


    @Override
    @EntityGraph(
            attributePaths = {
                    "category",
                    "seller"
            }
    )
    Optional<Product> findById(Long id);

    @Override
    @EntityGraph(
            attributePaths = {
                    "category",
                    "seller"
            }
    )
    List<Product> findAll();


    @EntityGraph(
            attributePaths = {
                    "category",
                    "seller"
            }
    )
    List<Product> findByStockGreaterThan(
            int stock
    );


    @EntityGraph(
            attributePaths = {
                    "category",
                    "seller"
            }
    )
    List<Product> findByStock(
            int stock
    );


    @EntityGraph(
            attributePaths = {
                    "category",
                    "seller"
            }
    )
    List<Product>
    findByStockGreaterThanAndStockLessThanEqual(
            int minStock,
            int maxStock
    );


    @EntityGraph(
            attributePaths = {
                    "category",
                    "seller"
            }
    )
    @Query("""
            SELECT p
            FROM Product p
            WHERE p.category.categoryId = :categoryId
              AND p.stock > 0
            """)
    List<Product>
    findAvailableProductsByCategory(
            @Param("categoryId")
            Long categoryId
    );

    /**
     * Low-stock products.
     */
    @EntityGraph(
            attributePaths = {
                    "category",
                    "seller"
            }
    )
    @Query("""
            SELECT p
            FROM Product p
            WHERE p.stock > 0
              AND p.stock <= :threshold
            """)
    List<Product>
    findLowStockProducts(
            @Param("threshold")
            int threshold
    );
}