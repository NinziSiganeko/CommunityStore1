package com.communitystore.service;

import com.communitystore.domain.Payment;

import java.util.List;

public interface IPaymentService  extends IService<Payment, Long>{

    List<Payment> getAll();

}