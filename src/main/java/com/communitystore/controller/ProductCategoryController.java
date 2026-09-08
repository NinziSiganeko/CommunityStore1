package com.communitystore.controller;

import com.communitystore.domain.ProductCategory;
import com.communitystore.repository.ProductCategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/categories")
//@CrossOrigin(origins = "http://localhost:5173") // React frontend
public class ProductCategoryController {

    @Autowired
    private ProductCategoryRepository categoryRepository;

    @GetMapping
    public List<ProductCategory> getAllCategories() {
        return categoryRepository.findAll();
    }

    @PostMapping
    public ProductCategory createCategory(@RequestBody ProductCategory category) {
        return categoryRepository.save(category);
    }
}