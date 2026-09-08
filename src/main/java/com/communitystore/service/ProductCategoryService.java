package com.communitystore.service;

import com.communitystore.domain.ProductCategory;

import java.util.List;

public interface ProductCategoryService {
    ProductCategory save(ProductCategory category);
    ProductCategory getById(Long id); // MAKE SURE THIS EXISTS
    List<ProductCategory> getAll();
    boolean delete(Long id);
}