package io.saadmughal.assignment05.vo;


import lombok.Data;

import java.io.Serializable;

@Data
public class TransactionTagsQueryVO implements Serializable {
    private static final long serialVersionUID = 1L;
    private Long transactionId;

    private Long tagId;

}
