package com.practice.expensemngr.dto;


import lombok.Data;

import java.io.Serializable;

@Data
public class TransactionTagsDTO implements Serializable {
    private static final long serialVersionUID = 1L;
    private Long transactionId;

    private Long tagId;

}
