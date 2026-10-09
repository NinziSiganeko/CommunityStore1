package com.communitystore.domain;

/**
 * Physical condition of a listed product.
 *
 * Listings created before this field existed have a
 * {@code null} condition, which the frontend shows as
 * "Not specified".
 */
public enum ProductCondition {
    NEW,
    LIKE_NEW,
    GOOD,
    FAIR
}
