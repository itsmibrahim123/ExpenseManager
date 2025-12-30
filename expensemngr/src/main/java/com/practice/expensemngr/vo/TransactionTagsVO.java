package io.saadmughal.assignment05.vo;

import lombok.Data;
import jakarta.validation.constraints.NotNull;

import java.io.Serializable;

@Data
public class TransactionTagsVO implements Serializable {
    private static final long serialVersionUID = 1L;

    @NotNull(message = "transactionId can not null")
    private Long transactionId;

    @NotNull(message = "tagId can not null")
    private Long tagId;

}
