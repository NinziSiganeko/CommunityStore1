package com.communitystore.service.impl;

import com.communitystore.domain.ProductCategory;
import com.communitystore.repository.ProductCategoryRepository;
import com.communitystore.service.ProductCategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;


import java.util.List;

@Service
public class ProductCategoryServiceImpl implements ProductCategoryService {

    @Autowired
    private ProductCategoryRepository repository;

    @Override
    public ProductCategory save(ProductCategory category) {
        return repository.save(category);
    }

    @Override
    public ProductCategory getById(Long id) {
        return repository.findById(id).orElse(null); // THIS METHOD
    }

    @Override
    public List<ProductCategory> getAll() {
        return repository.findAll();
    }

    @Override
    public boolean delete(Long id) {
        if (repository.existsById(id)) {
            repository.deleteById(id);
            return true;
        }
        return false;
    }
}