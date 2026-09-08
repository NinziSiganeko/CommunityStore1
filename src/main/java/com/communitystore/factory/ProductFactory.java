package com.communitystore.factory;

import com.communitystore.domain.Product;

public class ProductFactory {
    public static Product createProduct( String name, double price, int stock, byte[] productImage) {
        return new Product.Builder()

                .setName(name)
                .setPrice(price)
                .setStock(stock)
                .setProductImage(productImage)
                .build();
    }
}
