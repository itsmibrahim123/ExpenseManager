package com.practice.expensemngr.service;

import com.practice.expensemngr.dto.CustomerDTO;
import com.practice.expensemngr.entity.Customer;
import com.practice.expensemngr.repository.CustomerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CustomerService {

    @Autowired
    private CustomerRepository customerRepository;

    public List<CustomerDTO> getCustomers(String query) {
        List<Customer> customers;
        if (query != null && !query.trim().isEmpty()) {
            customers = customerRepository.searchCustomers(query.trim());
        } else {
            customers = customerRepository.findAll();
        }
        return customers.stream().map(this::mapToDTO).collect(Collectors.toList());
    }

    public CustomerDTO getCustomerById(Long id) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found with id: " + id));
        return mapToDTO(customer);
    }

    @Transactional
    public CustomerDTO createCustomer(CustomerDTO dto) {
        Customer customer = Customer.builder()
                .name(dto.getName())
                .phone(dto.getPhone())
                .email(dto.getEmail())
                .address(dto.getAddress())
                .taxId(dto.getTaxId())
                .currentCreditBalance(dto.getCurrentCreditBalance() != null ? dto.getCurrentCreditBalance() : BigDecimal.ZERO)
                .build();
        customer = customerRepository.save(customer);
        return mapToDTO(customer);
    }

    @Transactional
    public CustomerDTO updateCustomer(Long id, CustomerDTO dto) {
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Customer not found with id: " + id));
        customer.setName(dto.getName());
        customer.setPhone(dto.getPhone());
        customer.setEmail(dto.getEmail());
        customer.setAddress(dto.getAddress());
        customer.setTaxId(dto.getTaxId());
        if (dto.getCurrentCreditBalance() != null) {
            customer.setCurrentCreditBalance(dto.getCurrentCreditBalance());
        }
        customer = customerRepository.save(customer);
        return mapToDTO(customer);
    }

    private CustomerDTO mapToDTO(Customer customer) {
        return CustomerDTO.builder()
                .id(customer.getId())
                .name(customer.getName())
                .phone(customer.getPhone())
                .email(customer.getEmail())
                .address(customer.getAddress())
                .taxId(customer.getTaxId())
                .currentCreditBalance(customer.getCurrentCreditBalance())
                .createdAt(customer.getCreatedAt())
                .updatedAt(customer.getUpdatedAt())
                .build();
    }
}
