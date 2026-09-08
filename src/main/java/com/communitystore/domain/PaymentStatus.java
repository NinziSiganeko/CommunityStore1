package com.communitystore.domain;

import com.fasterxml.jackson.annotation.JsonFormat;

@JsonFormat(shape = JsonFormat.Shape.STRING)
public enum PaymentStatus {

    PENDING,
    COMPLETED,
    FAILED,
    CANCELLED,
    REFUNDED
}
