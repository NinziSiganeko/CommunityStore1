package com.communitystore.domain;


import jakarta.persistence.*;
import java.util.Objects;

@Entity
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long productId;
    private String name;
    private double price;
    private int stock;

    @Lob
    @Column(length = 10485760)
    private byte[] productImage;

    /**
     * Physical condition of the item.
     *
     * The column is named "product_condition" because
     * "condition" is a reserved word in MySQL.
     *
     * Existing rows are allowed to be null, which the
     * marketplace shows as "Not specified".
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "product_condition", length = 20)
    private ProductCondition condition;

    @ManyToOne
    @JoinColumn(name = "category_id")
    private ProductCategory category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id")
    private User seller;

    protected Product() {}

    private Product(Builder builder) {
        this.productId = builder.productId;
        this.name = builder.name;
        this.price = builder.price;
        this.stock = builder.stock;
        this.productImage = builder.productImage;
        this.condition = builder.condition;
        this.category = builder.category;
        this.seller = builder.seller;
    }

    // ================= Getters =================
    public Long getProductId() { return productId; }
    public String getName() { return name; }
    public double getPrice() { return price; }
    public int getStock() { return stock; }
    public byte[] getProductImage() { return productImage; }
    public ProductCondition getCondition() { return condition; }
    public ProductCategory getCategory() { return category; }
    public User getSeller() { return seller; }

    // ================= Setters =================
    public void setStock(int stock) { this.stock = stock; } // ← ADD THIS SETTER
    public void setProductImage(byte[] productImage) { this.productImage = productImage; }
    public void setCondition(ProductCondition condition) { this.condition = condition; }
    public void setCategory(ProductCategory category) { this.category = category; }
    public void setSeller(User seller) { this.seller = seller; }

    // ================= Builder =================
    public static class Builder {
        private Long productId;
        private String name;
        private double price;
        private int stock;
        private byte[] productImage;
        private ProductCondition condition;
        private ProductCategory category;
        private User seller;

        public Builder setProductId(Long productId) {
            this.productId = productId;
            return this;
        }

        public Builder setName(String name) {
            this.name = name;
            return this;
        }

        public Builder setPrice(double price) {
            this.price = price;
            return this;
        }

        public Builder setStock(int stock) {
            this.stock = stock;
            return this;
        }

        public Builder setProductImage(byte[] productImage) {
            this.productImage = productImage;
            return this;
        }

        public Builder setCondition(ProductCondition condition) {
            this.condition = condition;
            return this;
        }

        public Builder setCategory(ProductCategory category) {
            this.category = category;
            return this;
        }

        /**
         * Preserves the listing owner.
         *
         * This matters for updates: rebuilding a product
         * without the seller would otherwise detach the
         * listing from its owner.
         */
        public Builder setSeller(User seller) {
            this.seller = seller;
            return this;
        }

        public Builder copy(Product product) {
            this.productId = product.productId;
            this.name = product.name;
            this.price = product.price;
            this.stock = product.stock;
            this.productImage = product.productImage;
            this.condition = product.condition;
            this.category = product.category;
            this.seller = product.seller;
            return this;
        }

        public Product build() {
            return new Product(this);
        }
    }

    @Override
    public String toString() {
        return "Product{" +
                "productId=" + productId +
                ", name='" + name + '\'' +
                ", price=" + price +
                ", stock=" + stock +
                ", productImage=" + (productImage != null ? "[image data]" : "null") +
                ", condition=" + condition +
                ", category=" + (category != null ? category.getCategoryName() : "null") +
                ", seller=" + (seller != null ? seller.getUserId() : "null") +
                '}';
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Product product = (Product) o;
        return Double.compare(product.price, price) == 0 &&
                stock == product.stock &&
                Objects.equals(productId, product.productId) &&
                Objects.equals(name, product.name) &&
                Objects.equals(category, product.category);
    }

    @Override
    public int hashCode() {
        return Objects.hash(productId, name, price, stock, category);
    }
}
