package com.communitystore.service;

import com.communitystore.domain.Customer;

import java.util.List;

public interface ICustomerService extends IService<Customer, Long> {
    List<Customer> getAll();



}