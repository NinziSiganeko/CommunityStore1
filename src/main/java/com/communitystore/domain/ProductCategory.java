package com.communitystore.domain;


import jakarta.persistence.*;

@Entity
public class ProductCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long categoryId;
    private String categoryName;

    protected ProductCategory() {}

    public ProductCategory(Builder builder) {
        this.categoryId = builder.categoryId;
        this.categoryName = builder.categoryName;
    }

    @Override
    public String toString() {
        return "ProductCategory{" +
                "categoryId='" + categoryId + '\'' +
                ", categoryName='" + categoryName + '\'' +
                '}';
    }

    public Long getCategoryId() { return categoryId; }
    public String getCategoryName() { return categoryName; }

    public static class Builder {
        private Long categoryId;
        private String categoryName;

        public Builder setCategoryId(Long categoryId) {
            this.categoryId = categoryId;
            return this;
        }

        public Builder setCategoryName(String categoryName) {
            this.categoryName = categoryName;
            return this;
        }

        public ProductCategory build() {
            return new ProductCategory(this);
        }
    }
}
